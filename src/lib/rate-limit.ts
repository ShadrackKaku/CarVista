/**
 * Rate limiter for API routes.
 *
 * Uses Upstash Redis (a sliding-window limiter shared across every serverless
 * instance) when it's configured via env — the correct choice for Vercel, where
 * an in-memory counter is per-lambda and trivially bypassed. When Upstash isn't
 * configured it falls back to a per-instance in-memory limiter, so the app works
 * out of the box and upgrades automatically once the credentials are set:
 *
 *   UPSTASH_REDIS_REST_URL   = https://<your-db>.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN = <token>
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

const upstashConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = upstashConfigured ? Redis.fromEnv() : null;

// One Ratelimit instance per (limit, window) pair — reused across requests.
const limiterCache = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const key = `${limit}:${windowMs}`;
  let limiter = limiterCache.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: `cv:rl:${key}`,
      analytics: false,
    });
    limiterCache.set(key, limiter);
  }
  return limiter;
}

// ── In-memory fallback (single instance / no Upstash) ─────────────
interface Bucket {
  count: number;
  resetAt: number;
}
const store = new Map<string, Bucket>();

function memoryLimit(identifier: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(identifier);
  if (!bucket || bucket.resetAt < now) {
    const resetAt = now + windowMs;
    store.set(identifier, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, resetAt };
  }
  bucket.count += 1;
  return {
    success: bucket.count <= limit,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

/**
 * Check (and consume) one unit of rate-limit budget for `identifier`.
 * Async because the distributed backend is a network call; the in-memory
 * fallback resolves immediately. If Upstash errors, we fail OPEN (allow the
 * request) so a Redis blip can't take the whole API down.
 */
export async function rateLimit(
  identifier: string,
  limit = 60,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  if (redis) {
    try {
      const res = await getLimiter(limit, windowMs).limit(identifier);
      return {
        success: res.success,
        limit: res.limit,
        remaining: res.remaining,
        resetAt: res.reset,
      };
    } catch (e) {
      console.error("[rate-limit] upstash error, allowing request", e);
      return { success: true, limit, remaining: limit - 1, resetAt: Date.now() + windowMs };
    }
  }
  return memoryLimit(identifier, limit, windowMs);
}

/** Extract a best-effort client identifier from a request. */
export function getClientId(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip");
  return ip ?? "anonymous";
}

// Periodically evict expired in-memory buckets to avoid unbounded growth.
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, bucket] of store.entries()) {
        if (bucket.resetAt < now) store.delete(key);
      }
    },
    5 * 60_000,
  ).unref?.();
}
