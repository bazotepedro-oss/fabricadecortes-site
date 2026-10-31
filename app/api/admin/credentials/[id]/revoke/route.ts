// POST /api/admin/credentials/[id]/revoke
import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { revokeCredential } from '@/lib/provisioning';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await verifyAdminRequest();
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { id } = await params;
  await revokeCredential(id, 'manual admin');
  return NextResponse.json({ ok: true });
}
