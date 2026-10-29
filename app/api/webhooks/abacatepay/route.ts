// POST /api/webhooks/abacatepay
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/ratelimit';
import { verifyWebhookSignature, parseWebhookEvent, mapStatus } from '@/lib/abacatepay';
import { generateId } from '@/lib/utils';
import { provision, revokeCredential } from '@/lib/provisioning';
import { addCreditsOnServer } from '@/lib/license-server';
import { sendRechargeEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const rl = rateLimit(`webhook:${ip}`, { max: 120, windowMs: 60000 });
  if (!rl.ok) return NextResponse.json({ error: 'rate limited' }, { status: 429 });

  const rawPayload = await req.text();
  const signature = req.headers.get('x-abacatepay-signature') || req.headers.get('abacatepay-signature');
  const urlObj = new URL(req.url);
  const querySecret = urlObj.searchParams.get('webhookSecret') || urlObj.searchParams.get('secret');

  if (!verifyWebhookSignature(rawPayload, signature, querySecret)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let event: any;
  try {
    event = parseWebhookEvent(rawPayload);
  } catch {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }

  const eventId = event.id || generateId('evt');

  // Persist raw event for audit if DB is available
  try {
    await prisma.webhookEvent.create({
      data: {
        provider: 'AbacatePay',
        eventId,
        type: event.type,
        payload: event,
        signature: signature || undefined,
        processed: false,
      },
    });
  } catch (dbErr) {
    console.warn('[Webhook] Prisma indisponível para salvar evento:', dbErr);
  }

  const status = mapStatus(event.data?.status);
  const checkoutId = event.data?.checkoutId;
  const orderId = event.data?.orderId;
  const metadata = event.data?.metadata || {};
  const internalOrderId = metadata.orderId as string | undefined;

  // Localizar order no banco local se disponível
  const orConditions: any[] = [];
  if (checkoutId) orConditions.push({ abacateCheckoutId: checkoutId });
  if (internalOrderId) orConditions.push({ id: internalOrderId });
  if (orderId) orConditions.push({ abacateOrderId: orderId });

  let order: any = null;
  if (orConditions.length) {
    try {
      order = await prisma.order.findFirst({ where: { OR: orConditions }, include: { customer: true, plan: true } });
    } catch (err) {
      console.warn('[Webhook] Prisma indisponível para buscar pedido:', err);
    }
  }

  if (order) {
    try {
      const updateData: any = { status };
      if (status === 'paid') {
        updateData.paidAt = new Date();
        if (order.affiliateId) {
          updateData.commissionStatus = 'credited';
        }
      } else if (status === 'canceled' || status === 'refunded') {
        if (order.affiliateId) {
          updateData.commissionStatus = 'refunded';
        }
      }
      await prisma.order.update({ where: { id: order.id }, data: updateData });
    } catch (orderUpdateErr) {
      console.warn('[Webhook] Erro ao atualizar status do pedido no banco:', orderUpdateErr);
    }
  }

  if (status === 'paid') {
    const meta = (order?.metadata as any) || metadata || {};
    if (meta.isRecharge && meta.licenseKey && meta.creditsToAdd) {
      try {
        await addCreditsOnServer(meta.licenseKey, Number(meta.creditsToAdd));
        console.log(`[Webhook] Recarga automática de ${meta.creditsToAdd} créditos para a chave ${meta.licenseKey}`);
        try {
          await prisma.accessCredentials.updateMany({
            where: { licenseKey: meta.licenseKey },
            data: { credits: { increment: Number(meta.creditsToAdd) } },
          });
        } catch {}

        const customerEmail = meta.email || order?.customer?.email;
        const customerName = meta.name || order?.customer?.name || 'Criador';
        if (customerEmail) {
          await sendRechargeEmail({
            to: customerEmail,
            name: customerName,
            licenseKey: meta.licenseKey,
            creditsAdded: Number(meta.creditsToAdd),
          }).catch((err) => console.error('[Webhook] Falha ao enviar e-mail de recarga:', err));
        }
      } catch (e: any) {
        console.error('[Webhook] Falha na recarga de créditos:', e?.message);
      }
    } else if (!meta.isRecharge) {
      // Compra de plano novo
      const planSlug = meta.slug || order?.plan?.slug || 'pack_criador';
      const credits = planSlug === 'pack_teste' ? 15 : planSlug === 'pack_iniciante' ? 30 : planSlug === 'pack_escala' ? 120 : planSlug === 'pack_pro' ? 250 : 50;

      if (order) {
        try {
          await provision({
            customerId: order.customerId,
            orderId: order.id,
            email: order.customer?.email || meta.email,
            plan: planSlug,
            includeCourse: Boolean(meta.includeCourse),
          });
        } catch (provErr) {
          console.warn('[Webhook] Erro no provisionamento local:', provErr);
        }
      } else {
        // Se a ordem foi gerada em outro container serverless da Vercel,
        // aciona o sincronizador unificado que cria o cliente, pedido, licença e aluno no HostGator
        const { syncAbacatePay } = await import('@/lib/sync-abacatepay');
        await syncAbacatePay().catch((err) =>
          console.error('[Webhook] Erro ao sincronizar compra via syncAbacatePay:', err)
        );
      }
    }
  } else if (status === 'canceled' || status === 'refunded') {
    if (order) {
      try {
        const creds = await prisma.accessCredentials.findMany({
          where: { orderId: order.id, status: 'active' },
        });
        for (const c of creds) {
          await revokeCredential(c.id, `provider status: ${status}`);
        }
        await prisma.subscription.updateMany({
          where: { customerId: order.customerId, status: 'active' },
          data: { status: status === 'canceled' ? 'canceled' : 'suspended' },
        });
      } catch {}
    }
  }

  return NextResponse.json({ ok: true });
}