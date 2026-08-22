import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import type { SessionContext } from '@/types/session';
import type { UserRole } from '@/lib/auth/types';
import { GET as getTeamContext } from './team/[id]/route';

vi.mock('@/lib/auth/session-context', () => ({
  getSessionContext: vi.fn(),
}));

import { getSessionContext } from '@/lib/auth/session-context';

// The route authorizes on `roles`; `activeRole` is the demo-switcher value and
// has no bearing on this check, so it is held constant.
function session(roles: UserRole[]): SessionContext {
  return {
    userId: MOCK_IDS.users.jordan,
    organizationId: MOCK_IDS.organization,
    roles,
    activeRole: 'hr',
  };
}

function getProductTeamContext() {
  return getTeamContext(new Request('http://localhost/api/context/team/x'), {
    params: Promise.resolve({ id: MOCK_IDS.teams.product }),
  });
}

interface GraphBody {
  graph: { nodes: Array<{ entityType: string; label: string }> };
}

describe('team context graph read scoping', () => {
  beforeEach(() => {
    vi.mocked(getSessionContext).mockReset();
  });

  // SECURITY_AND_PRIVACY 6.1 gives `executive_readonly` "aggregated dashboards
  // only; no individual PII", and 6.2 Example 6 requires a 403 when that role
  // requests an individual's record. This route used to authorize on
  // `canReadOrganizationWorkforceData`, which admits the role.
  it('denies executive_readonly, which may not read individual records', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(session(['executive_readonly']));
    expect((await getProductTeamContext()).status).toBe(403);
  });

  // The reason the denial matters: the graph is not anonymous. If this
  // assertion ever fails because the payload stopped naming people, the
  // denial above can be revisited rather than silently kept.
  it('still names individual employees in the payload it protects', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(session(['hr_admin']));
    const response = await getProductTeamContext();
    expect(response.status).toBe(200);
    const body = (await response.json()) as GraphBody;
    const people = body.graph.nodes.filter((n) => n.entityType === 'employee');
    expect(people.length).toBeGreaterThan(0);
    // A resolved full name, not a bare UUID fallback.
    expect(people[0]!.label).not.toMatch(/^[0-9a-f-]{36}$/);
  });

  // Roles are additive: an executive who also holds a granting role keeps the
  // grant, so the denial must key on the absence of a granting role rather
  // than the presence of `executive_readonly`.
  it('allows an executive who also holds hr_admin', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(session(['executive_readonly', 'hr_admin']));
    expect((await getProductTeamContext()).status).toBe(200);
  });

  // The manager path is unchanged by the gate swap: a manager still reaches
  // only their own team, and is still refused another manager's team.
  it('allows a manager their own team and refuses another team', async () => {
    // Morgan manages the Product team (data/mock/teams.json); Jordan manages
    // Platform, so Jordan is a manager who is nonetheless out of scope here.
    vi.mocked(getSessionContext).mockResolvedValue({
      ...session(['manager']),
      employeeId: MOCK_IDS.employees.morgan,
    });
    expect((await getProductTeamContext()).status).toBe(200);

    vi.mocked(getSessionContext).mockResolvedValue({
      ...session(['manager']),
      employeeId: MOCK_IDS.employees.jordan,
    });
    expect((await getProductTeamContext()).status).toBe(403);
  });
});
