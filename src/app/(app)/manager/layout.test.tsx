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

const { default: ManagerLayout } = await import('./layout');

function session(roles: SessionContext['roles']): SessionContext {
  return {
    userId: '00000000-0000-4000-8000-000000000001',
    organizationId: '11111111-1111-4111-8111-111111111111',
    roles,
    activeRole: 'manager',
  };
}

async function destination(): Promise<string | null> {
  try {
    await ManagerLayout({ children: 'manager page' });
    return null;
  } catch (error) {
    const message = (error as Error).message;
    if (!message.startsWith('REDIRECT:')) throw error;
    return message.slice('REDIRECT:'.length);
  }
}

describe('/manager subtree route gate', () => {
  beforeEach(() => {
    redirect.mockClear();
    currentSession.value = null;
  });

  it('sends an unauthenticated request to /login', async () => {
    expect(await destination()).toBe('/login');
  });

  it('sends a plain employee to /forbidden', async () => {
    currentSession.value = session(['employee']);
    expect(await destination()).toBe('/forbidden');
  });

  /**
   * The asymmetry this pins: `executive_readonly` clears the `/hr` gate
   * (`canReadOrganizationWorkforceData` admits it) but must not clear this
   * one. The manager subtree is individual-level -- `/manager/employee/[id]`,
   * coaching and team scenarios all name people -- and
   * SECURITY_AND_PRIVACY.md 6.1 grants the role "aggregated dashboards only;
   * no individual PII". Swapping this gate to the HR predicate would open a
   * named-employee surface to a role denied it everywhere else, and that swap
   * now goes red here.
   */
  it('sends executive_readonly to /forbidden even though it clears the HR gate', async () => {
    currentSession.value = session(['executive_readonly']);
    expect(await destination()).toBe('/forbidden');
  });

  it('admits manager, hr_admin and org_admin', async () => {
    currentSession.value = session(['manager']);
    expect(await destination()).toBeNull();
    currentSession.value = session(['hr_admin']);
    expect(await destination()).toBeNull();
    currentSession.value = session(['org_admin']);
    expect(await destination()).toBeNull();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('admits an executive who also holds the manager role', async () => {
    currentSession.value = session(['executive_readonly', 'manager']);
    expect(await destination()).toBeNull();
  });
});
