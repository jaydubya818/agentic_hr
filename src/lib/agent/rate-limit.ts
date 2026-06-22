const WINDOW_MS = 60_000;
const MAX_INVOCATIONS = 30;

const invocationTimestamps = new Map<string, number[]>();

export function checkAgentRateLimit(sessionKey: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const prior = invocationTimestamps.get(sessionKey) ?? [];
  const inWindow = prior.filter((t) => t > windowStart);

  if (inWindow.length >= MAX_INVOCATIONS) {
    const oldest = inWindow[0]!;
    return { allowed: false, retryAfterMs: oldest + WINDOW_MS - now };
  }

  inWindow.push(now);
  invocationTimestamps.set(sessionKey, inWindow);
  return { allowed: true };
}

export function resetAgentRateLimitsForTests(): void {
  invocationTimestamps.clear();
}
