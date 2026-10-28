import { NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { prisma } from '@/lib/db';

import bcrypt from 'bcryptjs';
import { syncSetStudentPassword } from '@/lib/members-sync';

export async function POST(req: Request) {
  const auth = await verifyAdminRequest();
  if (!auth) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { customerId, name, email, phone, licenseKey, password } = await req.json().catch(() => ({}));
  if (!customerId) return NextResponse.json({ error: 'ID do cliente obrigatório' }, { status: 400 });

  try {
    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: {
        name: name ? String(name).trim() : undefined,
        email: email ? String(email).trim() : undefined,
        phone: phone ? String(phone).trim() : undefined,
      },
    });

    const updateData: any = {};
    if (licenseKey) {
      updateData.licenseKey = String(licenseKey).trim();
    }
    if (password && String(password).trim()) {
      const cleanPass = String(password).trim();
      updateData.plainPassword = cleanPass;
      updateData.passwordHash = await bcrypt.hash(cleanPass, 10);
      await syncSetStudentPassword(updated.email, cleanPass);
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.accessCredentials.updateMany({
        where: { customerId },
        data: updateData,
      });
    }

    return NextResponse.json({ ok: true, message: 'Cliente atualizado com sucesso', customer: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao atualizar cliente' }, { status: 500 });
  }
}
