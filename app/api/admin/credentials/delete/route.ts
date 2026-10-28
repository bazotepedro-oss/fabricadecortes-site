import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deleteLicenseOnServer } from '@/lib/license-server';

export async function POST(req: Request) {
  const auth = await verifyAdminRequest();
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const credId = body.credId ? String(body.credId).trim() : '';
  const licenseKey = body.licenseKey ? String(body.licenseKey).trim() : '';

  if (!credId && !licenseKey) return NextResponse.json({ error: 'ID da credencial ou chave obrigatório' }, { status: 400 });

  try {
    const cred = await prisma.accessCredentials.findFirst({
      where: credId ? { id: credId } : { licenseKey },
    }).catch(() => null);

    const keyToDelete = cred?.licenseKey || licenseKey;
    if (keyToDelete) {
      await deleteLicenseOnServer(keyToDelete).catch((e) =>
        console.warn('[Cred Delete] Erro ao deletar licença do Railway:', e)
      );
    }

    if (credId) {
      await prisma.accessCredentials.deleteMany({ where: { id: credId } }).catch(() => null);
    }
    if (keyToDelete) {
      await prisma.accessCredentials.deleteMany({ where: { licenseKey: keyToDelete } }).catch(() => null);
    }

    return NextResponse.json({ ok: true, message: 'Credencial e licença excluídas com sucesso' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao excluir credencial' }, { status: 500 });
  }
}
