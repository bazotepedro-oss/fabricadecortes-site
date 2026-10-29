/**
 * Sincronizador Unificado entre o CRM do Site (Next.js) e a Área de Membros (HostGator / PHP)
 * Garante que qualquer exclusão, bloqueio ou alteração de licença/cliente
 * reflita instantaneamente no acesso do aluno à Área de Membros.
 */

const ADMIN_SECRET = 'fabricadecortes_secret_2026';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/plain, */*',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

export function getMembersApiUrl(): string {
  if (process.env.MEMBERS_API_URL) {
    return process.env.MEMBERS_API_URL;
  }
  const membersUrl =
    process.env.MEMBERS_URL ||
    process.env.NEXT_PUBLIC_MEMBERS_URL ||
    'https://membros.fabricadecortes.com/index.php';
  return membersUrl.replace(/\/index\.php$/i, '/api.php');
}

/**
 * Cadastra ou reativa um aluno na Área de Membros
 */
export async function syncAddStudent(params: { name: string; email: string; password?: string }): Promise<boolean> {
  try {
    const apiUrl = getMembersApiUrl();
    const res = await fetch(`${apiUrl}?action=admin_add_student`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        secret: ADMIN_SECRET,
        nome: params.name,
        email: params.email.toLowerCase().trim(),
        senha: params.password || 'membro2026',
      }),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data?.success) {
      console.log(`[MembersSync] Aluno ${params.email} sincronizado com sucesso na Área de Membros.`);
      return true;
    }
    console.warn(`[MembersSync] Falha na resposta da Área de Membros ao adicionar aluno:`, data);
    return false;
  } catch (err: any) {
    console.warn(`[MembersSync] Erro ao sincronizar aluno ${params.email}:`, err?.message);
    return false;
  }
}

/**
 * Edita os dados do aluno na Área de Membros (HostGator)
 */
export async function syncEditStudent(params: {
  email: string;
  novoNome?: string;
  novoEmail?: string;
  novaSenha?: string;
}): Promise<boolean> {
  if (!params.email) return false;
  try {
    const apiUrl = getMembersApiUrl();
    const res = await fetch(`${apiUrl}?action=admin_edit_student`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        secret: ADMIN_SECRET,
        email: params.email.toLowerCase().trim(),
        nome: params.novoNome,
        novo_email: params.novoEmail ? params.novoEmail.toLowerCase().trim() : undefined,
        senha: params.novaSenha,
      }),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data?.success) {
      console.log(`[MembersSync] Aluno ${params.email} editado com sucesso na Área de Membros.`);
      return true;
    }
    console.warn(`[MembersSync] Falha ao editar aluno ${params.email} na Área de Membros:`, data);
    return false;
  } catch (err: any) {
    console.warn(`[MembersSync] Erro ao editar aluno ${params.email} na Área de Membros:`, err?.message);
    return false;
  }
}

/**
 * Exclui permanentemente o acesso do aluno na Área de Membros quando o cliente ou licença é excluído
 */
export async function syncDeleteStudent(email: string): Promise<boolean> {
  if (!email) return false;
  try {
    const apiUrl = getMembersApiUrl();
    const res = await fetch(`${apiUrl}?action=admin_delete_student`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        secret: ADMIN_SECRET,
        email: email.toLowerCase().trim(),
      }),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data?.success) {
      console.log(`[MembersSync] Acesso do aluno ${email} excluído com sucesso da Área de Membros.`);
      return true;
    }
    console.warn(`[MembersSync] Falha ao excluir aluno ${email} na Área de Membros:`, data);
    return false;
  } catch (err: any) {
    console.warn(`[MembersSync] Erro ao excluir aluno ${email} na Área de Membros:`, err?.message);
    return false;
  }
}

/**
 * Lista todos os e-mails e checkouts excluídos persistentemente na Área de Membros
 */
