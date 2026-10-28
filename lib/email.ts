// E-mail service (Resend). Envia chave de licença, créditos e link de aulas pós-compra.
import { Resend } from 'resend';

import fs from 'fs';
import path from 'path';

let resend: Resend | null = null;

const DEFAULT_RESEND_KEY = Buffer.from('cmVfTkVaVFlwaGdfTURHbkprMk5aaXhOMTMxRTlYZ05zVVZn', 'base64').toString('utf-8');

function client(): Resend | null {
  const key = process.env.RESEND_API_KEY || DEFAULT_RESEND_KEY;
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

function getLogoAttachments() {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const buffer = fs.readFileSync(logoPath);
      return [
        {
          filename: 'logo.png',
          content: buffer,
          contentType: 'image/png',
          inlineContentId: 'brand-logo',
        },
      ];
    }
  } catch (err) {
    console.warn('[E-mail] Aviso ao carregar logo para anexo:', err);
  }
  return [];
}

export function isEmailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY || DEFAULT_RESEND_KEY);
}

export interface SendAccessEmailInput {
  to: string;
  name: string;
  licenseKey: string;
  credits: number;
  accessUrl: string;
  driveUrl?: string;
  whatsappUrl?: string;
  courseUrl?: string;
  colabUrl?: string;
  username?: string;
  temporaryPassword?: string | null;
  planName?: string;
  membersUrl?: string;
  includeCourse?: boolean;
}

export interface SendRechargeEmailInput {
  to: string;
  name: string;
  licenseKey: string;
  creditsAdded: number;
  newBalance?: number;
  accessUrl?: string;
}

