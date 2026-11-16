import Link from 'next/link';
import {
  ArrowRight,
  Captions,
  Clapperboard,
  Clock3,
  ListVideo,
  Play,
  Sparkles,
  Timer,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const HIGHLIGHTS = [
  {
    icon: Clock3,
    title: 'Momentos completos de 60 s a 5 min',
    description:
      'A IA escolhe trechos com começo, contexto e desfecho — não fragmentos que perdem a graça fora do episódio.',
  },
  {
    icon: Sparkles,
    title: 'O melhor momento abre o vídeo',
    description:
      'Cold open automático: o trecho mais forte vira a abertura para segurar o espectador desde o primeiro segundo.',
  },
  {
    icon: Timer,
    title: 'Duração automática ou sob medida',
    description:
      'Deixe a IA usar todos os momentos fortes que encontrar ou defina a duração que você precisa.',
  },
  {
    icon: Captions,
    title: 'SRT, capítulos e descrição prontos',
    description:
      'Além do MP4, você recebe a legenda, o título, a descrição e os capítulos prontos para colar no YouTube.',
  },
];

const CHAPTERS = [
  { time: '00:00', title: 'A pergunta que mudou a conversa' },
  { time: '07:42', title: 'A história que ninguém esperava' },
  { time: '21:18', title: 'A opinião mais polêmica do episódio' },
  { time: '38:05', title: 'O conselho que vale o podcast inteiro' },
];

export function MelhoresMomentos() {
  return (
    <section id="melhores-momentos" className="relative overflow-hidden border-b border-border py-20 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_70%_0%,rgba(255,92,0,0.16),transparent)]" />
      <div className="pointer-events-none absolute -left-40 bottom-0 h-[420px] w-[420px] rounded-full bg-brand/10 blur-[150px]" />

      <div className="relative mx-auto w-full max-w-6xl px-4">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Copy */}
          <div className="lg:col-span-6">
            <Badge variant="brand">
              <Clapperboard className="mr-1 h-3.5 w-3.5" /> Novo: compilado para YouTube
            </Badge>

            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
              Do podcast inteiro para o{' '}
              <span className="bg-gradient-to-r from-brand via-orange-500 to-amber-400 bg-clip-text text-transparent">
                Melhores Momentos
              </span>{' '}
              em um clique.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-secondary sm:text-base">
              A IA lê a transcrição completa, encontra os trechos mais fortes e monta um vídeo 16:9
              com os melhores momentos do episódio — com transições, legenda SRT e capítulos prontos
              para o YouTube.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {HIGHLIGHTS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="group rounded-2xl border border-border/80 bg-surface/80 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/40"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand/15 bg-gradient-to-br from-brand/20 to-brand/5 text-brand transition-transform duration-300 group-hover:scale-105">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-text-primary">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-text-secondary">{item.description}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 space-y-3">
              <Link href="/#planos">
                <Button className="h-12 rounded-xl bg-gradient-to-r from-brand via-orange-500 to-amber-500 px-6 font-bold text-white shadow-[0_0_25px_rgba(255,92,0,0.35)] transition-all duration-300 hover:brightness-110 hover:scale-[1.02]">
                  <Clapperboard className="mr-2 h-4 w-4" />
                  Montar meus Melhores Momentos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <p className="max-w-md text-[11px] leading-relaxed text-text-secondary">
                <strong className="text-text-primary">10 créditos por compilado.</strong> A cobrança só é
                confirmada quando o vídeo fica pronto. Se a IA não encontrar material suficiente, os
                créditos voltam automaticamente.
              </p>
            </div>
          </div>

          {/* Mock do compilado */}
          <div className="relative lg:col-span-6">
            <div className="absolute -inset-4 rounded-[36px] bg-brand/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-[#17100C] to-[#0B0806] p-4 shadow-[0_30px_90px_-30px_rgba(255,107,26,0.45)] sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15 text-brand">
                    <Clapperboard className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand">
                      Melhores Momentos
                    </p>
                    <p className="text-[10px] text-white/45">Flow #663 — FABIO AKITA</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Pronto
                </span>
              </div>

              <div className="relative mt-4 aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(ellipse_at_center,#2A160C_0%,#0A0705_72%)]">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,black,transparent)]" />
                <span className="absolute left-3 top-3 rounded-full border border-brand/30 bg-black/50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-brand backdrop-blur-sm">
                  Cold open
                </span>
                <span className="absolute right-3 top-3 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold text-white/80 backdrop-blur-sm">
                  52:14
                </span>

                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-[0_0_40px_rgba(255,107,26,0.6)]">
                    <span className="absolute inset-0 animate-ping rounded-full bg-brand/30" />
                    <Play className="relative ml-0.5 h-6 w-6 fill-white" />
                  </span>
                  <div className="text-center">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-white">
                      Compilado 16:9
                    </p>
                    <p className="mt-0.5 text-[10px] text-white/55">17 momentos · 52,2 min</p>
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/45 px-3 py-2.5 backdrop-blur-sm">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
                    <div className="h-full w-[38%] rounded-full bg-gradient-to-r from-brand to-amber-400" />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[9px] font-semibold text-white/55">
                    <span>1920×1080 · 30 FPS</span>
                    <span>AAC 192 kbps</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/[0.08] bg-black/25 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/50">
                    <ListVideo className="h-3.5 w-3.5 text-brand" /> Capítulos do YouTube
                  </span>
                  <span className="text-[9px] font-semibold text-white/35">4 de 17</span>
                </div>
                <div className="space-y-1.5">
                  {CHAPTERS.map((chapter) => (
                    <div
                      key={chapter.time}
                      className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
                    >
                      <span className="w-10 shrink-0 font-mono text-[10px] font-bold text-brand">
                        {chapter.time}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-white/80">
                        {chapter.title}
                      </span>
                      <Play className="h-3 w-3 shrink-0 fill-white/25 text-white/25" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {['MP4 1080p', 'Legenda SRT', 'Capítulos', 'Transições'].map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/55"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
