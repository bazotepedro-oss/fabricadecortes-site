import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { AdminShell } from '@/components/admin-shell';
import { listLicensesFromServer } from '@/lib/license-server';
import { verifyAdminRequest } from '@/lib/auth';
import { syncAbacatePay } from '@/lib/sync-abacatepay';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams?: { token?: string };
}

export default async function AdminPage({ searchParams }: PageProps) {
  const urlToken = searchParams?.token;
  const session = await verifyAdminRequest(urlToken);

  if (!session) {
    redirect('/admin/login');
  }

  // Sincroniza pagamentos da AbacatePay (v2) automaticamente com Railway
  await syncAbacatePay().catch((err) => console.error('Erro na auto-sincronização:', err));

  const [orders, subscriptions, customers, credentials, events, railwayLicenses, affiliates] = await Promise.all([
    prisma.order.findMany({ include: { customer: true, plan: true }, orderBy: { createdAt: 'desc' }, take: 50 }).catch((e) => { console.warn('[Admin] Erro ao carregar pedidos:', e); return []; }),
    prisma.subscription.findMany({ include: { customer: true, plan: true }, orderBy: { createdAt: 'desc' }, take: 50 }).catch((e) => { console.warn('[Admin] Erro ao carregar assinaturas:', e); return []; }),
    prisma.customer.findMany({
      include: {
        orders: { include: { plan: true }, orderBy: { createdAt: 'desc' } },
        credentials: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }).catch((e) => { console.warn('[Admin] Erro ao carregar clientes:', e); return []; }),
    prisma.accessCredentials.findMany({ include: { customer: true, order: true }, orderBy: { createdAt: 'desc' }, take: 50 }).catch((e) => { console.warn('[Admin] Erro ao carregar credenciais:', e); return []; }),
    prisma.webhookEvent.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }).catch((e) => { console.warn('[Admin] Erro ao carregar webhooks:', e); return []; }),
    listLicensesFromServer().catch((e) => { console.warn('[Admin] Erro ao carregar licenças Railway:', e); return []; }),
    prisma.affiliate.findMany({
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
    }).catch((e) => { console.warn('[Admin] Erro ao carregar afiliados:', e); return []; }),
  ]);

  return (
    <AdminShell
      orders={orders}
      subscriptions={subscriptions}
      customers={customers}
      credentials={credentials}
      events={events}
      railwayLicenses={railwayLicenses}
      affiliates={affiliates}
    />
  );
}