import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Mail, MessageSquare, Clock, Headphones } from 'lucide-react';

export const revalidate = 0;

export default function ContatoPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl px-4 py-20 flex-1">
        <div className="text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2.5 rounded-2xl border border-brand/30 bg-surface/90 px-4 py-2 shadow-[0_0_25px_rgba(255,92,0,0.25)] backdrop-blur-md">
            <img
              src="/logo.png"
              alt="Fábrica dos Cortes"
              className="h-7 w-7 rounded-lg object-contain drop-shadow-[0_0_12px_rgba(255,92,0,0.6)]"
            />
            <span className="text-sm font-black text-white">
              Fábrica dos <span className="text-brand">Cortes</span>
            </span>
          </div>

          <h1 className="font-display text-3xl font-extrabold text-text-primary md:text-4xl">
            Contato e <span className="text-brand">Suporte Oficial</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-text-secondary text-sm sm:text-base">
            Dúvidas sobre sua licença, ativação no Google Colab ou sugestões? Fale diretamente com o nosso time.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
            <div className="flex items-center gap-2 text-brand font-bold text-sm">
              <Mail className="h-4 w-4" /> E-mail de Suporte
            </div>
            <p className="text-xs text-text-secondary">
              Para dúvidas sobre pagamentos, notas ou parcerias comerciais:
            </p>
            <p className="font-semibold text-text-primary text-sm">
              <a href="mailto:contato@fabricadecortes.com" className="text-brand hover:underline">
                contato@fabricadecortes.com
              </a>
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Headphones className="h-4 w-4 text-emerald-400" /> WhatsApp Oficial
            </div>
            <p className="text-xs text-text-secondary">
              Atendimento rápido para alunos e dúvidas de instalação:
            </p>
            <p className="font-semibold text-text-primary text-sm">
              <a
                href="https://chat.whatsapp.com/JlJ6ZJjBNpS7E9ErFSyMvC"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline inline-flex items-center gap-1 font-bold"
              >
                Entrar no Grupo VIP &rarr;
              </a>
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
            <div className="flex items-center gap-2 text-brand font-bold text-sm">
              <MessageSquare className="h-4 w-4" /> Comunidade no Discord
            </div>
            <p className="text-xs text-text-secondary">
              Tire dúvidas rápidas e troque ideias com outros criadores:
            </p>
            <p className="font-semibold text-text-primary text-sm">
              <a
                href="https://discord.gg/tAdPHFAbud"
                target="_blank"
                rel="noreferrer"
                className="text-brand hover:underline inline-flex items-center gap-1"
              >
                discord.gg/tAdPHFAbud &rarr;
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-background p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-brand shrink-0" />
            <span>Atendimento de segunda a sexta, das 09h às 18h (Horário de Brasília).</span>
          </div>
          <div className="font-medium text-text-primary">
            CNPJ: 59.155.448/0001-27
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}