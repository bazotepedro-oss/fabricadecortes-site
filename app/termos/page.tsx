import { prisma } from '@/lib/db';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const revalidate = 0;

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-20">
        <div className="mb-6 inline-flex items-center gap-2.5 rounded-2xl border border-brand/30 bg-surface/90 px-4 py-2 shadow-[0_0_25px_rgba(255,92,0,0.25)] backdrop-blur-md">
          <img
            src="/logo.png"
            alt="Fábrica dos Cortes"
            className="h-6 w-6 rounded-lg object-contain drop-shadow-[0_0_12px_rgba(255,92,0,0.6)]"
          />
          <span className="text-sm font-black text-white">
            Fábrica dos <span className="text-brand">Cortes</span>
          </span>
        </div>

        <h1 className="font-display text-3xl font-extrabold text-text-primary md:text-4xl">
          Termos de <span className="text-brand">uso</span>
        </h1>
        <div className="mt-8 space-y-6 text-text-secondary">
          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">1. Aceitação dos termos</h2>
            <p className="mt-2">Ao assinar ou adquirir créditos na Fábrica dos Cortes (fabricadecortes.com), você concorda com estes termos de uso.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">2. Assinatura</h2>
            <p className="mt-2">Planos mensal, trimestral ou anual. Cancele a qualquer momento. Preços editáveis no painel admin.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">3. Uso da ferramenta</h2>
            <p className="mt-2">A ferramenta é usada para cortes de vídeo com IA. É proibido uso ilegal ou que viole direitos de terceiros.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">4. Cancelamento</h2>
            <p className="mt-2">Ao cancelar, o acesso é revogado e a assinatura é suspensa.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}