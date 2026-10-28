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
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(customerId ? [{ id: customerId }] : []),
        ],
      },
      include: { credentials: true },
    }).catch(() => null);

    if (!customer) {
      // 1. Tenta hidratar via AbacatePay se este container ainda não sincronizou
      const { syncAbacatePay } = await import('@/lib/sync-abacatepay');
      await syncAbacatePay().catch(() => null);

      customer = await prisma.customer.findFirst({
        where: {
          OR: [
            ...(email ? [{ email }] : []),
            ...(customerId ? [{ id: customerId }] : []),
          ],
        },
        include: { credentials: true },
      }).catch(() => null);
    }

    const targetEmail = customer?.email || email;
    if (!targetEmail) {
      return NextResponse.json({ error: 'Informe o e-mail ou selecione um cliente válido' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.fabricadecortes.com').replace(/\/$/, '');

    // 2. Se o cliente não existir no Prisma local mas tiver e-mail, cria para manter sincronizado
    if (!customer) {
      const name = body.name || targetEmail.split('@')[0];
      customer = await prisma.customer.create({
        data: {
          name,
          email: targetEmail,
          credentials: {
            create: {
              username: targetEmail.split('@')[0],
              passwordHash,
              plainPassword: newPassword,
              accessUrl: `${base}/acesso`,
              status: 'active',
            },
          },
        },
        include: { credentials: true },
      }).catch(() => null);
    } else {
      // Atualiza credenciais no Prisma
      if (customer.credentials && customer.credentials.length > 0) {
        await prisma.accessCredentials.updateMany({
          where: { customerId: customer.id },
          data: {
            passwordHash,
            plainPassword: newPassword,
            updatedAt: new Date(),
          },
        }).catch(() => null);
      } else {
        await prisma.accessCredentials.create({
          data: {
            customerId: customer.id,
            username: customer.email.split('@')[0],
            passwordHash,
            plainPassword: newPassword,
            accessUrl: `${base}/acesso`,
            status: 'active',
          },
        }).catch(() => null);
      }
    }

    // 3. Sincroniza com a Área de Membros (HostGator)
    const membersSynced = await syncSetStudentPassword(targetEmail, newPassword);

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
