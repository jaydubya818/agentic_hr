import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import type { SessionContext } from '@/types/session';
import { GET as listPlans } from './route';

vi.mock('@/lib/auth/session-context', () => ({
  getSessionContext: vi.fn(),
}));

import { getSessionContext } from '@/lib/auth/session-context';

function buildSession(
  employeeId: string | undefined,
  roles: SessionContext['roles'],
  activeRole: SessionContext['activeRole'],
): SessionContext {
  return {
    userId: MOCK_IDS.users.alex,
    organizationId: MOCK_IDS.organization,
    employeeId,
    roles,
    activeRole,
  };
}

async function fetchPlanIds(): Promise<string[]> {
  const response = await listPlans();
  expect(response.status).toBe(200);
  const body = (await response.json()) as { plans: Array<{ id: string }> };
  return body.plans.map((p) => p.id);
}

describe('agent-actions list API scoping', () => {
  beforeEach(() => {
    vi.mocked(getSessionContext).mockReset();
  });

  it('returns 401 without a session', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(null);
    const response = await listPlans();
    expect(response.status).toBe(401);
  });

  it('returns every organization plan for an org-wide role', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(
      buildSession(MOCK_IDS.employees.sam, ['hr_admin'], 'hr'),
    );
    const ids = await fetchPlanIds();
    expect(ids).toEqual(
      expect.arrayContaining([
        MOCK_IDS.actionPlans.employeeGrowth,
        MOCK_IDS.actionPlans.supermanager,
      ]),
    );
  });

  it('returns team and direct-report plans for a manager', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(
      buildSession(MOCK_IDS.employees.jordan, ['employee', 'manager'], 'manager'),
    );
    const ids = await fetchPlanIds();
    expect(ids).toEqual(
      expect.arrayContaining([
        MOCK_IDS.actionPlans.employeeGrowth,
        MOCK_IDS.actionPlans.supermanager,
      ]),
    );
  });

  it('returns only plans involving the employee for an employee role', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(
      buildSession(MOCK_IDS.employees.alex, ['employee'], 'employee'),
    );
    const ids = await fetchPlanIds();
    expect(ids).toContain(MOCK_IDS.actionPlans.employeeGrowth);
  });

  it('returns no plans for an unrelated employee', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(
      buildSession(MOCK_IDS.employees.sam, ['employee'], 'employee'),
    );
    const ids = await fetchPlanIds();
    expect(ids).toEqual([]);
  });
});
