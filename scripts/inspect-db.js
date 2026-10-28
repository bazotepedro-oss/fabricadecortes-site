const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({
    include: {
      credentials: true,
      orders: { include: { plan: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log('CUSTOMERS IN SITE DB:', JSON.stringify(customers, null, 2));
}

main().finally(() => prisma.$disconnect());
