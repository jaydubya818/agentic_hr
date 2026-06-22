import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET as listAuditLogs } from './route';
import { GET as exportAuditLogs } from './export/route';

const mockSession = {
  userId: 'user-1',
  organizationId: 'org-1',
  employeeId: 'emp-1',
  roles: ['hr_admin'] as const,
  activeRole: 'hr' as const,
};

vi.mock('@/lib/auth/session-context', () => ({
  getSessionContext: vi.fn(),
}));

vi.mock('@/services/audit-service', () => ({
  listAuditLogsForOrganization: vi.fn(() => [
    {
      id: 'log-1',
      organizationId: 'org-1',
      userId: 'user-1',
      action: 'agent.invocation',
      entityType: 'agent',
      entityId: 'employee-growth',
      details: {},
      createdAt: '2026-06-08T00:00:00.000Z',
    },
  ]),
}));

import { getSessionContext } from '@/lib/auth/session-context';

describe('HR audit log API', () => {
  beforeEach(() => {
    vi.mocked(getSessionContext).mockReset();
  });

  it('returns 401 without session', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(null);
    const response = await listAuditLogs();
    expect(response.status).toBe(401);
  });

  it('returns 403 for manager role', async () => {
    vi.mocked(getSessionContext).mockResolvedValue({
      ...mockSession,
      roles: ['manager'],
      activeRole: 'manager',
    });
    const response = await listAuditLogs();
    expect(response.status).toBe(403);
  });

  it('returns logs for hr_admin', async () => {
    vi.mocked(getSessionContext).mockResolvedValue({
      ...mockSession,
      roles: ['hr_admin'],
    });
    const response = await listAuditLogs();
    expect(response.status).toBe(200);
    const body = (await response.json()) as { logs: unknown[] };
    expect(body.logs.length).toBe(1);
  });

  it('exports CSV for org_admin', async () => {
    vi.mocked(getSessionContext).mockResolvedValue({
      ...mockSession,
      roles: ['org_admin'],
    });
    const response = await exportAuditLogs();
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain('text/csv');
    const text = await response.text();
    expect(text).toContain('agent.invocation');
  });
});
