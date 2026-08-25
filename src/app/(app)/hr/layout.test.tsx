import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SessionContext } from '@/types/session';

const { redirect, currentSession } = vi.hoisted(() => ({
  redirect: vi.fn((to: string) => {
    // Next's redirect() never returns; throwing keeps the gate's control flow
    // honest so a missing `return` cannot make a denial fall through.
    throw new Error(`REDIRECT:${to}`);
  }),
  currentSession: { value: null as SessionContext | null },
}));

vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/lib/auth/session-context', () => ({
  getSessionContext: async () => currentSession.value,
}));

const { default: HrLayout } = await import('./layout');

function session(roles: SessionContext['roles']): SessionContext {
  return {
    userId: '00000000-0000-4000-8000-000000000001',
    organizationId: '11111111-1111-4111-8111-111111111111',
    roles,
    activeRole: 'hr',
  };
}

async function destination(): Promise<string | null> {
  try {
    await HrLayout({ children: 'hr page' });
    return null;
  } catch (error) {
    const message = (error as Error).message;
    if (!message.startsWith('REDIRECT:')) throw error;
    return message.slice('REDIRECT:'.length);
  }
}

describe('/hr subtree route gate', () => {
  beforeEach(() => {
    redirect.mockClear();
    currentSession.value = null;
  });

  it('sends an unauthenticated request to /login', async () => {
    expect(await destination()).toBe('/login');
  });

  it('sends employee and manager to /forbidden', async () => {
    currentSession.value = session(['employee']);
    expect(await destination()).toBe('/forbidden');
    currentSession.value = session(['manager']);
    expect(await destination()).toBe('/forbidden');
  });

  it('admits hr_admin and org_admin', async () => {
    currentSession.value = session(['hr_admin']);
    expect(await destination()).toBeNull();
    currentSession.value = session(['org_admin']);
    expect(await destination()).toBeNull();
    expect(redirect).not.toHaveBeenCalled();
  });

  /**
   * `executive_readonly` is admitted here on purpose -- the aggregate HR
   * dashboards are that role's documented surface
   * (SECURITY_AND_PRIVACY.md 6.1). The narrower reads underneath are gated
   * separately: `canReadIndividualEmployeeData` and `canReadAuditLogs` both
   * exclude the role. This case is the counterpart to the manager gate, which
   * denies it, and pins that the two subtrees really do differ.
   */
  it('admits executive_readonly to the aggregate HR subtree', async () => {
    currentSession.value = session(['executive_readonly']);
    expect(await destination()).toBeNull();
  });
});