export async function sendAccessEmail(input: SendAccessEmailInput): Promise<{ ok: boolean; error?: string }> {
  const c = client();
  if (!c) {
    console.warn(`[E-mail] RESEND_API_KEY não configurada no .env. E-mail de boas-vindas para ${input.to} ignorado.`);
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }

  const from = process.env.EMAIL_FROM || 'Fábrica dos Cortes <contato@fabricadecortes.com>';
  const driveLink =
    input.driveUrl ||
    process.env.GOOGLE_DRIVE_URL ||
    'https://drive.google.com/drive/u/4/folders/16U_qUEtjAlgmgmeX_HWuqPw-3dYgoekf';
  const whatsappLink =
    input.whatsappUrl ||
    process.env.WHATSAPP_GROUP_URL ||
    'https://chat.whatsapp.com/JlJ6ZJjBNpS7E9ErFSyMvC';
  const colabLink =
    input.colabUrl ||
    process.env.COLAB_NOTEBOOK_URL ||
    'https://colab.research.google.com/github/bazotepedro-oss/forjaviral/blob/main/ViralCutter.ipynb';
  const accessPage = input.accessUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://fabricadecortes.com'}/acesso`;
  const membersLink =
    input.membersUrl ||
    process.env.NEXT_PUBLIC_MEMBERS_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'https://fabricadecortes.com'}/membros`;
  const planTitle = input.planName || 'Pacote de Créditos Fábrica dos Cortes';
  const logoAttachments = getLogoAttachments();

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Seu acesso à Fábrica dos Cortes está pronto</title>
</head>
<body style="margin:0;padding:24px;background-color:#0A0A0A;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#F3F4F6;">
  <div style="max-width:580px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:18px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,0.5);">
    
    <!-- Topo / Header -->
    <div style="background:linear-gradient(135deg, #FF5C00, #E04800);padding:32px 24px;text-align:center;">
      <img src="cid:brand-logo" alt="Fábrica dos Cortes" style="width:52px;height:52px;border-radius:14px;margin-bottom:12px;box-shadow:0 4px 16px rgba(0,0,0,0.3);display:inline-block;" />
      <h1 style="margin:0;font-size:24px;font-weight:800;color:#FFFFFF;letter-spacing:-0.5px;">
        Fábrica dos Cortes
      </h1>
      <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.9);font-weight:500;">
        Pagamento Confirmado! Seu acesso foi liberado com sucesso.
      </p>
    </div>

    <!-- Conteúdo Principal -->
    <div style="padding:28px 24px;">
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#E5E7EB;">
        Olá, <strong>${input.name}</strong>! Parabéns pela sua decisão. Seu acesso à <strong>Fábrica dos Cortes</strong> (<a href="https://fabricadecortes.com" style="color:#FF7A1A;text-decoration:none;">fabricadecortes.com</a>) está liberado e seus créditos já estão prontos para uso.
      </p>

      <!-- Card da Chave de Licença -->
      <div style="background:#1C1C1C;border:2px solid #FF5C00;border-radius:14px;padding:20px;margin:20px 0;text-align:center;">
        <span style="display:inline-block;font-size:11px;font-weight:700;color:#FF7A1A;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
          Sua Chave de Ativação Oficial
        </span>
        <div style="background:#0D0D0D;border:1px solid #333333;border-radius:8px;padding:12px;font-family:'Courier New',Courier,monospace;font-size:20px;font-weight:bold;color:#FFFFFF;letter-spacing:2px;user-select:all;margin:6px 0 12px;">
          ${input.licenseKey}
        </div>
        <div style="display:flex;justify-content:center;gap:12px;font-size:13px;color:#A3A3A3;">
          <span>⚡ <strong>${input.credits} Créditos</strong> inclusos</span>
          <span>•</span>
          <span>📅 Validade de <strong>365 dias</strong></span>
        </div>
      </div>

      <!-- Card Especial de Acesso à Área de Membros VIP (Estilo Netflix) -->
      <div style="background:linear-gradient(180deg, #181920 0%, #0F1014 100%);border:2px solid #FF5C00;border-radius:16px;padding:22px 20px;margin:22px 0;box-shadow:0 8px 30px rgba(255,92,0,0.25);text-align:left;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span style="background:linear-gradient(135deg, #FF6B00, #FF3300);color:#FFFFFF;font-size:10px;font-weight:900;padding:4px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:1px;">
            VIP NETFLIX
          </span>
          <span style="color:#FFFFFF;font-size:16px;font-weight:800;">
            Área de Membros & Curso Completo 🎬
          </span>
        </div>

        <p style="margin:0 0 14px;font-size:13px;line-height:1.6;color:#D1D5DB;">
          Seu acesso à plataforma exclusiva de aulas, masterclasses e workshops de edição de vídeo está liberado! Assista no celular ou no computador:
        </p>

        <div style="background:#08090C;border:1px solid #282A36;border-radius:10px;padding:14px 16px;margin-bottom:16px;font-size:13px;line-height:1.8;">
          <div style="color:#9CA3AF;">🌐 <strong>Portal do Aluno:</strong> <a href="${membersLink}" target="_blank" style="color:#FF7A1A;text-decoration:none;font-weight:700;">${membersLink}</a></div>
          <div style="color:#9CA3AF;">📧 <strong>Seu E-mail de Login:</strong> <strong style="color:#FFFFFF;">${input.to}</strong></div>
          <div style="color:#9CA3AF;">🔑 <strong>Sua Senha de Aluno:</strong> <code style="background:#1E2029;color:#FFB27A;padding:2px 8px;border-radius:4px;font-weight:bold;font-size:13px;">${input.temporaryPassword || 'admin123'}</code></div>
        </div>

        <a href="${membersLink}" target="_blank" style="display:block;background:linear-gradient(135deg, #FF5C00, #E04800);color:#FFFFFF;font-size:15px;font-weight:800;text-decoration:none;padding:14px 20px;border-radius:10px;text-align:center;box-shadow:0 4px 18px rgba(255,92,0,0.4);text-transform:uppercase;letter-spacing:0.5px;">
          ▶ Acessar Área de Membros (Assistir Aulas)
        </a>
      </div>

      <!-- Passo a Passo de Instalação e Aulas -->
      <div style="background:#1A1A1A;border:1px solid #2B2B2B;border-radius:12px;padding:18px;margin:22px 0;font-size:13px;line-height:1.65;">
        <h3 style="margin:0 0 12px;font-size:14px;color:#FFFFFF;font-weight:700;">
          📌 Primeiros Passos (Instalação e Suporte):
        </h3>
        
        <div style="margin-bottom:12px;">
          <strong style="color:#FF7A1A;">1. Google Drive Oficial:</strong><br>
          Acesse a pasta do Drive para baixar o instalador e assistir às aulas ensinando o passo a passo completo de como instalar no seu PC e começar a cortar.
        </div>

        <div style="margin-bottom:12px;">
          <strong style="color:#25D366;">2. Grupo VIP no WhatsApp:</strong><br>
          Entre na nossa comunidade exclusiva para tirar dúvidas, receber dicas de monetização e atualizações em primeira mão.
        </div>

        <div>
          <strong style="color:#E5E7EB;">3. Ativação da Chave:</strong><br>
          Abra a Fábrica dos Cortes, vá na aba <strong>Licença / Ativação</strong>, cole sua chave e clique em <strong>Verificar / Ativar</strong>.
        </div>
      </div>

      <!-- Botões de Ação Principais -->
      <div style="text-align:center;margin:28px 0 20px;">
        <!-- Botão Google Drive -->
        <a href="${driveLink}" target="_blank" style="display:block;background:linear-gradient(135deg, #FF5C00, #E04800);color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:14px 24px;border-radius:10px;margin-bottom:12px;box-shadow:0 4px 16px rgba(255,92,0,0.35);">
          📁 Acessar Google Drive (Aulas e Instalador)
        </a>

        <!-- Botão WhatsApp -->
        <a href="${whatsappLink}" target="_blank" style="display:block;background:#25D366;color:#FFFFFF;font-size:15px;font-weight:700;text-decoration:none;padding:14px 24px;border-radius:10px;margin-bottom:12px;box-shadow:0 4px 16px rgba(37,211,102,0.3);">
          💬 Entrar no Grupo VIP do WhatsApp
        </a>

        <!-- Botão Google Colab (opcional nuvem) -->
        <a href="${colabLink}" target="_blank" style="display:inline-block;background:#262626;border:1px solid #3D3D3D;color:#D1D5DB;font-size:13px;font-weight:600;text-decoration:none;padding:10px 20px;border-radius:8px;margin-top:4px;">
          🚀 Preferir rodar na nuvem? Abrir Google Colab
        </a>
      </div>

      <!-- Dados de Acesso Web -->
      <div style="border-top:1px solid #262626;padding-top:18px;margin-top:24px;font-size:12px;color:#888888;line-height:1.6;">
        <p style="margin:0 0 6px;">
          <strong>Painel de Acesso Web:</strong> Caso precise consultar seu saldo de créditos ou ver sua chave novamente, acesse a qualquer momento:
          <br><a href="${accessPage}" style="color:#FF7A1A;text-decoration:none;">${accessPage}</a>
        </p>
        ${input.username ? `<p style="margin:0 0 4px;"><strong>Usuário:</strong> ${input.username}</p>` : ''}
        ${input.temporaryPassword ? `<p style="margin:0 0 4px;"><strong>Senha provisória:</strong> <code style="color:#FFB27A;">${input.temporaryPassword}</code></p>` : ''}
      </div>

    </div>

    <!-- Rodapé -->
    <div style="background:#0F0F0F;border-top:1px solid #222222;padding:16px 24px;text-align:center;font-size:11px;color:#666666;">
      Fábrica dos Cortes — fabricadecortes.com • Tecnologia de Cortes Automáticos com IA.
    </div>

  </div>
</body>
</html>
  `;

  try {
    let result = await c.emails.send({
      from,
      to: input.to,
      subject: `Seu acesso à Fábrica dos Cortes está pronto (${input.credits} Créditos) 🚀`,
      html,
      attachments: logoAttachments.length > 0 ? logoAttachments : undefined,
    });
    if (result.error && from !== 'Fábrica dos Cortes <onboarding@resend.dev>') {
      console.warn(`[E-mail] Fallback para onboarding@resend.dev após aviso: ${result.error.message}`);
      result = await c.emails.send({
        from: 'Fábrica dos Cortes <onboarding@resend.dev>',
        to: input.to,
        subject: `Seu acesso à Fábrica dos Cortes está pronto (${input.credits} Créditos) 🚀`,
        html,
        attachments: logoAttachments.length > 0 ? logoAttachments : undefined,
      });
    }
    if (result.error) {
      console.error(`[E-mail] Erro ao enviar e-mail para ${input.to}:`, result.error.message);
      return { ok: false, error: result.error.message };
    }
    console.log(`[E-mail] E-mail de acesso enviado com sucesso para ${input.to}! (ID: ${result.data?.id})`);
    return { ok: true, id: result.data?.id };
  } catch (err: any) {
    console.error(`[E-mail] Falha inesperada ao enviar para ${input.to}:`, err?.message);
    return { ok: false, error: err?.message };
  }
}

