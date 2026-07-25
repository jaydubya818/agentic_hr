import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import type { SessionContext } from '@/types/session';
import { PATCH as updateAction } from './route';

// Fixture actions: 01 targets Alex (managed by Jordan); 04 has no target employee.
const ALEX_ACTION_ID = '16161616-1616-4161-8161-161616161601';
const PLAN_LEVEL_ACTION_ID = '16161616-1616-4161-8161-161616161604';

vi.mock('@/lib/auth/session-context', () => ({
  getSessionContext: vi.fn(),
}));

vi.mock('@/services/data-provider/workforce-intelligence-persistence', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/services/data-provider/workforce-intelligence-persistence')
  >()),
  updateAgentProposedActionInDb: vi.fn(() => Promise.resolve(false)),
}));

import { getSessionContext } from '@/lib/auth/session-context';

function buildSession(
  employeeId: string | undefined,
  roles: SessionContext['roles'],
): SessionContext {
  return {
    userId: MOCK_IDS.users.alex,
    organizationId: MOCK_IDS.organization,
    employeeId,
    roles,
    activeRole: 'employee',
  };
}

function patchRequest(id: string, status = 'pending_review') {
  const request = new Request(`http://localhost/api/agent-actions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return updateAction(request, { params: Promise.resolve({ id }) });
}

describe('agent-action status API scoping', () => {
  beforeEach(() => {
    vi.mocked(getSessionContext).mockReset();
  });

  it('returns 401 without a session', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(null);
    const response = await patchRequest(ALEX_ACTION_ID);
    expect(response.status).toBe(401);
  });

  it('forbids an unrelated employee from updating another employee action', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(
      buildSession(MOCK_IDS.employees.sam, ['employee']),
    );
    const response = await patchRequest(ALEX_ACTION_ID);
    expect(response.status).toBe(403);
  });

  it('forbids a manager who does not manage the target employee', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(
      buildSession(MOCK_IDS.employees.morgan, ['employee', 'manager']),
    );
    const response = await patchRequest(ALEX_ACTION_ID);
    expect(response.status).toBe(403);
  });

  it('allows the target employee to update their own action', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(
      buildSession(MOCK_IDS.employees.alex, ['employee']),
    );
    const response = await patchRequest(ALEX_ACTION_ID);
    expect(response.status).toBe(200);
  });

  it('allows the direct manager of the target employee', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(
      buildSession(MOCK_IDS.employees.jordan, ['employee', 'manager']),
    );
    const response = await patchRequest(ALEX_ACTION_ID);
    expect(response.status).toBe(200);
  });

  it('forbids a plain employee from updating a plan-level action', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(
      buildSession(MOCK_IDS.employees.alex, ['employee']),
    );
    const response = await patchRequest(PLAN_LEVEL_ACTION_ID);
    expect(response.status).toBe(403);
  });

  it('allows a manager to update a plan-level action', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(
      buildSession(MOCK_IDS.employees.jordan, ['employee', 'manager']),
    );
    const response = await patchRequest(PLAN_LEVEL_ACTION_ID);
    expect(response.status).toBe(200);
  });

  it('returns 404 for an action in another organization', async () => {
    vi.mocked(getSessionContext).mockResolvedValue({
      ...buildSession(MOCK_IDS.employees.alex, ['hr_admin']),
      organizationId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
    });
    const response = await patchRequest(ALEX_ACTION_ID);
    expect(response.status).toBe(404);
  });
});
