// GET /api/health
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: 'connected' });
  } catch (error) {
    console.error('[health] PostgreSQL indisponível:', error);
    return NextResponse.json({ ok: false, db: 'unavailable' }, { status: 503 });
  }
}