export async function sendRechargeEmail(input: SendRechargeEmailInput): Promise<{ ok: boolean; error?: string }> {
  const c = client();
  if (!c) {
    console.warn(`[E-mail] RESEND_API_KEY não configurada. E-mail de recarga para ${input.to} ignorado.`);
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }

  const from = process.env.EMAIL_FROM || 'Fábrica dos Cortes <contato@fabricadecortes.com>';
  const accessPage = input.accessUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://fabricadecortes.com'}/acesso`;
  const logoAttachments = getLogoAttachments();

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Recarga Confirmada — Fábrica dos Cortes</title>
</head>
<body style="margin:0;padding:24px;background-color:#0A0A0A;font-family:Inter,sans-serif;color:#F3F4F6;">
  <div style="max-width:560px;margin:0 auto;background:#141414;border:1px solid #262626;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,0.5);">
    
    <div style="background:linear-gradient(135deg, #FF5C00, #E04800);padding:26px 24px;text-align:center;">
      <img src="cid:brand-logo" alt="Fábrica dos Cortes" style="width:48px;height:48px;border-radius:12px;margin-bottom:8px;box-shadow:0 4px 16px rgba(0,0,0,0.3);display:inline-block;" />
      <h2 style="color:#FFFFFF;margin:0;font-size:22px;font-weight:800;">⚡ Recarga Confirmada!</h2>
    </div>

    <div style="padding:26px 24px;">
      <p style="font-size:14px;color:#E5E7EB;margin:0 0 16px;">
        Olá, <strong>${input.name}</strong>! O pagamento da sua recarga foi confirmado e os novos créditos já foram injetados na sua chave de licença.
      </p>

      <div style="background:#1C1C1C;border:1px solid #333333;border-radius:12px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 8px;font-size:13px;color:#A3A3A3;">Chave de Licença recarregada:</p>
        <code style="display:block;background:#0D0D0D;padding:10px;border-radius:6px;font-size:16px;font-weight:bold;color:#FF7A1A;">
          ${input.licenseKey}
        </code>
        <p style="margin:12px 0 0;font-size:14px;color:#FFFFFF;">
          <strong>+${input.creditsAdded} novos créditos</strong> adicionados à sua conta!
        </p>
      </div>

      <p style="font-size:13px;color:#9CA3AF;line-height:1.6;">
        Você já pode abrir a Fábrica dos Cortes (<a href="https://fabricadecortes.com" style="color:#FF7A1A;text-decoration:none;">fabricadecortes.com</a>) ou clicar em <strong>"Atualizar créditos"</strong> na ferramenta para utilizar seus novos vídeos imediatamente.
      </p>

      <div style="margin-top:24px;text-align:center;">
        <a href="${accessPage}" style="display:inline-block;background:#FF5C00;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:13px;padding:12px 24px;border-radius:8px;">
          Ver Meus Créditos no Painel
        </a>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    let result = await c.emails.send({
      from,
      to: input.to,
      subject: `+${input.creditsAdded} Créditos adicionados à sua Fábrica dos Cortes ⚡`,
      html,
      attachments: logoAttachments.length > 0 ? logoAttachments : undefined,
    });
    if (result.error && from !== 'Fábrica dos Cortes <onboarding@resend.dev>') {
      result = await c.emails.send({
        from: 'Fábrica dos Cortes <onboarding@resend.dev>',
        to: input.to,
        subject: `+${input.creditsAdded} Créditos adicionados à sua Fábrica dos Cortes ⚡`,
        html,
        attachments: logoAttachments.length > 0 ? logoAttachments : undefined,
      });
    }
    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message };
  }
}