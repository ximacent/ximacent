/**
 * Simple fixed-window rate limiter, in-process memory only.
 *
 * CAVEAT: only correct for a single long-running Node process. If deployed
 * across multiple serverless instances/containers without shared state,
 * each instance enforces its own separate limit — effectively multiplying
 * the real limit by instance count. For multi-instance deployments, replace
 * the Map below with a Redis-backed counter (same interface, different store).
 */

interface WindowEntry {
  count: number;
  resetAt: number; // epoch ms when this window's count resets
}

const store = new Map<string, WindowEntry>();

// Lazy cleanup: sweep expired entries occasionally so the Map doesn't grow
// unboundedly under sustained traffic from many distinct IPs.
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function sweepExpired() {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
}

/**
 * Checks and increments a fixed-window counter for `key`.
 *
 * @param key         Unique identifier for the thing being limited (e.g. `payments:ip:1.2.3.4`)
 * @param limit       Max allowed calls within the window
 * @param windowMs    Window size in milliseconds
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  sweepExpired();

  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    // New window
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}