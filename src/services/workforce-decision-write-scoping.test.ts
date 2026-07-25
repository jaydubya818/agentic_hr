import { describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import {
  createWorkforceDecision,
  updateWorkforceDecision,
} from '@/services/workforce-decision-service';
import type { SessionContext } from '@/types/session';

const FOREIGN_ID = 'ffffffff-ffff-4fff-8fff-fffffffffff2';

function makeSession(overrides: Partial<SessionContext>): SessionContext {
  return {
    userId: MOCK_IDS.users.jordan,
    organizationId: MOCK_IDS.organization,
    employeeId: MOCK_IDS.employees.jordan,
    roles: ['employee', 'manager'],
    activeRole: 'manager',
    ...overrides,
  };
}

function baseInput(extra: { teamId?: string; ownerEmployeeId?: string } = {}) {
  return {
    title: 'Decision scoping test',
    decisionType: 'skill_development' as const,
    ...extra,
  };
}

describe('workforce-decision-service write scoping', () => {
  it('rejects creation with a team the manager does not manage', () => {
    expect(() =>
      createWorkforceDecision(makeSession({}), baseInput({ teamId: MOCK_IDS.teams.product })),
    ).toThrow('Forbidden');
  });

  it('rejects creation with a team outside the organization', () => {
    expect(() =>
      createWorkforceDecision(makeSession({}), baseInput({ teamId: FOREIGN_ID })),
    ).toThrow('Unknown team');
  });

  it('rejects creation with an owner outside the organization', () => {
    expect(() =>
      createWorkforceDecision(makeSession({}), baseInput({ ownerEmployeeId: FOREIGN_ID })),
    ).toThrow('Unknown owner');
  });

  it('allows a manager to create a decision for a managed team', () => {
    const decision = createWorkforceDecision(
      makeSession({}),
      baseInput({ teamId: MOCK_IDS.teams.platform }),
    );
    expect(decision.teamId).toBe(MOCK_IDS.teams.platform);
    expect(decision.ownerEmployeeId).toBe(MOCK_IDS.employees.jordan);
  });

  it('rejects retargeting an accessible decision to an unmanaged team', () => {
    const session = makeSession({});
    const decision = createWorkforceDecision(
      session,
      baseInput({ teamId: MOCK_IDS.teams.platform }),
    );
    expect(() =>
      updateWorkforceDecision(session, decision.id, { teamId: MOCK_IDS.teams.product }),
    ).toThrow('Forbidden');
  });

  it('allows HR to create a decision for any organization team', () => {
    const decision = createWorkforceDecision(
      makeSession({ roles: ['hr_admin'], activeRole: 'hr' }),
      baseInput({ teamId: MOCK_IDS.teams.product, ownerEmployeeId: MOCK_IDS.employees.morgan }),
    );
    expect(decision.teamId).toBe(MOCK_IDS.teams.product);
    expect(decision.ownerEmployeeId).toBe(MOCK_IDS.employees.morgan);
  });
});
