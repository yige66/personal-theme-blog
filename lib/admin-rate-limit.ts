type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  limit?: number;
  windowMs?: number;
  now?: number;
};

export type AdminRateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const defaultLimit = 30;
const defaultWindowMs = 60_000;
const maxBuckets = 1_000;
const buckets = new Map<string, RateLimitBucket>();

export function consumeAdminRateLimit(
  request: Request,
  scope: string,
  options: RateLimitOptions = {}
): AdminRateLimitResult {
  const now = options.now ?? Date.now();
  const limit = Math.max(1, options.limit ?? defaultLimit);
  const windowMs = Math.max(1_000, options.windowMs ?? defaultWindowMs);
  const key = `${scope}:${getClientAddress(request)}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    pruneExpiredBuckets(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    trimBucketCount();
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1_000))
    };
  }

  buckets.set(key, { ...current, count: current.count + 1 });
  return { allowed: true, retryAfterSeconds: 0 };
}

function getClientAddress(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = forwarded || request.headers.get('x-real-ip')?.trim() || 'unknown';
  return address.slice(0, 128);
}

function pruneExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

function trimBucketCount(): void {
  while (buckets.size > maxBuckets) {
    const oldestKey = buckets.keys().next().value;
    if (typeof oldestKey !== 'string') {
      return;
    }
    buckets.delete(oldestKey);
  }
}
