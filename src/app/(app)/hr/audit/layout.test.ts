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

const { default: HrAuditLayout } = await import('./layout');

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
    await HrAuditLayout({ children: 'audit page' });
    return null;
  } catch (error) {
    const message = (error as Error).message;
    if (!message.startsWith('REDIRECT:')) throw error;
    return message.slice('REDIRECT:'.length);
  }
}

describe('/hr/audit route gate', () => {
  beforeEach(() => {
    redirect.mockClear();
  });

  it('sends an unauthenticated request to /login', async () => {
    currentSession.value = null;
    expect(await destination()).toBe('/login');
  });

  /**
   * The regression this pins: `(app)/hr/layout.tsx` gates the HR subtree on
   * `canReadOrganizationWorkforceData`, which admits `executive_readonly`, but
   * `canReadAuditLogs` denies it and `/api/hr/audit-logs` answers 403. Before
   * this gate existed the role could open the page and only find out at fetch
   * time.
   */
  it('sends executive_readonly to /forbidden even though it clears the HR subtree gate', async () => {
    currentSession.value = session(['executive_readonly']);
    expect(await destination()).toBe('/forbidden');
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

  it('admits an executive who also holds an audit-reading role', async () => {
    currentSession.value = session(['executive_readonly', 'hr_admin']);
    expect(await destination()).toBeNull();
  });
});
