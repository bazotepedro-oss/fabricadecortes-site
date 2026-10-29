// GET, POST /api/admin/affiliates
import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncSaveAffiliate, syncListAffiliates } from '@/lib/members-sync';
import { z } from 'zod';

const CreateSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 letras').trim(),
  email: z.string().email('E-mail do parceiro inválido').trim().toLowerCase(),
  slug: z
    .string()
    .min(2, 'Slug deve ter no mínimo 2 letras')
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]+$/, 'Slug deve conter apenas letras, números e hífens'),
  couponCode: z.string().min(2, 'Cupom deve ter no mínimo 2 letras').trim().toUpperCase(),
  discountPercent: z.number().min(0).max(100).default(0),
  commissionPercent: z.number().min(1).max(100).default(20),
  pixKey: z.string().optional().default('A combinar').transform((v) => (v && v.trim()) ? v.trim() : 'A combinar'),
  pixKeyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random']).default('cpf'),
  notes: z.string().optional().transform((v) => (v && v.trim()) ? v.trim() : ''),
});

export async function GET(req: Request) {
  const admin = await verifyAdminRequest(undefined, req);
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // 1. Sincroniza afiliados salvos na HostGator para o banco local caso falte algum
  try {
    const hgAffiliates = await syncListAffiliates().catch(() => []);
    for (const hg of hgAffiliates) {
      if (!hg.email || !hg.slug) continue;
      const exists = await prisma.affiliate.findFirst({
        where: {
          OR: [{ email: hg.email }, { slug: hg.slug }, { id: hg.id }],
        },
      }).catch(() => null);

      if (!exists) {
        await prisma.affiliate.create({
          data: {
            id: hg.id || undefined,
            name: hg.name,
            email: hg.email,
            slug: hg.slug,
            token: hg.token || undefined,
            couponCode: hg.couponCode,
            discountPercent: hg.discountPercent,
            commissionPercent: hg.commissionPercent,
            pixKey: hg.pixKey,
            pixKeyType: hg.pixKeyType,
            active: hg.active !== false,
            notes: hg.notes,
          },
        }).catch(() => null);
      }
    }
  } catch (syncErr) {
    console.warn('[Affiliates GET] Falha ao sincronizar afiliados da HostGator:', syncErr);
  }

  const affiliates = await prisma.affiliate.findMany({
    include: {
      orders: {
        select: {
          id: true,
          status: true,
          amount: true,
          commissionAmount: true,
          commissionStatus: true,
          createdAt: true,
        },
      },
      payouts: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.fabricadecortes.com').replace(/\/$/, '');

  const enriched = affiliates.map((aff) => {
    const paidOrders = aff.orders.filter((o) => o.status === 'paid');
    const totalSales = paidOrders.length;
    const grossRevenue = paidOrders.reduce((acc, o) => acc + (o.amount || 0), 0);
    const pendingCommission = aff.orders
      .filter((o) => o.commissionStatus === 'credited')
      .reduce((acc, o) => acc + (o.commissionAmount || 0), 0);
    const paidCommission = aff.orders
      .filter((o) => o.commissionStatus === 'paid')
      .reduce((acc, o) => acc + (o.commissionAmount || 0), 0);

    return {
      ...aff,
      totalSales,
      grossRevenue,
      pendingCommission,
      paidCommission,
      referralUrl: `${appUrl}/?ref=${aff.slug}`,
      portalUrl: `${appUrl}/parceiro/${aff.token}`,
    };
  });

  return NextResponse.json({ ok: true, affiliates: enriched });
}

export async function POST(req: Request) {
  const admin = await verifyAdminRequest(undefined, req);
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let rawBody: any;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  // Sanitização prévia para evitar falhas por espaços em branco ou maiúsculas/minúsculas
  const body = {
    name: typeof rawBody.name === 'string' ? rawBody.name.trim() : rawBody.name,
    email: typeof rawBody.email === 'string' ? rawBody.email.trim().toLowerCase() : rawBody.email,
    slug: typeof rawBody.slug === 'string' ? rawBody.slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') : rawBody.slug,
    couponCode: typeof rawBody.couponCode === 'string' && rawBody.couponCode.trim()
      ? rawBody.couponCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '')
      : (typeof rawBody.slug === 'string' ? rawBody.slug.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') : ''),
    discountPercent: Number(rawBody.discountPercent) || 0,
    commissionPercent: Number(rawBody.commissionPercent) || 20,
    pixKey: typeof rawBody.pixKey === 'string' ? rawBody.pixKey.trim() : rawBody.pixKey,
    pixKeyType: rawBody.pixKeyType || 'cpf',
    notes: typeof rawBody.notes === 'string' ? rawBody.notes.trim() : rawBody.notes,
  };

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || 'Dados inválidos';
    return NextResponse.json(
      { error: firstIssue, details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const cleanSlug = data.slug.toLowerCase().trim();
  const cleanCoupon = data.couponCode.toUpperCase().trim();
  const cleanEmail = data.email.toLowerCase().trim();

  // 1. Verifica unicidade no banco local
  const existing = await prisma.affiliate.findFirst({
    where: {
      OR: [
        { email: cleanEmail },
        { slug: cleanSlug },
        { couponCode: cleanCoupon },
      ],
    },
  });

  if (existing) {
    let motivo = 'Já existe um parceiro cadastrado com estes dados.';
    if (existing.email.toLowerCase() === cleanEmail) {
      motivo = `Já existe um parceiro com o e-mail "${cleanEmail}".`;
    } else if (existing.slug.toLowerCase() === cleanSlug) {
      motivo = `O slug de link "${cleanSlug}" já está em uso por outro criador.`;
    } else if (existing.couponCode.toUpperCase() === cleanCoupon) {
      motivo = `O cupom "${cleanCoupon}" já está em uso por outro criador.`;
    }
    return NextResponse.json({ error: motivo }, { status: 409 });
  }

  const affiliate = await prisma.affiliate.create({
    data: {
      name: data.name.trim(),
      email: cleanEmail,
      slug: cleanSlug,
      couponCode: cleanCoupon,
      discountPercent: data.discountPercent,
      commissionPercent: data.commissionPercent,
      pixKey: data.pixKey.trim(),
      pixKeyType: data.pixKeyType,
      notes: data.notes?.trim() || null,
      active: true,
    },
  });

  // 2. Persiste na HostGator para retenção permanente entre containers da Vercel
  await syncSaveAffiliate(affiliate).catch((hgErr) => {
    console.warn('[Affiliate Create] Falha ao salvar backup na HostGator:', hgErr);
  });

  await prisma.auditLog.create({
    data: {
      eventType: 'affiliate_created',
      userId: admin.adminId,
      message: `Novo parceiro criado: ${affiliate.name} (${affiliate.couponCode})`,
      metadata: { affiliateId: affiliate.id },
    },
  }).catch(() => null);

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.fabricadecortes.com').replace(/\/$/, '');

  return NextResponse.json({
    ok: true,
    message: `Parceiro ${affiliate.name} cadastrado com sucesso!`,
    affiliate: {
      ...affiliate,
      referralUrl: `${appUrl}/?ref=${affiliate.slug}`,
      portalUrl: `${appUrl}/parceiro/${affiliate.token}`,
    },
  });
}
