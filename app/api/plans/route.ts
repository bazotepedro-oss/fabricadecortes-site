// GET /api/plans — return active plans
import { NextResponse } from 'next/server';
import { getActivePlans } from '@/lib/plans';

export const dynamic = 'force-dynamic';

export async function GET() {
  const plans = await getActivePlans();
  return NextResponse.json({ plans });
}