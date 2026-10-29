import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { syncEditStudent } from '@/lib/members-sync';
import { listLicensesFromServer, createLicenseOnServer } from '@/lib/license-server';

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
  const currentEmail = body.currentEmail ? String(body.currentEmail).trim().toLowerCase() : null;
  const email = body.email ? String(body.email).trim().toLowerCase() : null;
  const name = body.name ? String(body.name).trim() : null;
  const phone = body.phone !== undefined ? (body.phone ? String(body.phone).trim() : null) : undefined;
  const licenseKey = body.licenseKey ? String(body.licenseKey).trim().toUpperCase() : null;
  const password = body.password ? String(body.password).trim() : null;

  if (!customerId && !currentEmail && !email) {
    return NextResponse.json({ error: 'ID ou e-mail do cliente obrigatório' }, { status: 400 });
  }

  try {
    // 1. Localiza cliente por ID ou por e-mail (atual ou novo)
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [
          ...(customerId ? [{ id: customerId }] : []),
          ...(currentEmail ? [{ email: currentEmail }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
      include: { credentials: true },
    }).catch(() => null);

    // Se não encontrou neste container, tenta sincronizar e buscar novamente
    if (!customer) {
      const { syncAbacatePay } = await import('@/lib/sync-abacatepay');
      await syncAbacatePay().catch(() => null);

      customer = await prisma.customer.findFirst({
        where: {
          OR: [
            ...(customerId ? [{ id: customerId }] : []),
            ...(currentEmail ? [{ email: currentEmail }] : []),
            ...(email ? [{ email: email }] : []),
          ],
        },
        include: { credentials: true },
      }).catch(() => null);
    }

    const targetEmail = email || currentEmail || customer?.email;
    if (!targetEmail) {
      return NextResponse.json({ error: 'E-mail do cliente é obrigatório' }, { status: 400 });
    }

    // 2. Se ainda não existir no Prisma, cria
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          id: customerId || undefined,
          name: name || targetEmail.split('@')[0],
          email: targetEmail,
          phone: phone || null,
        },
        include: { credentials: true },
      });
    } else {
      // Atualiza os dados cadastrais do cliente
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: name || undefined,
          email: email || undefined,
          phone: phone !== undefined ? phone : undefined,
        },
        include: { credentials: true },
      });
    }

    // 3. Atualiza ou cria as credenciais no Prisma
    const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.fabricadecortes.com').replace(/\/$/, '');
    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    if (customer.credentials && customer.credentials.length > 0) {
      const credData: any = { updatedAt: new Date() };
      if (licenseKey) credData.licenseKey = licenseKey;
      if (password) {
        credData.plainPassword = password;
        credData.passwordHash = passwordHash;
      }
      await prisma.accessCredentials.updateMany({
        where: { customerId: customer.id },
        data: credData,
      }).catch(() => null);
    } else if (licenseKey || password) {
      await prisma.accessCredentials.create({
        data: {
          customerId: customer.id,
          username: targetEmail.split('@')[0],
          licenseKey: licenseKey || null,
          plainPassword: password || null,
          passwordHash: passwordHash || null,
          accessUrl: `${base}/retorno`,
          status: 'active',
        },
      }).catch(() => null);
    }

    // 4. Se uma chave de licença foi inserida ou alterada, verifica se existe no Railway
    if (licenseKey) {
      try {
        const allRailway = await listLicensesFromServer().catch(() => []);
        const exists = allRailway.some((l) => l.license_key.toUpperCase() === licenseKey);
        if (!exists) {
          await createLicenseOnServer({
            licenseKey,
            credits: 100,
            days: 365,
            plan: 'pack_criador',
          }).catch(() => null);
        }
      } catch (railErr) {
        console.warn('[Admin Edit] Falha ao verificar/criar chave no Railway:', railErr);
      }
    }

    // 5. Sincroniza dados com a Área de Membros (HostGator)
    const membersSynced = await syncEditStudent({
      email: currentEmail || targetEmail,
      novoNome: name || undefined,
      novoEmail: email && email !== (currentEmail || targetEmail) ? email : undefined,
      novaSenha: password || undefined,
    }).catch(() => false);

    return NextResponse.json({
      ok: true,
      message: `Cliente ${customer.name} atualizado com sucesso!${membersSynced ? ' (Sincronizado na Área de Membros)' : ''}`,
      customer,
      membersSynced,
    });
  } catch (err: any) {
    console.error('[Admin Edit] Erro ao editar cliente:', err);
    return NextResponse.json({ error: err?.message || 'Erro ao atualizar cliente' }, { status: 500 });
  }
}
