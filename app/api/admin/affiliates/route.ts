// GET, POST /api/admin/affiliates
import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const CreateSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  slug: z.string().min(2, 'Slug obrigatório').regex(/^[a-zA-Z0-9_-]+$/, 'Apenas letras, números e hífens'),
  couponCode: z.string().min(2, 'Cupom obrigatório'),
  discountPercent: z.number().min(0).max(100).default(0),
  commissionPercent: z.number().min(1).max(100).default(20),
  pixKey: z.string().min(3, 'Chave Pix obrigatória'),
  pixKeyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random']).default('cpf'),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  const admin = await verifyAdminRequest(undefined, req);
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fabricadecortes.com';

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const cleanSlug = data.slug.toLowerCase().trim();
  const cleanCoupon = data.couponCode.toUpperCase().trim();

  // Verifica unicidade
  const existing = await prisma.affiliate.findFirst({
    where: {
      OR: [
        { email: data.email.toLowerCase().trim() },
        { slug: cleanSlug },
        { couponCode: cleanCoupon },
      ],
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: 'Já existe um parceiro com este e-mail, slug ou cupom cadastrado' },
      { status: 409 }
    );
  }

  const affiliate = await prisma.affiliate.create({
    data: {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
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

  await prisma.auditLog.create({
    data: {
      eventType: 'affiliate_created',
      userId: admin.adminId,
      message: `Novo parceiro criado: ${affiliate.name} (${affiliate.couponCode})`,
      metadata: { affiliateId: affiliate.id },
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fabricadecortes.com';

  return NextResponse.json({
    ok: true,
    affiliate: {
      ...affiliate,
      referralUrl: `${appUrl}/?ref=${affiliate.slug}`,
      portalUrl: `${appUrl}/parceiro/${affiliate.token}`,
    },
  });
}
