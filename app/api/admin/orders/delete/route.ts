import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const auth = await verifyAdminRequest();
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { orderId } = await req.json().catch(() => ({}));
  if (!orderId) return NextResponse.json({ error: 'ID do pedido obrigatório' }, { status: 400 });

  try {
    // Remove credenciais associadas ao pedido
    await prisma.accessCredentials.deleteMany({ where: { orderId } });
    // Remove o pedido
    await prisma.order.delete({ where: { id: orderId } });

    return NextResponse.json({ ok: true, message: 'Pedido excluído com sucesso' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao excluir pedido' }, { status: 500 });
  }
}
