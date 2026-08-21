import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import type { SessionContext } from '@/types/session';
import type { UserRole } from '@/lib/auth/types';
import { GET as getDecision } from './[id]/route';

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

function getQaReskilling() {
  return getDecision(new Request('http://localhost/api/decisions/x'), {
    params: Promise.resolve({ id: MOCK_IDS.decisions.qaReskilling }),
  });
}

describe('workforce decision detail read scoping', () => {
  beforeEach(() => {
    vi.mocked(getSessionContext).mockReset();
  });

  // SECURITY_AND_PRIVACY 6.1 gives `executive_readonly` "aggregated dashboards
  // only; no individual PII", and 6.2 Example 6 requires a 403 when that role
  // requests an individual's record. The detail payload names the decision
  // owner and every participant, so it is an individual read.
  it('denies executive_readonly, which may not read individual records', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(session(['executive_readonly']));
    expect((await getQaReskilling()).status).toBe(403);
  });

  it('still allows hr_admin, which may read individual records', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(session(['hr_admin']));
    const response = await getQaReskilling();
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      decision: { participants: unknown[] };
    };
    expect(body.decision.participants.length).toBeGreaterThan(0);
  });

  // Roles are additive: an executive who also holds a granting role keeps the
  // grant, so the denial above must key on the absence of a granting role
  // rather than the presence of `executive_readonly`.
  it('allows an executive who also holds hr_admin', async () => {
    vi.mocked(getSessionContext).mockResolvedValue(
      session(['executive_readonly', 'hr_admin']),
    );
    expect((await getQaReskilling()).status).toBe(200);
  });
});
