// AbacatePay integration layer oficial (v2 nativo com fallback v1).
// Suporte a cobranças Pix, checkout hospedado e webhooks com assinatura HMAC.

import { verifyHmac } from './utils';
import { timingSafeEqual } from 'crypto';

export type AbacatePayStatus =
  | 'paid'
  | 'pending'
  | 'failed'
  | 'canceled'
  | 'refunded'
  | 'expired';

export interface AbacatePayCustomer {
  name: string;
  email: string;
  phone?: string;
}

export interface AbacatePayCheckoutInput {
  planSlug: string;
  planId: string;
  amount: number; // cents
  currency: 'BRL';
  customer: AbacatePayCustomer;
  metadata: Record<string, string>;
  returnURL: string;
  appName: string;
}

export interface AbacatePayCheckoutResponse {
  checkoutURL: string;
  checkoutId: string;
  orderId?: string;
}

export interface AbacatePayWebhookEvent {
  id?: string;
  event?: string;
  type?: string;
  data: {
    id?: string;
    status?: string;
    checkoutId?: string;
    orderId?: string;
    subscriptionId?: string;
    amount?: number;
    metadata?: Record<string, string>;
  };
}

function apiKey(): string {
  const key = process.env.ABACATEPAY_API_KEY?.trim();
  if (!key) throw new Error('ABACATEPAY_API_KEY não configurada');
  return key;
}

interface AbacateEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: string | null;
}

interface AbacateProduct {
  id: string;
  externalId?: string;
}

function webhookSecret(): string {
  const secret = process.env.ABACATEPAY_WEBHOOK_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error('ABACATEPAY_WEBHOOK_SECRET ausente ou fraca (mínimo 32 caracteres)');
  }
  return secret;
}

function baseUrl(): string {
  return (process.env.ABACATEPAY_BASE_URL || 'https://api.abacatepay.com').replace(/\/$/, '');
}

/**
 * Obtém ou cria o produto na AbacatePay v2.
 */
