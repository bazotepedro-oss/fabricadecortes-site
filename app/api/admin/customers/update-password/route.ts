import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncSetStudentPassword } from '@/lib/members-sync';
import { generatePassword } from '@/lib/provisioning';

export async function POST(req: Request) {
  const auth = await verifyAdminRequest();
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const customerId = body.customerId ? String(body.customerId).trim() : null;
  const email = body.email ? String(body.email).trim().toLowerCase() : null;
  const newPassword = body.newPassword ? String(body.newPassword).trim() : generatePassword(10);

  if (!customerId && !email) {
    return NextResponse.json({ error: 'Informe customerId ou email' }, { status: 400 });
  }

  try {
    const customer = await prisma.customer.findFirst({
      where: customerId ? { id: customerId } : { email: email! },
      include: { credentials: true },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Atualiza credenciais no Prisma
    if (customer.credentials && customer.credentials.length > 0) {
      await prisma.accessCredentials.updateMany({
        where: { customerId: customer.id },
        data: {
          passwordHash,
          plainPassword: newPassword,
          updatedAt: new Date(),
        },
      });
    } else {
      // Se não tinha credencial criada ainda, cria uma nova
      const base = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
      await prisma.accessCredentials.create({
        data: {
          customerId: customer.id,
          username: customer.email.split('@')[0],
          passwordHash,
          plainPassword: newPassword,
          accessUrl: `${base}/acesso`,
          status: 'active',
        },
      });
    }

    // Sincroniza com a Área de Membros (HostGator)
    const membersSynced = await syncSetStudentPassword(customer.email, newPassword);

    return NextResponse.json({
      ok: true,
      message: `Senha alterada para "${newPassword}" com sucesso!${membersSynced ? ' (Sincronizado na Área de Membros)' : ''}`,
      newPassword,
      membersSynced,
    });
  } catch (err: any) {
    console.error('[Admin] Erro ao atualizar senha do cliente:', err);
    return NextResponse.json({ error: err?.message || 'Erro ao atualizar senha' }, { status: 500 });
  }
}
