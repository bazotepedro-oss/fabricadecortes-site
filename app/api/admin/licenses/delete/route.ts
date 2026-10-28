import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { deleteLicenseOnServer } from '@/lib/license-server';
import { prisma } from '@/lib/db';
import { syncDeleteStudent } from '@/lib/members-sync';

export async function POST(req: Request) {
  const auth = await verifyAdminRequest();
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { licenseKey } = await req.json();
  if (!licenseKey) return NextResponse.json({ error: 'Chave obrigatória' }, { status: 400 });

  // 1. Exclui do servidor Railway
  const res = await deleteLicenseOnServer(licenseKey);

  // 2. Localiza o cliente e revoga/exclui o acesso da Área de Membros
  try {
    const cred = await prisma.accessCredentials.findFirst({
      where: { licenseKey },
      include: { customer: true },
    });
    if (cred?.customer?.email) {
      await syncDeleteStudent(cred.customer.email);
    }
  } catch (syncErr: any) {
    console.warn('[LicenseDelete] Erro ao sincronizar remoção na Área de Membros:', syncErr?.message);
  }

  // 3. Marca como revogada no banco local
  await prisma.accessCredentials.updateMany({
    where: { licenseKey },
    data: { status: 'revoked', updatedAt: new Date() },
  });

  return NextResponse.json(res);
}

