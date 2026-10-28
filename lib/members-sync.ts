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
 * Lista todos os e-mails de alunos excluídos persistentemente na Área de Membros
 */
export async function syncListDeletedStudents(): Promise<Set<string>> {
  try {
    const apiUrl = getMembersApiUrl();
    const res = await fetch(`${apiUrl}?action=admin_list_deleted`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({ secret: ADMIN_SECRET }),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json().catch(() => null);
    if (res.ok && Array.isArray(data?.deleted)) {
      return new Set(data.deleted.map((e: string) => String(e).toLowerCase().trim()));
    }
    return new Set();
  } catch (err: any) {
    console.warn(`[MembersSync] Falha ao listar alunos excluídos:`, err?.message);
    return new Set();
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
export async function syncClearStudents(): Promise<boolean> {
  try {
    const apiUrl = getMembersApiUrl();
    const res = await fetch(`${apiUrl}?action=admin_clear_students`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        secret: ADMIN_SECRET,
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


