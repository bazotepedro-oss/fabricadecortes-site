import { prisma } from '@/lib/db';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const revalidate = 0;

export default function PrivacidadePage() {
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

        <h1 className="font-display text-3xl font-bold text-text-primary md:text-4xl">
          Política de <span className="text-brand">privacidade</span>
        </h1>
        <div className="mt-8 space-y-6 text-text-secondary">
          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">1. Dados coletados</h2>
            <p className="mt-2">Coletamos nome, e-mail e telefone (opcional) para processar a assinatura e enviar acesso.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">2. Armazenamento</h2>
            <p className="mt-2">Senhas são armazenadas em hash (bcrypt). Tokens one-time são hasheados. Nunca armazenamos segredos em texto puro.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">3. LGPD</h2>
            <p className="mt-2">Você pode solicitar remoção de dados entrando em contato. Dados de pagamento são processados pela AbacatePay.</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold text-text-primary">4. Contato</h2>
            <p className="mt-2">E-mail: contato@fabricadecortes.com</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}