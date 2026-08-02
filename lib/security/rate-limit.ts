const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

interface RateEntry {
  count: number;
  resetAt: number;
}

const entries = new Map<string, RateEntry>();

export function checkAuditRateLimit(identifier: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const current = entries.get(identifier);

  if (!current || current.resetAt <= now) {
    entries.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    cleanupExpiredEntries(now);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  entries.set(identifier, current);
  return { allowed: true, retryAfterSeconds: 0 };
}

function cleanupExpiredEntries(now: number) {
  if (entries.size < 500) return;
  for (const [key, value] of entries) {
    if (value.resetAt <= now) entries.delete(key);
  }
}
