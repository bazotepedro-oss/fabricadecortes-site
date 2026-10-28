// POST /api/admin/grant-access
// Permite ao administrador conceder acesso manual completo a um Aluno, Amigo, YouTuber ou Parceiro,
// gerando credenciais, chave no Railway, cadastro na Área de Membros da HostGator e enviando o e-mail de acesso.

import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { generateToken, hashToken } from '@/lib/utils';
import { createLicenseOnServer, generateLicenseKey } from '@/lib/license-server';
import { syncAddStudent } from '@/lib/members-sync';
import { sendAccessEmail } from '@/lib/email';
import {
  generatePassword,
  membersUrl,
  driveUrl,
  whatsappUrl,
  courseUrl,
  colabUrl,
} from '@/lib/provisioning';

export async function POST(req: Request) {
  const auth = await verifyAdminRequest();
  if (!auth) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const name = (body.name || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const phone = (body.phone || '').trim();
  const reason = (body.reason || 'manual').trim();
  const reasonLabel = (body.reasonLabel || 'Acesso VIP / Manual').trim();
  const planSlug = (body.planSlug || 'pack_criador').trim();
  const credits = Number(body.credits) || 100;
  const days = Number(body.days) || 30;
  const customPassword = (body.customPassword || '').trim();
  const customKey = (body.licenseKey || '').trim().toUpperCase();
  const sendEmail = body.sendEmail !== false;
  const notes = (body.notes || '').trim();

  if (!email || !name) {
    return NextResponse.json(
      { error: 'Nome e E-mail são obrigatórios' },
      { status: 400 }
    );
  }

  try {
    // 1. Encontra ou cria o Cliente no banco local
    let customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name,
          email,
          phone: phone || null,
        },
      });
    } else {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: name || customer.name,
          phone: phone || customer.phone,
        },
      });
    }

    // 2. Encontra o Plano correspondente (ou plano padrão)
    let plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
    if (!plan) {
      plan = (await prisma.plan.findFirst()) || {
        id: 'plan_manual',
        name: 'Plano Personalizado VIP',
        slug: planSlug,
        price: 0,
        currency: 'BRL',
        interval: 'one_time',
        features: [],
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        abacatePlanId: null,
      };
    }

    // 3. Cria um Pedido com status 'paid' para registro histórico
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        planId: plan.id,
        status: 'paid',
        amount: plan.price || 0,
        currency: 'BRL',
        metadata: {
          grantedManually: true,
          grantedBy: auth.email || 'admin@fabricadecortes.com',
          reason,
          reasonLabel,
          credits,
          days,
          notes,
          grantedAt: new Date().toISOString(),
        },
        paidAt: new Date(),
      },
    });

    // 4. Gera a chave de licença oficial Fábrica dos Cortes
    const licenseKey = customKey || generateLicenseKey();

    // 5. Registra no Servidor Railway (PostgreSQL)
    let railwaySuccess = false;
    let railwayMessage = '';
    try {
      const srvRes = await createLicenseOnServer({
        licenseKey,
        credits,
        days,
        plan: planSlug,
      });
      railwaySuccess = srvRes.ok;
      railwayMessage = srvRes.message || '';
      console.log(`[GrantAccess] Chave ${licenseKey} registrada no Railway:`, srvRes);
    } catch (err: any) {
      console.error(`[GrantAccess] Falha ao registrar chave no Railway:`, err?.message);
    }

    // 6. Gera credenciais de login e token de acesso
    const password = customPassword || generatePassword(10);
    const passwordHash = await bcrypt.hash(password, 10);
    const accessToken = generateToken();
    const accessTokenHash = hashToken(accessToken);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const base = (
      process.env.NEXT_PUBLIC_APP_URL || 'https://www.fabricadecortes.com'
    ).replace(/\/$/, '');
    const accessUrl = `${base}/acesso?token=${accessToken}`;
    const username = email.split('@')[0];

    // 7. Salva Credencial no CRM local
    const credential = await prisma.accessCredentials.create({
      data: {
        customerId: customer.id,
        orderId: order.id,
        username,
        passwordHash,
        plainPassword: password,
        accessTokenHash,
        accessUrl,
        railwayAppUrl:
          process.env.FORJA_LICENSE_SERVER_URL ||
          'https://forja-license-production.up.railway.app',
        licenseKey,
        credits,
        courseUrl: membersUrl(),
        status: 'active',
        expiresAt,
      },
    });

    // 8. Sincroniza Aluno com a Área de Membros da HostGator (PHP / SQLite)
    let membersSyncSuccess = false;
    try {
      membersSyncSuccess = await syncAddStudent({
        name: customer.name,
        email: customer.email,
        password,
      });
      console.log(`[GrantAccess] Aluno sincronizado na HostGator:`, membersSyncSuccess);
    } catch (err: any) {
      console.warn(`[GrantAccess] Aviso: Falha ao sincronizar aluno na HostGator:`, err?.message);
    }

    // 9. Envia E-mail Completo de Boas-Vindas com o Login (se solicitado)
    let emailSent = false;
    let emailError = null;
    if (sendEmail) {
      try {
        const emailRes = await sendAccessEmail({
          to: email,
          name: customer.name,
          licenseKey,
          credits,
          accessUrl,
          membersUrl: membersUrl(),
          driveUrl: driveUrl(),
          whatsappUrl: whatsappUrl(),
          courseUrl: membersUrl(),
          colabUrl: colabUrl(),
          username,
          temporaryPassword: password,
          planName: `${plan.name} • ${reasonLabel}`,
          includeCourse: true,
        });
        emailSent = Boolean(emailRes && (emailRes as any).id);
        console.log(`[GrantAccess] E-mail de boas-vindas enviado para ${email}`);
      } catch (err: any) {
        emailError = err?.message || 'Falha ao enviar e-mail';
        console.error(`[GrantAccess] Falha ao enviar e-mail de boas-vindas:`, err?.message);
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Acesso concedido com sucesso para ${customer.name}!`,
      licenseKey,
      email: customer.email,
      name: customer.name,
      username,
      password,
      credits,
      days,
      accessUrl,
      membersUrl: membersUrl(),
      emailSent,
      emailError,
      railwaySuccess,
      railwayMessage,
      membersSyncSuccess,
    });
  } catch (err: any) {
    console.error('[GrantAccess] Erro geral ao conceder acesso:', err);
    return NextResponse.json(
      { error: err?.message || 'Erro interno ao conceder acesso' },
      { status: 500 }
    );
  }
}
