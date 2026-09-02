import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ACTIVE_ROLE_COOKIE } from '@/lib/auth/constants';
import type { UserRole } from '@/lib/auth/types';
import { MOCK_IDS } from '@/lib/mock/ids';
import type { SessionContext } from '@/types/session';
import { POST as switchRole } from './route';

/**
 * Characterization of `POST /api/auth/demo-role`, the route that writes the
 * unsigned active-role cookie. `clampActiveRoleToHeldRoles` already refuses
 * to honour a cookie the caller's roles do not grant, so this route is the
 * second line rather than the only one -- but it is the line that decides
 * whether a cookie is issued at all, and whether the switch is audited.
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

import { getSessionContext } from '@/lib/auth/session-context';
import { logAuditEvent } from '@/services/audit-service';
import { shouldUseMockData } from '@/services/data-provider/provider-config';

function session(roles: UserRole[]): SessionContext {
  return {
    userId: MOCK_IDS.users.jordan,
    organizationId: MOCK_IDS.organization,
    roles,
    activeRole: 'employee',
  };
}

function post(body: unknown): Promise<Response> {
  return switchRole(
    new Request('http://localhost/api/auth/demo-role', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
}

function roleCookie(response: Response) {
  return (response as unknown as { cookies: { get(name: string): { value: string } | undefined } })
    .cookies.get(ACTIVE_ROLE_COOKIE);
}

beforeEach(() => {
  vi.mocked(getSessionContext).mockReset();
  vi.mocked(logAuditEvent).mockReset();
  vi.mocked(shouldUseMockData).mockReturnValue(true);
});

describe('input validation', () => {
  it('rejects a body that is not JSON with 400', async () => {
    const response = await post('nope');
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid JSON body' });
  });

  // Only the three demo views are valid targets. The database role names are
  // not: a caller cannot ask for `hr_admin` or `org_admin` by name.
  it('rejects anything but employee, manager or hr with 400', async () => {
    for (const role of [undefined, null, '', 'admin', 'hr_admin', 'org_admin', 'executive_readonly', 'HR', 1]) {
      const response = await post({ role });
      expect(response.status, JSON.stringify(role)).toBe(400);
      expect(await response.json()).toEqual({ error: 'Invalid role' });
    }
    expect(getSessionContext).not.toHaveBeenCalled();
  });
});

describe('anonymous callers', () => {
  // Deny on ambiguity: even in mock mode, no session means no cookie.
  it('gets 401 and no cookie in mock mode', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(null);
    const response = await post({ role: 'hr' });
    expect(response.status).toBe(401);
    expect(roleCookie(response)).toBeUndefined();
    expect(logAuditEvent).not.toHaveBeenCalled();
  });

  it('gets 401 and no cookie in live mode', async () => {
    vi.mocked(shouldUseMockData).mockReturnValue(false);
    vi.mocked(getSessionContext).mockResolvedValue(null);
    expect((await post({ role: 'employee' })).status).toBe(401);
  });
});

describe('mock mode', () => {
  // The demo persona holds only employee+manager, yet the hr view is granted:
  // in mock mode the switcher is a demo affordance, not an authorization.
  it('grants every view regardless of the roles the session holds', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(session(['employee']));
    for (const role of ['employee', 'manager', 'hr'] as const) {
      const response = await post({ role });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true, role });
      expect(roleCookie(response)!.value).toBe(role);
    }
  });
});

describe('live mode', () => {
  beforeEach(() => {
    vi.mocked(shouldUseMockData).mockReturnValue(false);
  });

  const cases: Array<{ roles: UserRole[]; manager: number; hr: number }> = [
    { roles: ['employee'], manager: 403, hr: 403 },
    { roles: ['manager'], manager: 200, hr: 403 },
    { roles: ['hr_admin'], manager: 200, hr: 200 },
    { roles: ['org_admin'], manager: 200, hr: 200 },
    // The aggregate-only role is not admitted to either view (backlog
    // 2026-08-31: it has no navigable surface of its own).
    { roles: ['executive_readonly'], manager: 403, hr: 403 },
    // Roles are additive: an executive who also holds manager keeps manager.
    { roles: ['executive_readonly', 'manager'], manager: 200, hr: 403 },
  ];

  for (const { roles, manager, hr } of cases) {
    it(`[${roles.join(', ')}] -> employee 200, manager ${manager}, hr ${hr}`, async () => {
      vi.mocked(getSessionContext).mockResolvedValue(session(roles));
      expect((await post({ role: 'employee' })).status).toBe(200);
      expect((await post({ role: 'manager' })).status).toBe(manager);
      expect((await post({ role: 'hr' })).status).toBe(hr);
    });
  }

  it('issues no cookie and no audit entry on a refused switch', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(session(['employee']));
    const response = await post({ role: 'hr' });
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Forbidden' });
    expect(roleCookie(response)).toBeUndefined();
    expect(logAuditEvent).not.toHaveBeenCalled();
  });

  it('agrees with what the session clamp would honour for each held-role set', async () => {
    // A view this route grants must be one the clamp keeps, and vice versa;
    // otherwise a cookie could be issued that the next request ignores.
    const { clampActiveRoleToHeldRoles } = await vi.importActual<typeof import('@/lib/auth/session-context')>(
      '@/lib/auth/session-context',
    );
    for (const { roles } of cases) {
      vi.mocked(getSessionContext).mockResolvedValue(session(roles));
      for (const role of ['manager', 'hr'] as const) {
        const granted = (await post({ role })).status === 200;
        expect(clampActiveRoleToHeldRoles(role, roles) === role, `${roles.join(',')} -> ${role}`).toBe(granted);
      }
    }
  });
});

describe('the audited switch', () => {
  it('records role.switched from the current view to the requested one, for the caller', async () => {
    vi.mocked(getSessionContext).mockResolvedValue({ ...session(['employee', 'manager']), activeRole: 'manager' });
    await post({ role: 'employee' });
    expect(logAuditEvent).toHaveBeenCalledTimes(1);
    expect(logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'role.switched',
        entityType: 'user',
        entityId: MOCK_IDS.users.jordan,
        details: { fromRole: 'manager', toRole: 'employee' },
      }),
    );
  });

  it('issues an httpOnly, lax, path-wide cookie that lasts seven days', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(session(['employee']));
    const response = await post({ role: 'manager' });
    expect(roleCookie(response)).toMatchObject({
      value: 'manager',
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
  });
});
