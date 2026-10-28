import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncDeleteStudent } from '@/lib/members-sync';
import { deleteLicenseOnServer } from '@/lib/license-server';

export async function POST(req: Request) {
  const auth = await verifyAdminRequest();
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { customerId, email } = await req.json().catch(() => ({}));
  if (!customerId && !email) return NextResponse.json({ error: 'ID ou e-mail do cliente obrigatório' }, { status: 400 });

  try {
    const customer = await prisma.customer.findFirst({
      where: customerId ? { id: customerId } : { email: String(email).toLowerCase().trim() },
      include: { credentials: true, orders: true },
    });

    if (!customer) {
      return NextResponse.json({ ok: true, message: 'Cliente já não existe no banco de dados' });
    }

    const customerEmail = customer.email.toLowerCase().trim();

    // 1. Exclui da Área de Membros (HostGator) e registra na blacklist permanente
    await syncDeleteStudent(customerEmail).catch((e) =>
      console.warn('[Customer Delete] Falha ao excluir aluno na Área de Membros:', e)
    );

    // 2. Coleta todas as chaves de licença associadas (credenciais e metadados de pedidos)
    const keysToDelete = new Set<string>();
    if (customer.credentials?.length) {
      for (const cred of customer.credentials) {
        if (cred.licenseKey) keysToDelete.add(cred.licenseKey.trim().toUpperCase());
      }
    }
    if (customer.orders?.length) {
      for (const ord of customer.orders) {
        const meta = (ord.metadata as any) || {};
        if (meta.licenseKey) keysToDelete.add(String(meta.licenseKey).trim().toUpperCase());
      }
    }

    // Remove as chaves no Railway concorrentemente
    await Promise.all(
      Array.from(keysToDelete).map((key) =>
        deleteLicenseOnServer(key).catch((e) =>
          console.warn(`[Customer Delete] Erro ao deletar licença ${key} do Railway:`, e)
        )
      )
    );

    // 3. Remove credenciais, assinaturas, pedidos e cliente do banco local
    await prisma.accessCredentials.deleteMany({ where: { customerId: customer.id } });
    await prisma.subscription.deleteMany({ where: { customerId: customer.id } });
    await prisma.order.deleteMany({ where: { customerId: customer.id } });
    await prisma.customer.delete({ where: { id: customer.id } });

    // 4. Registra no AuditLog local para impedir que sincronizações futuras da AbacatePay recriem o cliente
    await prisma.auditLog.create({
      data: {
        eventType: 'customer_deleted',
        userId: customer.id,
        message: customerEmail,
        metadata: {
          name: customer.name,
          deletedAt: new Date().toISOString(),
          licenseKeys: Array.from(keysToDelete),
        },
      },
    }).catch((e) => console.warn('[Customer Delete] Falha ao gravar AuditLog:', e));

    return NextResponse.json({
      ok: true,
      message: 'Cliente, licença do Railway, pedidos, assinaturas e acesso à Área de Membros foram removidos com sucesso',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao remover cliente' }, { status: 500 });
  }
}
