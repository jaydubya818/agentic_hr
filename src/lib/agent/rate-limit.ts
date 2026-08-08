const WINDOW_MS = 60_000;
const MAX_INVOCATIONS = 20;

const MAX_TRACKED_SESSIONS = 1000;

const invocationTimestamps = new Map<string, number[]>();

function pruneExpiredSessions(windowStart: number): void {
  for (const [key, timestamps] of invocationTimestamps) {
    if (!timestamps.some((t) => t > windowStart)) {
      invocationTimestamps.delete(key);
    }
  }
}

export function checkAgentRateLimit(sessionKey: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  if (invocationTimestamps.size >= MAX_TRACKED_SESSIONS) {
    pruneExpiredSessions(windowStart);
  }
  const prior = invocationTimestamps.get(sessionKey);
  const inWindow = (prior ?? []).filter((t) => t > windowStart);

  if (inWindow.length >= MAX_INVOCATIONS) {
    const oldest = inWindow[0]!;
    return { allowed: false, retryAfterMs: oldest + WINDOW_MS - now };
  }

  // Fail closed when the table stays saturated with in-window sessions after
  // pruning: admitting untracked keys past the cap would grow memory without
  // bound under a flood of distinct session keys.
  if (prior === undefined && invocationTimestamps.size >= MAX_TRACKED_SESSIONS) {
    return { allowed: false, retryAfterMs: WINDOW_MS };
  }

  inWindow.push(now);
  invocationTimestamps.set(sessionKey, inWindow);
  return { allowed: true };
}

export function resetAgentRateLimitsForTests(): void {
  invocationTimestamps.clear();
}
