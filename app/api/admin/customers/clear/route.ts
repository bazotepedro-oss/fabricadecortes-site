import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncClearStudents } from '@/lib/members-sync';
import { listLicensesFromServer, deleteLicenseOnServer } from '@/lib/license-server';

export async function POST() {
  const auth = await verifyAdminRequest();
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    // 1. Limpa alunos da Área de Membros e grava seus e-mails na blacklist
    await syncClearStudents().catch((e) =>
      console.warn('[Clear CRM] Falha ao limpar Área de Membros:', e)
    );

    // 2. Remove as licenças existentes no Railway
    const licenses = await listLicensesFromServer().catch(() => []);
    for (const lic of licenses) {
      if (lic.license_key) {
        await deleteLicenseOnServer(lic.license_key).catch(() => null);
      }
    }

    // 3. Remove credenciais, assinaturas, pedidos e clientes do banco local
    await prisma.accessCredentials.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.customer.deleteMany({});

    return NextResponse.json({ ok: true, message: 'CRM, Licenças e Área de Membros limpos com sucesso' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao limpar CRM' }, { status: 500 });
  }
}


