import { describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import {
  compareExpectedToActual,
  createExpectedOutcome,
  recordActualOutcome,
} from '@/services/decision-outcome-service';
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

describe('decision-outcome-service comparison scoping', () => {
  it('excludes outcome rows from other organizations for the same decision id', () => {
    const morgan = makeSession({
      userId: MOCK_IDS.users.morgan,
      employeeId: MOCK_IDS.employees.morgan,
    });
    const decision = createWorkforceDecision(morgan, {
      title: 'Comparison scoping test',
      decisionType: 'skill_development',
      teamId: MOCK_IDS.teams.product,
    });
    const expected = createExpectedOutcome(morgan, decision.id, {
      description: 'Expected in-org outcome',
    });
    expect(expected).not.toBeNull();
    const actual = recordActualOutcome(morgan, decision.id, {
      description: 'Actual outcome',
    });
    expect(actual).not.toBeNull();
    // Simulate a foreign-org row carrying the same decision id.
    actual!.organizationId = '99999999-9999-4999-8999-999999999999';

    const comparisons = compareExpectedToActual(morgan.organizationId, decision.id);
    expect(comparisons).toHaveLength(1);
    // The foreign actual row must not pair with the in-org expected row.
    expect(comparisons[0]!.actual).toBeNull();
  });
});

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
