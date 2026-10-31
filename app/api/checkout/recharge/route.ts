// POST /api/checkout/recharge — Cria sessão de recarga de créditos com desconto progressivo no AbacatePay
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/ratelimit';
import { createCheckout } from '@/lib/abacatepay';
import { findLicenseOnServer } from '@/lib/license-server';

export const dynamic = 'force-dynamic';

const Schema = z.object({
  identifier: z.string().min(3, 'Informe sua Chave de Licença, Usuário ou E-mail'),
  credits: z.number().min(5, 'Mínimo de 5 créditos').max(5000, 'Máximo de 5.000 créditos'),
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
});

function calculateProgressivePrice(credits: number) {
  const c = Math.max(5, Math.min(5000, Math.floor(credits)));
  let unit = 1.30;
  let discount = 0;
  let tier = 'Preço Normal';

  if (c >= 2500) {
    unit = 0.33;
    discount = 75;
    tier = 'Mega Volume Industrial (75% OFF)';
  } else if (c >= 1000) {
    unit = 0.39;
    discount = 70;
    tier = 'Plano Enterprise (70% OFF)';
  } else if (c >= 500) {
    unit = 0.45;
    discount = 65;
    tier = 'Super Atacado (65% OFF)';
  } else if (c >= 250) {
    unit = 0.55;
    discount = 58;
    tier = 'Desconto Agência (58% OFF)';
  } else if (c >= 100) {
    unit = 0.66;
    discount = 49;
    tier = 'Desconto de Atacado (49% OFF)';
  } else if (c >= 50) {
    unit = 0.79;
    discount = 39;
    tier = 'Super Desconto Criador (39% OFF)';
  } else if (c >= 30) {
    unit = 0.95;
    discount = 27;
    tier = 'Desconto Especial (27% OFF)';
  }

  const totalCents = Math.round(c * unit * 100);
  return {
    credits: c,
    unitPrice: unit,
    totalCents,
    discountPercent: discount,
    tier,
  };
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';
  const rl = await rateLimit(`recharge:${ip}`);
  if (rl.unavailable) {
    return NextResponse.json({ error: 'Checkout temporariamente indisponível.' }, { status: 503 });
  }
  if (!rl.ok) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde um instante.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });
  }

  const { identifier, credits, name, email, phone } = parsed.data;
  const pricing = calculateProgressivePrice(credits);

  // Resolve only a license already attached to a persisted customer credential.
  const cleanId = identifier.trim();
  let resolvedLicenseKey = '';
  let credential: { licenseKey: string | null } | null = null;
  try {
    credential = await prisma.accessCredentials.findFirst({
      where: {
        OR: [
          { licenseKey: cleanId },
          { username: cleanId },
          { customer: { email: cleanId } },
        ],
      },
      select: { licenseKey: true },
    });
  } catch (err) {
    console.error('[recharge] Não foi possível validar a credencial:', err);
    return NextResponse.json({ error: 'Recarga temporariamente indisponível.' }, { status: 503 });
  }

  if (!credential?.licenseKey) {
    return NextResponse.json({ error: 'Não encontramos uma licença ativa vinculada a esses dados.' }, { status: 404 });
  }
  resolvedLicenseKey = credential.licenseKey;

  const remoteLicense = await findLicenseOnServer(resolvedLicenseKey);
  if (remoteLicense.unavailable) {
    return NextResponse.json({ error: 'Validação da licença temporariamente indisponível.' }, { status: 503 });
  }
  if (!remoteLicense.license || remoteLicense.license.status !== 'active' || remoteLicense.license.exp <= Math.floor(Date.now() / 1000)) {
    return NextResponse.json({ error: 'A licença não está ativa e não pode receber recargas.' }, { status: 409 });
  }

  const packageSlug = `recarga_${pricing.credits}_creditos`;
  let orderId: string;

  try {
    // 2. Localiza ou cria o cliente
    let customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      customer = await prisma.customer.create({ data: { name, email, phone } });
    } else if (phone && !customer.phone) {
      await prisma.customer.update({ where: { id: customer.id }, data: { phone } });
    }

    // 3. Garante que o plano de recarga dinâmico existe no banco
    let plan = await prisma.plan.findUnique({ where: { slug: packageSlug } });
    if (!plan) {
      plan = await prisma.plan.create({
        data: {
          name: `Recarga ${pricing.credits} Créditos`,
          slug: packageSlug,
          price: pricing.totalCents,
          currency: 'BRL',
          interval: 'one_time',
          features: JSON.stringify([`+${pricing.credits} Créditos automáticos na Fábrica dos Cortes (${pricing.tier})`]),
          active: true,
        },
      });
    }

    // 4. Cria a ordem de recarga
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        planId: plan.id,
        status: 'pending',
        amount: pricing.totalCents,
        currency: 'BRL',
        metadata: {
          isRecharge: true,
          licenseKey: resolvedLicenseKey,
          creditsToAdd: pricing.credits,
          packageSlug,
        },
      },
    });
    orderId = order.id;
  } catch (dbErr) {
    console.error('[recharge] Não foi possível persistir o pedido antes de criar a cobrança:', dbErr);
    return NextResponse.json({ error: 'Recarga temporariamente indisponível. Tente novamente.' }, { status: 503 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fabricadecortes.com';
  const returnURL = `${appUrl}/retorno`;

  try {
    const checkout = await createCheckout({
      planSlug: packageSlug,
      planId: packageSlug,
      amount: pricing.totalCents,
      currency: 'BRL',
      customer: { name, email, phone },
      metadata: {
        orderId,
        isRecharge: 'true',
        licenseKey: resolvedLicenseKey,
        creditsToAdd: String(pricing.credits),
      },
      returnURL,
      appName: `Fábrica dos Cortes - Recarga ${pricing.credits} Créditos`,
    });

    try {
      await prisma.order.update({
        where: { id: orderId },
        data: { abacateCheckoutId: checkout.checkoutId, abacateOrderId: checkout.orderId },
      });
    } catch (dbErr) {
      console.error('[recharge] Checkout criado, mas não foi possível persistir os IDs:', dbErr);
      return NextResponse.json({ error: 'Não foi possível confirmar o pedido. Contate o suporte antes de pagar novamente.' }, { status: 503 });
    }

    return NextResponse.json({
      ok: true,
      checkoutURL: checkout.checkoutURL,
      checkoutId: checkout.checkoutId,
      orderId,
      resolvedLicenseKey,
      credits: pricing.credits,
      totalCents: pricing.totalCents,
    });
  } catch (err) {
    console.error('[Checkout Recharge] Erro ao criar checkout no AbacatePay:', err);
    await prisma.order.update({ where: { id: orderId }, data: { status: 'failed' } }).catch((dbErr) => {
      console.error('[recharge] Falha ao marcar pedido como failed:', dbErr);
    });
    return NextResponse.json({ error: 'Falha ao gerar cobrança Pix. Tente novamente.' }, { status: 502 });
  }
}
