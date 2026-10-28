import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function getDatabaseUrl(): string {
  // 1. Se houver DATABASE_URL explícita nas variáveis de ambiente da Vercel
  const explicitUrl = process.env.DATABASE_URL;
  if (explicitUrl && !explicitUrl.startsWith('file:.')) {
    return explicitUrl;
  }

  // 2. Em ambiente serverless da Vercel, o diretório de execução é somente leitura.
  // Copiamos a base inicial para /tmp, que possui permissão de leitura e escrita.
  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/dev.db';
    if (!fs.existsSync(tmpDbPath)) {
      const candidates = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'dev.db'),
        path.resolve(__dirname, '..', 'prisma', 'dev.db'),
      ];
      for (const c of candidates) {
        if (fs.existsSync(c)) {
          try {
            fs.copyFileSync(c, tmpDbPath);
            break;
          } catch {}
        }
      }
    }
    return `file:${tmpDbPath}`;
  }

  return explicitUrl || 'file:./dev.db';
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}