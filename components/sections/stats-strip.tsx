import { BadgeCheck, Clock3, MonitorPlay, Zap } from 'lucide-react';

const STATS = [
  { icon: Zap, value: '5 segundos', label: 'Liberação da licença via Pix' },
  { icon: BadgeCheck, value: '365 dias', label: 'Seus créditos nunca expiram no mês' },
  { icon: MonitorPlay, value: '9:16 • 1080p', label: 'Pronto para Reels, TikTok e Shorts' },
  { icon: Clock3, value: '1 crédito', label: '1 vídeo completo renderizado com IA' },
];

export function StatsStrip() {
  return (
    <section className="relative border-b border-border bg-surface/60">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_100%_at_50%_0%,rgba(255,107,26,0.08),transparent)]" />
      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-2 gap-px overflow-hidden px-4 py-2 sm:py-0 md:grid-cols-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group flex items-center gap-3 px-2 py-5 md:px-6"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand transition-transform duration-300 group-hover:scale-105">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold leading-tight text-text-primary sm:text-base">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-text-secondary sm:text-xs">
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
