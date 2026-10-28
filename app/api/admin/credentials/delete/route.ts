import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deleteLicenseOnServer } from '@/lib/license-server';

export async function POST(req: Request) {
  const auth = await verifyAdminRequest();
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { credId } = await req.json().catch(() => ({}));
  if (!credId) return NextResponse.json({ error: 'ID da credencial obrigatório' }, { status: 400 });

  try {
    const cred = await prisma.accessCredentials.findUnique({ where: { id: credId } });
    if (cred?.licenseKey) {
      await deleteLicenseOnServer(cred.licenseKey).catch((e) =>
        console.warn('[Cred Delete] Erro ao deletar licença do Railway:', e)
      );
    }

    await prisma.accessCredentials.delete({ where: { id: credId } });

    return NextResponse.json({ ok: true, message: 'Credencial e licença excluídas com sucesso' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao excluir credencial' }, { status: 500 });
  }
}
