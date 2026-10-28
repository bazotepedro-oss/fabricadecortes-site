// PATCH, DELETE /api/admin/affiliates/[id]
import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const UpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  slug: z.string().min(2).optional(),
  couponCode: z.string().min(2).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  commissionPercent: z.number().min(1).max(100).optional(),
  pixKey: z.string().min(3).optional(),
  pixKeyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random']).optional(),
  active: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await verifyAdminRequest(undefined, req);
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const updateData: any = { ...parsed.data };
  if (updateData.slug) updateData.slug = updateData.slug.toLowerCase().trim();
  if (updateData.couponCode) updateData.couponCode = updateData.couponCode.toUpperCase().trim();

  const updated = await prisma.affiliate.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({ ok: true, affiliate: updated });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const admin = await verifyAdminRequest(undefined, req);
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    // 1. Desvincula pedidos associados para preservar histórico de pedidos dos clientes
    await prisma.order.updateMany({
      where: { affiliateId: params.id },
      data: { affiliateId: null },
    });

    // 2. Remove registros de repasses do afiliado
    await prisma.affiliatePayout.deleteMany({
      where: { affiliateId: params.id },
    });

    // 3. Exclui o afiliado do banco de dados
    await prisma.affiliate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true, message: 'Parceiro excluído com sucesso' });
  } catch (error: any) {
    console.error('[Delete Affiliate] Erro ao excluir parceiro:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir parceiro: ' + (error?.message || 'Erro interno') },
      { status: 500 }
    );
  }
}
