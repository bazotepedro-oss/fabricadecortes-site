// GET /api/orders/[id]/status — returns order status + credentials if available.
// Protected by one-time token or email+orderId query.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyAccessLinkToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email')?.toLowerCase();

    let order: any = null;
    try {
      order = await prisma.order.findUnique({ where: { id: params.id } });
    } catch (err) {
      console.warn('[orders/status] Erro no banco ao buscar pedido:', err);
    }

    if (!order) {
      return NextResponse.json({ error: 'Pedido não localizado ou em processamento' }, { status: 404 });
    }

    // Authz: either token matches, or email matches the customer
    let authorized = false;
    if (token) {
      const claims = verifyAccessLinkToken(token);
      if (claims && claims.orderId === order.id) authorized = true;
    }
    if (email) {
      try {
        const customer = await prisma.customer.findUnique({ where: { id: order.customerId } });
        if (customer && customer.email.toLowerCase() === email) authorized = true;
      } catch {}
    }
    if (!authorized) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    let credentials: any = null;
    let subscription: any = null;
    try {
      credentials = await prisma.accessCredentials.findFirst({
        where: { orderId: order.id, status: 'active' },
      });
      subscription = await prisma.subscription.findFirst({
        where: { customerId: order.customerId, status: 'active' },
      });
    } catch {}

    return NextResponse.json({
      order: { id: order.id, status: order.status, amount: order.amount, currency: order.currency, createdAt: order.createdAt },
      subscription: subscription ? { id: subscription.id, status: subscription.status } : null,
      credentials: credentials
        ? {
            id: credentials.id,
            username: credentials.username,
            accessUrl: credentials.accessUrl,
            status: credentials.status,
            expiresAt: credentials.expiresAt,
          }
        : null,
    });
  } catch (globalErr: any) {
    return NextResponse.json({ error: 'Erro ao consultar status' }, { status: 500 });
  }
}