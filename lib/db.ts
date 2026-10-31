import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url || !/^postgres(ql)?:\/\//i.test(url)) {
    throw new Error('DATABASE_URL deve apontar para PostgreSQL persistente');
  }
  return url;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createAdapter(): PrismaPg {
  return new PrismaPg({
    connectionString: getDatabaseUrl(),
    max: Math.max(1, Math.min(Number(process.env.DB_POOL_MAX || 4), 10)),
  });
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: createAdapter(),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
