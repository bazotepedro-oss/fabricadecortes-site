// Provisioning layer: gera credenciais de acesso, chave de licença no Railway e entrega de curso.

import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './db';
import { generateToken, hashToken } from './utils';
import { generateLicenseKey, createLicenseOnServer, listLicensesFromServer } from './license-server';
import { sendAccessEmail } from './email';
import { syncAddStudent, syncSetStudentPassword, syncToggleStudent } from './members-sync';

export interface ProvisionInput {
  customerId: string;
  orderId: string;
  subscriptionId?: string;
  email: string;
  plan: string;
  includeCourse?: boolean;
  licenseKey?: string;
  password?: string;
  skipEmail?: boolean;
}

export interface ProvisionResult {
  credentialId: string;
  username: string;
  temporaryPassword: string | null;
  accessToken: string;
  accessUrl: string;
  licenseKey: string;
  credits: number;
  courseUrl: string;
  driveUrl?: string;
  whatsappUrl?: string;
  colabUrl: string;
  expiresAt: Date;
}

const SALT_ROUNDS = 10;

function generateUsername(email: string): string {
  const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._-]/g, '');
  const suffix = randomBytes(2).toString('hex');
  return `${base}_${suffix}`;
}

export function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';
  let out = '';
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

export function driveUrl(): string {
  return (
    process.env.GOOGLE_DRIVE_URL ||
    'https://drive.google.com/drive/folders/16U_qUEtjAlgmgmeX_HWuqPw-3dYgoekf'
  );
}

export function whatsappUrl(): string {
  return (
    process.env.WHATSAPP_GROUP_URL ||
    'https://chat.whatsapp.com/JlJ6ZJjBNpS7E9ErFSyMvC'
  );
}

export function courseUrl(): string {
  return membersUrl();
}

export function membersUrl(): string {
  return (
    process.env.NEXT_PUBLIC_MEMBERS_URL ||
    process.env.MEMBERS_URL ||
    'https://membros.fabricadecortes.com/index.php'
  );
}

export function colabUrl(): string {
  return (
    process.env.COLAB_NOTEBOOK_URL ||
    'https://colab.research.google.com/github/bazotepedro-oss/forjaviral/blob/main/ViralCutter.ipynb'
  );
}

export function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

function getPlanSpecs(planSlug: string): { credits: number; days: number } {
  const s = (planSlug || '').toLowerCase();
  if (s.includes('pro') || s.includes('250')) {
    return { credits: 250, days: 365 };
  }
  if (s.includes('escala') || s.includes('120') || s.includes('trimestral') || s.includes('anual')) {
    return { credits: 120, days: 365 };
  }
  if (s.includes('criador') || s.includes('50') || s.includes('mensal')) {
    return { credits: 50, days: 365 };
  }
  if (s.includes('iniciante') || s.includes('30')) {
    return { credits: 30, days: 365 };
  }
  if (s.includes('teste') || s.includes('15')) {
    return { credits: 15, days: 365 };
  }
  return { credits: 50, days: 365 };
}

