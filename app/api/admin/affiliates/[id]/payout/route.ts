// POST /api/admin/affiliates/[id]/payout
// Realiza o fechamento e marca comissões como pagas via Pix
import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const Schema = z.object({
  period: z.string().optional(), // ex: "Outubro/2026"
  proof: z.string().optional(), // comprovante ou id da transação Pix
  notes: z.string().optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await verifyAdminRequest(undefined, req);
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: params.id },
    include: {
      orders: {
        where: {
          commissionStatus: 'credited',
        },
      },
    },
  });

  if (!affiliate) {
    return NextResponse.json({ error: 'Parceiro não encontrado' }, { status: 404 });
  }

  const creditedOrders = affiliate.orders;
  if (creditedOrders.length === 0) {
    return NextResponse.json(
      { error: 'Não há comissões pendentes de repasse para este parceiro' },
      { status: 400 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const parsed = Schema.safeParse(body);
  const { period, proof, notes } = parsed.success ? parsed.data : { period: undefined, proof: undefined, notes: undefined };

  const currentPeriod = period || new Date().toISOString().slice(0, 7); // ex: "2026-10"
  const totalSales = creditedOrders.length;
  const totalGrossAmount = creditedOrders.reduce((acc, o) => acc + (o.amount || 0), 0);
  const totalCommissionAmount = creditedOrders.reduce((acc, o) => acc + (o.commissionAmount || 0), 0);

  // 1. Cria o registro de repasse / Payout
  const payout = await prisma.affiliatePayout.create({
    data: {
      affiliateId: affiliate.id,
      period: currentPeriod,
      totalSales,
      totalAmount: totalGrossAmount,
      commissionAmount: totalCommissionAmount,
      status: 'paid',
      paidAt: new Date(),
      proof: proof || null,
      notes: notes || null,
    },
  });

  // 2. Atualiza todas as ordens vinculadas para status 'paid' e vincula ao payout
  const orderIds = creditedOrders.map((o) => o.id);
  await prisma.order.updateMany({
    where: { id: { in: orderIds } },
    data: {
      commissionStatus: 'paid',
      payoutId: payout.id,
    },
  });

  // 3. Registra log de auditoria
  await prisma.auditLog.create({
    data: {
      eventType: 'affiliate_payout',
      userId: admin.adminId,
      message: `Repasse Pix confirmado para ${affiliate.name}: R$ ${(totalCommissionAmount / 100).toFixed(2)} (${totalSales} vendas)`,
      metadata: {
        affiliateId: affiliate.id,
        payoutId: payout.id,
        amountCents: totalCommissionAmount,
        pixKey: affiliate.pixKey,
      },
    },
  });

  return NextResponse.json({
    ok: true,
    payout,
    message: `Repasse de R$ ${(totalCommissionAmount / 100).toFixed(2)} registrado com sucesso!`,
  });
}
