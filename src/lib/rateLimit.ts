/**
 * Simple in-memory rate limiter for AI endpoints.
 * Limits each user to `maxCalls` requests per `windowMs`.
 *
 * This resets on server restart (serverless cold start). Good enough for
 * protecting against runaway costs without requiring Redis. Swap for
 * Upstash Redis if the app scales to multiple instances.
 */

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

export function checkRateLimit(
  userId: string,
  endpoint: string,
  maxCalls = 20,
  windowMs = 60 * 60 * 1000 // 1 hour
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `${userId}:${endpoint}`;
  const now = Date.now();

  let window = store.get(key);
  if (!window || window.resetAt <= now) {
    window = { count: 0, resetAt: now + windowMs };
    store.set(key, window);
  }

  if (window.count >= maxCalls) {
    return { allowed: false, remaining: 0, resetAt: window.resetAt };
  }

  window.count += 1;
  return { allowed: true, remaining: maxCalls - window.count, resetAt: window.resetAt };
}

// Periodically clean up expired entries to prevent memory leaks
// Only runs once per module load (singleton)
setInterval(() => {
  const now = Date.now();
  for (const [key, win] of store.entries()) {
    if (win.resetAt <= now) store.delete(key);
  }
}, 10 * 60 * 1000); // every 10 minutes
