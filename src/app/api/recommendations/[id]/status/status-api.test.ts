import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import type { SessionContext } from '@/types/session';
import { PATCH as updateStatus } from './route';

// Recommendation owned by Alex (managed by Jordan) in the mock fixtures.
const ALEX_RECOMMENDATION_ID = 'ffffffff-ffff-4fff-8fff-fffffffffff1';

vi.mock('@/lib/auth/session-context', () => ({
  getSessionContext: vi.fn(),
}));

vi.mock('@/services/data-provider/supabase-persistence', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/data-provider/supabase-persistence')>()),
  updateRecommendationStatusInDb: vi.fn(() => Promise.resolve(false)),
}));

import { getSessionContext } from '@/lib/auth/session-context';

function buildSession(employeeId: string | undefined, roles: SessionContext['roles']): SessionContext {
  return {
    userId: MOCK_IDS.users.alex,
    organizationId: MOCK_IDS.organization,
    employeeId,
    roles,
    activeRole: 'employee',
  };
}

function patchRequest(id: string, status = 'accepted') {
  const request = new Request(`http://localhost/api/recommendations/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return updateStatus(request, { params: Promise.resolve({ id }) });
}

describe('recommendation status API scoping', () => {
  beforeEach(() => {
    vi.mocked(getSessionContext).mockReset();
  });

  it('returns 401 without a session', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(null);
    const response = await patchRequest(ALEX_RECOMMENDATION_ID);
    expect(response.status).toBe(401);
  });

  it('rejects an unrelated employee updating another employee recommendation', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(
      buildSession(MOCK_IDS.employees.morgan, ['employee']),
    );
    const response = await patchRequest(ALEX_RECOMMENDATION_ID);
    expect(response.status).toBe(403);
  });

  it('hides recommendations from sessions in another organization', async () => {
    vi.mocked(getSessionContext).mockResolvedValue({
      ...buildSession(undefined, ['hr_admin']),
      organizationId: '99999999-0000-4000-8000-000000000000',
    });
    const response = await patchRequest(ALEX_RECOMMENDATION_ID);
    expect(response.status).toBe(404);
  });

  it('allows the owning employee to update their recommendation', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(
      buildSession(MOCK_IDS.employees.alex, ['employee']),
    );
    const response = await patchRequest(ALEX_RECOMMENDATION_ID, 'dismissed');
    expect(response.status).toBe(200);
  });

  it('allows the direct manager to update a report recommendation', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(
      buildSession(MOCK_IDS.employees.jordan, ['employee', 'manager']),
    );
    const response = await patchRequest(ALEX_RECOMMENDATION_ID);
    expect(response.status).toBe(200);
  });

  it('allows HR to update any in-organization recommendation', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(buildSession(undefined, ['hr_admin']));
    const response = await patchRequest(ALEX_RECOMMENDATION_ID);
    expect(response.status).toBe(200);
  });

  it('still rejects invalid statuses', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(
      buildSession(MOCK_IDS.employees.alex, ['employee']),
    );
    const response = await patchRequest(ALEX_RECOMMENDATION_ID, 'archived');
    expect(response.status).toBe(400);
  });
});
