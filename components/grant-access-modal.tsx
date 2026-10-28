'use client';

import { useState } from 'react';
import {
  X,
  UserPlus,
  Mail,
  Key,
  ShieldCheck,
  Sparkles,
  Video,
  Heart,
  FlaskConical,
  User,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GrantAccessModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type RecipientType = 'youtuber' | 'aluno' | 'amigo' | 'teste';

const TYPE_CONFIG: Record<
  RecipientType,
  { label: string; icon: any; defaultCredits: number; defaultDays: number; defaultPlan: string; desc: string }
> = {
  youtuber: {
    label: 'YouTuber / Parceiro',
    icon: Video,
    defaultCredits: 300,
    defaultDays: 90,
    defaultPlan: 'pack_escala',
    desc: 'Parceria de divulgação ou influenciador de vídeo',
  },
  aluno: {
    label: 'Aluno VIP / Manual',
    icon: Sparkles,
    defaultCredits: 100,
    defaultDays: 30,
    defaultPlan: 'pack_criador',
    desc: 'Pagamento via PIX direto, TED ou aprovação manual',
  },
  amigo: {
    label: 'Amigo / Cortesia',
    icon: Heart,
    defaultCredits: 300,
    defaultDays: 365,
    defaultPlan: 'pack_escala',
    desc: 'Presente para amigos, equipe ou parceiros próximos',
  },
  teste: {
    label: 'Teste / Degustação',
    icon: FlaskConical,
    defaultCredits: 25,
    defaultDays: 7,
    defaultPlan: 'pack_teste',
    desc: 'Acesso rápido para demonstração de ferramenta',
  },
};

function generateRandomPassword(): string {
  const words = ['viral', 'corte', 'pro', 'vip', 'turbo', 'flow', 'forja'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}${num}`;
}

export function GrantAccessModal({ open, onClose, onSuccess }: GrantAccessModalProps) {
  const [type, setType] = useState<RecipientType>('youtuber');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [planSlug, setPlanSlug] = useState('pack_escala');
  const [credits, setCredits] = useState(300);
  const [days, setDays] = useState(90);
  const [password, setPassword] = useState(generateRandomPassword());
  const [showPassword, setShowPassword] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!open) return null;

  const handleTypeChange = (newType: RecipientType) => {
    setType(newType);
    const cfg = TYPE_CONFIG[newType];
    setCredits(cfg.defaultCredits);
    setDays(cfg.defaultDays);
    setPlanSlug(cfg.defaultPlan);
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2500);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/grant-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          reason: type,
          reasonLabel: TYPE_CONFIG[type].label,
          planSlug,
          credits: Number(credits) || 100,
          days: Number(days) || 30,
          customPassword: password.trim() || undefined,
          sendEmail,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao conceder acesso');
      }

      setResult(data);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  };

  const generateWhatsAppMessage = () => {
    if (!result) return '';
    return `Fala, ${result.name.split(' ')[0]}! Tudo certo? 🚀

Seu acesso à Fábrica dos Cortes foi liberado com sucesso!

🔑 Sua Chave de Licença: ${result.licenseKey} (${result.credits} Créditos)
🌐 Área de Membros: ${result.membersUrl || 'https://membros.fabricadecortes.com'}
👤 Usuário: ${result.username}
🔒 Senha: ${result.password}

⚡ Link de Acesso Rápido: ${result.accessUrl}

Você também recebeu todos os detalhes e links das aulas no seu e-mail (${result.email}).
Bora pra cima! TMJ 🔥`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-brand to-amber-500 flex items-center justify-center shadow-lg shadow-brand/20">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Liberar Acesso & Enviar Login
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20">
                  Manual VIP
                </span>
              </h2>
              <p className="text-xs text-text-secondary">
                Gera credenciais, chave no Railway, cadastra na Área de Membros e dispara o e-mail.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-sm flex items-center gap-2">
              <span className="font-bold">Erro:</span> {error}
            </div>
          )}

          {result ? (
            /* Tela de Sucesso */
            <div className="space-y-5 animate-in zoom-in-95 duration-200">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-emerald-400">Acesso Liberado com Sucesso!</h3>
                <p className="text-xs text-emerald-300/80">
                  {result.emailSent
                    ? `O e-mail oficial com dados de acesso foi enviado com sucesso para ${result.email}!`
                    : `Dados cadastrados com sucesso para ${result.email}.`}
                </p>
                {result.emailError && (
                  <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg mt-2 font-mono">
                    Aviso: {result.emailError}
                  </p>
                )}
              </div>

              {/* Cards de Credenciais Geradas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Chave de Licença */}
                <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-brand" />
                      Chave de Licença (Railway)
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(result.licenseKey, 'licenseKey')}
                      className="text-brand hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                      {copiedField === 'licenseKey' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedField === 'licenseKey' ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <div className="font-mono text-sm font-bold text-white tracking-wider bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 select-all">
                    {result.licenseKey}
                  </div>
                  <div className="text-[11px] text-text-secondary flex items-center justify-between">
                    <span>Créditos: <strong>{result.credits}</strong></span>
                    <span>Validade: <strong>{result.days} dias</strong></span>
                  </div>
                </div>

                {/* Login Área de Membros */}
                <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      Área de Membros (HostGator)
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(result.password, 'password')}
                      className="text-amber-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                      {copiedField === 'password' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedField === 'password' ? 'Copiada!' : 'Copiar Senha'}
                    </button>
                  </div>
                  <div className="space-y-1 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 text-xs">
                    <div className="text-text-secondary">Usuário: <span className="font-mono text-white font-semibold">{result.username}</span></div>
                    <div className="text-text-secondary">Senha: <span className="font-mono text-amber-300 font-bold">{result.password}</span></div>
                  </div>
                  <div className="text-[11px] text-text-secondary">
                    URL: <a href={result.membersUrl} target="_blank" className="text-brand hover:underline">{result.membersUrl}</a>
                  </div>
                </div>
              </div>

              {/* Botão Copiar Mensagem WhatsApp */}
              <div className="p-4 rounded-xl border border-brand/20 bg-brand/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    Mensagem Pronta para WhatsApp
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => copyToClipboard(generateWhatsAppMessage(), 'whatsapp')}
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  >
                    {copiedField === 'whatsapp' ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                    {copiedField === 'whatsapp' ? 'Mensagem Copiada!' : 'Copiar Texto Pronto'}
                  </Button>
                </div>
                <pre className="text-[11px] font-mono text-text-secondary bg-black/40 p-3 rounded-lg border border-white/5 whitespace-pre-wrap leading-relaxed">
                  {generateWhatsAppMessage()}
                </pre>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setResult(null);
                    setName('');
                    setEmail('');
                    setPhone('');
                    setPassword(generateRandomPassword());
                  }}
                >
                  Liberar Outro Acesso
                </Button>
                <Button onClick={onClose} className="bg-brand text-white font-bold">
                  Concluir & Fechar
                </Button>
              </div>
            </div>
          ) : (
            /* Formulário de Envio */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Seletor de Tipo */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Tipo de Destinatário
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(Object.keys(TYPE_CONFIG) as RecipientType[]).map((t) => {
                    const cfg = TYPE_CONFIG[t];
                    const Icon = cfg.icon;
                    const isSelected = type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleTypeChange(t)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                          isSelected
                            ? 'border-brand bg-brand/10 text-white shadow-lg shadow-brand/10 ring-1 ring-brand/40'
                            : 'border-white/10 bg-white/[0.02] text-text-secondary hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-brand' : 'text-text-secondary'}`} />
                          {isSelected && <span className="w-2 h-2 rounded-full bg-brand" />}
                        </div>
                        <div className="text-xs font-bold leading-tight">{cfg.label}</div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-text-secondary italic">
                  {TYPE_CONFIG[type].desc}
                </p>
              </div>

              {/* Dados do Aluno / YouTuber */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="grant-name" className="text-xs font-semibold text-text-secondary">
                    Nome Completo <span className="text-error">*</span>
                  </Label>
                  <Input
                    id="grant-name"
                    required
                    placeholder="Ex: Pedro Youtuber"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-surface-elevated border-white/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="grant-email" className="text-xs font-semibold text-text-secondary">
                    E-mail do Destinatário <span className="text-error">*</span>
                  </Label>
                  <Input
                    id="grant-email"
                    type="email"
                    required
                    placeholder="onde o login e a chave vão chegar"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-surface-elevated border-white/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="grant-phone" className="text-xs font-semibold text-text-secondary">
                    WhatsApp (Opcional)
                  </Label>
                  <Input
                    id="grant-phone"
                    placeholder="11999999999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-surface-elevated border-white/10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="grant-credits" className="text-xs font-semibold text-text-secondary">
                    Créditos da Licença
                  </Label>
                  <Input
                    id="grant-credits"
                    type="number"
                    min="1"
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    className="bg-surface-elevated border-white/10 font-bold text-brand"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="grant-days" className="text-xs font-semibold text-text-secondary">
                    Validade em Dias
                  </Label>
                  <Input
                    id="grant-days"
                    type="number"
                    min="1"
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="bg-surface-elevated border-white/10"
                  />
                </div>
              </div>

              {/* Senha da Área de Membros */}
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="grant-password" className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    Senha da Área de Membros
                  </Label>
                  <button
                    type="button"
                    onClick={() => setPassword(generateRandomPassword())}
                    className="text-[11px] text-brand hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Gerar Nova Senha
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="grant-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Defina uma senha ou use a gerada"
                    className="bg-surface-elevated border-white/10 pr-10 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-text-secondary">
                  Essa senha será enviada no e-mail e permitirá o acesso direto na HostGator (
                  <span className="font-mono text-white">membros.fabricadecortes.com</span>).
                </p>
              </div>

              {/* Checkbox de Envio de E-mail */}
              <div className="p-3.5 rounded-xl border border-brand/20 bg-brand/5 flex items-start gap-3 cursor-pointer select-none" onClick={() => setSendEmail(!sendEmail)}>
                <input
                  type="checkbox"
                  id="grant-send-email"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-brand focus:ring-brand accent-brand cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="text-xs">
                  <label htmlFor="grant-send-email" className="font-bold text-white cursor-pointer block">
                    Disparar E-mail Oficial de Acesso Imediatamente
                  </label>
                  <span className="text-text-secondary text-[11px]">
                    O destinatário receberá o e-mail completo com sua Chave de Licença, créditos, links da Área de Membros, Google Drive, WhatsApp VIP e Google Colab.
                  </span>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !name.trim() || !email.trim()}
                  className="bg-gradient-to-r from-orange-600 via-brand to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold px-6 shadow-lg shadow-brand/20"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processando & Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Liberar Acesso & Enviar Login
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
