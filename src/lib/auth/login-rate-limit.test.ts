import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  checkLoginRateLimit,
  clearLoginRateLimit,
  resetLoginRateLimitsForTests,
} from './login-rate-limit';

describe('login rate limit', () => {
  afterEach(() => {
    resetLoginRateLimitsForTests();
    vi.useRealTimers();
  });

  it('allows up to 10 attempts per email inside the window', () => {
    for (let i = 0; i < 10; i += 1) {
      expect(checkLoginRateLimit('user@example.com').allowed).toBe(true);
    }
    const eleventh = checkLoginRateLimit('user@example.com');
    expect(eleventh.allowed).toBe(false);
    expect(eleventh.retryAfterMs).toBeGreaterThan(0);
  });

  it('normalizes email case and whitespace into one key', () => {
    for (let i = 0; i < 10; i += 1) {
      checkLoginRateLimit('User@Example.com');
    }
    expect(checkLoginRateLimit('  user@example.com ').allowed).toBe(false);
  });

  it('tracks emails independently', () => {
    for (let i = 0; i < 10; i += 1) {
      checkLoginRateLimit('a@example.com');
    }
    expect(checkLoginRateLimit('b@example.com').allowed).toBe(true);
  });

  it('clears the counter after a successful login', () => {
    for (let i = 0; i < 10; i += 1) {
      checkLoginRateLimit('user@example.com');
    }
    clearLoginRateLimit('user@example.com');
    expect(checkLoginRateLimit('user@example.com').allowed).toBe(true);
  });

  it('allows again once the window has passed', () => {
    vi.useFakeTimers();
    for (let i = 0; i < 10; i += 1) {
      checkLoginRateLimit('user@example.com');
    }
    expect(checkLoginRateLimit('user@example.com').allowed).toBe(false);
    vi.advanceTimersByTime(15 * 60_000 + 1);
    expect(checkLoginRateLimit('user@example.com').allowed).toBe(true);
  });
});