async function getOrCreateV2Product(
  key: string,
  base: string,
  externalId: string,
  name: string,
  priceInCents: number
): Promise<string> {
  // 1. Tenta listar produtos e achar pelo externalId
  try {
    const listRes = await fetch(`${base}/v2/products/list`, {
      headers: { Authorization: `Bearer ${key}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (listRes.ok) {
      const listJson = await listRes.json() as AbacateEnvelope<AbacateProduct[]>;
      const existing = (listJson.data || []).find((product) => product.externalId === externalId);
      if (existing?.id) return existing.id;
    }
  } catch (err) {
    console.warn('[AbacatePay v2] Falha ao listar produtos:', err);
  }

  // 2. Se não encontrou, cria o produto
  const createRes = await fetch(`${base}/v2/products/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      externalId,
      name,
      price: priceInCents,
      currency: 'BRL',
      description: `Fábrica dos Cortes - ${name}`,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  const createJson = await createRes.json() as AbacateEnvelope<AbacateProduct>;
  if (createRes.ok && createJson.success && createJson.data?.id) {
    return createJson.data.id;
  }

  // Se já existia e não pegou na listagem por paginação, tenta listar novamente
  if (createJson.error && String(createJson.error).includes('already exists')) {
    const retryList = await fetch(`${base}/v2/products/list?limit=100`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const retryJson = await retryList.json() as AbacateEnvelope<AbacateProduct[]>;
    const found = (retryJson.data || []).find((product) => product.externalId === externalId);
    if (found?.id) return found.id;
  }

  throw new Error(`Falha ao registrar produto na AbacatePay: ${createJson.error || 'Erro desconhecido'}`);
}

/**
 * Cria ou recupera o cliente na AbacatePay v2 para vincular ao checkout.
 */
async function getOrCreateV2Customer(
  key: string,
  base: string,
  customer: AbacatePayCustomer
): Promise<string | undefined> {
  try {
    const cleanPhone = (customer.phone || '').replace(/\D/g, '');
    const res = await fetch(`${base}/v2/customers/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: customer.name,
        email: customer.email,
        cellphone: cleanPhone || undefined,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const json = await res.json() as AbacateEnvelope<{ id: string }>;
    if (res.ok && json.success && json.data?.id) {
      return json.data.id;
    }
  } catch (e) {
    console.warn('[AbacatePay v2] Aviso ao criar cliente:', e);
  }
  return undefined;
}

/**
 * Cria um checkout hospedado usando a API v2 oficial. Não faz fallback para a API v1.
 */
export async function createCheckout(
  input: AbacatePayCheckoutInput
): Promise<AbacatePayCheckoutResponse> {
  const key = apiKey();
  const base = baseUrl();

  const completionUrl = input.returnURL.includes('/retorno')
    ? `${input.returnURL}?status=sucesso&orderId=${encodeURIComponent(input.metadata?.orderId || '')}`
    : input.returnURL;

  const prodExternalId = `${input.planSlug}_${input.amount}`;
  const prodName = input.appName || 'Pacote de Créditos Fábrica dos Cortes';
  const productId = await getOrCreateV2Product(key, base, prodExternalId, prodName, input.amount);
  const customerId = await getOrCreateV2Customer(key, base, input.customer);

  const v2Payload = {
    items: [{ id: productId, quantity: 1 }],
    methods: ['PIX'],
    returnUrl: input.returnURL,
    completionUrl,
    metadata: input.metadata,
    ...(customerId ? { customerId } : {}),
  };

  const response = await fetch(`${base}/v2/checkouts/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(v2Payload),
    signal: AbortSignal.timeout(15_000),
  });

  const checkoutResponse = await response.json() as AbacateEnvelope<{ id: string; url: string }>;
  if (!response.ok || !checkoutResponse.success || !checkoutResponse.data?.url || !checkoutResponse.data.id) {
    throw new Error(`Falha ao criar checkout v2 (${response.status}): ${checkoutResponse.error || response.statusText}`);
  }
  return {
    checkoutURL: checkoutResponse.data.url,
    checkoutId: checkoutResponse.data.id,
    orderId: input.metadata.orderId,
  };
}

/**
 * Valida a assinatura ou o secret do webhook enviado pela AbacatePay.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  querySecret?: string | null
): boolean {
  let secret: string;
  try {
    secret = webhookSecret();
  } catch {
    return false;
  }

  // 1. Verificação por query secret (ex: ?webhookSecret=xyz)
  if (querySecret) {
    const expected = Buffer.from(secret);
    const supplied = Buffer.from(querySecret);
    if (expected.length === supplied.length && timingSafeEqual(expected, supplied)) return true;
  }

  // 2. Verificação por HMAC SHA-256 no header
  if (signature) {
    try {
      return verifyHmac(payload, signature, secret);
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Faz o parse seguro do evento de webhook recebido.
 */
export function parseWebhookEvent(payload: string): AbacatePayWebhookEvent {
  const parsed = JSON.parse(payload);
  return {
    id: parsed.id || parsed.eventId,
    type: parsed.event || parsed.type || 'unknown',
    data: parsed.data || parsed,
  };
}

/**
 * Mapeia os status retornados pela AbacatePay para os status do sistema.
 */
export function mapStatus(status?: string): string {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'paid':
    case 'completed':
    case 'confirmed':
      return 'paid';
    case 'pending':
    case 'processing':
      return 'pending';
    case 'failed':
      return 'failed';
    case 'canceled':
    case 'cancelled':
      return 'canceled';
    case 'refunded':
      return 'refunded';
    case 'expired':
      return 'failed';
    default:
      return 'pending';
  }
}

export function getPlanId(slug: string): string | undefined {
  const raw = process.env.ABACATEPAY_PLAN_IDS;
  if (!raw) return undefined;
  try {
    const map = JSON.parse(raw) as Record<string, string>;
    return map[slug];
  } catch {
    return undefined;
  }
}
