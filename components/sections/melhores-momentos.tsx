import Link from 'next/link';
import {
  ArrowRight,
  Captions,
  Clapperboard,
  Clock3,
  Sparkles,
  Timer,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { YouTubeEmbed } from '@/components/youtube-embed';

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

const FILES = ['MP4 1920×1080', 'Legenda SRT', 'Capítulos', 'Trechos de 60 s a 5 min'];

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

          {/* Vídeo do compilado */}
          <div className="relative lg:col-span-6">
            <div className="absolute -inset-4 rounded-[36px] bg-brand/10 blur-3xl" />
            <div className="relative">
              <YouTubeEmbed
                videoId="g2l04XfdmrY"
                title="Melhores Momentos na prática"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                {FILES.map((file) => (
                  <span
                    key={file}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/55"
                  >
                    {file}
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
