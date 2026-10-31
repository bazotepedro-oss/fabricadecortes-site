import { createHash } from 'crypto';
import { prisma } from './db';

export interface RateLimitOptions {
  max?: number;
  windowMs?: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  unavailable?: boolean;
}

/** PostgreSQL-backed atomic fixed-window limiter shared by all Vercel instances. */
export async function rateLimit(key: string, options: RateLimitOptions = {}): Promise<RateLimitResult> {
  const max = Math.max(1, Math.min(options.max ?? 60, 10_000));
  const windowMs = Math.max(1_000, Math.min(options.windowMs ?? 60_000, 86_400_000));
  const hash = createHash('sha256')
    .update(`${options.keyPrefix || 'rl'}:${key}`)
    .digest('hex');

  try {
    const rows = await prisma.$queryRaw<Array<{ count: number; windowStartedAt: Date }>>`
      INSERT INTO "RateLimitBucket" ("key", "count", "windowStartedAt", "updatedAt")
      VALUES (${hash}, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimitBucket"."windowStartedAt" <= CURRENT_TIMESTAMP - (${windowMs} * INTERVAL '1 millisecond') THEN 1
          ELSE "RateLimitBucket"."count" + 1
        END,
        "windowStartedAt" = CASE
          WHEN "RateLimitBucket"."windowStartedAt" <= CURRENT_TIMESTAMP - (${windowMs} * INTERVAL '1 millisecond') THEN CURRENT_TIMESTAMP
          ELSE "RateLimitBucket"."windowStartedAt"
        END,
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "count", "windowStartedAt"
    `;

    if (Math.random() < 0.01) {
      await prisma.rateLimitBucket.deleteMany({
        where: { updatedAt: { lt: new Date(Date.now() - 2 * 86_400_000) } },
      }).catch((error) => console.warn('[rateLimit] Bucket cleanup failed:', error));
    }

    const row = rows[0];
    if (!row) throw new Error('Rate limiter returned no row');
    const count = Number(row.count);
    return {
      ok: count <= max,
      remaining: Math.max(0, max - count),
      resetAt: new Date(row.windowStartedAt).getTime() + windowMs,
    };
  } catch (error) {
    console.error('[rateLimit] Persistent limiter unavailable:', error);
    return { ok: false, remaining: 0, resetAt: Date.now() + windowMs, unavailable: true };
  }
}
