'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sparkles,
  PlayCircle,
  Tag,
  Check,
  X,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const schema = z.object({
  slug: z.string({ required_error: 'Selecione um pacote' }).min(1, 'Selecione um pacote'),
  name: z.string({ required_error: 'Informe seu nome completo' }).min(2, 'Nome muito curto').max(120),
  email: z.string({ required_error: 'Informe seu e-mail' }).email('E-mail inválido'),
  phone: z.string().max(30).optional(),
  includeCourse: z.boolean().default(false),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Você precisa aceitar os termos' }),
  }),
});

type FormData = z.infer<typeof schema>;

const PLAN_PRICES: Record<string, { name: string; price: number; credits: number }> = {
  pack_teste: { name: 'Pack Teste (15 Vídeos)', price: 19.90, credits: 15 },
  pack_iniciante: { name: 'Pack Iniciante (30 Vídeos)', price: 29.90, credits: 30 },
  pack_criador: { name: 'Pack Criador (50 Vídeos)', price: 39.90, credits: 50 },
  pack_escala: { name: 'Pack Escala (120 Vídeos)', price: 79.90, credits: 120 },
  pack_pro: { name: 'Pack Agência / Pro (250 Vídeos)', price: 139.90, credits: 250 },
};

const COURSE_ORDER_BUMP_PRICE = 47.00;

interface AppliedCoupon {
  code: string;
  affiliateName: string;
  discountPercent: number;
  commissionPercent: number;
}

interface CheckoutFormProps {
  defaultSlug?: string;
}

