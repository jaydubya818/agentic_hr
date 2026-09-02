import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ACTIVE_ROLE_COOKIE, SESSION_COOKIE } from '@/lib/auth/constants';
import { resetLoginRateLimitsForTests } from '@/lib/auth/login-rate-limit';
import { DEMO_USER_ID, MOCK_IDS } from '@/lib/mock/ids';
import { POST as login } from './route';

/**
 * Characterization of `POST /api/auth/login`, the only route that mints a
 * session cookie. It had no test of its own: the rate limiter and the cookie
 * parsers are covered, but nothing pinned how the route strings them together
 * or which branch answers which input.
 *
 * Every collaborator with a side effect is mocked. `shouldUseMockData` picks
 * the branch; `createSupabaseServerClient` stands in for Supabase Auth;
 * `getDb` supplies the one query the live path makes (auth user -> user row)
 * and `logAuditEvent` records what the route claims to audit.
 */

vi.mock('@/services/data-provider/provider-config', () => ({
  shouldUseMockData: vi.fn(() => true),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(() => null),
}));

vi.mock('@/services/audit-service', () => ({
  logAuditEvent: vi.fn(),
}));

import { getDb } from '@/lib/db';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit-service';
import { shouldUseMockData } from '@/services/data-provider/provider-config';

const AUTH_USER_ID = 'a0000000-0000-4000-8000-000000000001';

function post(body: unknown): Promise<Response> {
  return login(
    new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
}

/** A Supabase client whose `signInWithPassword` answers as configured. */
function supabaseClient(result: { user: { id: string } | null; error: unknown }) {
  const signInWithPassword = vi.fn(async () => ({
    data: { user: result.user },
    error: result.error,
  }));
  return { client: { auth: { signInWithPassword } }, signInWithPassword };
}

/** A Drizzle `db` whose one chained select resolves to `rows`. */
function dbSelecting(rows: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(async () => rows),
  };
  return { select: vi.fn(() => chain) };
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
  vi.mocked(shouldUseMockData).mockReturnValue(true);
  vi.mocked(createSupabaseServerClient).mockReset();
  vi.mocked(getDb).mockReset().mockReturnValue(null);
  vi.mocked(logAuditEvent).mockReset();
  resetLoginRateLimitsForTests();
});

describe('input validation, before either branch is chosen', () => {
  it('rejects a body that is not JSON with 400', async () => {
    const response = await post('{not json');
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid JSON body' });
  });

  it('rejects a missing, non-string or blank email with 400', async () => {
    for (const body of [{}, { email: 42 }, { email: '   ' }, { email: null }]) {
      const response = await post(body);
      expect(response.status, JSON.stringify(body)).toBe(400);
      expect(await response.json()).toEqual({ error: 'Email required' });
    }
  });

  // The email becomes an in-memory rate-limit key, so its size is bounded up
  // front; RFC 5321 caps addresses at 254 characters and no real credential
  // approaches 512. Both are refused with the generic message, not a hint.
  it('refuses an oversize email or password with 400 and the generic message', async () => {
    const longEmail = `${'a'.repeat(250)}@x.io`;
    expect(longEmail.length).toBeGreaterThan(254);
    const byEmail = await post({ email: longEmail, password: 'pw' });
    expect(byEmail.status).toBe(400);
    expect(await byEmail.json()).toEqual({ error: 'Invalid email or password' });

    const byPassword = await post({ email: 'a@x.io', password: 'p'.repeat(513) });
    expect(byPassword.status).toBe(400);
    expect(await byPassword.json()).toEqual({ error: 'Invalid email or password' });
  });

  it('accepts a 254-character email and a 512-character password (the limits are inclusive)', async () => {
    const email = `${'a'.repeat(249)}@x.io`;
    expect(email.length).toBe(254);
    const response = await post({ email, password: 'p'.repeat(512) });
    expect(response.status).toBe(200);
  });

  it('never reaches an auth provider or the database when validation fails', async () => {
    vi.mocked(shouldUseMockData).mockReturnValue(false);
    await post({ email: '' });
    await post({ email: 'x'.repeat(300) });
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
    expect(getDb).not.toHaveBeenCalled();
  });
});

