// POST /api/admin/login
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminSession, setAdminCookieHeader } from '@/lib/auth';
import { rateLimit } from '@/lib/ratelimit';

const Schema = z.object({
  email: z.string().optional(),
  password: z.string().min(1, 'Senha obrigatória'),
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',').pop()?.trim() || 'unknown';
  const limit = await rateLimit(`admin-login:${ip}`, { max: 8, windowMs: 15 * 60 * 1000 });
  if (limit.unavailable) {
    return NextResponse.json({ error: 'Autenticação temporariamente indisponível.' }, { status: 503 });
  }
  if (!limit.ok) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde antes de tentar novamente.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 400 });
  }

  const token = await createAdminSession(parsed.data.email, parsed.data.password);
  if (!token) {
    return NextResponse.json({ error: 'Senha ou Token inválido' }, { status: 401 });
  }

  return NextResponse.json(
    { ok: true },
    { headers: { 'Set-Cookie': setAdminCookieHeader(token) } }
  );
}
