import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncDeleteStudent } from '@/lib/members-sync';
import { deleteLicenseOnServer } from '@/lib/license-server';

export async function POST(req: Request) {
  const auth = await verifyAdminRequest();
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { customerId } = await req.json().catch(() => ({}));
  if (!customerId) return NextResponse.json({ error: 'ID do cliente obrigatório' }, { status: 400 });

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { credentials: true },
    });

    if (customer?.email) {
      // 1. Exclui da Área de Membros e registra na blacklist permanente
      await syncDeleteStudent(customer.email).catch((e) =>
        console.warn('[Customer Delete] Falha ao excluir aluno na Área de Membros:', e)
      );
    }

    // 2. Remove as chaves de licença associadas no servidor Railway (PostgreSQL)
    if (customer?.credentials?.length) {
      for (const cred of customer.credentials) {
        if (cred.licenseKey) {
          await deleteLicenseOnServer(cred.licenseKey).catch((e) =>
            console.warn('[Customer Delete] Erro ao deletar licença do Railway:', e)
          );
        }
      }
    }

    // 3. Remove credenciais, assinaturas, pedidos e cliente do banco local
    await prisma.accessCredentials.deleteMany({ where: { customerId } });
    await prisma.subscription.deleteMany({ where: { customerId } });
    await prisma.order.deleteMany({ where: { customerId } });
    await prisma.customer.delete({ where: { id: customerId } });

    return NextResponse.json({
      ok: true,
      message: 'Cliente, licença do Railway e acesso à Área de Membros foram removidos com sucesso',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao remover cliente' }, { status: 500 });
  }
}


