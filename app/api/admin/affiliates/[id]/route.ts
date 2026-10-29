// PATCH, DELETE /api/admin/affiliates/[id]
import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncSaveAffiliate, syncDeleteAffiliate } from '@/lib/members-sync';
import { z } from 'zod';

const UpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  slug: z.string().min(2).optional(),
  couponCode: z.string().min(2).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  commissionPercent: z.number().min(1).max(100).optional(),
  pixKey: z.string().optional().nullable().transform((v) => (v && v.trim()) ? v.trim() : 'A combinar'),
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

  try {
    const updated = await prisma.affiliate.update({
      where: { id: params.id },
      data: updateData,
    });

    await syncSaveAffiliate(updated).catch(() => null);

    return NextResponse.json({ ok: true, affiliate: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao atualizar parceiro' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const admin = await verifyAdminRequest(undefined, req);
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    // 0. Busca o parceiro antes de excluir para limpar id, email e slug permanentemente
    const aff = await prisma.affiliate.findUnique({
      where: { id: params.id },
    }).catch(() => null);

    // 1. Sincroniza exclusão definitiva na HostGator
    await syncDeleteAffiliate({
      id: params.id,
      email: aff?.email,
      slug: aff?.slug,
    }).catch(() => null);

    // 2. Desvincula pedidos associados para preservar histórico de pedidos dos clientes
    await prisma.order.updateMany({
      where: { affiliateId: params.id },
      data: { affiliateId: null },
    }).catch(() => null);

    // 3. Remove registros de repasses do afiliado
    await prisma.affiliatePayout.deleteMany({
      where: { affiliateId: params.id },
    }).catch(() => null);

    // 4. Exclui o afiliado do banco de dados local
    await prisma.affiliate.delete({
      where: { id: params.id },
    }).catch(() => null);

    return NextResponse.json({ ok: true, message: 'Parceiro excluído com sucesso' });
  } catch (error: any) {
    console.error('[Delete Affiliate] Erro ao excluir parceiro:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir parceiro: ' + (error?.message || 'Erro interno') },
      { status: 500 }
    );
  }
}