export function CheckoutForm({ defaultSlug = 'pack_criador' }: CheckoutFormProps) {
  const searchParams = useSearchParams();
  const planFromUrl = searchParams.get('plan') || searchParams.get('slug');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      slug: planFromUrl || defaultSlug,
      name: '',
      email: '',
      phone: '',
      includeCourse: false,
      consent: true,
    },
  });

  const selectedSlug = watch('slug') || 'pack_criador';
  const includeCourse = watch('includeCourse');

  const currentPlan = PLAN_PRICES[selectedSlug] || PLAN_PRICES.pack_criador;
  const basePrice = currentPlan.price;
  const rawSubtotal = includeCourse ? basePrice + COURSE_ORDER_BUMP_PRICE : basePrice;

  // Estados de Cupom e Afiliado
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // Cálculo de desconto e preço final
  const discountAmount =
    appliedCoupon && appliedCoupon.discountPercent > 0
      ? Number(((rawSubtotal * appliedCoupon.discountPercent) / 100).toFixed(2))
      : 0;

  const finalPrice = Math.max(1.0, rawSubtotal - discountAmount);

  // Efeito: Selecionar plano da URL
  useEffect(() => {
    if (planFromUrl) {
      setValue('slug', planFromUrl);
    }
  }, [planFromUrl, setValue]);

  // Função para validar cupom via API
  const applyCouponCode = async (code: string) => {
    if (!code || !code.trim()) return;
    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(code.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setCouponError(data.error || 'Código ou cupom inválido');
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon({
          code: data.couponCode,
          affiliateName: data.affiliateName,
          discountPercent: data.discountPercent || 0,
          commissionPercent: data.commissionPercent || 20,
        });
        setCouponInput(data.couponCode);
        setCouponError(null);
      }
    } catch {
      setCouponError('Erro ao validar código');
    } finally {
      setCouponLoading(false);
    }
  };

  // Efeito: Detectar indicação via URL (?ref=... / ?cupom=...) ou LocalStorage
  useEffect(() => {
    const urlRef =
      searchParams.get('ref') ||
      searchParams.get('aff') ||
      searchParams.get('cupom') ||
      searchParams.get('c') ||
      searchParams.get('apoiador');

    const storedRef = typeof window !== 'undefined' ? localStorage.getItem('forja_affiliate_ref') : null;
    const detected = urlRef || storedRef;

    if (detected && !appliedCoupon) {
      applyCouponCode(detected);
    }
  }, [searchParams]);

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('forja_affiliate_ref');
    }
  };

  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'info' } | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (data: FormData) => {
    setToast(null);
    try {
      const payload = {
        ...data,
        couponCode: appliedCoupon?.code,
        affiliateRef: appliedCoupon?.code,
      };

      const res = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.checkoutURL) {
        setToast({ message: json.error || 'Erro ao criar checkout', variant: 'error' });
        return;
      }
      setDone(true);
      setToast({ message: 'Redirecionando para o pagamento Pix...', variant: 'info' });
      window.location.href = json.checkoutURL;
    } catch {
      setToast({ message: 'Erro de conexão. Tente novamente.', variant: 'error' });
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in duration-300">
        <CheckCircle2 className="h-12 w-12 text-emerald-400" />
        <p className="mt-4 font-semibold text-white">Pedido gerado com sucesso!</p>
        <p className="text-sm text-neutral-400">Você será redirecionado para o pagamento Pix...</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])} className="space-y-4">
        <div>
          <Label htmlFor="slug">Pacote de Créditos</Label>
          <select
            id="slug"
            className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-[#121215] px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand font-medium"
            {...register('slug')}
          >
            <option value="pack_teste">Pack Teste (15 Vídeos) — R$ 19,90</option>
            <option value="pack_iniciante">Pack Iniciante (30 Vídeos) — R$ 29,90</option>
            <option value="pack_criador">Pack Criador (50 Vídeos) — R$ 39,90 [Mais Popular 🔥]</option>
            <option value="pack_escala">Pack Escala (120 Vídeos) — R$ 79,90 [Melhor Custo]</option>
            <option value="pack_pro">Pack Agência / Pro (250 Vídeos) — R$ 139,90</option>
          </select>
        </div>

        <div>
          <Label htmlFor="name">Seu Nome Completo</Label>
          <Input id="name" placeholder="Ex: Lucas Silva" {...register('name')} />
          {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="email">E-mail (onde receberá a chave e o acesso ao curso)</Label>
          <Input id="email" type="email" placeholder="Ex: lucas@gmail.com" {...register('email')} />
          {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>}
        </div>

        <div>
          <Label htmlFor="phone">WhatsApp / Telefone (para suporte do CRM)</Label>
          <Input id="phone" placeholder="Ex: 11999999999" {...register('phone')} />
        </div>

        {/* ── ORDER BUMP CINEMATOGRÁFICO: CURSO + ÁREA DE MEMBROS VIP ── */}
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl border-2 transition-all duration-300 p-4 sm:p-5 my-5',
            includeCourse
              ? 'border-brand bg-gradient-to-br from-brand/15 via-[#181210] to-[#0E0C0B] shadow-[0_0_30px_rgba(255,92,0,0.25)]'
              : 'border-dashed border-orange-500/40 bg-[#121215] hover:border-orange-500/70'
          )}
        >
          {/* Header do Order Bump */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-brand text-white shadow-glow">
              🔥 OFERTA ÚNICA DESTA TELA
            </span>
            <span className="text-xs font-bold text-orange-400">
              De <span className="line-through text-neutral-400">R$ 197,00</span> por{' '}
              <strong className="text-white text-sm">R$ 47,00</strong>
            </span>
          </div>

          <label htmlFor="includeCourse" className="flex items-start gap-3.5 cursor-pointer select-none">
            <input
              type="checkbox"
              id="includeCourse"
              className="mt-1 h-5 w-5 rounded-md border-2 border-brand/60 bg-black/50 accent-brand cursor-pointer shrink-0 transition-transform active:scale-90"
              {...register('includeCourse')}
            />
            <div className="space-y-1.5">
              <div className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2 flex-wrap">
                <span>SIM! Levar o Curso Completo + Área de Membros VIP</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  +R$ 47,00 (76% OFF)
                </span>
              </div>

              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Aprenda a criar cortes virais de alta retenção no estilo <strong>Netflix</strong>: técnica dos 3 segundos (hooks), legendas magnéticas com emojis, sound design profissional, workshops e análises práticas de vídeos com +1 milhão de views.
              </p>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-neutral-400 font-medium">
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <span className="text-brand font-bold">✓</span> Plataforma VIP estilo Netflix vitalícia
                </div>
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <span className="text-brand font-bold">✓</span> Pack com 500+ Efeitos Sonoros (SFX)
                </div>
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <span className="text-brand font-bold">✓</span> Aulas práticas de Premiere & Whisper IA
                </div>
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <span className="text-brand font-bold">✓</span> Acesso ao Grupo VIP no WhatsApp
                </div>
              </div>
            </div>
          </label>
        </div>

        {/* ── SEÇÃO DE CUPOM / CÓDIGO DE APOIADOR DO YOUTUBER ── */}
        <div className="rounded-xl border border-white/[0.08] bg-[#121215]/80 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand" /> Cupom de Desconto ou Código de Apoiador
            </span>
          </div>

          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-emerald-400 tracking-wide uppercase">
                    {appliedCoupon.code}
                  </span>
                  <span className="text-neutral-300 ml-1.5 font-medium">
                    (Apoiando: <strong className="text-white">{appliedCoupon.affiliateName}</strong>)
                  </span>
                  {appliedCoupon.discountPercent > 0 && (
                    <span className="block text-[11px] text-emerald-400 font-semibold">
                      Desconto de {appliedCoupon.discountPercent}% aplicado!
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={removeCoupon}
                className="text-neutral-400 hover:text-white p-1 hover:bg-white/10 rounded transition-colors"
                title="Remover cupom"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: CANALDOJOAO"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value);
                  if (couponError) setCouponError(null);
                }}
                className="flex-1 h-9 rounded-lg border border-white/10 bg-black/40 px-3 text-xs text-white placeholder-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand uppercase font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyCouponCode(couponInput)}
                disabled={couponLoading || !couponInput.trim()}
                className="h-9 px-3 text-xs font-semibold bg-white/5 hover:bg-white/10 border-white/10 text-white"
              >
                {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Aplicar'}
              </Button>
            </div>
          )}

          {couponError && <p className="text-[11px] text-rose-400 font-medium">{couponError}</p>}
        </div>

        {/* ── Resumo Financeiro do Pedido ── */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-xs space-y-2">
          <div className="flex justify-between text-neutral-300">
            <span>Pacote Selecionado:</span>
            <span className="font-bold text-white">
              {currentPlan.name} — R$ {basePrice.toFixed(2).replace('.', ',')}
            </span>
          </div>

          {includeCourse && (
            <div className="flex justify-between text-orange-400 font-semibold animate-in fade-in duration-200">
              <span className="flex items-center gap-1">
                <PlayCircle className="w-3.5 h-3.5" /> Order Bump (Curso + Área VIP Netflix):
              </span>
              <span>+ R$ 47,00</span>
            </div>
          )}

          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-400 font-semibold animate-in fade-in duration-200">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" /> Desconto ({appliedCoupon?.discountPercent}% OFF):
              </span>
              <span>- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
            </div>
          )}

          <div className="pt-2 border-t border-white/[0.08] flex justify-between text-sm font-black text-white">
            <span>TOTAL A PAGAR NO PIX:</span>
            <span className="text-base text-brand">R$ {finalPrice.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        <div className="flex items-start gap-2 pt-1">
          <input
            type="checkbox"
            id="consent"
            className="mt-1 h-4 w-4 rounded border-white/10 bg-black/40 accent-brand cursor-pointer"
            {...register('consent')}
          />
          <Label htmlFor="consent" className="font-normal text-xs text-neutral-400 cursor-pointer">
            Concordo com os{' '}
            <a href="/termos" className="text-brand hover:underline">
              termos de uso
            </a>
            . Compreendo que este é um pagamento único pré-pago sem mensalidades ou cobranças recorrentes.
          </Label>
        </div>
        {errors.consent && <p className="mt-1 text-xs text-rose-500">{errors.consent.message}</p>}

        <Button
          type="submit"
          className="w-full bg-brand-gradient hover:brightness-110 shadow-glow font-bold py-3.5 text-base"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Gerando Pix de R$ {finalPrice.toFixed(2).replace('.', ',')}...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Zap className="h-4 w-4" /> Finalizar Pedido Pix — R$ {finalPrice.toFixed(2).replace('.', ',')}
            </span>
          )}
        </Button>
      </form>

      {toast && (
        <div
          className={`mt-4 p-3 rounded-xl text-xs font-semibold ${
            toast.variant === 'error'
              ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
              : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}