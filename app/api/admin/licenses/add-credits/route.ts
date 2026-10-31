import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { addCreditsOnServer } from '@/lib/license-server';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req: Request) {
  const auth = await verifyAdminRequest(undefined, req);
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { licenseKey, credits, operationId } = await req.json();
  const numCredits = Number(credits);
  if (!licenseKey || !Number.isInteger(numCredits) || numCredits < 1 || numCredits > 5000) {
    return NextResponse.json({ error: 'Chave ou quantidade inválida' }, { status: 400 });
  }

  const res = await addCreditsOnServer(licenseKey, numCredits, operationId || randomUUID());
  if (!res.ok) return NextResponse.json(res, { status: 502 });

  // Atualiza também na base local do site para sincronia visual
  await prisma.accessCredentials.updateMany({
    where: { licenseKey },
    data: {
      credits: res.credits === undefined ? { increment: numCredits } : res.credits,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json(res);
}
