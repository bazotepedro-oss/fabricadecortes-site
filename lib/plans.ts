import { prisma } from '@/lib/db';

export interface PlanData {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  interval: string;
  abacatePlanId?: string | null;
  features: string[] | any;
  active: boolean;
}

export const FALLBACK_PLANS: PlanData[] = [
  {
    id: 'pack_teste',
    name: 'Pack Teste (15 Vídeos)',
    slug: 'pack_teste',
    price: 1990,
    currency: 'BRL',
    interval: 'one_time',
    abacatePlanId: 'pack_teste_15',
    features: [
      '15 cortes virais com IA (R$ 1,32 por corte)',
      'Legendas dinâmicas estilo Hormozi / TikTok',
      'Enquadramento Face Crop automático (9:16)',
      'Áudio aprimorado e corte de silêncio',
      'Exportação XML para Premiere / DaVinci',
      'Créditos válidos por 365 dias (Sem mensalidade)',
    ],
    active: true,
  },
  {
    id: 'pack_iniciante',
    name: 'Pack Iniciante (30 Vídeos)',
    slug: 'pack_iniciante',
    price: 2990,
    currency: 'BRL',
    interval: 'one_time',
    abacatePlanId: 'pack_iniciante_30',
    features: [
      '30 cortes virais com IA (R$ 0,99 por corte - 25% OFF)',
      'Ideal para testar 1 vídeo por dia durante o mês',
      'Todas as funções de IA e corte inclusas',
      'Renderização acelerada por GPU',
      'Suporte direto via WhatsApp',
      'Sem assinatura e sem pegadinhas',
    ],
    active: true,
  },
  {
    id: 'pack_criador',
    name: 'Pack Criador (50 Vídeos)',
    slug: 'pack_criador',
    price: 3990,
    currency: 'BRL',
    interval: 'one_time',
    abacatePlanId: 'pack_criador_50',
    features: [
      '50 cortes virais com IA (R$ 0,79 por corte - 39% OFF)',
      'Mais Vendido 🔥 — Perfeito para TikTok e Reels',
      'Prioridade máxima no servidor',
      'Exportação em 1080p 60fps',
      'Templates prontos de legendas',
      'Créditos acumulativos por 1 ano',
    ],
    active: true,
  },
  {
    id: 'pack_escala',
    name: 'Pack Escala (120 Vídeos)',
    slug: 'pack_escala',
    price: 7990,
    currency: 'BRL',
    interval: 'one_time',
    abacatePlanId: 'pack_escala_120',
    features: [
      '120 cortes virais com IA (R$ 0,66 por corte - 49% OFF)',
      'Máxima economia para canais dark e múltiplos perfis',
      'Suporte VIP prioritário',
      'Acesso antecipado a novas atualizações',
      'Volume para postar 4 vídeos por dia',
      'Créditos válidos por 365 dias',
    ],
    active: true,
  },
  {
    id: 'pack_pro',
    name: 'Pack Agência / Pro (250 Vídeos)',
    slug: 'pack_pro',
    price: 13990,
    currency: 'BRL',
    interval: 'one_time',
    abacatePlanId: 'pack_pro_250',
    features: [
      '250 cortes virais com IA (R$ 0,55 por corte - 58% OFF)',
      'Volume industrial para agências e infoprodutores',
      'Custo imbatível: apenas R$ 0,55 por vídeo completo',
      'Suporte dedicado com canal direto',
      'Sem limite de exportação diária',
      'Validade total de 1 ano',
    ],
    active: true,
  },
];

export async function getActivePlans(): Promise<PlanData[]> {
  try {
    if (!process.env.DATABASE_URL) {
      return FALLBACK_PLANS;
    }
    const plans = await prisma.plan.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    });
    if (plans && plans.length > 0) {
      return plans;
    }
  } catch (error) {
    console.warn('[getActivePlans] Usando planos padrão de fallback devido a erro no banco:', error);
  }
  return FALLBACK_PLANS;
}
