'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink, Sparkles, DollarSign, ShoppingCart, Clock, CheckCircle2, Wallet, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PartnerPortalClientProps {
  affiliate: {
    id: string;
    name: string;
    slug: string;
    couponCode: string;
    discountPercent: number;
    commissionPercent: number;
    pixKey: string;
    pixKeyType: string;
  };
  appUrl: string;
}

export function PartnerPortalClient({ affiliate, appUrl }: PartnerPortalClientProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const referralLink = `${appUrl}/?ref=${affiliate.slug}`;
  const promoScript = `🔥 Quer transformar vídeos longos em dezenas de cortes virais para TikTok, Reels e Shorts com IA em segundos?\nUse meu cupom oficial "${affiliate.couponCode}" na Fábrica dos Cortes: ${referralLink}`;

  const copyToClipboard = (text: string, type: 'link' | 'coupon' | 'script') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else if (type === 'coupon') {
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 2000);
    } else if (type === 'script') {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Box de Links e Ferramentas de Divulgação ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card: Link de Afiliado */}
        <div className="rounded-2xl border border-white/10 bg-[#121215] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Seu Link de Divulgação Exclusivo
            </span>
            <span className="text-[11px] font-semibold text-neutral-400">Cookie: 30 dias</span>
          </div>

          <p className="text-xs text-neutral-400">
            Quem clicar nesse link terá suas compras vinculadas automaticamente a você pelos próximos 30 dias.
          </p>

          <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl p-2">
            <span className="flex-1 font-mono text-xs text-white truncate px-2">
              {referralLink}
            </span>
            <Button
              size="sm"
              onClick={() => copyToClipboard(referralLink, 'link')}
              className="h-8 px-3 text-xs font-semibold bg-brand hover:brightness-110 text-white shrink-0"
            >
              {copiedLink ? (
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Copiado!
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Copy className="w-3.5 h-3.5" /> Copiar Link
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Card: Cupom de Desconto / Código */}
        <div className="rounded-2xl border border-white/10 bg-[#121215] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Seu Código de Apoiador / Cupom
            </span>
            <span className="text-[11px] font-semibold text-neutral-400">
              Comissão: {affiliate.commissionPercent}%
            </span>
          </div>

          <p className="text-xs text-neutral-400">
            Divulgue seu cupom para a sua audiência aplicar direto na tela de pagamento.
          </p>

          <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl p-2">
            <span className="flex-1 font-mono text-sm font-bold text-emerald-400 tracking-wider px-2">
              {affiliate.couponCode}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(affiliate.couponCode, 'coupon')}
              className="h-8 px-3 text-xs font-semibold bg-white/5 hover:bg-white/10 border-white/10 text-white shrink-0"
            >
              {copiedCoupon ? (
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado!
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Copy className="w-3.5 h-3.5" /> Copiar Cupom
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Sugestão de Copy Pronta para Fixar no Vídeo / Descrição ── */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#14121a] to-[#121215] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            💬 Modelo de Texto Pronto para o Primeiro Comentário ou Descrição
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(promoScript, 'script')}
            className="text-xs text-brand hover:text-orange-400 hover:bg-white/5"
          >
            {copiedScript ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <Check className="w-3.5 h-3.5" /> Texto Copiado!
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Copy className="w-3.5 h-3.5" /> Copiar Sugestão
              </span>
            )}
          </Button>
        </div>
        <div className="bg-black/60 border border-white/5 rounded-xl p-3.5 text-xs text-neutral-300 font-mono whitespace-pre-line leading-relaxed">
          {promoScript}
        </div>
      </div>
    </div>
  );
}
