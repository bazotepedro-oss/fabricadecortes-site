// POST /api/admin/customers/resend-email
// Permite ao administrador reenviar manualmente o e-mail de acesso e login para qualquer cliente
import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendAccessEmail } from '@/lib/email';
import {
  membersUrl,
  driveUrl,
  whatsappUrl,
  colabUrl,
} from '@/lib/provisioning';

export async function POST(req: Request) {
  const auth = await verifyAdminRequest();
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const customerId = (body.customerId || '').trim();
  const email = (body.email || '').trim().toLowerCase();

  if (!customerId && !email) {
    return NextResponse.json({ error: 'Informe customerId ou email' }, { status: 400 });
  }

  try {
    let customer = await prisma.customer.findFirst({
      where: customerId ? { id: customerId } : { email },
      include: {
        credentials: { orderBy: { createdAt: 'desc' } },
        orders: { include: { plan: true }, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!customer) {
      // Tenta sincronizar com a AbacatePay caso este container ainda não tenha sincronizado
      const { syncAbacatePay } = await import('@/lib/sync-abacatepay');
      await syncAbacatePay().catch(() => null);

      customer = await prisma.customer.findFirst({
        where: customerId ? { id: customerId } : { email },
        include: {
          credentials: { orderBy: { createdAt: 'desc' } },
          orders: { include: { plan: true }, orderBy: { createdAt: 'desc' } },
        },
      });
    }

    if (!customer) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const cred = customer.credentials?.[0];
    const order = customer.orders?.[0];
    const planName = order?.plan?.name || 'Acesso Fábrica dos Cortes';
    const licenseKey = cred?.licenseKey || 'N/A';
    const credits = cred?.credits || 50;
    const password = cred?.plainPassword || 'membro2026';
    const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.fabricadecortes.com').replace(/\/$/, '');
    const accessUrl = cred?.accessUrl || `${base}/acesso`;

    const emailRes = await sendAccessEmail({
      to: customer.email,
      name: customer.name,
      licenseKey,
      credits,
      accessUrl,
      membersUrl: membersUrl(),
      driveUrl: driveUrl(),
      whatsappUrl: whatsappUrl(),
      courseUrl: membersUrl(),
      colabUrl: colabUrl(),
      username: cred?.username || customer.email.split('@')[0],
      temporaryPassword: password,
      planName,
      includeCourse: true,
    });

    if (!emailRes.ok) {
      return NextResponse.json({
        error: `Falha ao enviar e-mail via Resend: ${emailRes.error || 'Erro desconhecido'}`,
      }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      message: `E-mail de acesso reenviado com sucesso para ${customer.email}!`,
    });
  } catch (err: any) {
    console.error('[ResendEmail] Erro ao reenviar e-mail:', err);
    return NextResponse.json({ error: err?.message || 'Erro interno ao reenviar' }, { status: 500 });
  }
}
