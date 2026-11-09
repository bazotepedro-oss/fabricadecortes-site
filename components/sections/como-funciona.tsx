import { Coins, Zap, Unlock, Headphones, Rocket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STEPS = [
  { icon: Coins, title: 'Escolha seu Pacote', description: 'De 15 até 250 créditos ou monte uma quantidade avulsa sob medida. Sem assinatura no cartão.' },
  { icon: Zap, title: 'Pix Instantâneo', description: 'Checkout seguro com QR Code Pix via AbacatePay e aprovação em menos de 5 segundos.' },
  { icon: Unlock, title: 'Chave e Acesso Imediatos', description: 'Sua licença e seus créditos chegam automaticamente no seu e-mail e na Área VIP, prontos para usar.' },
  { icon: Headphones, title: 'Corte e Viralize', description: 'Cole o link do podcast no computador ou na nuvem e receba os cortes verticais com legendas em minutos.' },
];

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="relative overflow-hidden border-y border-border bg-surface">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(255,107,26,0.08),transparent)]" />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-20 md:py-24">
        <div className="space-y-3 text-center">
          <Badge variant="brand">
            <Rocket className="mr-1 h-3.5 w-3.5" /> Do Pix ao vídeo em minutos
          </Badge>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-text-primary md:text-4xl">
            Como funciona em{' '}
            <span className="bg-gradient-to-r from-brand via-orange-500 to-amber-400 bg-clip-text text-transparent">
              4 passos
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-text-secondary">
            Do Pix ao primeiro corte viral pronto, tudo é 100% automático.
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="group relative rounded-3xl border border-border/80 bg-background/80 p-6 pt-7 transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-[0_18px_45px_-20px_rgba(255,107,26,0.45)]"
              >
                <span className="absolute -top-3 left-6 flex h-7 min-w-7 items-center justify-center rounded-full bg-brand-gradient px-2 text-xs font-extrabold text-white shadow-[0_6px_18px_-6px_rgba(255,107,26,0.9)]">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/25 to-brand/5 text-brand transition-transform duration-300 group-hover:scale-105">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-4 font-display text-lg font-bold text-text-primary">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
