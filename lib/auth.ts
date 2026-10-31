import { cookies, headers } from 'next/headers';
import { createHash, timingSafeEqual, createHmac } from 'crypto';

const SESSION_COOKIE = 'fv_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 horas

function constantTimeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface AdminSession {
  adminId: string;
  email: string;
}

function secret(): string {
  const value = process.env.ACCESS_TOKEN_SECRET?.trim();
  if (!value || value.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ACCESS_TOKEN_SECRET ausente ou fraco (mínimo 32 caracteres)');
    }
    return 'local-development-secret-not-for-production';
  }
  return value;
}

export function signSession(payload: string): string {
  const sig = createHmac('sha256', secret()).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

export function verifySession(token: string): AdminSession | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const dot = raw.lastIndexOf('.');
    if (dot === -1) return null;
    const payload = raw.slice(0, dot);
    const sig = raw.slice(dot + 1);
    const expected = createHmac('sha256', secret()).update(payload).digest('hex');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
    const json = JSON.parse(payload) as AdminSession & { exp: number };
    if (json.exp && json.exp < Date.now()) return null;
    return { adminId: json.adminId, email: json.email };
  } catch {
    return null;
  }
}

export async function verifyAdminRequest(_urlToken?: string, req?: Request): Promise<AdminSession | null> {
  const masterToken = process.env.FORJA_LICENSE_ADMIN_TOKEN?.trim();
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@fabricadecortes.com';

  // Tokens de serviço só são aceitos em headers, nunca em URL/query string.
  try {
    const nextHeaders = await headers();
    const hToken =
      nextHeaders.get('x-admin-token') ||
      nextHeaders.get('authorization')?.replace('Bearer ', '')?.trim();
    if (hToken && masterToken && masterToken.length >= 32 && constantTimeEqual(hToken, masterToken)) {
      return { adminId: 'admin_master', email: adminEmail };
    }
  } catch {}

  // Token de serviço ou sessão HttpOnly da requisição.
  if (req) {
    const headerToken =
      req.headers.get('x-admin-token') ||
      req.headers.get('authorization')?.replace('Bearer ', '')?.trim();
    if (headerToken && masterToken && masterToken.length >= 32 && constantTimeEqual(headerToken, masterToken)) {
      return { adminId: 'admin_master', email: adminEmail };
    }
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
      if (match) {
        const session = verifySession(match[1]);
        if (session) return session;
      }
    }
  }

  // 4. Cookie de sessão autenticada (30 dias)
  try {
    const cookieStore = cookies();
    const token = (await cookieStore).get(SESSION_COOKIE)?.value;
    if (token) {
      const session = verifySession(token);
      if (session) return session;
    }
  } catch {}

  // 4. Fallback seguro em ambiente de desenvolvimento local (localhost)
  if (process.env.NODE_ENV === 'development') {
    return { adminId: 'admin_dev', email: adminEmail };
  }

  return null;
}

export async function createAdminSession(email?: string, password?: string): Promise<string | null> {
  const masterPass = process.env.ADMIN_PASSWORD?.trim();
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@fabricadecortes.com';

  const pass = (password || '').trim();
  if (!pass || !masterPass || masterPass.length < 16) return null;
  const passBuffer = Buffer.from(pass);
  const expectedBuffer = Buffer.from(masterPass);
  const isValidPass = passBuffer.length === expectedBuffer.length && timingSafeEqual(passBuffer, expectedBuffer);

  if (!isValidPass) return null;

  const validEmail = (email && email.includes('@')) ? email.trim() : adminEmail;
  const adminId = 'admin_' + createHash('sha256').update(validEmail).digest('hex').slice(0, 16);
  const payload = JSON.stringify({
    adminId,
    email: validEmail,
    exp: Date.now() + SESSION_TTL_MS,
  });
  return signSession(payload);
}

export function setAdminCookieHeader(token: string): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/;${process.env.NODE_ENV === 'production' ? ' Secure;' : ''} Max-Age=${Math.floor(
    SESSION_TTL_MS / 1000
  )}`;
}

export function clearAdminCookieHeader(): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

// One-time access link token (signed payload, no DB storage)
export function createAccessLinkToken(orderId: string, customerId: string, hours = 72): string {
  const payload = JSON.stringify({
    orderId,
    customerId,
    exp: Date.now() + hours * 60 * 60 * 1000,
  });
  const sig = createHmac('sha256', secret()).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

export function verifyAccessLinkToken(token: string): { orderId: string; customerId: string } | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const dot = raw.lastIndexOf('.');
    if (dot === -1) return null;
    const payload = raw.slice(0, dot);
    const sig = raw.slice(dot + 1);
    const expected = createHmac('sha256', secret()).update(payload).digest('hex');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
    const json = JSON.parse(payload) as { orderId: string; customerId: string; exp: number };
    if (json.exp < Date.now()) return null;
    return { orderId: json.orderId, customerId: json.customerId };
  } catch {
    return null;
  }
}
