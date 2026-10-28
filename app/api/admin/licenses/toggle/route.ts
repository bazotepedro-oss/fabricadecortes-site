import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { toggleLicenseOnServer } from '@/lib/license-server';
import { prisma } from '@/lib/db';
import { syncToggleStudent } from '@/lib/members-sync';

export async function POST(req: Request) {
  const auth = await verifyAdminRequest();
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { licenseKey } = await req.json();
  if (!licenseKey) return NextResponse.json({ error: 'Chave obrigatória' }, { status: 400 });

  const res = await toggleLicenseOnServer(licenseKey);

  try {
    const cred = await prisma.accessCredentials.findFirst({
      where: { licenseKey },
      include: { customer: true },
    });
    if (cred) {
      const nextStatus = cred.status === 'active' ? 'suspended' : 'active';
      await prisma.accessCredentials.update({
        where: { id: cred.id },
        data: { status: nextStatus, updatedAt: new Date() },
      });
      if (cred.customer?.email) {
        await syncToggleStudent(cred.customer.email, nextStatus === 'active' ? 'ativo' : 'bloqueado');
      }
    }
  } catch (err: any) {
    console.warn('[LicenseToggle] Erro ao sincronizar status na Área de Membros:', err?.message);
  }

  return NextResponse.json(res);
}

