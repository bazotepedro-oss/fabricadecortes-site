import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const auth = await verifyAdminRequest();
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { subscriptionId } = await req.json().catch(() => ({}));
  if (!subscriptionId) return NextResponse.json({ error: 'ID da assinatura obrigatório' }, { status: 400 });

  try {
    // Remove credenciais associadas à assinatura
    await prisma.accessCredentials.deleteMany({ where: { subscriptionId } });
    // Remove a assinatura
    await prisma.subscription.delete({ where: { id: subscriptionId } });

    return NextResponse.json({ ok: true, message: 'Assinatura excluída com sucesso' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao excluir assinatura' }, { status: 500 });
  }
}
