import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { syncDeleteStudent, syncDeleteCheckout } from '@/lib/members-sync';
import { deleteLicenseOnServer } from '@/lib/license-server';

export async function POST(req: Request) {
  const auth = await verifyAdminRequest();
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const customerId = body.customerId ? String(body.customerId).trim() : '';
  const email = body.email ? String(body.email).toLowerCase().trim() : '';
  const licenseKey = body.licenseKey ? String(body.licenseKey).toUpperCase().trim() : '';

  if (!customerId && !email) {
    return NextResponse.json({ error: 'ID ou e-mail do cliente obrigatório' }, { status: 400 });
  }

  try {
    const customer = await prisma.customer.findFirst({
      where: customerId ? { id: customerId } : { email },
      include: { credentials: true, orders: true },
    }).catch(() => null);

    const targetEmail = customer?.email || email;

    // 1. Exclui da Área de Membros (HostGator) e registra na blacklist permanente com timestamp
    if (targetEmail) {
      await syncDeleteStudent(targetEmail).catch((e) =>
        console.warn('[Customer Delete] Falha ao excluir aluno na Área de Membros:', e)
      );
    }

    // 2. Coleta todas as chaves de licença associadas (passada pelo front, credenciais e pedidos)
    const keysToDelete = new Set<string>();
    if (licenseKey) keysToDelete.add(licenseKey);

    if (customer?.credentials?.length) {
      for (const cred of customer.credentials) {
        if (cred.licenseKey) keysToDelete.add(cred.licenseKey.trim().toUpperCase());
      }
    }
    if (customer?.orders?.length) {
      for (const ord of customer.orders) {
        const meta = (ord.metadata as any) || {};
        if (meta.licenseKey) keysToDelete.add(String(meta.licenseKey).trim().toUpperCase());
      }
    }

    // Remove as chaves no Railway concorrentemente
    await Promise.all(
      Array.from(keysToDelete).map((key) =>
        deleteLicenseOnServer(key).catch((e) =>
          console.warn(`[Customer Delete] Erro ao deletar licença ${key} do Railway:`, e)
        )
      )
    );

    // 3. Registra os checkouts específicos deste cliente para não ressuscitarem em sync manual
    const checkoutsToBlacklist = new Set<string>();
    if (body.checkoutId) checkoutsToBlacklist.add(String(body.checkoutId).trim());
    if (customer?.orders?.length) {
      for (const ord of customer.orders) {
        if (ord.abacateCheckoutId) checkoutsToBlacklist.add(ord.abacateCheckoutId);
      }
    }
    // Também localiza na AbacatePay checkouts associados a este e-mail
    if (targetEmail) {
      try {
        const apiKey = process.env.ABACATEPAY_API_KEY || 'abc_dev_zWzyHEKWK5cX6gZf63HUWpZy';
        const resList = await fetch('https://api.abacatepay.com/v2/checkouts/list', {
          headers: { Authorization: `Bearer ${apiKey}` },
          cache: 'no-store',
        });
        if (resList.ok) {
          const listJson = await resList.json();
          for (const chk of listJson.data || []) {
            const chkEmail = (chk.metadata?.email || '').toLowerCase().trim();
            if (chkEmail === targetEmail) {
              checkoutsToBlacklist.add(chk.id);
            }
          }
        }
      } catch (errChk) {
        console.warn('[Customer Delete] Erro ao buscar checkouts da AbacatePay:', errChk);
      }
    }

    for (const cId of checkoutsToBlacklist) {
      await syncDeleteCheckout(cId).catch(() => null);
    }

    // 4. Remove credenciais, assinaturas, pedidos e cliente do banco local usando deleteMany (não falha)
    if (customer?.id || customerId) {
      const cid = customer?.id || customerId;
      await prisma.accessCredentials.deleteMany({ where: { customerId: cid } }).catch(() => null);
      await prisma.subscription.deleteMany({ where: { customerId: cid } }).catch(() => null);
      await prisma.order.deleteMany({ where: { customerId: cid } }).catch(() => null);
      await prisma.customer.deleteMany({ where: { id: cid } }).catch(() => null);
    }
    if (targetEmail) {
      const byEmail = await prisma.customer.findFirst({ where: { email: targetEmail } }).catch(() => null);
      if (byEmail) {
        await prisma.accessCredentials.deleteMany({ where: { customerId: byEmail.id } }).catch(() => null);
        await prisma.subscription.deleteMany({ where: { customerId: byEmail.id } }).catch(() => null);
        await prisma.order.deleteMany({ where: { customerId: byEmail.id } }).catch(() => null);
      }
      await prisma.customer.deleteMany({ where: { email: targetEmail } }).catch(() => null);
    }

    // 4. Registra no AuditLog local
    if (targetEmail) {
      await prisma.auditLog.create({
        data: {
          eventType: 'customer_deleted',
          userId: customerId || targetEmail,
          message: targetEmail,
          metadata: {
            name: customer?.name || targetEmail,
            deletedAt: new Date().toISOString(),
            licenseKeys: Array.from(keysToDelete),
          },
        },
      }).catch(() => null);
    }

    return NextResponse.json({
      ok: true,
      message: 'Cliente, licença do Railway, pedidos, assinaturas e acesso à Área de Membros foram removidos com sucesso',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao remover cliente' }, { status: 500 });
  }
}
