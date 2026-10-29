// GET /api/admin/customers
import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const admin = await verifyAdminRequest(undefined, req);
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let customers = await prisma.customer.findMany({
    include: {
      orders: { include: { plan: true }, orderBy: { createdAt: 'desc' } },
      credentials: { orderBy: { createdAt: 'desc' } },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  if (customers.length === 0) {
    const { syncAbacatePay } = await import('@/lib/sync-abacatepay');
    await syncAbacatePay().catch(() => null);
    customers = await prisma.customer.findMany({
      include: {
        orders: { include: { plan: true }, orderBy: { createdAt: 'desc' } },
        credentials: { orderBy: { createdAt: 'desc' } },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  return NextResponse.json({ customers });
}