export async function provision(input: ProvisionInput): Promise<ProvisionResult> {
  const username = generateUsername(input.email);
  const temporaryPassword = input.password || generatePassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);

  // Token de acesso rápido à página de acesso
  const accessToken = generateToken(32);
  const accessTokenHash = hashToken(accessToken);

  const base = appBaseUrl().replace(/\/$/, '');
  const accessUrl = `${base}/retorno`;

  const { credits, days } = getPlanSpecs(input.plan);
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  // A credencial permanece pending até a licença, a Área de Membros e o e-mail
  // confirmarem. Assim, retries continuam o provisionamento sem duplicar crédito.
  const existing = await prisma.accessCredentials.findFirst({
    where: { orderId: input.orderId },
  });
  if (existing) {
    if (existing.status === 'active') {
      return {
        credentialId: existing.id,
        username: existing.username,
        temporaryPassword: null,
        accessToken: '',
        accessUrl: existing.accessUrl || accessUrl,
        licenseKey: existing.licenseKey || 'FV-PENDING',
        credits: existing.credits || credits,
        courseUrl: existing.courseUrl || courseUrl(),
        colabUrl: colabUrl(),
        expiresAt: existing.expiresAt || expiresAt,
      };
    }

    const retryPassword = generatePassword();
    const retryHash = await bcrypt.hash(retryPassword, SALT_ROUNDS);
    const retryCustomer = await prisma.customer.findUnique({ where: { id: existing.customerId } });
    const syncOk = await syncSetStudentPassword(input.email, retryPassword);
    if (!syncOk) throw new Error('Não foi possível sincronizar a senha com a Área de Membros');
    await prisma.accessCredentials.update({
      where: { id: existing.id },
      data: { passwordHash: retryHash, updatedAt: new Date() },
    });
    if (!input.skipEmail) {
      const mail = await sendAccessEmail({
        to: input.email,
        name: retryCustomer?.name || input.email.split('@')[0],
        licenseKey: existing.licenseKey || 'FV-PENDING',
        credits: existing.credits || credits,
        accessUrl: existing.accessUrl || accessUrl,
        membersUrl: membersUrl(),
        includeCourse: input.includeCourse,
        driveUrl: driveUrl(),
        whatsappUrl: whatsappUrl(),
        courseUrl: membersUrl(),
        colabUrl: colabUrl(),
        username: existing.username,
        temporaryPassword: retryPassword,
        planName: input.plan,
      });
      if (!mail.ok) throw new Error(mail.error || 'Não foi possível enviar o e-mail de acesso');
    }
    await prisma.accessCredentials.update({
      where: { id: existing.id },
      data: { status: 'active', passwordHash: retryHash, updatedAt: new Date() },
    });
    return {
      credentialId: existing.id,
      username: existing.username,
      temporaryPassword: retryPassword,
      accessToken,
      accessUrl: existing.accessUrl || accessUrl,
      licenseKey: existing.licenseKey || 'FV-PENDING',
      credits: existing.credits || credits,
      courseUrl: existing.courseUrl || courseUrl(),
      colabUrl: colabUrl(),
      expiresAt: existing.expiresAt || expiresAt,
    };
  }

  // 1. Chave de Licença oficial Fábrica dos Cortes (usa a fornecida ou gera nova)
  let licenseKey = (input.licenseKey || generateLicenseKey()).trim().toUpperCase();

  // 2. Se for nova chave e ainda não existir no Railway, registra no servidor Railway!
  const suppliedLicense = input.licenseKey
    ? (await listLicensesFromServer()).find((item) => item.license_key.toUpperCase() === licenseKey)
    : null;
  if (suppliedLicense) {
    if (suppliedLicense.status !== 'active' || suppliedLicense.credits < credits) {
      throw new Error('A licença fornecida não está ativa ou não tem créditos suficientes');
    }
  } else {
    const srvRes = await createLicenseOnServer({
      licenseKey,
      credits,
      days,
      plan: input.plan,
      operationId: `provision:${input.orderId}`,
    });
    if (!srvRes.ok) throw new Error(srvRes.message || 'Falha ao registrar licença no Railway');
    licenseKey = (srvRes.licenseKey || licenseKey).trim().toUpperCase();
  }

  // 3. Salva no banco de dados local do site
  const credential = await prisma.accessCredentials.create({
    data: {
      customerId: input.customerId,
      orderId: input.orderId,
      subscriptionId: input.subscriptionId,
      username,
      passwordHash,
      accessTokenHash,
      accessUrl,
      railwayAppUrl: process.env.FORJA_LICENSE_SERVER_URL || 'https://forja-license-production.up.railway.app',
      licenseKey,
      credits,
      courseUrl: courseUrl(),
      status: 'pending',
      expiresAt,
    },
  });

  // 4. Cadastra automaticamente o aluno na Área de Membros (HostGator / Local)
  const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
  const memberSynced = await syncAddStudent({
    name: customer?.name || username,
    email: input.email,
    password: temporaryPassword,
  });
  if (!memberSynced) throw new Error('Não foi possível sincronizar o aluno com a Área de Membros');

  // 5. Envia e-mail automático com Chave de Licença, créditos e Acesso à Área de Membros
  if (!input.skipEmail) {
    try {
      const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
      const mail = await sendAccessEmail({
        to: input.email,
        name: customer?.name || username,
        licenseKey,
        credits,
        accessUrl,
        membersUrl: membersUrl(),
        includeCourse: input.includeCourse,
        driveUrl: driveUrl(),
        whatsappUrl: whatsappUrl(),
        courseUrl: membersUrl(),
        colabUrl: colabUrl(),
        username,
        temporaryPassword,
        planName: input.plan,
      });
      if (!mail.ok) throw new Error(mail.error || 'Não foi possível enviar o e-mail de acesso');
    } catch (emailErr: any) {
      console.error(`[Provisioning] Falha ao enviar e-mail de acesso:`, emailErr?.message);
      throw emailErr;
    }
  }

  await prisma.accessCredentials.update({
    where: { id: credential.id },
    data: { status: 'active', updatedAt: new Date() },
  });

  return {
    credentialId: credential.id,
    username,
    temporaryPassword,
    accessToken,
    accessUrl,
    licenseKey,
    credits,
    driveUrl: driveUrl(),
    whatsappUrl: whatsappUrl(),
    courseUrl: driveUrl(),
    colabUrl: colabUrl(),
    expiresAt,
  };
}

export async function revokeCredential(credentialId: string, reason = 'manual'): Promise<void> {
  const cred = await prisma.accessCredentials.findUnique({
    where: { id: credentialId },
    include: { customer: true },
  });

  await prisma.accessCredentials.update({
    where: { id: credentialId },
    data: { status: 'revoked', updatedAt: new Date() },
  });

  if (cred?.customer?.email) {
    await syncToggleStudent(cred.customer.email, 'bloqueado');
  }

  await prisma.auditLog.create({
    data: {
      eventType: 'credential_revoked',
      orderId: undefined,
      message: `Credential ${credentialId} revogada: ${reason}`,
    },
  });
}

export async function regenerateCredential(credentialId: string): Promise<{ accessToken: string; licenseKey: string }> {
  const accessToken = generateToken(32);
  const accessTokenHash = hashToken(accessToken);
  const newLicenseKey = generateLicenseKey();

  const cred = await prisma.accessCredentials.findUnique({ where: { id: credentialId } });
  if (cred) {
    const created = await createLicenseOnServer({
      licenseKey: newLicenseKey,
      credits: cred.credits || 100,
      days: 30,
      plan: 'regenerated',
      operationId: `regenerate:${credentialId}:${newLicenseKey}`,
    });
    if (!created.ok) throw new Error(created.message || 'Falha ao criar a nova licença');
  }

  await prisma.accessCredentials.update({
    where: { id: credentialId },
    data: {
      accessTokenHash,
      licenseKey: newLicenseKey,
      updatedAt: new Date(),
    },
  });

  return { accessToken, licenseKey: newLicenseKey };
}
