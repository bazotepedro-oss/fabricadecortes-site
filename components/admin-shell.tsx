'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn, formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  RefreshCcw,
  Users,
  Key,
  Webhook,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  RotateCcw,
  ShieldOff,
  Zap,
  Activity,
  MessageCircle,
  Copy,
  PlusCircle,
  Search,
  CalendarPlus,
  Trash2,
  Edit2,
  UserCheck,
  DollarSign,
  Wallet,
  Check,
  Tag,
  Gift,
  Eye,
  EyeOff,
  Lock,
  UserPlus,
} from 'lucide-react';
import type { RailwayLicense } from '@/lib/license-server';
import { GrantAccessModal } from './grant-access-modal';

// ── Types (mirrored from Prisma) ──────────────────────────────────────────────

interface Plan {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  interval: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: Date | string;
  orders?: any[];
  credentials?: {
    id: string;
    username: string;
    plainPassword?: string | null;
    licenseKey?: string | null;
    credits?: number | null;
    status: string;
    expiresAt?: Date | string | null;
  }[];
}

interface Order {
  id: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: Date | string;
  paidAt?: Date | string | null;
  customer: Customer;
  plan: Plan;
}

interface Subscription {
  id: string;
  status: string;
  provider: string;
  currentPeriodEnd?: Date | string | null;
  createdAt: Date | string;
  customer: Customer;
  plan: Plan;
}

interface Credential {
  id: string;
  username: string;
  plainPassword?: string | null;
  accessUrl: string;
  railwayAppUrl?: string | null;
  licenseKey?: string | null;
  credits?: number | null;
  status: string;
  expiresAt?: Date | string | null;
  createdAt: Date | string;
  customer: Customer;
  order?: { id: string } | null;
}

interface WebhookEvent {
  id: string;
  provider: string;
  eventId: string;
  type: string;
  processed: boolean;
  createdAt: Date | string;
  orderId?: string | null;
}

interface Affiliate {
  id: string;
  name: string;
  email: string;
  slug: string;
  couponCode: string;
  discountPercent: number;
  commissionPercent: number;
  pixKey: string;
  pixKeyType: string;
  token: string;
  active: boolean;
  notes?: string | null;
  createdAt: Date | string;
  orders?: {
    id: string;
    status: string;
    amount: number;
    commissionAmount?: number | null;
    commissionStatus?: string | null;
    createdAt: Date | string;
  }[];
  payouts?: {
    id: string;
    period: string;
    commissionAmount: number;
    status: string;
    paidAt?: Date | string | null;
  }[];
}

