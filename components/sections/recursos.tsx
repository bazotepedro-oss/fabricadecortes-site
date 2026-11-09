import { Sparkles, Video, Subtitles, Zap, Shield, Headphones, Globe, FileVideo, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const FEATURES = [
  { icon: Sparkles, title: 'Cortes automáticos com IA', description: 'A IA identifica os momentos mais engajantes e gera cortes prontos.' },
  { icon: Subtitles, title: 'Legendas dinâmicas', description: 'Estilo Hormozi com highlight palavra por palavra e emojis.' },
  { icon: Video, title: 'Otimizado para Reels/TikTok/Shorts', description: 'Formatos 9:16, auto-crop e legendas otimizados para cada plataforma.' },
  { icon: Zap, title: 'Processamento rápido', description: 'Transcrição com slicing: processa 1x, corta N vezes.' },
  { icon: Shield, title: 'Acesso seguro', description: 'Credenciais geradas com hash e token one-time com expiração.' },
  { icon: Headphones, title: 'Suporte', description: 'Equipe disponível para ajudar com configuração e uso.' },
  { icon: Globe, title: 'Sem complicação técnica', description: 'Instale, acesse e corte. Interface moderna e direta.' },
  { icon: FileVideo, title: 'Tradução automática', description: 'Traduza legendas para 10+ línguas automaticamente.' },
];

export function Recursos() {
  return (
    <section id="recursos" className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_100%,rgba(255,107,26,0.07),transparent)]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-20 md:py-24">
        <div className="space-y-3 text-center">
          <Badge variant="brand">
            <Wand2 className="mr-1 h-3.5 w-3.5" /> Recursos Premium
          </Badge>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
            Tudo o que você precisa para{' '}
            <span className="bg-gradient-to-r from-brand via-orange-500 to-amber-400 bg-clip-text text-transparent">
              viralizar
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-text-secondary">
            Recursos profissionais em um único acesso, sem depender de várias ferramentas.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_16px_40px_-22px_rgba(255,107,26,0.45)]"
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-brand/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-brand/15 bg-gradient-to-br from-brand/20 to-brand/5 text-brand transition-transform duration-300 group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="relative mt-4 font-display font-bold text-text-primary">{f.title}</h3>
                <p className="relative mt-1.5 text-sm leading-relaxed text-text-secondary">{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
