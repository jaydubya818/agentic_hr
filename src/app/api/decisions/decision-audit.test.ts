import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import { getAuditLogs } from '@/services/audit-service';
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

describe('decision write audit trail', () => {
  beforeEach(() => {
    vi.mocked(getSessionContext).mockReset();
  });

  it('records an audit entry when a decision is created', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(managerSession());
    const before = getAuditLogs().length;

    const request = new Request('http://localhost/api/decisions', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Audit trail test decision',
        decisionType: 'team_composition',
        teamId: MOCK_IDS.teams.platform,
      }),
    });
    const response = await createDecision(request);
    expect(response.status).toBe(201);

    const entries = getAuditLogs().slice(before);
    const entry = entries.find((e) => e.action === 'decision.created');
    expect(entry).toBeDefined();
    expect(entry?.entityType).toBe('workforce_decision');
    expect(entry?.organizationId).toBe(MOCK_IDS.organization);
    expect(entry?.details.decisionType).toBe('team_composition');
  });

  it('does not record an audit entry when creation is forbidden', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(managerSession());
    const before = getAuditLogs().length;

    const request = new Request('http://localhost/api/decisions', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Forbidden audit test decision',
        decisionType: 'team_composition',
        teamId: MOCK_IDS.teams.product,
      }),
    });
    const response = await createDecision(request);
    expect(response.status).toBe(403);

    const entries = getAuditLogs().slice(before);
    expect(entries.filter((e) => e.action === 'decision.created')).toHaveLength(0);
  });
});