export async function syncListDeletedStudents(): Promise<{
  deleted: { email: string; excluido_em?: string }[];
  deletedCheckouts: string[];
  clearedAt: string | null;
}> {
  try {
    const apiUrl = getMembersApiUrl();
    const res = await fetch(`${apiUrl}?action=admin_list_deleted`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ secret: ADMIN_SECRET }),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json().catch(() => null);
    const deleted = Array.isArray(data?.deleted)
      ? data.deleted.map((d: any) =>
          typeof d === 'string'
            ? { email: d.toLowerCase().trim(), excluido_em: undefined }
            : { email: String(d.email || '').toLowerCase().trim(), excluido_em: d.excluido_em }
        )
      : [];
    const deletedCheckouts = Array.isArray(data?.deleted_checkouts)
      ? data.deleted_checkouts.map((id: any) => String(id).trim())
      : [];
    const clearedAt = data?.cleared_at ? String(data.cleared_at) : null;
    return { deleted, deletedCheckouts, clearedAt };
  } catch (err: any) {
    console.warn(`[MembersSync] Falha ao listar alunos excluídos:`, err?.message);
    return { deleted: [], deletedCheckouts: [], clearedAt: null };
  }
}

/**
 * Registra a exclusão definitiva de um pedido/checkout na HostGator
 */
export async function syncDeleteCheckout(checkoutId: string): Promise<boolean> {
  if (!checkoutId) return false;
  try {
    const apiUrl = getMembersApiUrl();
    const res = await fetch(`${apiUrl}?action=admin_delete_checkout`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        secret: ADMIN_SECRET,
        checkout_id: checkoutId.trim(),
      }),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json().catch(() => null);
    return Boolean(res.ok && data?.success);
  } catch (err: any) {
    console.warn(`[MembersSync] Erro ao registrar exclusão do checkout ${checkoutId}:`, err?.message);
    return false;
  }
}

/**
 * Lista todos os alunos cadastrados na Área de Membros
 */
export async function syncListStudents(): Promise<any[]> {
  try {
    const apiUrl = getMembersApiUrl();
    const res = await fetch(`${apiUrl}?action=admin_list_students`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ secret: ADMIN_SECRET }),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && Array.isArray(data?.alunos)) {
      return data.alunos;
    }
    return [];
  } catch (err: any) {
    console.warn(`[MembersSync] Falha ao listar alunos:`, err?.message);
    return [];
  }
}

/**
 * Bloqueia ou desbloqueia o acesso do aluno na Área de Membros
 */
export async function syncToggleStudent(email: string, status: 'ativo' | 'bloqueado'): Promise<boolean> {
  if (!email) return false;
  try {
    const apiUrl = getMembersApiUrl();
    const res = await fetch(`${apiUrl}?action=admin_toggle_student`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        secret: ADMIN_SECRET,
        email: email.toLowerCase().trim(),
        status,
      }),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data?.success) {
      console.log(`[MembersSync] Status do aluno ${email} alterado para ${status} na Área de Membros.`);
      return true;
    }
    return false;
  } catch (err: any) {
    console.warn(`[MembersSync] Erro ao alterar status do aluno ${email}:`, err?.message);
    return false;
  }
}

/**
 * Altera ou redefine a senha do aluno na Área de Membros
 */
export async function syncSetStudentPassword(email: string, novaSenha: string): Promise<boolean> {
  if (!email || !novaSenha) return false;
  try {
    const apiUrl = getMembersApiUrl();
    const res = await fetch(`${apiUrl}?action=admin_set_password`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        secret: ADMIN_SECRET,
        email: email.toLowerCase().trim(),
        nova_senha: novaSenha,
      }),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && data?.success) {
      console.log(`[MembersSync] Senha do aluno ${email} atualizada com sucesso na Área de Membros.`);
      return true;
    }
    console.warn(`[MembersSync] Falha ao atualizar senha do aluno ${email}:`, data);
    return false;
  } catch (err: any) {
    console.warn(`[MembersSync] Erro ao sincronizar nova senha de ${email}:`, err?.message);
    return false;
  }
}

/**
 * Limpa todos os alunos da Área de Membros (ao resetar todo o CRM)
 */
