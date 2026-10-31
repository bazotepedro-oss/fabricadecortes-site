import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { syncAbacatePay } from '@/lib/sync-abacatepay';

export async function POST(req: Request) {
  const auth = await verifyAdminRequest(undefined, req);
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const result = await syncAbacatePay();
  return NextResponse.json({ ok: true, ...result });
}
