import Link from 'next/link';
import { Zap, Sliders, ShieldCheck, Flame, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTAFinal() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-surface/50 py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 bg-brand-radial" />

      <div className="relative mx-auto w-full max-w-5xl px-4">
        <div className="relative overflow-hidden rounded-[36px] border border-brand/25 bg-gradient-to-br from-[#1C120B] via-[#121215] to-[#0D0D10] px-6 py-12 text-center shadow-[0_30px_100px_-40px_rgba(255,107,26,0.55)] sm:px-12 md:py-16">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[28rem] -translate-x-1/2 rounded-full bg-brand/20 blur-[90px]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_30%,black,transparent)]" />

          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand">
              <Flame className="w-3.5 h-3.5" />
              Acesso Imediato via Pix
            </div>

            <h2 className="font-display text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
              Pronto para produzir seus primeiros{' '}
              <span className="bg-gradient-to-r from-brand via-brand-soft to-orange-400 bg-clip-text text-transparent">
                cortes virais
              </span>
              ?
            </h2>

            <p className="mx-auto max-w-xl text-base leading-relaxed text-text-secondary">
              Sem assinaturas presas no cartão. Pague apenas pelos vídeos que produzir a partir de R$ 19,90 e receba sua licença em 5 segundos.
            </p>

            <div className="flex flex-col items-center justify-center gap-3.5 pt-2 sm:flex-row">
              <Button asChild size="lg" className="h-12 w-full rounded-2xl bg-brand-gradient px-8 font-bold text-white shadow-[0_0_35px_rgba(255,107,26,0.4)] transition-transform hover:scale-[1.02] hover:brightness-110 sm:h-14 sm:w-auto">
                <Link href="#planos">
                  <Zap className="mr-2 h-5 w-5" />
                  Garantir Créditos Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 w-full rounded-2xl border-2 border-white/10 px-6 font-semibold hover:border-brand/40 hover:bg-surface-elevated sm:h-14 sm:w-auto">
                <Link href="/recarga">
                  <Sliders className="mr-2 h-4 w-4 text-brand" />
                  Já sou cliente / Recarregar
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-2 text-[11px] font-semibold text-text-secondary">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Garantia de 7 dias
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Acesso imediato
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Suporte em português
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