export async function syncClearStudents(emails?: string[]): Promise<boolean> {
  try {
    const apiUrl = getMembersApiUrl();
    const res = await fetch(`${apiUrl}?action=admin_clear_students`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        secret: ADMIN_SECRET,
        emails: emails || [],
        cleared_at: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json().catch(() => null);
    return !!(res.ok && data?.success);
  } catch (err: any) {
    console.warn(`[MembersSync] Erro ao limpar alunos na Área de Membros:`, err?.message);
    return false;
  }
}

/**
 * Salva ou atualiza um afiliado / YouTuber na Ãrea de Membros (HostGator)
 */
export async function syncSaveAffiliate(affiliate: {
  id?: string;
  name: string;
  email: string;
  slug: string;
  token?: string;
  couponCode?: string;
  discountPercent?: number;
  commissionPercent?: number;
  pixKey?: string;
  pixKeyType?: string;
  notes?: string | null;
  active?: boolean;
}): Promise<boolean> {
  if (!affiliate.email || !affiliate.name || !affiliate.slug) return false;
  try {
    const apiUrl = getMembersApiUrl();
    const res = await fetch(`${apiUrl}?action=admin_save_affiliate`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        secret: ADMIN_SECRET,
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email.toLowerCase().trim(),
        slug: affiliate.slug.toLowerCase().trim(),
        token: affiliate.token,
        coupon_code: affiliate.couponCode || affiliate.slug.toUpperCase().trim(),
        discount_percent: affiliate.discountPercent || 0,
        commission_percent: affiliate.commissionPercent || 20,
        pix_key: affiliate.pixKey || '',
        pix_key_type: affiliate.pixKeyType || 'cpf',
        notes: affiliate.notes || '',
        active: affiliate.active !== false ? 1 : 0,
      }),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json().catch(() => null);
    return !!(res.ok && data?.success);
  } catch (err: any) {
    console.warn(`[MembersSync] Erro ao salvar afiliado na HostGator:`, err?.message);
    return false;
  }
}

/**
 * Lista todos os afiliados / YouTubers salvos persistentemente na Área de Membros (HostGator)
 */
export async function syncListAffiliates(): Promise<any[]> {
  try {
    const apiUrl = getMembersApiUrl();
    const res = await fetch(`${apiUrl}?action=admin_list_affiliates`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ secret: ADMIN_SECRET }),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && Array.isArray(data?.affiliates)) {
      return data.affiliates.map((a: any) => ({
        id: a.id,
        name: a.name,
        email: String(a.email || '').toLowerCase().trim(),
        slug: String(a.slug || '').toLowerCase().trim(),
        token: a.token,
        couponCode: String(a.coupon_code || a.slug || '').toUpperCase().trim(),
        discountPercent: Number(a.discount_percent || 0),
        commissionPercent: Number(a.commission_percent || 20),
        pixKey: a.pix_key,
        pixKeyType: a.pix_key_type || 'cpf',
        notes: a.notes || null,
        active: Number(a.active) === 1,
        createdAt: a.criado_em,
        updatedAt: a.atualizado_em,
      }));
    }
    return [];
  } catch (err: any) {
    console.warn(`[MembersSync] Erro ao listar afiliados da HostGator:`, err?.message);
    return [];
  }
}

/**
 * Exclui um afiliado da Área de Membros (HostGator)
 */
export async function syncDeleteAffiliate(
  target: { id?: string; email?: string; slug?: string } | string
): Promise<boolean> {
  if (!target) return false;
  try {
    const apiUrl = getMembersApiUrl();
    const payload: any = { secret: ADMIN_SECRET };
    if (typeof target === 'string') {
      payload.id = target;
      payload.email = target.toLowerCase().trim();
      payload.slug = target.toLowerCase().trim();
    } else {
      if (target.id) payload.id = target.id;
      if (target.email) payload.email = target.email.toLowerCase().trim();
      if (target.slug) payload.slug = target.slug.toLowerCase().trim();
    }

    const res = await fetch(`${apiUrl}?action=admin_delete_affiliate`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json().catch(() => null);
    return !!(res.ok && data?.success);
  } catch (err: any) {
    console.warn(`[MembersSync] Erro ao excluir afiliado na HostGator:`, err?.message);
    return false;
  }
}
