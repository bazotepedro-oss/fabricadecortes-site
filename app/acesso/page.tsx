import { Suspense } from 'react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { AccessCard } from '@/components/access-card';

export const revalidate = 0;

export default function AcessoPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:py-20">
        <div className="text-center">
          <div className="mx-auto mb-5 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Fábrica dos Cortes"
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-contain drop-shadow-[0_0_30px_rgba(255,92,0,0.5)]"
            />
          </div>
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-brand px-3 py-1 rounded-full bg-brand/10 border border-brand/20 mb-3">
            Portal Oficial de Licenças
          </span>
          <h1 className="font-display text-3xl font-extrabold text-text-primary md:text-4xl">
            Acesso <span className="text-brand">Fábrica dos Cortes</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-text-secondary text-sm sm:text-base leading-relaxed">
            Informe seu e-mail cadastrado na compra para visualizar sua chave de licença oficial, saldo de créditos e links da Área VIP.
          </p>
        </div>
        <div className="mt-10">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl border border-border bg-surface" />}>
            <AccessCard />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}