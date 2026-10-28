// Test script for Affiliate & Supporter flow
import { prisma } from '../lib/db';

async function main() {
  console.log('--- TESTANDO FLUXO DE AFILIADOS / YOUTUBERS ---');

  // 1. Cadastra ou recupera um afiliado de teste
  let affiliate = await prisma.affiliate.findFirst({
    where: { slug: 'pedro' },
  });

  if (!affiliate) {
    affiliate = await prisma.affiliate.create({
      data: {
        name: 'Canal do Pedro (150k)',
        email: 'pedro.canal@gmail.com',
        slug: 'pedro',
        couponCode: 'PEDRO',
        discountPercent: 10, // 10% de desconto para os inscritos
        commissionPercent: 20, // 20% de comissão para o Pedro
        pixKey: 'pedro.canal@gmail.com',
        pixKeyType: 'email',
        notes: 'Canal focado em podcasts e cortes virais',
      },
    });
    console.log('✅ Afiliado criado com sucesso:', affiliate.name, 'Token:', affiliate.token);
  } else {
    console.log('ℹ️ Afiliado já existente:', affiliate.name, 'Token:', affiliate.token);
  }

  // 2. Cria cliente de teste
  const customer = await prisma.customer.upsert({
    where: { email: 'alunopedro@teste.com' },
    update: {},
    create: {
      name: 'Aluno Indicado pelo Pedro',
      email: 'alunopedro@teste.com',
      phone: '11988887777',
    },
  });

  const plan = await prisma.plan.findFirst();
  if (!plan) throw new Error('Nenhum plano cadastrado');

  // 3. Simula compra usando o cupom PEDRO
  const subtotal = plan.price; // ex: 3990 (R$ 39,90)
  const discountCents = Math.round((subtotal * affiliate.discountPercent) / 100);
  const finalAmount = subtotal - discountCents;
  const commissionCents = Math.round((finalAmount * affiliate.commissionPercent) / 100);

  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      planId: plan.id,
      status: 'pending',
      amount: finalAmount,
      currency: 'BRL',
      affiliateId: affiliate.id,
      couponCode: affiliate.couponCode,
      commissionAmount: commissionCents,
      commissionStatus: 'pending',
      metadata: {
        slug: plan.slug,
        affiliateId: affiliate.id,
        affiliateName: affiliate.name,
        couponCode: affiliate.couponCode,
        commissionAmount: commissionCents,
      },
    },
  });

  console.log(`✅ Pedido gerado! Total: R$ ${(finalAmount / 100).toFixed(2)} | Comissão: R$ ${(commissionCents / 100).toFixed(2)}`);

  // 4. Simula aprovação de pagamento via Pix (Webhook / Sync)
  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'paid',
      paidAt: new Date(),
      commissionStatus: 'credited',
    },
  });

  console.log('✅ Pagamento Pix confirmado! Comissão creditada ao parceiro.');

  // 5. Verifica métricas do afiliado
  const affCheck = await prisma.affiliate.findUnique({
    where: { id: affiliate.id },
    include: { orders: true, payouts: true },
  });

  const creditedOrders = (affCheck?.orders || []).filter((o) => o.commissionStatus === 'credited');
  const totalPending = creditedOrders.reduce((acc, o) => acc + (o.commissionAmount || 0), 0);

  console.log(`📊 Saldo acumulado para repasse Pix: R$ ${(totalPending / 100).toFixed(2)} (${creditedOrders.length} vendas)`);
  console.log(`🔗 Link Mágico do Painel do Youtuber: http://localhost:3000/parceiro/${affiliate.token}`);
}

main()
  .catch((e) => {
    console.error('Erro no teste:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
