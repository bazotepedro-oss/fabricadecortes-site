'use client';

import Link from 'next/link';
import {
  Flame,
  Zap,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { YouTubeEmbed } from '@/components/youtube-embed';

export function Hero() {
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
              <span>Cortes Virais + Melhores Momentos • Sem Mensalidade</span>
            </div>

            <h1 className="font-display text-4xl font-extrabold leading-[1.10] tracking-tight text-text-primary sm:text-5xl lg:text-5xl xl:text-6xl">
              Corte podcasts em virais e monte o{' '}
              <span className="bg-gradient-to-r from-brand via-orange-500 to-amber-400 bg-clip-text text-transparent drop-shadow-sm">
                Melhores Momentos
              </span>{' '}
              com IA.
            </h1>

            <p className="max-w-xl mx-auto lg:mx-0 text-base sm:text-lg text-text-secondary leading-relaxed">
              Gere cortes verticais com legendas e enquadramento inteligente para Reels, TikTok e Shorts. E deixe a IA montar um compilado 16:9 com os trechos completos mais fortes do podcast, com capítulos e SRT prontos para o YouTube — sem mensalidade, com créditos no Pix.
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
            <div className="w-full max-w-2xl">
              <YouTubeEmbed
                videoId="GHN6FqrnrIA"
                title="Apresentação Fábrica dos Cortes"
                sound
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}