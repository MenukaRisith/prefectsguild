type RateLimitState = {
  count: number;
  resetAt: number;
};

declare global {
  var rateLimitStore: Map<string, RateLimitState> | undefined;
}

const store = global.rateLimitStore ?? new Map<string, RateLimitState>();

if (!global.rateLimitStore) {
  global.rateLimitStore = store;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const current = store.get(key);

  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  }

  current.count += 1;
  store.set(key, current);
  return { allowed: true, retryAfter: 0 };
}
