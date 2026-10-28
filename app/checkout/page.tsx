import { Suspense } from 'react';
import { getActivePlans } from '@/lib/plans';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { CheckoutForm } from '@/components/checkout-form';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ShieldCheck, Zap, Coins } from 'lucide-react';

export const revalidate = 60;

interface CheckoutPageProps {
  searchParams?: { plan?: string; slug?: string };
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const plans = await getActivePlans();
  const defaultSlug = searchParams?.plan || searchParams?.slug || 'pack_criador';

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between">
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border py-14 md:py-18">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,rgba(255,92,0,0.22),transparent)]" />
          <div className="mx-auto w-full max-w-6xl px-4 text-center relative z-10">
            {/* Logo Badge */}
            <div className="mx-auto mb-4 inline-flex items-center gap-2.5 rounded-2xl border border-brand/35 bg-surface/90 px-4 py-2 shadow-[0_0_30px_rgba(255,92,0,0.25)] backdrop-blur-md">
              <img
                src="/logo.png"
                alt="Fábrica dos Cortes"
                className="h-7 w-7 rounded-lg object-contain drop-shadow-[0_0_12px_rgba(255,92,0,0.6)]"
              />
              <span className="text-sm font-black text-white tracking-tight">
                Fábrica dos <span className="bg-gradient-to-r from-brand to-amber-400 bg-clip-text text-transparent">Cortes</span>
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand/10 px-3.5 py-1 text-xs font-bold text-brand mb-3">
              <Zap className="h-3.5 w-3.5" /> Checkout Seguro & Liberação Imediata
            </div>
            
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-text-primary tracking-tight">
              Liberar Meu <span className="bg-gradient-to-r from-brand via-orange-500 to-amber-400 bg-clip-text text-transparent">Acesso Imediato</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-text-secondary text-sm sm:text-base leading-relaxed">
              Preencha seus dados abaixo para gerar seu Pix via AbacatePay. Sua chave de licença oficial da <strong className="text-white">Fábrica dos Cortes</strong> e os créditos serão ativados em menos de 5 segundos.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Suspense fallback={<div className="h-96 rounded-2xl border border-border bg-surface animate-pulse" />}>
                <CheckoutForm defaultSlug={defaultSlug} />
              </Suspense>
            </div>

            <aside>
              <div className="sticky top-24 space-y-4">
                <div className="rounded-2xl border border-border bg-surface p-6 shadow-xl">
                  <h3 className="font-display text-lg font-bold text-text-primary flex items-center gap-2">
                    <Coins className="h-5 w-5 text-brand" /> Pacotes de Créditos
                  </h3>
                  <p className="text-xs text-text-secondary mt-1">1 crédito = 1 corte viral completo com IA e legendas</p>

                  <div className="mt-4 space-y-2.5">
                    {plans.map((plan) => {
                      const features = Array.isArray(plan.features) ? (plan.features as string[]) : [];
                      return (
                        <div key={plan.id} className="flex items-center justify-between rounded-xl border border-border bg-background p-3 text-xs">
                          <div>
                            <p className="font-bold text-text-primary">{plan.name}</p>
                            <p className="text-[11px] text-text-secondary">Validade: 365 dias (Sem mensalidade)</p>
                          </div>
                          <Badge variant="brand">{formatPrice(plan.price, plan.currency)}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-surface to-background p-5 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-brand text-white">
                      Área de Membros VIP
                    </span>
                    <span className="text-xs font-bold text-orange-400">Estilo Netflix 🎬</span>
                  </div>
                  <h4 className="text-sm font-black text-text-primary">
                    Aprenda a Estrutura dos Vídeos Virais
                  </h4>
                  <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                    Marque o <strong>Order Bump</strong> no formulário para levar o Curso Completo de Edição Cinematográfica com mais de 500 efeitos sonoros e workshops práticos por apenas <strong>+R$ 47,00</strong>!
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-6">
                  <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" /> Garantia & Segurança
                  </h4>
                  <ul className="mt-3 space-y-2 text-xs text-text-secondary">
                    <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand" /> Pagamento instantâneo via Pix (AbacatePay)</li>
                    <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand" /> Chave gerada na hora na tela e no e-mail</li>
                    <li className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand" /> Acesso ao curso e tutoriais passo a passo</li>
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}