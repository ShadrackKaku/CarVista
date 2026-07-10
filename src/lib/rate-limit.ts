/**
 * Lightweight in-memory rate limiter for API routes.
 *
 * For a single-instance deployment this is sufficient. For multi-instance
 * (Vercel / horizontal scaling) swap the Map for Upstash Redis or similar —
 * the interface is intentionally minimal so it can be re-implemented.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  identifier: string,
  limit = 60,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(identifier);

  if (!bucket || bucket.resetAt < now) {
    const resetAt = now + windowMs;
    store.set(identifier, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, resetAt };
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  return {
    success: bucket.count <= limit,
    limit,
    remaining,
    resetAt: bucket.resetAt,
  };
}

/** Extract a best-effort client identifier from a request. */
export function getClientId(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip");
  return ip ?? "anonymous";
}

// Periodically evict expired buckets to avoid unbounded growth.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of store.entries()) {
      if (bucket.resetAt < now) store.delete(key);
    }
  }, 5 * 60_000).unref?.();
}
