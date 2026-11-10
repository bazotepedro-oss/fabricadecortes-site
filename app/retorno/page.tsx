import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import {
  CheckCircle2,
  MailCheck,
  PlayCircle,
  MessageCircle,
  ArrowRight,
  KeyRound,
  Sparkles,
  ShieldCheck,
  Inbox,
  Tv,
  HelpCircle,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { syncAbacatePay } from '@/lib/sync-abacatepay';
import { prisma } from '@/lib/db';
import { driveUrl } from '@/lib/provisioning';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RetornoPageProps {
  searchParams?: { orderId?: string; checkoutId?: string; email?: string; status?: string };
}

export default async function RetornoPage({ searchParams }: RetornoPageProps) {
  // Sincroniza pagamentos da AbacatePay instantaneamente ao carregar a página
  await syncAbacatePay().catch((e) => console.error('[Retorno] Erro ao sincronizar AbacatePay:', e));

  const customerEmail = searchParams?.email;
  const orderId = searchParams?.orderId;

  // O curso/Área de Membros só aparece para quem contratou o order bump.
  let includeCourse = false;
  try {
    const order = orderId
      ? await prisma.order.findFirst({
          where: {
            OR: [
              { id: orderId },
              { abacateCheckoutId: orderId },
              { abacateOrderId: orderId },
            ],
          },
          select: { customerId: true, metadata: true },
        })
      : customerEmail
        ? await prisma.order.findFirst({
            where: { customer: { email: customerEmail } },
            orderBy: { createdAt: 'desc' },
            select: { customerId: true, metadata: true },
          })
        : null;

    if (order) {
      const ownMeta = (order.metadata || {}) as Record<string, unknown>;
      includeCourse = ownMeta.includeCourse === true || ownMeta.includeCourse === 'true';

      // Se o pedido atual for uma recarga, mas o cliente já tiver comprado o curso antes,
      // continua mostrando o acesso ao curso.
      if (!includeCourse && order.customerId) {
        const previousOrders = await prisma.order.findMany({
          where: { customerId: order.customerId },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { metadata: true },
        });

        includeCourse = previousOrders.some((item) => {
          const meta = (item.metadata || {}) as Record<string, unknown>;
          return meta.includeCourse === true || meta.includeCourse === 'true';
        });
      }
    }
  } catch (error) {
    console.error('[Retorno] Não foi possível verificar o curso:', error);
  }

  const whatsappUrl =
    process.env.WHATSAPP_GROUP_URL || 'https://chat.whatsapp.com/JlJ6ZJjBNpS7E9ErFSyMvC';
  const membersUrl =
    process.env.NEXT_PUBLIC_MEMBERS_URL || 'https://membros.fabricadecortes.com';
  const appDownloadUrl = driveUrl();

  return (
    <div className="min-h-screen bg-[#070709] text-text-primary flex flex-col justify-between selection:bg-brand selection:text-white">
      <Navbar />

      <main className="relative mx-auto w-full max-w-4xl px-4 py-12 sm:py-20 flex-1 flex flex-col justify-center">
        {/* Glow Effects de Fundo */}
        <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-96 bg-[radial-gradient(ellipse_60%_50%_at_50%_30%,rgba(255,92,0,0.18),rgba(16,185,129,0.12),transparent)] blur-3xl" />

        <div className="relative z-10 text-center space-y-6">
          {/* Badge de Confirmação */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-emerald-300">
              Pagamento Aprovado • Acesso Liberado Instantaneamente
            </span>
          </div>

          {/* Ícone de Sucesso Animado */}
          <div className="mx-auto flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500/20 via-brand/10 to-transparent border border-emerald-500/40 text-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.35)]">
            <CheckCircle2 className="h-11 w-11 sm:h-13 sm:w-13 text-emerald-400 animate-in zoom-in-50 duration-500" />
          </div>

          {/* Título Principal */}
          <div className="space-y-2">
            <h1 className="font-display text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight">
              Obrigado pela <span className="bg-gradient-to-r from-brand via-orange-500 to-amber-400 bg-clip-text text-transparent">Compra!</span>
            </h1>
            <p className="mx-auto max-w-xl text-neutral-300 text-base sm:text-lg font-medium leading-relaxed">
              Sua chave de licença oficial e seus créditos já foram ativados com sucesso na rede da <strong className="text-white">Fábrica dos Cortes</strong>.
            </p>
          </div>

          {/* ── CARD PRINCIPAL: AVISO DO E-MAIL ── */}
          <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-[#0F1713]/90 to-[#0A0D0B]/90 p-6 sm:p-8 text-left shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <MailCheck className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Seus dados de acesso foram enviados para o seu e-mail!
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {customerEmail ? (
                    <>
                      Enviamos para <strong className="text-emerald-400">{customerEmail}</strong> todas as informações oficiais para você começar agora mesmo:
                    </>
                  ) : (
                    <>
                      Enviamos para o seu <strong className="text-emerald-400">e-mail cadastrado na compra</strong> todas as informações oficiais para você começar agora mesmo:
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Checklist de entrega */}
            <div className="grid gap-2.5 sm:grid-cols-2 pt-2 border-t border-white/[0.08]">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-neutral-200 bg-white/[0.03] p-3 rounded-xl border border-white/[0.06]">
                <KeyRound className="h-4 w-4 text-brand shrink-0" />
                <span><strong>Chave de Licença Oficial</strong></span>
              </div>
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-neutral-200 bg-white/[0.03] p-3 rounded-xl border border-white/[0.06]">
                <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                <span><strong>Saldo de Créditos</strong> já ativado</span>
              </div>
              {includeCourse ? (
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-neutral-200 bg-white/[0.03] p-3 rounded-xl border border-white/[0.06]">
                  <Tv className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span><strong>Login e Senha</strong> da Área VIP</span>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-neutral-200 bg-white/[0.03] p-3 rounded-xl border border-white/[0.06]">
                  <Download className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span><strong>Instalador</strong> e guia de instalação</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-neutral-200 bg-white/[0.03] p-3 rounded-xl border border-white/[0.06]">
                <ShieldCheck className="h-4 w-4 text-brand shrink-0" />
                <span><strong>Notebook Google Colab</strong> configurado</span>
              </div>
            </div>

            {!includeCourse && (
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-3.5 text-xs text-neutral-300 leading-relaxed">
                Esta compra inclui o aplicativo e os créditos. O curso/Área de Membros é opcional e não foi incluído.
                Se quiser adicionar depois, fale com o suporte.
              </div>
            )}

            {/* Caixa de Atenção: Spam/Promoções */}
            <div className="rounded-xl bg-orange-500/10 border border-orange-500/25 p-3.5 flex items-start gap-3 text-xs sm:text-sm text-orange-200/90 leading-relaxed">
              <Inbox className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Atenção à sua caixa de entrada:</strong> O e-mail chega em 1 a 2 minutos. Se não encontrar na entrada principal, certifique-se de verificar a pasta de <strong>Spam</strong> ou <strong>Promoções</strong>.
              </div>
            </div>
          </div>

          {/* ── BOTÕES DE AÇÃO PRINCIPAIS ── */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-xl mx-auto">
            {includeCourse ? (
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto h-12 px-6 rounded-xl font-black text-sm text-white bg-gradient-to-r from-brand via-orange-500 to-amber-500 hover:brightness-110 shadow-[0_0_30px_rgba(255,92,0,0.4)] transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <Link href={membersUrl} target="_blank">
                  <PlayCircle className="h-5 w-5 mr-2" />
                  Entrar na Área de Membros VIP
                </Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto h-12 px-6 rounded-xl font-black text-sm text-white bg-gradient-to-r from-brand via-orange-500 to-amber-500 hover:brightness-110 shadow-[0_0_30px_rgba(255,92,0,0.4)] transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <Link href={appDownloadUrl} target="_blank">
                  <Download className="h-5 w-5 mr-2" />
                  Baixar aplicativo e guia
                </Link>
              </Button>
            )}

            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto h-12 px-6 rounded-xl font-bold text-sm text-emerald-400 border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-300 transition-all duration-300"
            >
              <Link href={whatsappUrl} target="_blank">
                <MessageCircle className="h-5 w-5 mr-2 text-emerald-400" />
                {includeCourse ? 'Grupo VIP no WhatsApp' : 'Suporte no WhatsApp'}
              </Link>
            </Button>

            <Button
              asChild
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto h-12 px-5 rounded-xl text-neutral-400 hover:text-white hover:bg-white/[0.06] text-sm"
            >
              <Link href="/">
                Voltar ao Início <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>

          {/* ── 3 PASSOS RÁPIDOS ── */}
          <div className="pt-8 border-t border-white/[0.08] max-w-3xl mx-auto">
            <h3 className="text-xs uppercase tracking-widest font-bold text-neutral-400 mb-6">
              Como começar em 3 minutos
            </h3>
            <div className="grid gap-4 sm:grid-cols-3 text-left">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
                <div className="text-xs font-black text-brand uppercase tracking-wider">Passo 1</div>
                <div className="text-sm font-bold text-white">Abra seu E-mail</div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Procure pela mensagem com o título &quot;Seu acesso à Fábrica dos Cortes está pronto&quot; com sua chave e instruções.
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
                <div className="text-xs font-black text-emerald-400 uppercase tracking-wider">Passo 2</div>
                <div className="text-sm font-bold text-white">
                  {includeCourse ? 'Acesse as Aulas' : 'Baixe e Instale o App'}
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {includeCourse
                    ? 'Faça login na Área de Membros para assistir os tutoriais passo a passo e baixar os arquivos.'
                    : 'Baixe o instalador no Google Drive, extraia o ZIP e execute o INSTALADOR.bat. O guia completo está na pasta.'}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2">
                <div className="text-xs font-black text-amber-400 uppercase tracking-wider">Passo 3</div>
                <div className="text-sm font-bold text-white">Ative e Corte Vídeos</div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Insira sua Chave de Licença oficial no gerador e comece a gerar cortes virais com IA em segundos.
                </p>
              </div>
            </div>
          </div>

          {/* Suporte WhatsApp */}
          <div className="pt-4 flex items-center justify-center gap-2 text-xs text-neutral-400">
            <HelpCircle className="h-4 w-4 text-neutral-500" />
            <span>
              Dúvidas ou precisa de ajuda? Fale com nosso{' '}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="text-brand hover:underline font-semibold"
              >
                Suporte no WhatsApp
              </a>.
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
