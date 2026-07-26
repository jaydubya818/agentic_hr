import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import type { SessionContext } from '@/types/session';
import { POST as createDecision } from './route';

vi.mock('@/lib/auth/session-context', () => ({
  getSessionContext: vi.fn(),
}));

import { getSessionContext } from '@/lib/auth/session-context';

function managerSession(): SessionContext {
  return {
    userId: MOCK_IDS.users.jordan,
    organizationId: MOCK_IDS.organization,
    employeeId: MOCK_IDS.employees.jordan,
    roles: ['employee', 'manager'],
    activeRole: 'manager',
  };
}

function postDecision(teamId: string) {
  const request = new Request('http://localhost/api/decisions', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Decision status-code test',
      decisionType: 'team_composition',
      teamId,
    }),
  });
  return createDecision(request);
}

describe('decisions API status codes', () => {
  beforeEach(() => {
    vi.mocked(getSessionContext).mockReset();
  });

  it('returns 403 when a manager targets a team they do not manage', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(managerSession());
    const response = await postDecision(MOCK_IDS.teams.product);
    expect(response.status).toBe(403);
  });

  it('returns 201 when a manager targets a managed team', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(managerSession());
    const response = await postDecision(MOCK_IDS.teams.platform);
    expect(response.status).toBe(201);
  });
});
