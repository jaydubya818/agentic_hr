import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { checkAgentRateLimit, resetAgentRateLimitsForTests } from './rate-limit';

describe('checkAgentRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetAgentRateLimitsForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows up to 20 invocations per minute per session (SECURITY_AND_PRIVACY.md)', () => {
    for (let i = 0; i < 20; i += 1) {
      expect(checkAgentRateLimit('session-a').allowed).toBe(true);
    }
    const blocked = checkAgentRateLimit('session-a');
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(60_000);
  });

  it('tracks sessions independently', () => {
    for (let i = 0; i < 20; i += 1) {
      checkAgentRateLimit('session-a');
    }
    expect(checkAgentRateLimit('session-a').allowed).toBe(false);
    expect(checkAgentRateLimit('session-b').allowed).toBe(true);
  });

  it('allows invocations again after the window expires', () => {
    for (let i = 0; i < 20; i += 1) {
      checkAgentRateLimit('session-a');
    }
    expect(checkAgentRateLimit('session-a').allowed).toBe(false);

    vi.advanceTimersByTime(60_001);
    expect(checkAgentRateLimit('session-a').allowed).toBe(true);
  });

  it('sweeps aged-out sessions at the tracking cap without breaking behavior', () => {
    for (let i = 0; i < 1000; i += 1) {
      checkAgentRateLimit(`session-${i}`);
    }
    vi.advanceTimersByTime(60_001);
    expect(checkAgentRateLimit('fresh-session').allowed).toBe(true);
    expect(checkAgentRateLimit('session-0').allowed).toBe(true);
  });

  it('does not evict sessions with activity still inside the window', () => {
    for (let i = 0; i < 20; i += 1) {
      checkAgentRateLimit('busy');
    }
    for (let i = 0; i < 1000; i += 1) {
      checkAgentRateLimit(`filler-${i}`);
    }
    vi.advanceTimersByTime(30_000);
    checkAgentRateLimit('sweep-trigger');
    expect(checkAgentRateLimit('busy').allowed).toBe(false);
  });
});
