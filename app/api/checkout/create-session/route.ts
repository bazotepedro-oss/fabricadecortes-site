// POST /api/checkout/create-session
// Body: { slug, name, email, phone?, includeCourse?, couponCode?, affiliateRef?, consent }
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/ratelimit';
import { getPlanId, createCheckout } from '@/lib/abacatepay';
import { FALLBACK_PLANS } from '@/lib/plans';

export const dynamic = 'force-dynamic';

const Schema = z.object({
  slug: z.string().min(1, 'Plano obrigatório'),
  name: z.string().min(2, 'Nome muito curto').max(120),
  email: z.string().email('E-mail inválido'),
  phone: z.string().max(30).optional(),
  includeCourse: z.boolean().optional(),
  couponCode: z.string().optional(),
  affiliateRef: z.string().optional(),
  consent: z.literal(true, { message: 'Você precisa aceitar os termos' }),
});

export async function POST(req: Request) {
  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const rl = rateLimit(`checkout:${ip}`);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em instantes.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { slug, name, email, phone, includeCourse, couponCode, affiliateRef } = parsed.data;

  let plan: any = null;
  try {
    plan = await prisma.plan.findUnique({ where: { slug } });
  } catch (err) {
    console.warn('[checkout] Erro ao buscar plano no banco, usando fallback:', err);
  }

  if (!plan) {
    const fallback = FALLBACK_PLANS.find((p) => p.slug === slug);
    if (fallback) {
      plan = {
        id: fallback.id,
        name: fallback.name,
        slug: fallback.slug,
        price: fallback.price,
        currency: fallback.currency,
        interval: fallback.interval,
        abacatePlanId: fallback.abacatePlanId,
        features: fallback.features,
        active: true,
      };
    }
  }

  if (!plan || !plan.active) {
    return NextResponse.json({ error: 'Plano indisponível' }, { status: 404 });
  }

  // Preço base com ou sem Order Bump do Curso
  const COURSE_ORDER_BUMP_CENTS = 4700; // R$ 47,00
  const subtotalAmount = includeCourse ? plan.price + COURSE_ORDER_BUMP_CENTS : plan.price;

  // Busca e validação do Afiliado / YouTuber / Cupom
  const codeToSearch = (couponCode || affiliateRef || '').trim().toUpperCase();
  let affiliate: any = null;
  if (codeToSearch) {
    try {
      affiliate = await prisma.affiliate.findFirst({
        where: {
          active: true,
          OR: [
            { couponCode: codeToSearch },
            { slug: codeToSearch.toLowerCase() },
          ],
        },
      });
    } catch (affErr) {
      console.warn('[checkout] Erro ao buscar cupom no banco:', affErr);
    }
  }

  // Cálculo de desconto (caso o afiliado ofereça cupom de desconto ao cliente)
  let discountCents = 0;
  if (affiliate && affiliate.discountPercent > 0) {
    discountCents = Math.round((subtotalAmount * affiliate.discountPercent) / 100);
  }
  const finalAmount = Math.max(100, subtotalAmount - discountCents);

  // Cálculo da comissão do YouTuber (ex: 20% do valor final faturado)
  let commissionAmount = 0;
  if (affiliate && affiliate.commissionPercent > 0) {
    commissionAmount = Math.round((finalAmount * affiliate.commissionPercent) / 100);
  }

  let orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  let orderCreatedInDb = false;

  try {
    // Upsert customer
    let customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      customer = await prisma.customer.create({ data: { name, email, phone } });
    } else {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: { name, email, phone: phone ?? customer.phone },
      });
    }

    // Create order no banco de dados local com vínculo do criador
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        planId: plan.id,
        status: 'pending',
        amount: finalAmount,
        currency: plan.currency,
        affiliateId: affiliate ? affiliate.id : null,
        couponCode: affiliate ? affiliate.couponCode : (couponCode ? couponCode.trim().toUpperCase() : null),
        commissionAmount,
        commissionStatus: affiliate ? 'pending' : null,
        metadata: {
          slug,
          source: 'site',
          includeCourse: Boolean(includeCourse),
          coursePriceCents: includeCourse ? COURSE_ORDER_BUMP_CENTS : 0,
          planPriceCents: plan.price,
          subtotalAmount,
          discountCents,
          affiliateId: affiliate?.id,
          affiliateName: affiliate?.name,
          affiliateSlug: affiliate?.slug,
          couponCode: affiliate?.couponCode,
          commissionPercent: affiliate?.commissionPercent,
          commissionAmount,
        },
      },
    });
    orderId = order.id;
    orderCreatedInDb = true;
  } catch (dbErr) {
    console.warn('[checkout] Banco SQLite indisponível ou somente leitura na Vercel. Prosseguindo com pedido temporário:', dbErr);
  }

  // AbacatePay plan id
  const abacatePlanId = plan.abacatePlanId || getPlanId(slug);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fabricadecortes.com';
  const returnURL = process.env.ABACATEPAY_RETURN_URL || `${appUrl}/retorno`;

  let checkout: any;
  try {
    checkout = await createCheckout({
      planSlug: slug,
      planId: abacatePlanId || slug,
      amount: finalAmount,
      currency: 'BRL',
      customer: { name, email, phone },
      metadata: {
        orderId,
        slug,
        email,
        includeCourse: includeCourse ? 'true' : 'false',
        affiliateId: affiliate?.id || '',
        couponCode: affiliate?.couponCode || '',
      },
      returnURL,
      appName: includeCourse 
        ? `${process.env.ABACATEPAY_APP_NAME || 'Fábrica dos Cortes'} + Curso VIP`
        : (process.env.ABACATEPAY_APP_NAME || 'Fábrica dos Cortes'),
    });
  } catch (e: any) {
    console.error('[createCheckout Error]:', e);
    if (orderCreatedInDb) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'failed', metadata: { error: e.message } },
      }).catch(() => null);
    }
    return NextResponse.json(
      { error: 'Não foi possível iniciar o checkout no AbacatePay.', detail: e.message },
      { status: 502 }
    );
  }

  // Update order with checkout id
  if (orderCreatedInDb) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        abacateCheckoutId: checkout.checkoutId,
        abacateOrderId: checkout.orderId,
      },
    }).catch(() => null);
  }

  return NextResponse.json({
    ok: true,
    orderId,
    checkoutURL: checkout.checkoutURL,
  });
}