import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEMO_USER_ID } from '@/lib/mock/ids';
import { ACTIVE_ROLE_COOKIE, SESSION_COOKIE } from './constants';

/**
 * Characterization of `getMockSession`, the function behind the still-open
 * backlog item "ground the app shell's identity in the real session": in
 * mock mode every signed-in user resolves to the same hard-coded demo
 * persona (Alex Chen), regardless of which cookie value signed them in. This
 * file pins the current behaviour -- including the parts that are the
 * documented gap -- so a fix is a deliberate, visible diff rather than a
 * silent behaviour change.
 */

const { cookies } = vi.hoisted(() => ({ cookies: vi.fn() }));
vi.mock('next/headers', () => ({ cookies }));

import { createMockSessionCookie, getMockSession } from './mock-session';

function cookieJar(entries: Record<string, string>) {
  return {
    get: (name: string) => (name in entries ? { value: entries[name] } : undefined),
  };
}

beforeEach(() => {
  cookies.mockReset();
});

describe('getMockSession', () => {
  it('returns null with no session cookie at all', async () => {
    cookies.mockResolvedValue(cookieJar({}));
    expect(await getMockSession()).toBeNull();
  });

  it('returns null when the session cookie is not valid JSON', async () => {
    cookies.mockResolvedValue(cookieJar({ [SESSION_COOKIE]: 'not-json' }));
    expect(await getMockSession()).toBeNull();
  });

  it('returns null when the parsed cookie is not authenticated', async () => {
    cookies.mockResolvedValue(
      cookieJar({ [SESSION_COOKIE]: JSON.stringify({ authenticated: false, userId: 'someone-else' }) }),
    );
    expect(await getMockSession()).toBeNull();
  });

  // This is the documented gap: the cookie's userId is never read back out.
  // Any authenticated cookie -- including one this module did not mint --
  // resolves to the same hard-coded demo persona.
  it('resolves the same demo persona regardless of the cookie userId', async () => {
    cookies.mockResolvedValue(
      cookieJar({ [SESSION_COOKIE]: JSON.stringify({ authenticated: true, userId: 'not-the-demo-user' }) }),
    );
    const session = await getMockSession();
    expect(session?.userId).toBe(DEMO_USER_ID);
    expect(session?.email).toBe('alex.chen@techforward.io');
  });

  it('defaults the active role to employee when the role cookie is absent or unrecognised', async () => {
    cookies.mockResolvedValue(cookieJar({ [SESSION_COOKIE]: createMockSessionCookie() }));
    expect((await getMockSession())?.activeRole).toBe('employee');

    cookies.mockResolvedValue(
      cookieJar({ [SESSION_COOKIE]: createMockSessionCookie(), [ACTIVE_ROLE_COOKIE]: 'not-a-role' }),
    );
    expect((await getMockSession())?.activeRole).toBe('employee');
  });

  it('honours a recognised active-role cookie', async () => {
    cookies.mockResolvedValue(
      cookieJar({ [SESSION_COOKIE]: createMockSessionCookie(), [ACTIVE_ROLE_COOKIE]: 'hr' }),
    );
    expect((await getMockSession())?.activeRole).toBe('hr');
  });
});

describe('createMockSessionCookie', () => {
  it('always mints the same demo identity, authenticated', () => {
    expect(JSON.parse(createMockSessionCookie())).toEqual({
      authenticated: true,
      userId: DEMO_USER_ID,
    });
  });
});
