'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Flame,
  Zap,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Star,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VslOverlay } from '@/components/vsl-overlay';

export function Hero() {
  const [vslOpen, setVslOpen] = useState(false);
  const youtubeConfigured = Boolean(process.env.NEXT_PUBLIC_VSL_YOUTUBE_URL);

  useEffect(() => {
    if (!youtubeConfigured || typeof window === 'undefined') return;
    if (window.sessionStorage.getItem('fdc_vsl_auto_opened') === '1') return;

    const timer = window.setTimeout(() => {
      setVslOpen(true);
      window.sessionStorage.setItem('fdc_vsl_auto_opened', '1');
    }, 900);

    return () => window.clearTimeout(timer);
  }, [youtubeConfigured]);

  return (
    <section className="relative overflow-hidden border-b border-border py-16 md:py-24">
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-10%,rgba(255,92,0,0.22),rgba(255,0,76,0.08),transparent)]" />
      <div className="pointer-events-none absolute -left-40 top-20 h-[450px] w-[450px] rounded-full bg-brand/25 blur-[140px]" />
      <div className="pointer-events-none absolute -right-40 bottom-10 h-[450px] w-[450px] rounded-full bg-brand-soft/20 blur-[140px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_0%,black,transparent)]" />

      <div className="relative mx-auto w-full max-w-6xl px-4">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Left Column: Copy & Value Proposition */}
          <div className="space-y-7 lg:col-span-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/50 bg-brand/10 px-4 py-1.5 text-xs font-bold text-brand shadow-[0_0_20px_rgba(255,92,0,0.25)]">
              <Flame className="h-4 w-4 animate-pulse text-brand" />
              <span>Sem Mensalidade Presa • 1 Crédito = 1 Vídeo Pronto</span>
            </div>

            <h1 className="font-display text-4xl font-extrabold leading-[1.10] tracking-tight text-text-primary sm:text-5xl lg:text-5xl xl:text-6xl">
              Corte podcasts e vídeos longos em{' '}
              <span className="bg-gradient-to-r from-brand via-orange-500 to-amber-400 bg-clip-text text-transparent drop-shadow-sm">
                virais milionários
              </span>{' '}
              com IA em segundos.
            </h1>

            <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg text-text-secondary leading-relaxed">
              Esqueça pagar R$ 150 todo mês em ferramentas gringas. Compre créditos avulsos no Pix, gere cortes verticais com legendas automáticas e enquadramento inteligente — prontos para postar.
            </p>

            {/* CTAs — Botões Grandes, Marcantes e Imponentes */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-3">
              <Link href="/#planos" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-15 sm:h-16 px-8 sm:px-10 text-base sm:text-lg font-black tracking-wide text-white bg-gradient-to-r from-brand via-orange-500 to-amber-500 hover:brightness-110 rounded-2xl shadow-[0_0_35px_rgba(255,92,0,0.45)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
                >
                  <Zap className="h-5 w-5 mr-2 text-white animate-pulse" />
                  Ver Pacotes de Créditos
                  <ArrowRight className="h-5 w-5 ml-2 text-white" />
                </Button>
              </Link>

              <Link href="/recarga" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto h-15 sm:h-16 px-7 sm:px-8 text-base font-bold text-text-primary bg-surface/90 hover:bg-surface-elevated border-2 border-brand/40 hover:border-brand rounded-2xl shadow-xl hover:shadow-brand/20 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
                >
                  <Sliders className="h-4 w-4 mr-2 text-brand" />
                  Recarregar Licença
                </Button>
              </Link>
            </div>

            {/* Atalho para a VSL */}
            <div className="flex justify-center lg:justify-start">
              <button
                type="button"
                onClick={() => setVslOpen(true)}
                className="group inline-flex items-center gap-2.5 text-xs font-bold text-text-secondary transition-colors hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brand/30 bg-brand/10 text-brand transition-colors group-hover:bg-brand/20">
                  <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                </span>
                Assistir à apresentação em 6 minutos
              </button>
            </div>

            {/* Social proof + trust */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
              <div className="flex items-center justify-center lg:justify-start gap-3">
                <div className="flex -space-x-2.5">
                  {[
                    { initial: 'M', className: 'bg-gradient-to-br from-orange-500 to-rose-500' },
                    { initial: 'L', className: 'bg-gradient-to-br from-amber-500 to-orange-600' },
                    { initial: 'B', className: 'bg-gradient-to-br from-fuchsia-500 to-orange-500' },
                  ].map((avatar) => (
                    <span
                      key={avatar.initial}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-background text-[11px] font-extrabold text-white shadow-lg ${avatar.className}`}
                    >
                      {avatar.initial}
                    </span>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-[11px] font-medium text-text-secondary">
                    Aprovado por criadores e editores
                  </p>
                </div>
              </div>

              <span className="hidden sm:block h-9 w-px bg-border" />

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1.5 text-[11px] font-semibold text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand" /> Sem assinatura no cartão
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand" /> Pix em 5s
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: VSL em destaque */}
          <div className="relative flex justify-center lg:col-span-6">
            <div className="absolute -inset-6 rounded-[40px] bg-brand/10 blur-3xl" />

            <div className="relative w-full max-w-2xl">
              <button
                type="button"
                onClick={() => setVslOpen(true)}
                aria-label="Assistir à apresentação em vídeo"
                className="group relative block w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#0B0B0D] text-left shadow-[0_30px_90px_-30px_rgba(255,107,26,0.45)] transition-transform duration-300 hover:scale-[1.01]"
              >
                <div className="relative aspect-video w-full">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,107,26,0.22),transparent_65%)]" />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)]" />

                  {/* Topo do player */}
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
                    <div className="flex items-center gap-2.5">
                      <img
                        src="/logo.png"
                        alt="Fábrica dos Cortes"
                        className="h-8 w-8 rounded-lg object-contain"
                      />
                      <span className="text-xs font-extrabold tracking-tight text-white">
                        Fábrica dos Cortes
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/70">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand" /> VSL oficial
                    </span>
                  </div>

                  {/* Play central */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                    <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white shadow-[0_0_45px_rgba(255,107,26,0.65)] transition-transform duration-300 group-hover:scale-105">
                      <span className="absolute inset-0 animate-ping rounded-full bg-brand/35" />
                      <Play className="relative ml-1 h-7 w-7 fill-white" />
                    </span>
                    <div>
                      <p className="text-sm font-extrabold uppercase tracking-wider text-white">
                        Assistir à apresentação
                      </p>
                      <p className="mt-1 text-[11px] text-white/60">
                        Veja como funciona em 6 minutos
                      </p>
                    </div>
                  </div>

                  {/* Base do player */}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/10 bg-black/50 px-5 py-3 backdrop-blur-sm">
                    <span className="text-[11px] font-semibold text-white/70">
                      Menos edição. Mais conteúdo no ar.
                    </span>
                    <span className="text-[11px] font-bold text-white/60">6 min</span>
                  </div>
                </div>
              </button>

              <p className="mt-3 text-center text-[11px] text-text-secondary">
                Clique para assistir com som — sem sair da página.
              </p>
            </div>
          </div>
        </div>
      </div>
      <VslOverlay open={vslOpen} onClose={() => setVslOpen(false)} />
    </section>
  );
}