describe('mock mode', () => {
  it('signs in the demo user without a password and issues both cookies', async () => {
    const response = await post({ email: 'anyone@example.com' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ redirectTo: '/employee/home' });

    const { session, activeRole } = cookiesOf(response);
    expect(JSON.parse(session!.value)).toEqual({ authenticated: true, userId: DEMO_USER_ID });
    expect(activeRole!.value).toBe('employee');
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  // The email in the body is not the identity: whatever is submitted, the mock
  // cookie names the demo user. Pinned so a future "log in as any fixture
  // user by email" change is a deliberate one.
  it('ignores the submitted email when choosing the identity', async () => {
    const response = await post({ email: 'jordan.lee@techforward.io', password: 'irrelevant' });
    const { session } = cookiesOf(response);
    expect(JSON.parse(session!.value).userId).toBe(DEMO_USER_ID);
  });

  it('records auth.login for the demo user in the demo organization', async () => {
    await post({ email: 'anyone@example.com' });
    expect(logAuditEvent).toHaveBeenCalledTimes(1);
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.login',
        entityType: 'user',
        entityId: DEMO_USER_ID,
        session: expect.objectContaining({
          userId: DEMO_USER_ID,
          organizationId: MOCK_IDS.organization,
        }),
      }),
    );
  });

  it('issues httpOnly, lax, path-wide cookies that last seven days', async () => {
    const response = await post({ email: 'anyone@example.com' });
    const { session, activeRole } = cookiesOf(response);
    for (const cookie of [session, activeRole]) {
      expect(cookie).toMatchObject({
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }
  });
});

describe('live mode', () => {
  beforeEach(() => {
    vi.mocked(shouldUseMockData).mockReturnValue(false);
  });

  it('answers 503 when Supabase is not configured, and never falls back to the mock cookie', async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);
    const response = await post({ email: 'a@x.io', password: 'pw' });
    expect(response.status).toBe(503);
    expect(cookiesOf(response).session).toBeUndefined();
  });

  it('requires a non-empty password once the provider is available', async () => {
    const { client, signInWithPassword } = supabaseClient({ user: null, error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);
    for (const body of [{ email: 'a@x.io' }, { email: 'a@x.io', password: '' }, { email: 'a@x.io', password: 7 }]) {
      const response = await post(body);
      expect(response.status, JSON.stringify(body)).toBe(400);
      expect(await response.json()).toEqual({ error: 'Password required' });
    }
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it('answers a rejected credential with 401 and no cookie', async () => {
    const { client } = supabaseClient({ user: null, error: { message: 'Invalid login credentials' } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);
    const response = await post({ email: 'a@x.io', password: 'wrong' });
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Invalid email or password' });
    expect(cookiesOf(response).session).toBeUndefined();
    expect(logAuditEvent).not.toHaveBeenCalled();
  });

  // Ten failures in the window are admitted to the provider; the eleventh is
  // refused before the provider is consulted, with a Retry-After in seconds.
  it('throttles the eleventh attempt for one email with 429 and Retry-After', async () => {
    const { client, signInWithPassword } = supabaseClient({ user: null, error: { message: 'no' } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);
    for (let i = 0; i < 10; i += 1) {
      expect((await post({ email: 'Target@x.io', password: 'wrong' })).status).toBe(401);
    }
    expect(signInWithPassword).toHaveBeenCalledTimes(10);

    // Case and surrounding whitespace do not open a fresh bucket.
    const response = await post({ email: '  target@X.IO ', password: 'wrong' });
    expect(response.status).toBe(429);
    expect(signInWithPassword).toHaveBeenCalledTimes(10);
    const retryAfter = Number(response.headers.get('Retry-After'));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(15 * 60);
  });

  it('keys the throttle per email, so one caller cannot lock out another', async () => {
    const { client } = supabaseClient({ user: null, error: { message: 'no' } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);
    for (let i = 0; i < 10; i += 1) {
      await post({ email: 'victim@x.io', password: 'wrong' });
    }
    expect((await post({ email: 'other@x.io', password: 'wrong' })).status).toBe(401);
  });

  it('sets the session cookie to the auth user id on success and clears the throttle', async () => {
    const { client, signInWithPassword } = supabaseClient({ user: { id: AUTH_USER_ID }, error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);

    for (let i = 0; i < 9; i += 1) {
      await post({ email: 'a@x.io', password: 'wrong' });
    }
    const response = await post({ email: 'a@x.io', password: 'right' });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ redirectTo: '/employee/home' });
    expect(signInWithPassword).toHaveBeenLastCalledWith({ email: 'a@x.io', password: 'right' });

    const { session, activeRole } = cookiesOf(response);
    expect(JSON.parse(session!.value)).toEqual({ authenticated: true, userId: AUTH_USER_ID });
    expect(activeRole!.value).toBe('employee');

    // The nine failures before it are forgotten: ten more attempts are allowed.
    for (let i = 0; i < 10; i += 1) {
      expect((await post({ email: 'a@x.io', password: 'right' })).status).toBe(200);
    }
  });

  it('attributes auth.login to the linked user row, not the auth id', async () => {
    const { client } = supabaseClient({ user: { id: AUTH_USER_ID }, error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);
    const db = dbSelecting([{ id: MOCK_IDS.users.jordan, organizationId: MOCK_IDS.organization }]);
    vi.mocked(getDb).mockReturnValue(db as never);

    await post({ email: 'a@x.io', password: 'right' });

    expect(logAuditEvent).toHaveBeenCalledTimes(1);
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.login',
        entityId: MOCK_IDS.users.jordan,
        session: expect.objectContaining({
          userId: MOCK_IDS.users.jordan,
          organizationId: MOCK_IDS.organization,
        }),
      }),
    );
  });

  // An auth identity with no user row is signed in (the cookie is issued) but
  // not audited, rather than logged against a guessed organization. Pinned
  // because this is a deliberate gap: such a login leaves no audit trail.
  it('still signs in, but skips the audit entry, when the auth user has no user row', async () => {
    const { client } = supabaseClient({ user: { id: AUTH_USER_ID }, error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);
    vi.mocked(getDb).mockReturnValue(dbSelecting([]) as never);

    const response = await post({ email: 'a@x.io', password: 'right' });
    expect(response.status).toBe(200);
    expect(cookiesOf(response).session).toBeDefined();
    expect(logAuditEvent).not.toHaveBeenCalled();
  });

  it('also skips the audit entry when no database is configured', async () => {
    const { client } = supabaseClient({ user: { id: AUTH_USER_ID }, error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);
    vi.mocked(getDb).mockReturnValue(null);

    const response = await post({ email: 'a@x.io', password: 'right' });
    expect(response.status).toBe(200);
    expect(logAuditEvent).not.toHaveBeenCalled();
  });
});
