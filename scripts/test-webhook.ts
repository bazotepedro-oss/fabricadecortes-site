import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

async function main() {
  if (process.env.NODE_ENV !== 'development' || process.env.FDC_STAGING_SMOKE_TEST !== '1') {
    throw new Error('Este teste muta o banco. Use NODE_ENV=development e FDC_STAGING_SMOKE_TEST=1 em staging local.');
  }
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
  const eventId = `evt_staging_${randomUUID()}`;
  const email = `webhook-${randomUUID()}@example.test`;
  const customer = await prisma.customer.upsert({
    where: { email },
    update: {},
    create: { name: 'Cliente Staging', email },
  });
  const plan = await prisma.plan.upsert({
    where: { slug: 'pack_criador' },
    update: {},
    create: {
      id: 'pack_criador_staging',
      name: 'Pack Criador Staging',
      slug: 'pack_criador',
      price: 3990,
      currency: 'BRL',
      interval: 'one_time',
      features: ['staging-smoke-test'],
    },
  });

  const order = await prisma.order.create({
    data: { customerId: customer.id, planId: plan.id, status: 'pending', amount: plan.price, currency: plan.currency },
  });

  const payload = JSON.stringify({
    id: eventId,
    type: 'checkout.completed',
    data: {
      status: 'paid',
      checkoutId: `chk_${eventId}`,
      orderId: `provider_${eventId}`,
      amount: plan.price,
      metadata: { orderId: order.id, email, name: customer.name, slug: plan.slug, includeCourse: 'false' },
    },
  });
  const secret = process.env.ABACATEPAY_WEBHOOK_SECRET;
  if (!secret || secret.length < 32) throw new Error('Configure ABACATEPAY_WEBHOOK_SECRET (mínimo 32 caracteres) para testar');
  const { signHmac } = await import('@/lib/utils');
  const signature = signHmac(payload, secret);

  let licenseKey: string | undefined;
  try {
  const res = await fetch(`${baseUrl}/api/webhooks/abacatepay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-abacatepay-signature': signature },
    body: payload,
  });
  const firstBody = await res.json();
  if (!res.ok || !firstBody.ok) throw new Error(`First webhook failed (${res.status}): ${JSON.stringify(firstBody)}`);

  const creds = await prisma.accessCredentials.findFirst({ where: { orderId: order.id } });
  if (!creds || creds.status !== 'active') throw new Error('Credential was not activated');
  licenseKey = creds.licenseKey || undefined;

  const duplicate = await fetch(`${baseUrl}/api/webhooks/abacatepay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-abacatepay-signature': signature },
    body: payload,
  });
  const duplicateBody = await duplicate.json();
  if (!duplicate.ok || !duplicateBody.duplicate) {
    throw new Error(`Duplicate webhook was not idempotent: ${JSON.stringify(duplicateBody)}`);
  }
  const credentialCount = await prisma.accessCredentials.count({ where: { orderId: order.id } });
  if (credentialCount !== 1) throw new Error(`Expected one credential, got ${credentialCount}`);

  const adminToken = process.env.FORJA_LICENSE_ADMIN_TOKEN;
  if (!adminToken) throw new Error('Missing staging FORJA_LICENSE_ADMIN_TOKEN');
  const licensesResponse = await fetch(`${process.env.FORJA_LICENSE_SERVER_URL}/admin/api/licenses`, {
    headers: { 'x-admin-token': adminToken },
  });
  if (!licensesResponse.ok) throw new Error('Could not read staging license after fulfillment');
  const licensesBody = await licensesResponse.json();
  const issuedLicense = (licensesBody.licenses || []).find((item: { license_key: string }) => item.license_key === licenseKey);
  if (!issuedLicense || Number(issuedLicense.credits) !== 50) throw new Error('Staging license balance does not match the 50-credit pack');
  console.log('PASS: signed webhook fulfilled one credential; replay did not duplicate it; Railway balance is 50.');
  } finally {
    await prisma.accessCredentials.deleteMany({ where: { orderId: order.id } });
    await prisma.webhookEvent.deleteMany({ where: { eventId } });
    await prisma.order.delete({ where: { id: order.id } }).catch(() => null);
    await prisma.customer.delete({ where: { id: customer.id } }).catch(() => null);
    if (licenseKey && process.env.FORJA_LICENSE_SERVER_URL && process.env.FORJA_LICENSE_ADMIN_TOKEN) {
      const form = new URLSearchParams({ action: 'delete', license_key: licenseKey });
      await fetch(`${process.env.FORJA_LICENSE_SERVER_URL}/admin/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'x-admin-token': process.env.FORJA_LICENSE_ADMIN_TOKEN },
        body: form,
      }).catch(() => null);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
