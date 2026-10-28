import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { KeyRound, ExternalLink, Zap, HelpCircle, FolderDown, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const revalidate = 0;

export default function SuportePage() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 py-16 flex-1">
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

          <h1 className="font-display text-3xl font-black text-text-primary md:text-5xl tracking-tight">
            Central de <span className="bg-gradient-to-r from-brand via-orange-500 to-amber-400 bg-clip-text text-transparent">Ajuda & Suporte</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-text-secondary text-sm sm:text-base leading-relaxed">
            Tudo o que você precisa para começar a rodar a <strong className="text-white">Fábrica dos Cortes</strong> (fabricadecortes.com) e solucionar eventuais dúvidas.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* 1. Ativação da Licença */}
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
            <div className="flex items-center gap-2 text-brand font-bold text-base">
              <KeyRound className="h-5 w-5" /> 1. Como recuperar minha chave
            </div>
            <p className="text-xs leading-relaxed text-text-secondary">
              Comprou um pacote e precisa ver sua chave de ativação? Informe seu e-mail cadastrado na nossa página de recuperação para ver sua chave oficial e créditos restantes.
            </p>
            <div className="pt-2">
              <Button asChild size="sm" variant="secondary" className="w-full sm:w-auto">
                <Link href="/acesso">
                  <KeyRound className="h-3.5 w-3.5 mr-1.5" /> Abrir Página de Acesso
                </Link>
              </Button>
            </div>
          </div>

          {/* 2. Google Colab */}
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
            <div className="flex items-center gap-2 text-brand font-bold text-base">
              <ExternalLink className="h-5 w-5" /> 2. Executar no Google Colab
            </div>
            <p className="text-xs leading-relaxed text-text-secondary">
              Não tem PC potente? Rode diretamente na nuvem usando as placas de vídeo gratuitas do Google. O notebook oficial já vem pré-configurado com todas as IAs.
            </p>
            <div className="pt-2">
              <Button asChild size="sm" className="w-full sm:w-auto bg-brand hover:bg-brand/90 text-white font-bold">
                <a
                  href="https://colab.research.google.com/github/bazotepedro-oss/forjaviral/blob/main/ViralCutter.ipynb"
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Abrir no Google Colab
                </a>
              </Button>
            </div>
          </div>

          {/* 3. Google Drive (Aulas e Instalador) */}
          <div className="rounded-2xl border border-brand/40 bg-surface p-6 space-y-3">
            <div className="flex items-center gap-2 text-brand font-bold text-base">
              <FolderDown className="h-5 w-5" /> 3. Google Drive (Aulas & Instalador)
            </div>
            <p className="text-xs leading-relaxed text-text-secondary">
              Acesse a pasta oficial no Google Drive com os instaladores do programa e aulas práticas ensinando o passo a passo de como instalar no PC e começar a cortar vídeos.
            </p>
            <div className="pt-2">
              <Button asChild size="sm" className="w-full sm:w-auto bg-brand hover:bg-brand/90 text-white font-bold">
                <a
                  href="https://drive.google.com/drive/u/4/folders/16U_qUEtjAlgmgmeX_HWuqPw-3dYgoekf"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FolderDown className="h-3.5 w-3.5 mr-1.5" /> Acessar Google Drive
                </a>
              </Button>
            </div>
          </div>

          {/* 4. Grupo VIP no WhatsApp */}
          <div className="rounded-2xl border border-emerald-500/40 bg-surface p-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
              <MessageCircle className="h-5 w-5" /> 4. Grupo VIP no WhatsApp
            </div>
            <p className="text-xs leading-relaxed text-text-secondary">
              Participe da nossa comunidade exclusiva de alunos no WhatsApp para tirar dúvidas, receber dicas de monetização e suporte direto da nossa equipe.
            </p>
            <div className="pt-2">
              <Button asChild size="sm" className="w-full sm:w-auto bg-[#25D366] hover:bg-[#20ba59] text-white font-bold">
                <a
                  href="https://chat.whatsapp.com/JlJ6ZJjBNpS7E9ErFSyMvC"
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Entrar no Grupo WhatsApp
                </a>
              </Button>
            </div>
          </div>

          {/* 5. Recarga de Créditos */}
          <div className="rounded-2xl border border-border bg-surface p-6 space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-brand font-bold text-base">
              <Zap className="h-5 w-5" /> 5. Recarregar Créditos
            </div>
            <p className="text-xs leading-relaxed text-text-secondary">
              Seus créditos acabaram? Recarregue qualquer quantidade com desconto progressivo (até 49% OFF). A injeção de créditos na sua chave existente é instantânea via Pix.
            </p>
            <div className="pt-2">
              <Button asChild size="sm" variant="outline" className="w-full sm:w-auto border-brand/40 text-brand">
                <Link href="/recarga">
                  <Zap className="h-3.5 w-3.5 mr-1.5" /> Recarregar Minha Chave
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-surface/50 p-6 text-center space-y-2">
          <p className="text-sm font-semibold text-text-primary">Ainda precisa de suporte pessoal?</p>
          <p className="text-xs text-text-secondary">
            Entre na nossa comunidade no Discord ou envie um e-mail para{' '}
            <a href="mailto:contato@fabricadecortes.com" className="text-brand underline">
              contato@fabricadecortes.com
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}