import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_20%,rgba(255,92,0,0.18),transparent)]" />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-6 inline-flex items-center gap-2.5 rounded-2xl border border-brand/30 bg-surface/90 px-4 py-2 shadow-[0_0_25px_rgba(255,92,0,0.25)] backdrop-blur-md">
          <img
            src="/logo.png"
            alt="Fábrica dos Cortes"
            className="h-8 w-8 rounded-lg object-contain drop-shadow-[0_0_12px_rgba(255,92,0,0.6)]"
          />
          <span className="text-base font-black text-white">
            Fábrica dos <span className="text-brand">Cortes</span>
          </span>
        </div>

        <div className="w-20 h-20 rounded-3xl bg-brand/10 border border-brand/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,92,0,0.2)]">
          <span className="text-4xl font-black text-brand">404</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Página Não Encontrada</h1>
        <p className="text-text-secondary max-w-md mb-8 text-sm sm:text-base leading-relaxed">
          O link que você tentou acessar não existe ou foi movido na <strong className="text-white">Fábrica dos Cortes</strong>.
        </p>

        <Link href="/">
          <Button className="bg-gradient-to-r from-brand via-orange-500 to-amber-500 hover:brightness-110 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-brand/30 transition-all hover:scale-105">
            Voltar para a Página Inicial
          </Button>
        </Link>
      </div>
    </div>
  );
}
