import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { PartnerPortalClient } from '@/components/partner-portal-client';
import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  Calendar,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Sempre atualizado em tempo real

interface PageProps {
  params: {
    token: string;
  };
}

export default async function PartnerPortalPage({ params }: PageProps) {
  const { token } = params;

  const affiliate = await prisma.affiliate.findUnique({
    where: { token },
    include: {
      orders: {
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      },
      payouts: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!affiliate || !affiliate.active) {
    notFound();
  }

  // Métricas calculadas
  const paidOrders = affiliate.orders.filter((o) => o.status === 'paid');
  const totalSalesCount = paidOrders.length;
  const grossRevenueCents = paidOrders.reduce((acc, o) => acc + (o.amount || 0), 0);
  
  // Saldo que foi aprovado (status 'credited') e ainda não foi marcado como pago no fechamento
  const pendingCommissionCents = affiliate.orders
    .filter((o) => o.commissionStatus === 'credited')
    .reduce((acc, o) => acc + (o.commissionAmount || 0), 0);

  // Histórico de comissões já pagas via Pix
  const paidCommissionCents = affiliate.orders
    .filter((o) => o.commissionStatus === 'paid')
    .reduce((acc, o) => acc + (o.commissionAmount || 0), 0);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fabricadecortes.com';

  return (
    <div className="min-h-screen bg-[#08080a] text-white selection:bg-brand selection:text-white">
      {/* ── Background Glow ── */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,92,0,0.18),rgba(0,0,0,0))]" />

      {/* ── Top Bar ── */}
      <header className="border-b border-white/[0.08] bg-[#0d0d10]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <img
                src="/logo.png"
                alt="Fábrica dos Cortes"
                className="w-10 h-10 rounded-xl object-contain drop-shadow-[0_0_20px_rgba(255,92,0,0.5)] group-hover:scale-105 transition-transform"
              />
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  Fábrica dos
                </span>
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-brand via-orange-500 to-amber-400 bg-clip-text text-transparent">
                  Cortes
                </span>
              </div>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/25 shadow-glow">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
              Portal do Parceiro VIP
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-white">{affiliate.name}</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ── Welcome & Status Hero ── */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#181210] via-[#121215] to-[#0d0d10] p-6 sm:p-8">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/25">
                <ShieldCheck className="w-4 h-4" /> Parceiro Oficial & Afiliado Autorizado
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Olá, {affiliate.name}! 👋
              </h1>
              <p className="text-sm text-neutral-300 max-w-xl leading-relaxed">
                Acompanhe o desempenho das suas indicações em tempo real. Cada venda confirmada com seu link ou cupom rende{' '}
                <strong className="text-brand font-bold">{affiliate.commissionPercent}% de comissão</strong> direta para você.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-5 text-right shrink-0">
              <span className="text-xs text-neutral-400 block font-medium">Saldo a Receber (Pix)</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                R$ {(pendingCommissionCents / 100).toFixed(2).replace('.', ',')}
              </span>
              <span className="text-[11px] text-neutral-400 block mt-1">
                Chave Pix: <strong className="text-white font-mono">{affiliate.pixKey}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* ── Cards de Estatísticas ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-white/10 bg-[#121215] p-5 space-y-2">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-semibold">Vendas Concluídas</span>
              <ShoppingCart className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-black text-white">{totalSalesCount}</div>
            <p className="text-[11px] text-neutral-400">Pedidos pagos com seu código</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121215] p-5 space-y-2">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-semibold">Faturamento Gerado</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">
              R$ {(grossRevenueCents / 100).toFixed(2).replace('.', ',')}
            </div>
            <p className="text-[11px] text-neutral-400">Total movimentado pelo seu canal</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121215] p-5 space-y-2">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-semibold">Comissão a Receber</span>
              <DollarSign className="w-4 h-4 text-brand" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              R$ {(pendingCommissionCents / 100).toFixed(2).replace('.', ',')}
            </div>
            <p className="text-[11px] text-neutral-400">Será transferido no próximo fechamento</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#121215] p-5 space-y-2">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-semibold">Comissões Já Pagas</span>
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white">
              R$ {(paidCommissionCents / 100).toFixed(2).replace('.', ',')}
            </div>
            <p className="text-[11px] text-neutral-400">Histórico de transferências Pix</p>
          </div>
        </div>

        {/* ── Ferramentas de Divulgação (Client Component com Copiar) ── */}
        <PartnerPortalClient affiliate={affiliate} appUrl={appUrl} />

        {/* ── Tabela de Vendas em Tempo Real ── */}
        <div className="rounded-2xl border border-white/10 bg-[#121215] overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-white">Vendas e Indicações em Tempo Real</h2>
              <p className="text-xs text-neutral-400">
                Atualização instantânea assim que o Pix do cliente for aprovado.
              </p>
            </div>
            <span className="text-xs font-semibold text-neutral-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              Total de Registros: {affiliate.orders.length}
            </span>
          </div>

          {affiliate.orders.length === 0 ? (
            <div className="p-12 text-center text-neutral-400 space-y-2">
              <ShoppingCart className="w-10 h-10 mx-auto text-neutral-600 mb-2" />
              <p className="font-semibold text-white">Nenhuma venda registrada ainda</p>
              <p className="text-xs max-w-sm mx-auto">
                Assim que você começar a divulgar seu link ou cupom nos vídeos, as compras aparecerão aqui automaticamente!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/40 text-neutral-400 border-b border-white/5 uppercase font-mono text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Data / Hora</th>
                    <th className="py-3 px-4">Pacote</th>
                    <th className="py-3 px-4">Valor da Venda</th>
                    <th className="py-3 px-4">Sua Comissão ({affiliate.commissionPercent}%)</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {affiliate.orders.map((o) => {
                    const isPaid = o.status === 'paid';
                    const comm = (o.commissionAmount || 0) / 100;
                    const orderTotal = (o.amount || 0) / 100;
                    const dateStr = new Date(o.createdAt).toLocaleString('pt-BR');

                    return (
                      <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-mono text-neutral-300">{dateStr}</td>
                        <td className="py-3.5 px-4 font-medium text-white">
                          {o.plan?.name || 'Pacote de Vídeos'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-300">
                          R$ {orderTotal.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          R$ {comm.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-3.5 px-4">
                          {o.commissionStatus === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                              <CheckCircle2 className="w-3 h-3" /> Pago via Pix
                            </span>
                          ) : o.commissionStatus === 'credited' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                              <CheckCircle2 className="w-3 h-3" /> Confirmado (A Receber)
                            </span>
                          ) : o.commissionStatus === 'refunded' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-500/15 text-neutral-400 border border-neutral-500/25">
                              Reembolsado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/25">
                              <Clock className="w-3 h-3" /> Aguardando Pix do Cliente
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Regras de Repasse e Suporte ── */}
        <div className="rounded-2xl border border-white/10 bg-[#121215] p-5 text-xs text-neutral-400 space-y-2">
          <h3 className="font-bold text-white flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-orange-400" /> Como funcionam os Repasses Mensais
          </h3>
          <p>
            • Os pagamentos de comissões acumuladas são transferidos diretamente via Pix para a sua chave:{' '}
            <strong className="text-white font-mono">{affiliate.pixKey}</strong> ({affiliate.pixKeyType.toUpperCase()}).
          </p>
          <p>
            • Precisa atualizar sua chave Pix ou tirar alguma dúvida sobre campanhas? Entre em contato diretamente com o suporte da Fábrica dos Cortes.
          </p>
        </div>
      </main>
    </div>
  );
}