interface AdminShellProps {
  orders: Order[];
  subscriptions: Subscription[];
  customers: Customer[];
  credentials: Credential[];
  events: WebhookEvent[];
  railwayLicenses?: RailwayLicense[];
  affiliates?: Affiliate[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const statusColor: Record<string, 'success' | 'brand' | 'default' | 'outline'> = {
  paid: 'success',
  active: 'success',
  completed: 'success',
  pending: 'brand',
  processing: 'brand',
  cancelled: 'outline',
  expired: 'outline',
  revoked: 'outline',
  failed: 'outline',
};

const statusLabel: Record<string, string> = {
  paid: 'Pago',
  active: 'Ativo',
  completed: 'Concluído',
  pending: 'Pendente',
  processing: 'Processando',
  cancelled: 'Cancelado',
  expired: 'Expirado',
  revoked: 'Revogado',
  failed: 'Falhou',
};

function StatusBadge({ status }: { status: string }) {
  const variant = statusColor[status] ?? 'default';
  return <Badge variant={variant}>{statusLabel[status] ?? status}</Badge>;
}

// ── Tab config ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'affiliates',    label: 'Afiliados & YouTubers', Icon: UserCheck    },
  { id: 'customers',     label: 'CRM & WhatsApp',     Icon: Users        },
  { id: 'licenses',      label: 'Licenças Railway',    Icon: Key          },
  { id: 'orders',        label: 'Pedidos',            Icon: ShoppingCart },
  { id: 'subscriptions', label: 'Assinaturas',        Icon: RefreshCcw   },
  { id: 'credentials',   label: 'Credenciais',        Icon: Key          },
  { id: 'events',        label: 'Webhooks',           Icon: Webhook      },
] as const;

type TabId = (typeof TABS)[number]['id'];

function RailwayLicensesPanel({
  licenses,
  onOpenGrantModal,
}: {
  licenses: RailwayLicense[];
  onOpenGrantModal?: () => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Form state
  const [formKey, setFormKey] = useState('');
  const [formCredits, setFormCredits] = useState('100');
  const [formDays, setFormDays] = useState('30');
  const [formPlan, setFormPlan] = useState('pro');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');

  const [workingKey, setWorkingKey] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ key: string; text: string; ok: boolean } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filtered = licenses.filter((l) => {
    const term = q.toLowerCase();
    return (
      l.license_key.toLowerCase().includes(term) ||
      (l.plan || '').toLowerCase().includes(term) ||
      (l.hwid || '').toLowerCase().includes(term)
    );
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(null);
    try {
      const res = await fetch('/api/admin/licenses/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          licenseKey: formKey.trim() || undefined,
          credits: Number(formCredits) || 100,
          days: Number(formDays) || 30,
          plan: formPlan,
          name: formName.trim() || undefined,
          email: formEmail.trim() || undefined,
          phone: formPhone.trim() || undefined,
        }),
      });
      const data = await res.json();
      setCreateMsg({ text: data.message || (res.ok ? 'Criada!' : data.error), ok: res.ok });
      if (res.ok) {
        setFormKey('');
        setFormName('');
        setFormEmail('');
        setFormPhone('');
        startTransition(() => router.refresh());
      }
    } catch {
      setCreateMsg({ text: 'Erro de conexão', ok: false });
    } finally {
      setCreating(false);
    }
  }

  async function handleAddCredits(licenseKey: string, amount?: number) {
    let creds = amount;
    if (!creds) {
      const input = window.prompt('Quantos créditos deseja adicionar à licença?', '100');
      if (!input) return;
      creds = parseInt(input, 10);
      if (isNaN(creds) || creds <= 0) return;
    }

    setWorkingKey(licenseKey);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/licenses/add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, credits: creds }),
      });
      const data = await res.json();
      setMsg({ key: licenseKey, text: data.message || `+${creds} créditos`, ok: res.ok });
      if (res.ok) startTransition(() => router.refresh());
    } catch {
      setMsg({ key: licenseKey, text: 'Erro de conexão', ok: false });
    } finally {
      setWorkingKey(null);
    }
  }

  async function handleExtendDays(licenseKey: string, daysToAdd?: number) {
    let days = daysToAdd;
    if (!days) {
      const input = window.prompt('Quantos dias deseja adicionar à validade?', '30');
      if (!input) return;
      days = parseInt(input, 10);
      if (isNaN(days) || days <= 0) return;
    }

    setWorkingKey(licenseKey);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/licenses/extend-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, days }),
      });
      const data = await res.json();
      setMsg({ key: licenseKey, text: data.message || `+${days} dias`, ok: res.ok });
      if (res.ok) startTransition(() => router.refresh());
    } catch {
      setMsg({ key: licenseKey, text: 'Erro de conexão', ok: false });
    } finally {
      setWorkingKey(null);
    }
  }

  async function handleDelete(licenseKey: string) {
    if (!window.confirm(`Tem certeza que deseja DELETAR permanentemente a licença ${licenseKey} do Railway?`)) {
      return;
    }

    setWorkingKey(licenseKey);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/licenses/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey }),
      });
      const data = await res.json();
      setMsg({ key: licenseKey, text: data.message || 'Licença deletada', ok: res.ok });
      if (res.ok) startTransition(() => router.refresh());
    } catch {
      setMsg({ key: licenseKey, text: 'Erro de conexão', ok: false });
    } finally {
      setWorkingKey(null);
    }
  }

  async function handleUnbind(licenseKey: string) {
    setWorkingKey(licenseKey);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/licenses/unbind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey }),
      });
      const data = await res.json();
      setMsg({ key: licenseKey, text: data.message || 'HWID resetado', ok: res.ok });
      if (res.ok) startTransition(() => router.refresh());
    } catch {
      setMsg({ key: licenseKey, text: 'Erro de conexão', ok: false });
    } finally {
      setWorkingKey(null);
    }
  }

  async function handleToggle(licenseKey: string) {
    setWorkingKey(licenseKey);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/licenses/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey }),
      });
      const data = await res.json();
      setMsg({ key: licenseKey, text: data.message || 'Status alterado', ok: res.ok });
      if (res.ok) startTransition(() => router.refresh());
    } catch {
      setMsg({ key: licenseKey, text: 'Erro de conexão', ok: false });
    } finally {
      setWorkingKey(null);
    }
  }

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-4 p-4">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Buscar por chave, plano ou HWID..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand"
          />
        </div>
        <div className="flex items-center gap-2">
          {onOpenGrantModal && (
            <Button
              onClick={onOpenGrantModal}
              size="sm"
              className="bg-gradient-to-r from-orange-600 via-brand to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              + Liberar Acesso & Enviar Login
            </Button>
          )}
          <Button onClick={() => setShowCreate(!showCreate)} size="sm" variant="secondary">
            <PlusCircle className="w-4 h-4 mr-1.5" />
            {showCreate ? 'Fechar' : '+ Chave Direta'}
          </Button>
        </div>
      </div>

      {/* Formulário de criação de chave */}
      {showCreate && (
        <form onSubmit={handleCreate} className="p-5 rounded-xl border border-brand/40 bg-surface/80 space-y-4">
          <h3 className="font-bold text-sm text-text-primary flex items-center gap-2">
            <Key className="w-4 h-4 text-brand" />
            Criar Nova Licença no Railway (+ Cadastrar no CRM)
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Chave Personalizada (opcional)</label>
              <input
                type="text"
                placeholder="Deixe vazio para gerar FV-XXXX"
                value={formKey}
                onChange={(e) => setFormKey(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Créditos</label>
              <input
                type="number"
                value={formCredits}
                onChange={(e) => setFormCredits(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary"
                required
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Validade (dias)</label>
              <input
                type="number"
                value={formDays}
                onChange={(e) => setFormDays(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary"
                required
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Plano</label>
              <select
                value={formPlan}
                onChange={(e) => setFormPlan(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary"
              >
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
                <option value="anual">Anual</option>
                <option value="pro">Pro</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Nome do Cliente (para CRM)</label>
              <input
                type="text"
                placeholder="Ex: Pedro Silva"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">E-mail do Cliente</label>
              <input
                type="email"
                placeholder="Ex: pedro@gmail.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">WhatsApp / Telefone</label>
              <input
                type="text"
                placeholder="Ex: 11999999999"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {createMsg && (
              <span className={`text-xs ${createMsg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                {createMsg.text}
              </span>
            )}
            <Button type="submit" size="sm" disabled={creating} className="ml-auto">
              {creating ? 'Criando no Railway...' : 'Criar Licença Agora'}
            </Button>
          </div>
        </form>
      )}

      {/* Tabela de Licenças */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-text-secondary text-xs uppercase tracking-wider">
              <th className="text-left py-3 px-4 font-medium">Chave de Licença</th>
              <th className="text-left py-3 px-4 font-medium">Plano</th>
              <th className="text-left py-3 px-4 font-medium">Créditos</th>
              <th className="text-left py-3 px-4 font-medium">HWID / Máquina</th>
              <th className="text-left py-3 px-4 font-medium">Status</th>
              <th className="text-left py-3 px-4 font-medium">Validade</th>
              <th className="text-left py-3 px-4 font-medium">Ações (Railway)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-text-secondary">
                  Nenhuma licença encontrada no servidor Railway.
                </td>
              </tr>
            )}
            {filtered.map((l) => {
              const expDate = l.exp ? new Date(l.exp * 1000).toLocaleDateString('pt-BR') : '—';
              const isExpired = l.exp ? l.exp * 1000 < Date.now() : false;

              return (
                <tr key={l.license_key} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs text-brand font-bold bg-brand/10 px-2 py-0.5 rounded border border-brand/20">
                        {l.license_key}
                      </code>
                      <button
                        onClick={() => copyToClipboard(l.license_key)}
                        title="Copiar chave"
                        className="text-text-secondary hover:text-text-primary"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {copiedKey === l.license_key && <span className="text-[10px] text-emerald-400">Copiada!</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4 capitalize text-text-primary">{l.plan}</td>
                  <td className="py-3 px-4 font-bold text-text-primary">
                    <span className="inline-flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-brand" />
                      {l.credits}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-text-secondary">
                    {l.hwid ? (
                      <span className="truncate max-w-[120px] inline-block" title={l.hwid}>
                        {l.hwid.slice(0, 12)}...
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-sans text-xs">Livre (sem amarração)</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {isExpired ? (
                      <Badge variant="outline">Expirado</Badge>
                    ) : (
                      <StatusBadge status={l.status} />
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs text-text-secondary">{expDate}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={workingKey === l.license_key}
                          onClick={() => handleAddCredits(l.license_key)}
                          className="text-xs h-7 px-2"
                          title="Adicionar Créditos (Personalizado ou Padrão)"
                        >
                          <PlusCircle className="h-3 w-3 mr-1 text-brand" /> +Créditos
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={workingKey === l.license_key}
                          onClick={() => handleExtendDays(l.license_key, 30)}
                          className="text-xs h-7 px-2 text-text-secondary hover:text-text-primary border border-white/5"
                          title="Estender Validade em +30 Dias"
                        >
                          <CalendarPlus className="h-3 w-3 mr-1 text-sky-400" /> +30d
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={workingKey === l.license_key}
                          onClick={() => handleUnbind(l.license_key)}
                          className="text-xs h-7 px-2 text-text-secondary hover:text-text-primary border border-white/5"
                          title="Desvincular HWID / Liberar para Trocar de PC"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" /> Unbind
                        </Button>
                        <Button
                          variant={l.status === 'blocked' ? 'secondary' : 'ghost'}
                          size="sm"
                          disabled={workingKey === l.license_key}
                          onClick={() => handleToggle(l.license_key)}
                          className="text-xs h-7 px-2 border border-white/5"
                          title={l.status === 'blocked' ? 'Desbloquear Licença' : 'Bloquear Licença'}
                        >
                          <ShieldOff className="h-3 w-3 text-amber-400" />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={workingKey === l.license_key}
                          onClick={() => handleDelete(l.license_key)}
                          className="text-xs h-7 px-2"
                          title="Deletar Licença Permanentemente do Railway"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      {msg?.key === l.license_key && (
                        <span className={`text-[11px] ${msg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {msg.text}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersPanel({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activating, setActivating] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  async function activate(orderId: string) {
    setActivating(orderId);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/activate`, { method: 'POST' });
      const data = await res.json();
      setMsg({ id: orderId, text: data.message ?? (res.ok ? 'Ativado' : 'Erro'), ok: res.ok });
      if (res.ok) startTransition(() => router.refresh());
    } catch {
      setMsg({ id: orderId, text: 'Erro de rede', ok: false });
    } finally {
      setActivating(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-text-secondary text-xs uppercase tracking-wider">
            <th className="text-left py-3 px-4 font-medium">ID</th>
            <th className="text-left py-3 px-4 font-medium">Cliente</th>
            <th className="text-left py-3 px-4 font-medium">Plano</th>
            <th className="text-left py-3 px-4 font-medium">Valor</th>
            <th className="text-left py-3 px-4 font-medium">Status</th>
            <th className="text-left py-3 px-4 font-medium">Criado</th>
            <th className="text-left py-3 px-4 font-medium">Pago em</th>
            <th className="text-left py-3 px-4 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr>
              <td colSpan={8} className="py-12 text-center text-text-secondary">Nenhum pedido ainda.</td>
            </tr>
          )}
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              <td className="py-3 px-4 font-mono text-xs text-text-secondary">{o.id.slice(-8)}</td>
              <td className="py-3 px-4">
                <div className="font-medium text-text-primary">{o.customer.name}</div>
                <div className="text-xs text-text-secondary">{o.customer.email}</div>
              </td>
              <td className="py-3 px-4 text-text-secondary">{o.plan.name}</td>
              <td className="py-3 px-4 font-semibold">{formatPrice(o.amount, o.currency)}</td>
              <td className="py-3 px-4"><StatusBadge status={o.status} /></td>
              <td className="py-3 px-4 text-text-secondary text-xs">{fmt(o.createdAt)}</td>
              <td className="py-3 px-4 text-text-secondary text-xs">{fmt(o.paidAt)}</td>
              <td className="py-3 px-4">
                {o.status === 'pending' && (
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={activating === o.id}
                      onClick={() => activate(o.id)}
                      className="text-xs"
                    >
                      <Zap className="w-3 h-3" />
                      {activating === o.id ? 'Ativando…' : 'Ativar manual'}
                    </Button>
                    {msg?.id === o.id && (
                      <span className={cn('text-xs', msg.ok ? 'text-success' : 'text-error')}>
                        {msg.text}
                      </span>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SubscriptionsPanel({ subscriptions }: { subscriptions: Subscription[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-text-secondary text-xs uppercase tracking-wider">
            <th className="text-left py-3 px-4 font-medium">ID</th>
            <th className="text-left py-3 px-4 font-medium">Cliente</th>
            <th className="text-left py-3 px-4 font-medium">Plano</th>
            <th className="text-left py-3 px-4 font-medium">Provedor</th>
            <th className="text-left py-3 px-4 font-medium">Status</th>
            <th className="text-left py-3 px-4 font-medium">Próx. renovação</th>
            <th className="text-left py-3 px-4 font-medium">Criado</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.length === 0 && (
            <tr>
              <td colSpan={7} className="py-12 text-center text-text-secondary">Nenhuma assinatura ainda.</td>
            </tr>
          )}
          {subscriptions.map((s) => (
            <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              <td className="py-3 px-4 font-mono text-xs text-text-secondary">{s.id.slice(-8)}</td>
              <td className="py-3 px-4">
                <div className="font-medium text-text-primary">{s.customer.name}</div>
                <div className="text-xs text-text-secondary">{s.customer.email}</div>
              </td>
              <td className="py-3 px-4 text-text-secondary">{s.plan.name}</td>
              <td className="py-3 px-4 text-text-secondary">{s.provider}</td>
              <td className="py-3 px-4"><StatusBadge status={s.status} /></td>
              <td className="py-3 px-4 text-text-secondary text-xs">{fmt(s.currentPeriodEnd)}</td>
              <td className="py-3 px-4 text-text-secondary text-xs">{fmt(s.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomersPanel({
  customers,
  onOpenGrantModal,
}: {
  customers: Customer[];
  onOpenGrantModal?: () => void;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState('');
  const [workingKey, setWorkingKey] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ key: string; text: string; ok: boolean } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Senhas de Alunos (Área de Membros & CRM)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedPass, setCopiedPass] = useState<string | null>(null);
  const [passwordModalCustomer, setPasswordModalCustomer] = useState<Customer | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  // Edit state
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLicenseKey, setEditLicenseKey] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [clearingCrm, setClearingCrm] = useState(false);

  function startEdit(c: Customer) {
    setEditingCustomer(c);
    setEditName(c.name);
    setEditEmail(c.email);
    setEditPhone(c.phone || '');
    setEditLicenseKey(c.credentials?.[0]?.licenseKey || '');
    setEditPassword(c.credentials?.[0]?.plainPassword || '');
  }

  function openPasswordModal(c: Customer) {
    setPasswordModalCustomer(c);
    setNewPasswordInput(c.credentials?.[0]?.plainPassword || 'membro' + Math.floor(1000 + Math.random() * 9000));
    setPasswordFeedback(null);
  }

  async function handleSavePassword() {
    if (!passwordModalCustomer || !newPasswordInput.trim()) return;
    setSavingPassword(true);
    setPasswordFeedback(null);
    try {
      const res = await fetch('/api/admin/customers/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: passwordModalCustomer.id,
          email: passwordModalCustomer.email,
          newPassword: newPasswordInput.trim(),
        }),
      });
      const data = await res.json();
      setPasswordFeedback({ text: data.message || (res.ok ? 'Senha atualizada!' : data.error), ok: res.ok });
      if (res.ok) {
        startTransition(() => router.refresh());
        setTimeout(() => setPasswordModalCustomer(null), 1500);
      }
    } catch {
      setPasswordFeedback({ text: 'Erro ao conectar ao servidor', ok: false });
    } finally {
      setSavingPassword(false);
    }
  }

  const toggleShowPassword = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPassword = (pass: string, id: string) => {
    navigator.clipboard.writeText(pass);
    setCopiedPass(id);
    setTimeout(() => setCopiedPass(null), 2000);
  };

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCustomer) return;
    setSavingEdit(true);
    try {
      const res = await fetch('/api/admin/customers/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: editingCustomer.id,
          name: editName,
          email: editEmail,
          phone: editPhone,
          licenseKey: editLicenseKey || undefined,
          password: editPassword || undefined,
        }),
      });
      if (res.ok) {
        setEditingCustomer(null);
        startTransition(() => router.refresh());
      }
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDeleteCustomer(customerId: string, customerName: string) {
    if (!window.confirm(`Tem certeza que deseja remover o cliente "${customerName}" do CRM?`)) {
      return;
    }
    try {
      const res = await fetch('/api/admin/customers/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId }),
      });
      if (res.ok) startTransition(() => router.refresh());
    } catch {
      alert('Erro ao excluir cliente');
    }
  }

  async function handleClearCrm() {
    if (!window.confirm('ATENÇÃO: Deseja realmente LIMPAR TODO O CRM? Todos os clientes, pedidos e credenciais locais serão apagados.')) {
      return;
    }
    setClearingCrm(true);
    try {
      const res = await fetch('/api/admin/customers/clear', { method: 'POST' });
      if (res.ok) startTransition(() => router.refresh());
    } finally {
      setClearingCrm(false);
    }
  }

  const filtered = customers.filter((c) => {
    const term = q.toLowerCase();
    const lk = c.credentials?.[0]?.licenseKey?.toLowerCase() || '';
    return (
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      (c.phone || '').includes(term) ||
      lk.includes(term)
    );
  });

  async function handleAddCredits(licenseKey: string) {
    setWorkingKey(licenseKey);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/licenses/add-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, credits: 100 }),
      });
      const data = await res.json();
      setMsg({ key: licenseKey, text: data.message || '+100 créditos', ok: res.ok });
      if (res.ok) startTransition(() => router.refresh());
    } catch {
      setMsg({ key: licenseKey, text: 'Erro de conexão', ok: false });
    } finally {
      setWorkingKey(null);
    }
  }

  async function handleUnbind(licenseKey: string) {
    setWorkingKey(licenseKey);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/licenses/unbind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey }),
      });
      const data = await res.json();
      setMsg({ key: licenseKey, text: data.message || 'HWID resetado', ok: res.ok });
      if (res.ok) startTransition(() => router.refresh());
    } catch {
      setMsg({ key: licenseKey, text: 'Erro de conexão', ok: false });
    } finally {
      setWorkingKey(null);
    }
  }

  async function handleToggle(licenseKey: string) {
    setWorkingKey(licenseKey);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/licenses/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey }),
      });
      const data = await res.json();
      setMsg({ key: licenseKey, text: data.message || 'Status alterado', ok: res.ok });
      if (res.ok) startTransition(() => router.refresh());
    } catch {
      setMsg({ key: licenseKey, text: 'Erro de conexão', ok: false });
    } finally {
      setWorkingKey(null);
    }
  }

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Busca do CRM e Limpar CRM */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface/50 p-4 rounded-xl border border-border">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, telefone ou chave..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-brand"
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-text-secondary">
            Clientes: <strong className="text-text-primary">{filtered.length}</strong>
          </span>
          {onOpenGrantModal && (
            <Button
              size="sm"
              onClick={onOpenGrantModal}
              className="text-xs h-8 bg-gradient-to-r from-orange-600 via-brand to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              + Liberar Acesso VIP
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            disabled={clearingCrm || customers.length === 0}
            onClick={handleClearCrm}
            className="text-xs h-8"
            title="Apagar todos os clientes e pedidos de teste"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            {clearingCrm ? 'Limpando...' : 'Limpar Todo o CRM'}
          </Button>
        </div>
      </div>

      {/* Modal / Formulário de Edição */}
      {editingCustomer && (
        <form onSubmit={handleSaveEdit} className="p-4 rounded-xl border border-brand/50 bg-surface/90 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              <Edit2 className="w-4 h-4 text-brand" /> Editar Cliente: {editingCustomer.name}
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEditingCustomer(null)}
              className="text-xs h-7 px-2"
            >
              Cancelar
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-5">
            <div>
              <label className="text-xs text-text-secondary block mb-1">Nome Completo</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">E-mail</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">WhatsApp / Telefone</label>
              <input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="DDD + Número"
                className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg text-text-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Chave de Licença</label>
              <input
                type="text"
                value={editLicenseKey}
                onChange={(e) => setEditLicenseKey(e.target.value.toUpperCase())}
                placeholder="FV-XXXXX-XXXXX"
                className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg text-text-primary font-mono uppercase"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary block mb-1">Senha (Área de Membros)</label>
              <input
                type="text"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Ex: membro123"
                className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg text-text-primary font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <Button type="submit" size="sm" disabled={savingEdit} className="text-xs font-bold">
              {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      )}

      {/* Modal Dedicado: Alterar Senha do Aluno */}
      {passwordModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-surface border border-brand/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <Lock className="w-5 h-5 text-brand" />
                Alterar Senha do Aluno
              </h3>
              <button
                type="button"
                onClick={() => setPasswordModalCustomer(null)}
                className="text-text-secondary hover:text-text-primary text-sm p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Você está alterando a senha de <strong>{passwordModalCustomer.name}</strong> ({passwordModalCustomer.email}).
              A nova senha será salva no CRM e sincronizada automaticamente na Área de Membros da HostGator.
            </p>

            <div>
              <label className="text-xs text-text-secondary block mb-1.5 font-medium">Nova Senha de Acesso</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg text-text-primary font-mono"
                  placeholder="Digite a nova senha..."
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setNewPasswordInput('membro' + Math.floor(1000 + Math.random() * 9000))}
                  className="whitespace-nowrap text-xs"
                >
                  Gerar Aleatória
                </Button>
              </div>
            </div>

            {passwordFeedback && (
              <div
                className={`text-xs p-3 rounded-lg flex items-center gap-2 ${
                  passwordFeedback.ok
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {passwordFeedback.text}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPasswordModalCustomer(null)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={savingPassword || !newPasswordInput.trim()}
                onClick={handleSavePassword}
                className="text-xs font-bold"
              >
                {savingPassword ? 'Salvando...' : 'Salvar e Sincronizar'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-text-secondary text-xs uppercase tracking-wider">
              <th className="text-left py-3 px-4 font-medium">Cliente</th>
              <th className="text-left py-3 px-4 font-medium">Acesso Aluno (Usuário / Senha)</th>
              <th className="text-left py-3 px-4 font-medium">WhatsApp / Contato</th>
              <th className="text-left py-3 px-4 font-medium">Chave de Licença (Railway)</th>
              <th className="text-left py-3 px-4 font-medium">Créditos</th>
              <th className="text-left py-3 px-4 font-medium">Cadastro</th>
              <th className="text-left py-3 px-4 font-medium">Ações de Suporte (CRM)</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-text-secondary">
                  Nenhum cliente no CRM.
                </td>
              </tr>
            )}
            {filtered.map((c) => {
              const cleanPhone = (c.phone || '').replace(/\D/g, '');
              const waNumber = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
              const waText = encodeURIComponent(
                `Olá ${c.name}, aqui é da equipe da Fábrica dos Cortes! Como estão seus cortes? Precisa de alguma ajuda?`
              );
              const waUrl = cleanPhone ? `https://wa.me/${waNumber}?text=${waText}` : null;
              const primaryCred = c.credentials?.[0];
              const lk = primaryCred?.licenseKey;
              const studentPassword = primaryCred?.plainPassword || 'membro123';
              const studentUsername = primaryCred?.username || c.email.split('@')[0];

              return (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  {/* Nome e E-mail */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-text-primary">{c.name}</div>
                    <div className="text-xs text-text-secondary">{c.email}</div>
                  </td>

                  {/* Usuário & Senha do Aluno */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1">
                      <div className="text-xs text-text-secondary flex items-center gap-1.5">
                        <span className="text-text-muted text-[11px]">Usuário:</span>
                        <span className="font-mono text-text-primary text-xs font-semibold">{studentUsername}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-text-muted text-[11px]">Senha:</span>
                        <code className="font-mono text-xs text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                          {showPasswords[c.id] ? studentPassword : '••••••••'}
                        </code>
                        <button
                          type="button"
                          onClick={() => toggleShowPassword(c.id)}
                          title={showPasswords[c.id] ? 'Ocultar senha' : 'Ver senha'}
                          className="text-text-secondary hover:text-text-primary p-0.5 transition-colors"
                        >
                          {showPasswords[c.id] ? <EyeOff className="h-3.5 w-3.5 text-amber-400" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyPassword(studentPassword, c.id)}
                          title="Copiar senha do aluno"
                          className="text-text-secondary hover:text-text-primary p-0.5 transition-colors"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        {copiedPass === c.id && <span className="text-[10px] text-emerald-400 font-semibold">Copiada!</span>}
                      </div>
                    </div>
                  </td>

                  {/* WhatsApp */}
                  <td className="py-3 px-4">
                    {waUrl ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-colors text-xs font-semibold"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        {c.phone}
                      </a>
                    ) : (
                      <span className="text-xs text-text-secondary">{c.phone || 'Sem número'}</span>
                    )}
                  </td>

                  {/* Chave de Licença */}
                  <td className="py-3 px-4">
                    {lk ? (
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-xs text-brand font-bold bg-brand/10 px-2 py-0.5 rounded border border-brand/20">
                          {lk}
                        </code>
                        <button
                          onClick={() => copyToClipboard(lk)}
                          title="Copiar chave"
                          className="text-text-secondary hover:text-text-primary"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        {copiedKey === lk && <span className="text-[10px] text-emerald-400">Copiada!</span>}
                      </div>
                    ) : (
                      <span className="text-xs text-text-secondary italic">Sem chave</span>
                    )}
                  </td>

                  {/* Saldo de Créditos */}
                  <td className="py-3 px-4 font-semibold text-text-primary">
                    <span className="inline-flex items-center gap-1">
                      <Zap className="h-3.5 w-3.5 text-brand" />
                      {primaryCred?.credits ?? 0}
                    </span>
                  </td>

                  {/* Data Cadastro */}
                  <td className="py-3 px-4 text-text-secondary text-xs">{fmt(c.createdAt)}</td>

                  {/* Ações CRM */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {lk && (
                          <>
                            {/* Adicionar +100 Créditos */}
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={workingKey === lk}
                              onClick={() => handleAddCredits(lk)}
                              className="text-xs h-7 px-2"
                              title="Recarregar +100 créditos no servidor Railway"
                            >
                              <PlusCircle className="h-3 w-3 mr-1 text-brand" /> +100
                            </Button>

                            {/* Resetar HWID (Unbind PC) */}
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={workingKey === lk}
                              onClick={() => handleUnbind(lk)}
                              className="text-xs h-7 px-2 text-text-secondary hover:text-text-primary border border-white/5"
                              title="Desvincular HWID / Trocar de Computador"
                            >
                              <RotateCcw className="h-3 w-3 mr-1" /> Unbind
                            </Button>

                            {/* Bloquear / Ativar */}
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={workingKey === lk}
                              onClick={() => handleToggle(lk)}
                              className="text-xs h-7 px-2 border border-white/5"
                              title="Bloquear ou reativar licença"
                            >
                              <ShieldOff className="h-3 w-3 text-amber-400" />
                            </Button>
                          </>
                        )}

                        {/* Alterar Senha do Aluno */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPasswordModal(c)}
                          className="text-xs h-7 px-2 text-amber-400 hover:text-amber-300 border border-amber-400/20 hover:bg-amber-400/10"
                          title="Ver ou Redefinir Senha do Aluno (Sincroniza com HostGator)"
                        >
                          <Lock className="h-3 w-3 mr-1" /> Senha
                        </Button>

                        {/* Editar Cliente */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(c)}
                          className="text-xs h-7 px-2 text-sky-400 hover:text-sky-300 border border-sky-400/20 hover:bg-sky-400/10"
                          title="Editar dados do cliente"
                        >
                          <Edit2 className="h-3 w-3 mr-1" /> Editar
                        </Button>

                        {/* Excluir do CRM */}
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteCustomer(c.id, c.name)}
                          className="text-xs h-7 px-2"
                          title="Remover cliente do CRM"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {msg && msg.key === lk && (
                        <span className={`text-[11px] ${msg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {msg.text}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CredentialsPanel({ credentials }: { credentials: Credential[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [working, setWorking] = useState<{ id: string; action: string } | null>(null);
  const [msgs, setMsgs] = useState<Record<string, { text: string; ok: boolean }>>({});
  const [showCredPasswords, setShowCredPasswords] = useState<Record<string, boolean>>({});
  const [copiedCredPass, setCopiedCredPass] = useState<string | null>(null);

  async function doAction(credId: string, action: 'revoke' | 'regenerate') {
    setWorking({ id: credId, action });
    try {
      const res = await fetch(`/api/admin/credentials/${credId}/${action}`, { method: 'POST' });
      const data = await res.json();
      setMsgs((m) => ({
        ...m,
        [credId]: { text: data.message ?? (res.ok ? 'OK' : 'Erro'), ok: res.ok },
      }));
      if (res.ok) startTransition(() => router.refresh());
    } catch {
      setMsgs((m) => ({ ...m, [credId]: { text: 'Erro de rede', ok: false } }));
    } finally {
      setWorking(null);
    }
  }

  async function changeCredPassword(customerId: string, email: string, name: string, currentPass?: string | null) {
    const defaultPass = currentPass || 'membro' + Math.floor(1000 + Math.random() * 9000);
    const newPass = window.prompt(`Digite a nova senha para ${name} (${email}):`, defaultPass);
    if (!newPass || !newPass.trim()) return;

    try {
      const res = await fetch('/api/admin/customers/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, email, newPassword: newPass.trim() }),
      });
      const data = await res.json();
      alert(data.message || (res.ok ? 'Senha alterada com sucesso!' : data.error));
      if (res.ok) startTransition(() => router.refresh());
    } catch {
      alert('Erro de conexão ao alterar senha');
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-text-secondary text-xs uppercase tracking-wider">
            <th className="text-left py-3 px-4 font-medium">Usuário</th>
            <th className="text-left py-3 px-4 font-medium">Senha (Área de Membros)</th>
            <th className="text-left py-3 px-4 font-medium">Chave de Licença</th>
            <th className="text-left py-3 px-4 font-medium">Cliente</th>
            <th className="text-left py-3 px-4 font-medium">URL de Acesso</th>
            <th className="text-left py-3 px-4 font-medium">Railway</th>
            <th className="text-left py-3 px-4 font-medium">Status</th>
            <th className="text-left py-3 px-4 font-medium">Expira</th>
            <th className="text-left py-3 px-4 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {credentials.length === 0 && (
            <tr>
              <td colSpan={9} className="py-12 text-center text-text-secondary">Nenhuma credencial ainda.</td>
            </tr>
          )}
          {credentials.map((c) => {
            const pass = c.plainPassword || 'membro123';
            return (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-4 font-mono text-xs text-text-primary font-semibold">{c.username}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <code className="font-mono text-xs text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      {showCredPasswords[c.id] ? pass : '••••••••'}
                    </code>
                    <button
                      type="button"
                      onClick={() => setShowCredPasswords((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                      title={showCredPasswords[c.id] ? 'Ocultar senha' : 'Ver senha'}
                      className="text-text-secondary hover:text-text-primary p-0.5 transition-colors"
                    >
                      {showCredPasswords[c.id] ? <EyeOff className="h-3.5 w-3.5 text-amber-400" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(pass);
                        setCopiedCredPass(c.id);
                        setTimeout(() => setCopiedCredPass(null), 2000);
                      }}
                      title="Copiar senha"
                      className="text-text-secondary hover:text-text-primary p-0.5 transition-colors"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    {copiedCredPass === c.id && <span className="text-[10px] text-emerald-400 font-semibold">Copiada!</span>}
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-xs text-brand font-bold">{c.licenseKey || '—'}</td>
                <td className="py-3 px-4">
                  <div className="font-medium text-text-primary">{c.customer.name}</div>
                  <div className="text-xs text-text-secondary">{c.customer.email}</div>
                </td>
                <td className="py-3 px-4">
                  <a
                    href={c.accessUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-brand hover:underline text-xs"
                  >
                    Abrir <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
                <td className="py-3 px-4 text-xs text-text-secondary">
                  {c.railwayAppUrl ? (
                    <a href={c.railwayAppUrl} target="_blank" rel="noreferrer" className="text-brand hover:underline inline-flex items-center gap-1">
                      Railway <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : '—'}
                </td>
                <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                <td className="py-3 px-4 text-text-secondary text-xs">{fmt(c.expiresAt)}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => changeCredPassword(c.customer.id, c.customer.email, c.customer.name, c.plainPassword)}
                        className="text-xs h-7 px-2 text-amber-400 hover:text-amber-300 border border-amber-400/20 hover:bg-amber-400/10"
                        title="Alterar Senha do Aluno"
                      >
                        <Lock className="w-3 h-3 mr-1" /> Senha
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!!working}
                        onClick={() => doAction(c.id, 'regenerate')}
                        className="text-xs h-7 px-2"
                        title="Regenerar token de acesso"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={!!working || c.status === 'revoked'}
                        onClick={() => doAction(c.id, 'revoke')}
                        className="text-xs h-7 px-2"
                        title="Revogar acesso"
                      >
                        <ShieldOff className="w-3 h-3" />
                      </Button>
                    </div>
                    {msgs[c.id]?.text && (
                      <span className={cn('text-xs', msgs[c.id].ok ? 'text-success' : 'text-error')}>
                        {msgs[c.id].text}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EventsPanel({ events }: { events: WebhookEvent[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-text-secondary text-xs uppercase tracking-wider">
            <th className="text-left py-3 px-4 font-medium">Event ID</th>
            <th className="text-left py-3 px-4 font-medium">Provedor</th>
            <th className="text-left py-3 px-4 font-medium">Tipo</th>
            <th className="text-left py-3 px-4 font-medium">Pedido</th>
            <th className="text-left py-3 px-4 font-medium">Processado</th>
            <th className="text-left py-3 px-4 font-medium">Recebido</th>
          </tr>
        </thead>
        <tbody>
          {events.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-text-secondary">Nenhum evento ainda.</td>
            </tr>
          )}
          {events.map((e) => (
            <>
              <tr
                key={e.id}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                onClick={() => setExpanded(expanded === e.id ? null : e.id)}
              >
                <td className="py-3 px-4 font-mono text-xs text-text-secondary">{e.eventId.slice(-12)}</td>
                <td className="py-3 px-4 text-text-secondary">{e.provider}</td>
                <td className="py-3 px-4">
                  <span className="font-mono text-xs bg-surface rounded px-1.5 py-0.5 text-brand">{e.type}</span>
                </td>
                <td className="py-3 px-4 font-mono text-xs text-text-secondary">{e.orderId?.slice(-8) ?? '—'}</td>
                <td className="py-3 px-4">
                  {e.processed
                    ? <CheckCircle2 className="w-4 h-4 text-success" />
                    : <Clock className="w-4 h-4 text-brand" />
                  }
                </td>
                <td className="py-3 px-4 text-text-secondary text-xs">{fmt(e.createdAt)}</td>
              </tr>
              {expanded === e.id && (
                <tr key={`${e.id}-detail`} className="bg-surface/50">
                  <td colSpan={6} className="px-4 py-3">
                    <pre className="text-xs text-text-secondary overflow-x-auto whitespace-pre-wrap break-all bg-background rounded-lg p-3 border border-white/10 max-h-48">
                      {JSON.stringify(e, null, 2)}
                    </pre>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Affiliates Panel ─────────────────────────────────────────────────────────

function AffiliatesPanel({ affiliates }: { affiliates: Affiliate[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [slug, setSlug] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [commissionPercent, setCommissionPercent] = useState('20');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [notes, setNotes] = useState('');

  // Payout modal
  const [payoutTarget, setPayoutTarget] = useState<Affiliate | null>(null);
  const [paying, setPaying] = useState(false);
  const [payoutProof, setPayoutProof] = useState('');
  const [payoutError, setPayoutError] = useState<string | null>(null);

  // Deleting state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(aff: Affiliate) {
    if (!confirm(`Tem certeza que deseja remover o afiliado "${aff.name}" (${aff.couponCode})? O link e o cupom dele deixarão de funcionar.`)) {
      return;
    }
    setDeletingId(aff.id);
    try {
      const res = await fetch(`/api/admin/affiliates/${aff.id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-token': 'FV291125',
        },
      });
      if (res.ok) {
        startTransition(() => router.refresh());
      } else {
        const json = await res.json();
        alert(json.error || 'Erro ao remover afiliado');
      }
    } catch {
      alert('Erro de conexão ao remover afiliado');
    } finally {
      setDeletingId(null);
    }
  }

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://fabricadecortes.com';

  const enriched = affiliates.map((aff) => {
    const paidOrders = (aff.orders || []).filter((o) => o.status === 'paid');
    const totalSales = paidOrders.length;
    const grossRevenue = paidOrders.reduce((acc, o) => acc + (o.amount || 0), 0);
    const pendingCommission = (aff.orders || [])
      .filter((o) => o.commissionStatus === 'credited')
      .reduce((acc, o) => acc + (o.commissionAmount || 0), 0);
    const paidCommission = (aff.orders || [])
      .filter((o) => o.commissionStatus === 'paid')
      .reduce((acc, o) => acc + (o.commissionAmount || 0), 0);

    return {
      ...aff,
      totalSales,
      grossRevenue,
      pendingCommission,
      paidCommission,
      referralUrl: `${appUrl}/?ref=${aff.slug}`,
      portalUrl: `${appUrl}/parceiro/${aff.token}`,
    };
  });

  const totalAffiliates = affiliates.length;
  const totalSalesAll = enriched.reduce((acc, a) => acc + a.totalSales, 0);
  const totalRevenueAll = enriched.reduce((acc, a) => acc + a.grossRevenue, 0);
  const totalPendingPayoutAll = enriched.reduce((acc, a) => acc + a.pendingCommission, 0);

  const filtered = enriched.filter((a) => {
    const term = q.toLowerCase();
    return (
      a.name.toLowerCase().includes(term) ||
      a.email.toLowerCase().includes(term) ||
      a.slug.toLowerCase().includes(term) ||
      a.couponCode.toLowerCase().includes(term) ||
      a.pixKey.toLowerCase().includes(term)
    );
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'FV291125',
        },
        body: JSON.stringify({
          name,
          email,
          slug,
          couponCode: couponCode || slug.toUpperCase(),
          discountPercent: Number(discountPercent) || 0,
          commissionPercent: Number(commissionPercent) || 20,
          pixKey,
          pixKeyType,
          notes,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setCreateError(json.error || 'Erro ao cadastrar parceiro');
      } else {
        setShowCreate(false);
        setName('');
        setEmail('');
        setSlug('');
        setCouponCode('');
        setDiscountPercent('0');
        setCommissionPercent('20');
        setPixKey('');
        setNotes('');
        startTransition(() => router.refresh());
      }
    } catch {
      setCreateError('Erro de conexão');
    } finally {
      setCreating(false);
    }
  }

  async function handlePayout() {
    if (!payoutTarget) return;
    setPaying(true);
    setPayoutError(null);

    try {
      const res = await fetch(`/api/admin/affiliates/${payoutTarget.id}/payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': 'FV291125',
        },
        body: JSON.stringify({ proof: payoutProof }),
      });

      const json = await res.json();
      if (!res.ok) {
        setPayoutError(json.error || 'Erro ao processar repasse');
      } else {
        setPayoutTarget(null);
        setPayoutProof('');
        startTransition(() => router.refresh());
      }
    } catch {
      setPayoutError('Erro de conexão ao processar repasse');
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-surface-elevated/40 p-4">
          <span className="text-xs text-text-secondary">Criadores / YouTubers</span>
          <p className="text-2xl font-bold text-text-primary mt-1">{totalAffiliates}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-surface-elevated/40 p-4">
          <span className="text-xs text-text-secondary">Vendas via Parceiros</span>
          <p className="text-2xl font-bold text-text-primary mt-1">{totalSalesAll}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-surface-elevated/40 p-4">
          <span className="text-xs text-text-secondary">Faturamento Total Gerado</span>
          <p className="text-2xl font-bold text-text-primary mt-1">
            R$ {(totalRevenueAll / 100).toFixed(2).replace('.', ',')}
          </p>
        </div>
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
          <span className="text-xs font-semibold text-orange-400">Total a Repassar (Pix Pendente)</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            R$ {(totalPendingPayoutAll / 100).toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>

      {/* ── Action bar & Search ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-text-secondary" />
          <input
            type="text"
            placeholder="Buscar por nome, cupom ou Pix..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-white/10 bg-surface-elevated text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <Button
          onClick={() => setShowCreate(true)}
          className="w-full sm:w-auto bg-brand hover:brightness-110 text-white text-xs font-bold gap-2 h-10 px-4"
        >
          <PlusCircle className="w-4 h-4" /> Cadastrar Novo Parceiro / YouTuber
        </Button>
      </div>

      {/* ── Modal de Cadastro ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-brand" /> Cadastrar Parceiro Oficial (YouTuber)
              </h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-neutral-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Nome do Canal / YouTuber</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Canal do Pedro"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                        setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                      }
                    }}
                    className="mt-1 w-full h-9 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300">E-mail do Parceiro</label>
                  <input
                    required
                    type="email"
                    placeholder="Ex: pedro@youtube.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full h-9 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300">
                    Slug do Link (gera ?ref=slug)
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: pedro"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="mt-1 w-full h-9 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Código do Cupom</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: PEDRO"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                    className="mt-1 w-full h-9 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-300">
                    Comissão do Parceiro (%)
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    max="100"
                    value={commissionPercent}
                    onChange={(e) => setCommissionPercent(e.target.value)}
                    className="mt-1 w-full h-9 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300">
                    Desconto para o Cliente (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="mt-1 w-full h-9 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-neutral-300">Chave Pix para Repasses</label>
                  <input
                    required
                    type="text"
                    placeholder="CPF, E-mail, Celular ou Chave Aleatória"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    className="mt-1 w-full h-9 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-300">Tipo de Chave</label>
                  <select
                    value={pixKeyType}
                    onChange={(e) => setPixKeyType(e.target.value)}
                    className="mt-1 w-full h-9 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white"
                  >
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="email">E-mail</option>
                    <option value="phone">Telefone</option>
                    <option value="random">Aleatória</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300">Notas Internas (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Canal de 120k inscritos sobre cortes, contato via WhatsApp"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full h-9 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white"
                />
              </div>

              {createError && (
                <p className="text-xs text-rose-400 font-semibold">{createError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreate(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={creating}
                  className="bg-brand hover:brightness-110 text-white font-bold"
                >
                  {creating ? 'Salvando...' : 'Criar Parceiro'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal de Repasse Pix (Fechamento) ── */}
      {payoutTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121215] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" /> Confirmar Repasse Pix
              </h3>
              <button
                onClick={() => setPayoutTarget(null)}
                className="text-neutral-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-neutral-300">
                Você está fazendo o fechamento e repasse de comissões para:{' '}
                <strong className="text-white">{payoutTarget.name}</strong>.
              </p>

              {/* Box de Valor e Chave Pix */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                  Valor a Transferir via Pix:
                </span>
                <span className="text-3xl font-black text-emerald-400 block font-mono">
                  R${' '}
                  {(
                    ((payoutTarget as any).pendingCommission || 0) / 100
                  )
                    .toFixed(2)
                    .replace('.', ',')}
                </span>

                <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-neutral-400 block">Chave Pix ({payoutTarget.pixKeyType.toUpperCase()}):</span>
                    <span className="font-mono text-sm text-white font-bold select-all">
                      {payoutTarget.pixKey}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copy(payoutTarget.pixKey, `modal-pix-${payoutTarget.id}`)}
                    className="h-8 text-xs bg-white/5 border-white/10 text-white"
                  >
                    {copiedKey === `modal-pix-${payoutTarget.id}` ? 'Copiada!' : 'Copiar Chave'}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-neutral-400 font-semibold block mb-1">
                  Identificador / Comprovante do Pix (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: E2E1234567890 ou comprovante"
                  value={payoutProof}
                  onChange={(e) => setPayoutProof(e.target.value)}
                  className="w-full h-9 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white font-mono"
                />
              </div>

              {payoutError && (
                <p className="text-xs text-rose-400 font-semibold">{payoutError}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPayoutTarget(null)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={paying}
                onClick={handlePayout}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                {paying ? 'Registrando...' : 'Confirmar Pagamento Realizado'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tabela de Afiliados ── */}
      <div className="rounded-xl border border-white/10 bg-surface overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-text-secondary text-xs">
            Nenhum parceiro encontrado. Clique em &quot;+ Cadastrar Novo Parceiro&quot; para adicionar o primeiro YouTuber!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated text-text-secondary border-b border-white/10 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Canal / YouTuber</th>
                  <th className="py-3 px-4">Cupom & Link</th>
                  <th className="py-3 px-4">Portal do Criador</th>
                  <th className="py-3 px-4">Chave Pix</th>
                  <th className="py-3 px-4">Vendas</th>
                  <th className="py-3 px-4">Faturamento</th>
                  <th className="py-3 px-4">Comissão a Pagar</th>
                  <th className="py-3 px-4 text-right">Fechamento / Repasse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((aff) => {
                  const pendingBrl = aff.pendingCommission / 100;
                  const revBrl = aff.grossRevenue / 100;

                  return (
                    <tr key={aff.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-text-primary">{aff.name}</div>
                        <div className="text-[11px] text-text-secondary">{aff.email}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            {aff.couponCode}
                          </span>
                          <button
                            onClick={() => copy(aff.referralUrl, `link-${aff.id}`)}
                            title="Copiar Link de Divulgação"
                            className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white"
                          >
                            {copiedKey === `link-${aff.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">
                          Comissão: {aff.commissionPercent}% {aff.discountPercent > 0 && `(Desc: ${aff.discountPercent}%)`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={aff.portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
                          >
                            Abrir Painel <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            onClick={() => copy(aff.portalUrl, `portal-${aff.id}`)}
                            title="Copiar Link Mágico do Painel para enviar no WhatsApp"
                            className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white"
                          >
                            {copiedKey === `portal-${aff.id}` ? (
                              <span className="text-[10px] text-emerald-400 font-bold">Copiado!</span>
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-neutral-500 block">Link Mágico Privado</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white font-medium truncate max-w-[140px] block" title={aff.pixKey}>
                            {aff.pixKey}
                          </span>
                          <button
                            onClick={() => copy(aff.pixKey, `pix-${aff.id}`)}
                            title="Copiar Chave Pix"
                            className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white"
                          >
                            {copiedKey === `pix-${aff.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-neutral-400 uppercase">{aff.pixKeyType}</span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-white">
                        {aff.totalSales}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-neutral-300">
                        R$ {revBrl.toFixed(2).replace('.', ',')}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold">
                        {pendingBrl > 0 ? (
                          <span className="text-emerald-400 text-sm">
                            R$ {pendingBrl.toFixed(2).replace('.', ',')}
                          </span>
                        ) : (
                          <span className="text-neutral-500">R$ 0,00</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {pendingBrl > 0 ? (
                            <Button
                              size="sm"
                              onClick={() => setPayoutTarget(aff)}
                              className="h-8 px-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow"
                            >
                              <DollarSign className="w-3.5 h-3.5 mr-1" /> Pagar Pix
                            </Button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400 bg-white/5 px-2.5 py-1 rounded-full">
                              <Check className="w-3 h-3 text-emerald-400" /> Em dia
                            </span>
                          )}

                          <button
                            type="button"
                            disabled={deletingId === aff.id}
                            onClick={() => handleDelete(aff)}
                            title="Remover Afiliado"
                            className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          >
                            {deletingId === aff.id ? (
                              <RefreshCcw className="w-4 h-4 animate-spin text-rose-400" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-5 flex items-start gap-4 transition-colors',
        accent ? 'border-brand/30 bg-brand/10' : 'border-white/10 bg-surface'
      )}
    >
      <div className={cn('rounded-xl p-2.5', accent ? 'bg-brand/20' : 'bg-surface-elevated')}>
        <Icon className={cn('w-5 h-5', accent ? 'text-brand' : 'text-text-secondary')} />
      </div>
      <div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-xs text-text-secondary mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminShell({
  orders,
  subscriptions,
  customers,
  credentials,
  events,
  railwayLicenses = [],
  affiliates = [],
}: AdminShellProps) {
  const [activeTab, setActiveTab] = useState<TabId>('affiliates');
  const [syncing, setSyncing] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const paidOrders = orders.filter((o) => o.status === 'paid').length;
  const activeSubs = subscriptions.filter((s) => s.status === 'active').length;
  const revenue = orders
    .filter((o) => o.status === 'paid')
    .reduce((acc, o) => acc + o.amount, 0);

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch('/api/admin/sync', { method: 'POST' });
      startTransition(() => router.refresh());
    } finally {
      setSyncing(false);
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  const panels: Record<TabId, React.ReactNode> = {
    affiliates: <AffiliatesPanel affiliates={affiliates || []} />,
    customers: (
      <CustomersPanel
        customers={customers}
        onOpenGrantModal={() => setShowGrantModal(true)}
      />
    ),
    licenses: (
      <RailwayLicensesPanel
        licenses={railwayLicenses || []}
        onOpenGrantModal={() => setShowGrantModal(true)}
      />
    ),
    orders: <OrdersPanel orders={orders} />,
    subscriptions: <SubscriptionsPanel subscriptions={subscriptions} />,
    credentials: <CredentialsPanel credentials={credentials} />,
    events: <EventsPanel events={events} />,
  };

  const counts: Record<TabId, number> = {
    affiliates: (affiliates || []).length,
    customers: customers.length,
    licenses: (railwayLicenses || []).length,
    orders: orders.length,
    subscriptions: subscriptions.length,
    credentials: credentials.length,
    events: events.length,
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Header */}
      <header className="border-b border-white/10 bg-surface/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img
                src="/logo.png"
                alt="Fábrica dos Cortes"
                className="w-9 h-9 rounded-xl object-contain drop-shadow-[0_0_15px_rgba(255,92,0,0.5)] group-hover:scale-105 transition-transform"
              />
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-base tracking-tight text-white">
                  Fábrica dos
                </span>
                <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-brand via-orange-500 to-amber-400 bg-clip-text text-transparent">
                  Cortes
                </span>
              </div>
            </Link>
            <ChevronRight className="w-4 h-4 text-text-secondary" />
            <span className="text-text-secondary text-sm font-semibold">Painel Admin & CRM</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowGrantModal(true)}
              className="text-xs h-8 bg-gradient-to-r from-orange-600 via-brand to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold shadow-md shadow-brand/20 border border-brand/40"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" />
              + Liberar Acesso & Enviar Login
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={syncing}
              onClick={handleSync}
              className="text-xs h-8 border border-brand/30"
            >
              <RefreshCcw className={cn('w-3.5 h-3.5 mr-1.5 text-brand', syncing && 'animate-spin')} />
              {syncing ? 'Sincronizando...' : 'Sincronizar AbacatePay'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-text-secondary hover:text-error text-xs h-8"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-8 space-y-8">
        {/* Stats row */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Receita (pagos)" value={formatPrice(revenue)} icon={ShoppingCart} accent />
          <StatCard label="Licenças Railway" value={(railwayLicenses || []).length} icon={Key} />
          <StatCard label="Clientes CRM" value={customers.length} icon={Users} />
          <StatCard label="Pedidos pagos" value={paidOrders} icon={CheckCircle2} />
          <StatCard label="Assinaturas ativas" value={activeSubs} icon={RefreshCcw} />
        </section>

        {/* Tab panel */}
        <section className="rounded-2xl border border-white/10 bg-surface overflow-hidden">
          {/* Tab bar */}
          <div className="flex gap-0 border-b border-white/10 overflow-x-auto">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px',
                  activeTab === id
                    ? 'border-brand text-brand bg-brand/5'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-white/[0.03]'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
                <span
                  className={cn(
                    'ml-1 rounded-full px-1.5 py-0.5 text-xs font-mono',
                    activeTab === id
                      ? 'bg-brand/20 text-brand'
                      : 'bg-surface-elevated text-text-secondary'
                  )}
                >
                  {counts[id]}
                </span>
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="min-h-[400px]">{panels[activeTab]}</div>
        </section>
      </main>

      <GrantAccessModal
        open={showGrantModal}
        onClose={() => setShowGrantModal(false)}
        onSuccess={() => {
          startTransition(() => router.refresh());
        }}
      />
    </div>
  );
}
