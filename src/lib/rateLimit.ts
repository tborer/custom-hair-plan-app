import { sql } from "@vercel/postgres";
import { ensureSchema, isDbConfigured } from "@/lib/db";

/**
 * Fixed-window rate limiter. Uses Postgres when configured so limits hold across
 * serverless instances; falls back to per-instance memory otherwise (or when
 * memoryOnly is set, for high-volume low-risk routes like /api/log).
 */
type Result = { allowed: boolean; count: number; retryAfterSec: number };

const memory = new Map<string, { windowStart: number; count: number }>();

function memoryHit(bucket: string, windowStart: number): number {
  const entry = memory.get(bucket);
  if (!entry || entry.windowStart !== windowStart) {
    memory.set(bucket, { windowStart, count: 1 });
    if (memory.size > 10_000) {
      memory.forEach((v, k) => {
        if (v.windowStart !== windowStart) memory.delete(k);
      });
    }
    return 1;
  }
  entry.count += 1;
  return entry.count;
}

export async function rateLimit(
  bucket: string,
  opts: { limit: number; windowSec: number; memoryOnly?: boolean }
): Promise<Result> {
  const nowSec = Math.floor(Date.now() / 1000);
  const windowStart = nowSec - (nowSec % opts.windowSec);
  const retryAfterSec = windowStart + opts.windowSec - nowSec;

  let count: number;
  if (!opts.memoryOnly && isDbConfigured()) {
    try {
      await ensureSchema();
      const { rows } = await sql`
        INSERT INTO rate_limits (bucket, window_start, count)
        VALUES (${bucket}, to_timestamp(${windowStart}), 1)
        ON CONFLICT (bucket, window_start) DO UPDATE SET count = rate_limits.count + 1
        RETURNING count
      `;
      count = Number(rows[0]?.count ?? 1);
      if (Math.random() < 0.01) {
        await sql`DELETE FROM rate_limits WHERE window_start < NOW() - INTERVAL '2 days'`;
      }
    } catch (err) {
      console.warn("[rateLimit] db error, using memory", { message: (err as Error)?.message });
      count = memoryHit(bucket, windowStart);
    }
  } else {
    count = memoryHit(bucket, windowStart);
  }

  return { allowed: count <= opts.limit, count, retryAfterSec };
}
