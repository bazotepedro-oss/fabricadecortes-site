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

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const affId = params.id || body.id;
  const bodyEmail = (body.email ? String(body.email) : '').toLowerCase().trim();
  const bodySlug = (body.slug ? String(body.slug) : '').toLowerCase().trim();

  try {
    // 0. Busca o parceiro antes de excluir para limpar id, email e slug permanentemente
    const aff = await prisma.affiliate.findFirst({
      where: {
        OR: [
          ...(affId ? [{ id: affId }] : []),
          ...(bodyEmail ? [{ email: bodyEmail }] : []),
          ...(bodySlug ? [{ slug: bodySlug }] : []),
        ],
      },
    }).catch(() => null);

    const targetId = aff?.id || affId;
    const targetEmail = aff?.email || bodyEmail;
    const targetSlug = aff?.slug || bodySlug;

    // 1. Sincroniza exclusão definitiva na HostGator por id, email e slug
    await syncDeleteAffiliate({
      id: targetId,
      email: targetEmail,
      slug: targetSlug,
    }).catch((e) => console.warn('[Affiliate Delete] Falha ao excluir na HostGator:', e));

    // 2. Desvincula pedidos associados para preservar histórico de pedidos dos clientes
    if (targetId) {
      await prisma.order.updateMany({
        where: { affiliateId: targetId },
        data: { affiliateId: null, payoutId: null },
      }).catch(() => null);

      // 3. Remove registros de repasses do afiliado
      await prisma.affiliatePayout.deleteMany({
        where: { affiliateId: targetId },
      }).catch(() => null);
    }

    // 4. Exclui o afiliado do banco de dados local por ID, email e slug
    await prisma.affiliate.deleteMany({
      where: {
        OR: [
          ...(targetId ? [{ id: targetId }] : []),
          ...(targetEmail ? [{ email: targetEmail }] : []),
          ...(targetSlug ? [{ slug: targetSlug }] : []),
        ],
      },
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
