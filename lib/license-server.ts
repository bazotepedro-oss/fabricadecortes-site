// Integração do Site com o Fábrica dos Cortes License Server (Railway + Postgres)

import { randomInt } from 'crypto';

export interface CreateLicenseParams {
  licenseKey: string;
  credits: number;
  days: number;
  plan: string;
  operationId?: string;
}

export function getLicenseServerUrl(): string {
  return (
    process.env.FORJA_LICENSE_SERVER_URL ||
    'https://forja-license-production.up.railway.app'
  ).replace(/\/$/, '');
}

export function getLicenseAdminToken(): string {
  const token = process.env.FORJA_LICENSE_ADMIN_TOKEN?.trim();
  if (!token || token.length < 32) {
    throw new Error('FORJA_LICENSE_ADMIN_TOKEN ausente ou fraco (mínimo 32 caracteres)');
  }
  return token;
}

export interface RailwayLicense {
  license_key: string;
  hwid?: string | null;
  exp: number;
  credits: number;
  plan: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Busca todas as licenças diretamente do PostgreSQL do Railway via JSON API.
 */
export async function listLicensesFromServer(search?: string): Promise<RailwayLicense[]> {
  const query = search ? `?q=${encodeURIComponent(search)}&limit=10` : '';
  const url = `${getLicenseServerUrl()}/admin/api/licenses${query}`;
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'x-admin-token': getLicenseAdminToken() },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.licenses || [];
  } catch (e) {
    console.error('Falha ao listar licenças do Railway:', e);
    return [];
  }
}

/**
 * Cria uma nova licença no servidor Railway com créditos e dias de validade.
 */
export async function createLicenseOnServer(params: CreateLicenseParams): Promise<{ ok: boolean; message?: string; licenseKey?: string }> {
  const operationId = params.operationId || `license-create:${params.licenseKey}`;
  const url = `${getLicenseServerUrl()}/admin/api/licenses/create`;
  const body = JSON.stringify({
    license_key: params.licenseKey,
    credits: params.credits,
    days: params.days,
    plan: params.plan || 'custom',
    operation_id: operationId,
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': getLicenseAdminToken(),
        'Idempotency-Key': operationId,
      },
      body,
      signal: AbortSignal.timeout(8000),
    });

    const json = await res.json().catch(() => null);
    if (res.ok && json?.ok) {
      return { ok: true, message: 'Licença criada com sucesso no servidor Railway', licenseKey: json.license_key };
    }
    return { ok: false, message: `Falha ao criar licença (${res.status}): ${json?.reason || 'resposta inválida'}` };
  } catch (err: any) {
    console.error('Erro ao conectar ao License Server:', err);
    return { ok: false, message: err?.message || 'Erro de conexão com o License Server' };
  }
}

/**
 * Recarrega/adiciona créditos à licença existente do cliente.
 */
export async function addCreditsOnServer(licenseKey: string, creditsToAdd: number, operationId: string): Promise<{ ok: boolean; message?: string; credits?: number }> {
  if (!Number.isInteger(creditsToAdd) || creditsToAdd < 1 || creditsToAdd > 5000 || !operationId) {
    return { ok: false, message: 'Parâmetros de recarga inválidos' };
  }
  const url = `${getLicenseServerUrl()}/admin/api/credits/add`;
  const body = JSON.stringify({
    license_key: licenseKey,
    add: creditsToAdd,
    operation_id: operationId,
  });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': getLicenseAdminToken(),
        'Idempotency-Key': operationId,
      },
      body,
      signal: AbortSignal.timeout(8000),
    });

    const json = await res.json().catch(() => null);
    if (res.ok && json?.ok) return {
      ok: true,
      message: `+${creditsToAdd} créditos sincronizados`,
      credits: Number.isInteger(json.credits) ? Number(json.credits) : undefined,
    };
    return { ok: false, message: `Erro ao adicionar créditos (${res.status}): ${json?.reason || 'resposta inválida'}` };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Erro de conexão' };
  }
}

export async function findLicenseOnServer(licenseKey: string): Promise<{ license: RailwayLicense | null; unavailable: boolean }> {
  const url = `${getLicenseServerUrl()}/admin/api/licenses?q=${encodeURIComponent(licenseKey)}&limit=10`;
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'x-admin-token': getLicenseAdminToken() },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { license: null, unavailable: true };
    const json = await response.json();
    const license = (json.licenses || []).find(
      (entry: RailwayLicense) => entry.license_key.toUpperCase() === licenseKey.toUpperCase(),
    ) || null;
    return { license, unavailable: false };
  } catch (error) {
    console.error('Falha ao consultar licença no Railway:', error);
    return { license: null, unavailable: true };
  }
}

async function postAdminAction(body: URLSearchParams): Promise<boolean> {
  const response = await fetch(`${getLicenseServerUrl()}/admin/action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'x-admin-token': getLicenseAdminToken(),
    },
    body: body.toString(),
    signal: AbortSignal.timeout(8000),
  });
  const result = await response.json().catch(() => null);
  return response.ok && result?.ok === true;
}

/**
 * Reseta o HWID (Unbind) para o cliente poder trocar de PC.
 */
export async function unbindHwidOnServer(licenseKey: string): Promise<{ ok: boolean; message?: string }> {
  const body = new URLSearchParams({
    action: 'unbind',
    license_key: licenseKey,
  });

  try {
    const ok = await postAdminAction(body);
    return { ok, message: ok ? 'HWID resetado com sucesso' : 'Railway recusou a operação' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Erro ao resetar HWID' };
  }
}

/**
 * Bloqueia ou ativa uma licença no servidor Railway.
 */
export async function toggleLicenseOnServer(licenseKey: string): Promise<{ ok: boolean; message?: string }> {
  const body = new URLSearchParams({
    action: 'toggle',
    license_key: licenseKey,
  });

  try {
    const ok = await postAdminAction(body);
    return { ok, message: ok ? 'Status alternado com sucesso' : 'Railway recusou a operação' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Erro ao alterar status' };
  }
}

/**
 * Estende a validade da licença em N dias no servidor Railway.
 */
export async function extendDaysOnServer(licenseKey: string, days: number): Promise<{ ok: boolean; message?: string }> {
  const body = new URLSearchParams({
    action: 'extend_days',
    license_key: licenseKey,
    days: String(days),
  });

  try {
    const ok = await postAdminAction(body);
    return { ok, message: ok ? `+${days} dias adicionados com sucesso` : 'Railway recusou a operação' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Erro ao estender validade' };
  }
}

/**
 * Deleta permanentemente uma licença no servidor Railway.
 */
export async function deleteLicenseOnServer(licenseKey: string): Promise<{ ok: boolean; message?: string }> {
  const body = new URLSearchParams({
    action: 'delete',
    license_key: licenseKey,
  });

  try {
    const ok = await postAdminAction(body);
    return { ok, message: ok ? 'Licença removida com sucesso do Railway' : 'Railway recusou a operação' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Erro ao deletar licença' };
  }
}

/**
 * Gera uma chave de licença no padrão Fábrica dos Cortes: FC-XXXXX-XXXXX
 */
export function generateLicenseKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part1 = Array.from({ length: 5 }, () => chars[randomInt(chars.length)]).join('');
  const part2 = Array.from({ length: 5 }, () => chars[randomInt(chars.length)]).join('');
  return `FC-${part1}-${part2}`;
}
