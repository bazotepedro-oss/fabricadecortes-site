// POST /api/admin/licenses/create — Cria chave no Railway e opcionalmente cadastra no CRM do site
import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { createLicenseOnServer, generateLicenseKey } from '@/lib/license-server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { courseUrl, colabUrl, generatePassword } from '@/lib/provisioning';
import { syncAddStudent } from '@/lib/members-sync';

export async function POST(req: Request) {
  const auth = await verifyAdminRequest();
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const licenseKey = (body.licenseKey || generateLicenseKey()).trim().toUpperCase();
  const credits = Number(body.credits) || 100;
  const days = Number(body.days) || 30;
  const plan = (body.plan || 'pro').trim();
  const name = (body.name || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const phone = (body.phone || '').trim();

  // 1. Cria a licença no servidor Railway (PostgreSQL)
  const srvRes = await createLicenseOnServer({
    licenseKey,
    credits,
    days,
    plan,
  });

  if (!srvRes.ok) {
    return NextResponse.json({ error: srvRes.message }, { status: 502 });
  }

  // 2. Se informou nome e e-mail, cadastra/vincula no CRM local do site
  if (email && name) {
    let customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { name, email, phone: phone || null },
      });
    } else if (phone && !customer.phone) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { phone },
      });
    }

    const password = (body.password || generatePassword(10)).trim();
    const passwordHash = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const base = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

    await prisma.accessCredentials.create({
      data: {
        customerId: customer.id,
        username: email.split('@')[0],
        passwordHash,
        plainPassword: password,
        licenseKey,
        credits,
        courseUrl: courseUrl(),
        accessUrl: `${base}/acesso`,
        status: 'active',
        expiresAt,
      },
    });

    // Sincroniza com a Área de Membros da HostGator
    try {
      await syncAddStudent({
        name: customer.name,
        email: customer.email,
        password,
      });
    } catch (err: any) {
      console.warn('[Admin Create License] Falha ao sincronizar com área de membros:', err?.message);
    }
  }

  return NextResponse.json({
    ok: true,
    licenseKey,
    message: `Chave ${licenseKey} criada com sucesso no Railway e integrada ao CRM!`,
  });
}
