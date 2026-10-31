import { randomUUID } from 'crypto';
import { prisma } from '@/lib/db';

async function main() {
  const appBase = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');
  if (process.env.NODE_ENV !== 'development' || process.env.FDC_STAGING_SMOKE_TEST !== '1') {
    throw new Error('Mutating test blocked: enable only in local staging with FDC_STAGING_SMOKE_TEST=1');
  }
  if (!['localhost', '127.0.0.1'].includes(new URL(appBase).hostname)) {
    throw new Error('This test only calls a locally running staging site');
  }

  const apiKey = process.env.ABACATEPAY_API_KEY?.trim();
  if (!apiKey) throw new Error('ABACATEPAY_API_KEY is not configured');
  const gatewayBase = (process.env.ABACATEPAY_BASE_URL || 'https://api.abacatepay.com').replace(/\/$/, '');
  const suffix = randomUUID();
  const email = `checkout-${suffix}@example.test`;
  let orderId: string | undefined;
  let customerId: string | undefined;
  let checkoutId: string | undefined;
  let checkoutDeleted = false;

  // Preflight: bloqueia chave de produção. A API não expõe devMode em stores/get,
  // então usamos o prefixo da chave e confirmamos no checkout criado antes de apagar.
  const storeResponse = await fetch(`${gatewayBase}/v2/stores/get`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(15_000),
  });
  const store = await storeResponse.json().catch(() => null);
  if (!storeResponse.ok || store?.success !== true) {
    throw new Error(
      `Preflight bloqueado: chave inválida ou sem permissão (HTTP ${storeResponse.status}). Nenhuma cobrança foi criada.`
    );
  }
  if (store?.data?.devMode === false || !apiKey.startsWith('abc_dev_')) {
    throw new Error('Preflight bloqueado: a chave não é Dev Mode. Nenhuma cobrança foi criada.');
  }

  try {
    const response = await fetch(`${appBase}/api/checkout/create-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'pack_criador', name: 'Staging Checkout Test', email, consent: true }),
      signal: AbortSignal.timeout(30_000),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.ok || !result.orderId) {
      throw new Error(`Checkout creation failed (${response.status}): ${result?.error || 'invalid response'}`);
    }
    orderId = String(result.orderId);
    checkoutId = result.checkoutId
      ? String(result.checkoutId)
      : (await prisma.order.findUnique({ where: { id: orderId }, select: { abacateCheckoutId: true } }))?.abacateCheckoutId || undefined;
    if (!checkoutId) throw new Error('Checkout foi criado, mas o ID não foi encontrado para verificação/remoção.');

    const detailsResponse = await fetch(
      `${gatewayBase}/v2/checkouts/get?id=${encodeURIComponent(checkoutId)}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(15_000) },
    );
    const details = await detailsResponse.json().catch(() => null);
    const checkout = details?.data;
    if (!detailsResponse.ok || details?.success !== true || checkout?.devMode !== true) {
      throw new Error('Gateway did not confirm a Dev Mode pending checkout; do not use a live key in this test.');
    }
    if (checkout.status !== 'PENDING') throw new Error(`Expected PENDING checkout, got ${checkout.status}`);

    const deleteResponse = await fetch(
      `${gatewayBase}/v2/checkouts/delete?id=${encodeURIComponent(checkoutId)}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(15_000),
      },
    );
    const deleteResult = await deleteResponse.json().catch(() => null);
    if (!deleteResponse.ok || deleteResult?.success !== true) {
      throw new Error('Dev Mode checkout was created, but the gateway did not confirm deletion.');
    }
    checkoutDeleted = true;
    console.log('PASS: AbacatePay key is Dev Mode; checkout creation, read, and deletion succeeded without payment.');
  } finally {
    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId }, select: { customerId: true } }).catch(() => null);
      customerId = order?.customerId;
      await prisma.order.delete({ where: { id: orderId } }).catch(() => null);
      if (customerId) await prisma.customer.delete({ where: { id: customerId } }).catch(() => null);
    }
    if (checkoutId && !checkoutDeleted) {
      try {
        const response = await fetch(
          `${gatewayBase}/v2/checkouts/delete?id=${encodeURIComponent(checkoutId)}`,
          { method: 'POST', headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(15_000) },
        );
        const result = await response.json().catch(() => null);
        checkoutDeleted = response.ok && result?.success === true;
      } catch {}
      if (!checkoutDeleted) console.error('Could not delete the staging checkout; remove it from the AbacatePay Dev Mode dashboard.');
    }
  }
}

main()
  .catch((error) => {
    console.error('[AbacatePay staging smoke] Failed:', error instanceof Error ? error.message : 'unknown error');
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
