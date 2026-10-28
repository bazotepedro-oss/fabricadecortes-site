import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncClearStudents } from '@/lib/members-sync';
import { listLicensesFromServer, deleteLicenseOnServer } from '@/lib/license-server';

export async function POST() {
  const auth = await verifyAdminRequest();
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    // 0. Coleta todos os e-mails existentes no banco antes da exclusão
    const existingCustomers = await prisma.customer.findMany({ select: { email: true } }).catch(() => []);
    const emails = existingCustomers.map((c) => c.email.toLowerCase().trim()).filter(Boolean);

    // 1. Limpa alunos da Área de Membros (HostGator), salva crm_cleared_at e inclui e-mails na blacklist
    await syncClearStudents(emails).catch((e) =>
      console.warn('[Clear CRM] Falha ao limpar Área de Membros:', e)
    );

    // 2. Remove as licenças existentes no Railway concorrentemente
    const licenses = await listLicensesFromServer().catch(() => []);
    await Promise.all(
      licenses.map((lic) =>
        lic.license_key ? deleteLicenseOnServer(lic.license_key).catch(() => null) : Promise.resolve()
      )
    );

    // 3. Remove credenciais, assinaturas, pedidos e clientes do banco local
    await prisma.accessCredentials.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.customer.deleteMany({});

    // 4. Registra no AuditLog local para proteção em dupla camada contra ressuscitação de dados
    await prisma.auditLog.create({
      data: {
        eventType: 'crm_cleared',
        message: `Limpeza total do CRM executada em ${new Date().toISOString()}`,
        metadata: {
          clearedAt: new Date().toISOString(),
          totalEmails: emails.length,
          emails,
        },
      },
    }).catch((e) => console.warn('[Clear CRM] Falha ao gravar AuditLog:', e));

    return NextResponse.json({ ok: true, message: 'CRM, Licenças e Área de Membros limpos com sucesso' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao limpar CRM' }, { status: 500 });
  }
}
