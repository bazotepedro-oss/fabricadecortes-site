import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncDeleteCheckout } from '@/lib/members-sync';

export async function POST(req: Request) {
  const auth = await verifyAdminRequest(undefined, req);
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const orderId = body.orderId ? String(body.orderId).trim() : '';
  const checkoutId = body.checkoutId ? String(body.checkoutId).trim() : '';

  if (!orderId && !checkoutId) {
    return NextResponse.json({ error: 'ID do pedido ou do checkout obrigatório' }, { status: 400 });
  }

  try {
    let targetCheckoutId = checkoutId;
    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } }).catch(() => null);
      if (order?.abacateCheckoutId) {
        targetCheckoutId = order.abacateCheckoutId;
      }
    }

    // Registra na HostGator para impedir que a sincronização da AbacatePay recrie o pedido
    if (targetCheckoutId) {
      await syncDeleteCheckout(targetCheckoutId).catch(() => null);
    }

    // Remove credenciais associadas ao pedido
    if (orderId) {
      await prisma.accessCredentials.deleteMany({ where: { orderId } }).catch(() => null);
      await prisma.order.deleteMany({ where: { id: orderId } }).catch(() => null);
    }
    if (targetCheckoutId) {
      await prisma.order.deleteMany({ where: { abacateCheckoutId: targetCheckoutId } }).catch(() => null);
    }

    return NextResponse.json({ ok: true, message: 'Pedido excluído com sucesso' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao excluir pedido' }, { status: 500 });
  }
}
