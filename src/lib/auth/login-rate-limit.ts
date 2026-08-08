/**
 * In-memory brute-force throttle for live-mode password login.
 *
 * Same tradeoff as the agent invocation limiter: per-instance state is
 * acceptable for the MVP single-instance deployment and resets on restart.
 */
const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 10;

const MAX_TRACKED_KEYS = 1000;

const attemptTimestamps = new Map<string, number[]>();

function pruneExpiredKeys(windowStart: number): void {
  for (const [key, timestamps] of attemptTimestamps) {
    if (!timestamps.some((t) => t > windowStart)) {
      attemptTimestamps.delete(key);
    }
  }
}

export function checkLoginRateLimit(email: string): { allowed: boolean; retryAfterMs?: number } {
  const key = email.trim().toLowerCase();
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  if (attemptTimestamps.size >= MAX_TRACKED_KEYS) {
    pruneExpiredKeys(windowStart);
  }
  const prior = attemptTimestamps.get(key);
  const inWindow = (prior ?? []).filter((t) => t > windowStart);

  if (inWindow.length >= MAX_ATTEMPTS) {
    const oldest = inWindow[0]!;
    return { allowed: false, retryAfterMs: oldest + WINDOW_MS - now };
  }

  // Fail closed when the table stays saturated with in-window keys after
  // pruning: admitting untracked keys past the cap would let a distributed
  // attacker grow memory without bound or attempt untracked brute force.
  if (prior === undefined && attemptTimestamps.size >= MAX_TRACKED_KEYS) {
    return { allowed: false, retryAfterMs: WINDOW_MS };
  }

  inWindow.push(now);
  attemptTimestamps.set(key, inWindow);
  return { allowed: true };
}

/** Successful logins clear the counter so legitimate users are not penalized. */
export function clearLoginRateLimit(email: string): void {
  attemptTimestamps.delete(email.trim().toLowerCase());
}

export function resetLoginRateLimitsForTests(): void {
  attemptTimestamps.clear();
}
