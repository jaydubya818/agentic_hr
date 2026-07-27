import { describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import { createExpectedOutcome, recordActualOutcome } from '@/services/decision-outcome-service';
import { createWorkforceDecision } from '@/services/workforce-decision-service';
import type { SessionContext } from '@/types/session';

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

describe('decision-outcome-service write scoping', () => {
  it('returns null for decisions outside the caller read scope', () => {
    const hr = makeSession({ roles: ['hr_admin'], activeRole: 'hr' });
    const decision = createWorkforceDecision(hr, {
      title: 'Outcome scoping test',
      decisionType: 'skill_development',
      teamId: MOCK_IDS.teams.product,
      ownerEmployeeId: MOCK_IDS.employees.morgan,
    });

    // Jordan manages platform, not product, and is not a participant.
    expect(
      recordActualOutcome(makeSession({}), decision.id, { description: 'Attempted write' }),
    ).toBeNull();
  });

  it('rejects outcome writes from a manager who is only a participant', () => {
    // Fixture decision qaReskilling (product team, owned by Morgan) lists
    // Sam as a reviewer participant. Participation grants read access, but
    // Sam neither owns the decision nor manages the product team.
    const samAsManager = makeSession({
      userId: MOCK_IDS.users.sam,
      employeeId: MOCK_IDS.employees.sam,
    });

    expect(() =>
      createExpectedOutcome(samAsManager, MOCK_IDS.decisions.qaReskilling, {
        description: 'Participant write attempt',
      }),
    ).toThrow('Forbidden');
  });

  it('allows the managing manager to record outcomes for a team decision', () => {
    const morgan = makeSession({
      userId: MOCK_IDS.users.morgan,
      employeeId: MOCK_IDS.employees.morgan,
    });
    const decision = createWorkforceDecision(morgan, {
      title: 'Managed team outcome test',
      decisionType: 'skill_development',
      teamId: MOCK_IDS.teams.product,
    });

    const outcome = recordActualOutcome(morgan, decision.id, {
      description: 'Coverage improved',
    });
    expect(outcome?.outcomeType).toBe('actual');
  });

  it('allows HR to record outcomes on any organization decision', () => {
    const hr = makeSession({ roles: ['hr_admin'], activeRole: 'hr' });
    const outcome = createExpectedOutcome(hr, MOCK_IDS.decisions.qaReskilling, {
      description: 'HR expected outcome',
    });
    expect(outcome?.outcomeType).toBe('expected');
  });
});
