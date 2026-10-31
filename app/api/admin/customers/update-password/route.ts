import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncSetStudentPassword } from '@/lib/members-sync';

export async function POST(req: Request) {
  const auth = await verifyAdminRequest(undefined, req);
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const customerId = body.customerId ? String(body.customerId).trim() : null;
  const email = body.email ? String(body.email).trim().toLowerCase() : null;
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword.trim() : '';
  if (newPassword.length < 12 || newPassword.length > 128) {
    return NextResponse.json({ error: 'A senha deve ter entre 12 e 128 caracteres.' }, { status: 400 });
  }

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
              accessUrl: `${base}/retorno`,
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
            updatedAt: new Date(),
          },
        }).catch(() => null);
      } else {
        await prisma.accessCredentials.create({
          data: {
            customerId: customer.id,
            username: customer.email.split('@')[0],
            passwordHash,
            accessUrl: `${base}/retorno`,
            status: 'active',
          },
        }).catch(() => null);
      }
    }

    // 3. Sincroniza com a Área de Membros (HostGator)
    const membersSynced = await syncSetStudentPassword(targetEmail, newPassword);

    return NextResponse.json({
      ok: membersSynced,
      message: membersSynced
        ? 'Senha atualizada com sucesso e sincronizada na Área de Membros.'
        : 'Senha local atualizada, mas a Área de Membros não confirmou a alteração. Tente sincronizar novamente.',
      membersSynced,
    }, { status: membersSynced ? 200 : 502 });
  } catch (err: any) {
    console.error('[Admin] Erro ao atualizar senha do cliente:', err);
    return NextResponse.json({ error: err?.message || 'Erro ao atualizar senha' }, { status: 500 });
  }
}
