// POST /api/webhooks/abacatepay
import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyWebhookSignature, parseWebhookEvent, mapStatus } from '@/lib/abacatepay';
import { provision, revokeCredential } from '@/lib/provisioning';
import { addCreditsOnServer } from '@/lib/license-server';
import { sendRechargeEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const CLAIM_TTL_MS = 2 * 60 * 1000;

function canTransitionOrder(current: string, incoming: string): boolean {
  if (current === incoming) return true;
  if (current === 'pending') return ['paid', 'canceled', 'failed', 'refunded'].includes(incoming);
  if (current === 'paid') return incoming === 'refunded';
  if (current === 'canceled' || current === 'failed') return incoming === 'refunded';
  return false;
}

export async function POST(req: Request) {
  const declaredLength = Number(req.headers.get('content-length') || 0);
  if (declaredLength > 1_000_000) return NextResponse.json({ error: 'payload too large' }, { status: 413 });
  const rawPayload = await req.text();
  if (Buffer.byteLength(rawPayload, 'utf8') > 1_000_000) {
    return NextResponse.json({ error: 'payload too large' }, { status: 413 });
  }
  const signature = req.headers.get('x-abacatepay-signature') || req.headers.get('abacatepay-signature');
  const url = new URL(req.url);
  const querySecret = url.searchParams.get('webhookSecret') || url.searchParams.get('secret');

  if (!verifyWebhookSignature(rawPayload, signature, querySecret)) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let event: ReturnType<typeof parseWebhookEvent>;
  try {
    event = parseWebhookEvent(rawPayload);
  } catch {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
  }

  // Stable fallback for providers that omit an event ID: the same body always maps to one ID.
  const eventId = String(event.id || createHash('sha256').update(rawPayload).digest('hex'));
  if (eventId.length > 190) return NextResponse.json({ error: 'invalid event id' }, { status: 400 });

  try {
    await prisma.webhookEvent.create({
      data: {
        provider: 'AbacatePay',
        eventId,
        type: event.type || 'unknown',
        payload: JSON.parse(JSON.stringify(event)),
        signature: signature || null,
        processed: false,
      },
    });
  } catch (error: any) {
    // A duplicate is expected on provider retries. Other DB errors must fail closed.
    if (error?.code !== 'P2002') {
      console.error('[Webhook] Não foi possível persistir o evento:', error);
      return NextResponse.json({ error: 'event persistence unavailable' }, { status: 503 });
    }
  }

  const now = new Date();
  const staleBefore = new Date(now.getTime() - CLAIM_TTL_MS);
  let claim;
  try {
    claim = await prisma.webhookEvent.updateMany({
      where: {
        eventId,
        processed: false,
        OR: [{ processingAt: null }, { processingAt: { lt: staleBefore } }],
      },
      data: { processingAt: now, attemptCount: { increment: 1 }, lastError: null },
    });
  } catch (error) {
    console.error('[Webhook] Não foi possível reservar o evento:', error);
    return NextResponse.json({ error: 'event claim unavailable' }, { status: 503 });
  }

  if (claim.count === 0) {
    const existing = await prisma.webhookEvent.findUnique({ where: { eventId }, select: { processed: true } }).catch(() => null);
    if (existing?.processed) return NextResponse.json({ ok: true, duplicate: true });
    return NextResponse.json({ error: 'event is already processing; retry later' }, {
      status: 503,
      headers: { 'Retry-After': '30' },
    });
  }

  try {
    const mappedStatus = mapStatus(event.data?.status);
    const checkoutId = event.data?.checkoutId;
    const providerOrderId = event.data?.orderId;
    const metadata = event.data?.metadata || {};
    const internalOrderId = metadata.orderId as string | undefined;

    const conditions: any[] = [];
    if (checkoutId) conditions.push({ abacateCheckoutId: checkoutId });
    if (internalOrderId) conditions.push({ id: internalOrderId });
    if (providerOrderId) conditions.push({ abacateOrderId: providerOrderId });

    const order = conditions.length
      ? await prisma.order.findFirst({ where: { OR: conditions }, include: { customer: true, plan: true } })
      : null;
    const status = order && !canTransitionOrder(order.status, mappedStatus)
      ? order.status
      : mappedStatus;

    if (order) {
      const updateData: any = {};
      if (status !== order.status) updateData.status = status;
      if (status === 'paid') {
        updateData.paidAt = order.paidAt || new Date();
        if (order.affiliateId) updateData.commissionStatus = 'credited';
      } else if (status === 'canceled' || status === 'refunded') {
        if (order.affiliateId) updateData.commissionStatus = 'refunded';
      }
      if (Object.keys(updateData).length) {
        await prisma.order.update({ where: { id: order.id }, data: updateData });
      }
    }

    if (status === 'paid') {
      const meta = (order?.metadata as any) || metadata || {};
      if (meta.isRecharge && meta.licenseKey && Number(meta.creditsToAdd) > 0) {
        const result = await addCreditsOnServer(
          String(meta.licenseKey),
          Number(meta.creditsToAdd),
          `recharge:${order?.id || createHash('sha256').update(eventId).digest('hex')}`,
        );
        if (!result.ok) throw new Error(result.message || 'Railway recusou a recarga');

        await prisma.accessCredentials.updateMany({
          where: { licenseKey: meta.licenseKey },
          data: result.credits === undefined
            ? { credits: { increment: Number(meta.creditsToAdd) } }
            : { credits: result.credits },
        });

        const customerEmail = meta.email || order?.customer?.email;
        if (customerEmail) {
          const emailResult = await sendRechargeEmail({
            to: customerEmail,
            name: meta.name || order?.customer?.name || 'Criador',
            licenseKey: String(meta.licenseKey),
            creditsAdded: Number(meta.creditsToAdd),
          });
          if (!emailResult.ok) throw new Error(emailResult.error || 'Não foi possível enviar o e-mail de recarga');
        }
      } else if (!meta.isRecharge) {
        const planSlug = meta.slug || order?.plan?.slug || 'pack_criador';
        if (order) {
          await provision({
            customerId: order.customerId,
            orderId: order.id,
            email: order.customer?.email || meta.email,
            plan: planSlug,
            includeCourse: meta.includeCourse === true || meta.includeCourse === 'true',
          });
        } else {
          const { syncAbacatePay } = await import('@/lib/sync-abacatepay');
          await syncAbacatePay();
        }
      }
    } else if (status === 'canceled' || status === 'refunded') {
      if (order) {
        const credentials = await prisma.accessCredentials.findMany({
          where: { orderId: order.id, status: { in: ['active', 'pending'] } },
        });
        for (const credential of credentials) {
          await revokeCredential(credential.id, `provider status: ${status}`);
        }
        await prisma.subscription.updateMany({
          where: { customerId: order.customerId, status: 'active' },
          data: { status: status === 'canceled' ? 'canceled' : 'suspended' },
        });
      }
    }

    await prisma.webhookEvent.update({
      where: { eventId },
      data: { processed: true, processingAt: null, lastError: null },
    });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Webhook] Processamento incompleto; evento liberado para retry:', error);
    await prisma.webhookEvent.update({
      where: { eventId },
      data: { processingAt: null, lastError: String(error?.message || error).slice(0, 1000) },
    }).catch((dbError) => console.error('[Webhook] Falha ao liberar evento para retry:', dbError));
    return NextResponse.json({ error: 'processing failed; retry later' }, { status: 503 });
  }
}
