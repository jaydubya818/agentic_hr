import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ACTIVE_ROLE_COOKIE, SESSION_COOKIE } from '@/lib/auth/constants';
import { MOCK_IDS } from '@/lib/mock/ids';
import type { SessionContext } from '@/types/session';
import { POST as logout } from './route';

/**
 * Characterization of `POST /api/auth/logout`, the route that clears both
 * session cookies and (SECURITY_AND_PRIVACY 8.1) audits the sign-out. It had
 * no test of its own: the cookie constants and `getSessionContext` are
 * covered elsewhere, but nothing pinned how this route strings them
 * together, or that a Supabase `signOut` failure is swallowed rather than
 * surfaced.
 */

vi.mock('@/lib/auth/session-context', () => ({
  getSessionContext: vi.fn(),
}));

vi.mock('@/services/audit-service', () => ({
  logAuditEvent: vi.fn(),
}));

vi.mock('@/services/data-provider/provider-config', () => ({
  shouldUseMockData: vi.fn(() => true),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { getSessionContext } from '@/lib/auth/session-context';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit-service';
import { shouldUseMockData } from '@/services/data-provider/provider-config';

function session(): SessionContext {
  return {
    userId: MOCK_IDS.users.jordan,
    organizationId: MOCK_IDS.organization,
    roles: ['employee'],
    activeRole: 'employee',
  };
}

function cookiesOf(response: Response) {
  const set = (response as unknown as { cookies: { get(name: string): { value: string } | undefined } })
    .cookies;
  return {
    session: set.get(SESSION_COOKIE),
    activeRole: set.get(ACTIVE_ROLE_COOKIE),
  };
}

beforeEach(() => {
  vi.mocked(getSessionContext).mockReset().mockResolvedValue(null);
  vi.mocked(logAuditEvent).mockReset();
  vi.mocked(shouldUseMockData).mockReset().mockReturnValue(true);
  vi.mocked(createSupabaseServerClient).mockReset();
});

describe('cookie clearing', () => {
  it('always answers 200 with redirectTo /login, session present or not', async () => {
    const response = await logout();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ redirectTo: '/login' });
  });

  it('expires both cookies with maxAge 0, httpOnly, lax, path-wide', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(session());
    const response = await logout();
    const { session: sessionCookie, activeRole } = cookiesOf(response);
    for (const cookie of [sessionCookie, activeRole]) {
      expect(cookie).toMatchObject({
        value: '',
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
    }
  });
});

describe('audit trail', () => {
  it('logs auth.logout for the resolved session before clearing it', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(session());
    await logout();
    expect(logAuditEvent).toHaveBeenCalledTimes(1);
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.logout',
        entityType: 'user',
        entityId: MOCK_IDS.users.jordan,
        session: expect.objectContaining({ userId: MOCK_IDS.users.jordan }),
      }),
    );
  });

  // There is no session left to attribute the sign-out to once the cookie is
  // already gone (a second logout, or a logout with no session cookie at
  // all), so nothing is audited -- pinned so a future change does not log an
  // entry with a null or guessed identity.
  it('skips the audit entry when there is no session to resolve', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(null);
    await logout();
    expect(logAuditEvent).not.toHaveBeenCalled();
  });
});

describe('mock mode', () => {
  it('never touches Supabase', async () => {
    vi.mocked(shouldUseMockData).mockReturnValue(true);
    await logout();
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });
});

describe('live mode', () => {
  beforeEach(() => {
    vi.mocked(shouldUseMockData).mockReturnValue(false);
  });

  it('revokes the Supabase session when a client is configured', async () => {
    const signOut = vi.fn(async () => ({ error: null }));
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ auth: { signOut } } as never);
    const response = await logout();
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
  });

  it('skips signOut, but still clears cookies, when Supabase is not configured', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);
    const response = await logout();
    expect(response.status).toBe(200);
    const { session: sessionCookie } = cookiesOf(response);
    expect(sessionCookie?.value).toBe('');
  });

  // The two local cookies are this app's own session; Supabase revocation is
  // best-effort cleanup on top of it. A thrown signOut must not turn a
  // logout into a 500, and must not leave the local session cookie in place.
  it('swallows a thrown signOut and still returns 200 with cookies cleared', async () => {
    const signOut = vi.fn(async () => {
      throw new Error('network error');
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({ auth: { signOut } } as never);
    const response = await logout();
    expect(response.status).toBe(200);
    const { session: sessionCookie, activeRole } = cookiesOf(response);
    expect(sessionCookie?.value).toBe('');
    expect(activeRole?.value).toBe('');
  });
});
