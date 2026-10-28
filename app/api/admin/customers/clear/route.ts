import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncClearStudents } from '@/lib/members-sync';

export async function POST() {
  const auth = await verifyAdminRequest();
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    // 1. Limpa alunos de teste da Área de Membros
    await syncClearStudents();

    // 2. Remove credenciais, assinaturas, pedidos e clientes do banco local
    await prisma.accessCredentials.deleteMany({});
    await prisma.subscription.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.customer.deleteMany({});

    return NextResponse.json({ ok: true, message: 'CRM e Área de Membros limpos com sucesso' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao limpar CRM' }, { status: 500 });
  }
}

