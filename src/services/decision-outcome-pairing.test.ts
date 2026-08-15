import { describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import {
  compareExpectedToActual,
  createExpectedOutcome,
  recordActualOutcome,
} from '@/services/decision-outcome-service';
import { createWorkforceDecision } from '@/services/workforce-decision-service';
import type { SessionContext } from '@/types/session';

const session: SessionContext = {
  userId: MOCK_IDS.users.jordan,
  organizationId: MOCK_IDS.organization,
  employeeId: MOCK_IDS.employees.jordan,
  roles: ['employee', 'manager'],
  activeRole: 'manager',
};

function newDecision(title: string): string {
  return createWorkforceDecision(session, {
    title,
    description: 'Outcome pairing fixture',
    decisionType: 'skill_development',
    status: 'draft',
    teamId: MOCK_IDS.teams.platform,
  }).id;
}

describe('expected-to-actual outcome pairing', () => {
  it('does not pair unrelated outcomes just because both lack a metric label', () => {
    const decisionId = newDecision('Unlabelled outcome pairing');

    createExpectedOutcome(session, decisionId, { description: 'Ship the migration' });
    createExpectedOutcome(session, decisionId, { description: 'Close the review backlog' });
    recordActualOutcome(session, decisionId, {
      description: 'Something else entirely',
      status: 'achieved',
    });

    const comparisons = compareExpectedToActual(MOCK_IDS.organization, decisionId);
    expect(comparisons).toHaveLength(2);
    expect(comparisons.every((c) => c.actual === null)).toBe(true);
    expect(comparisons.every((c) => c.summary === 'No actual outcome recorded yet.')).toBe(true);
  });

  it('pairs on a shared metric label', () => {
    const decisionId = newDecision('Labelled outcome pairing');

    createExpectedOutcome(session, decisionId, {
      description: 'Raise coverage',
      metricLabel: 'coverage',
      targetValue: 80,
    });
    createExpectedOutcome(session, decisionId, {
      description: 'Raise throughput',
      metricLabel: 'throughput',
      targetValue: 10,
    });
    recordActualOutcome(session, decisionId, {
      description: 'Coverage result',
      metricLabel: 'coverage',
      metricValue: 85,
      status: 'achieved',
    });

    const comparisons = compareExpectedToActual(MOCK_IDS.organization, decisionId);
    const coverage = comparisons.find((c) => c.expected?.metricLabel === 'coverage');
    const throughput = comparisons.find((c) => c.expected?.metricLabel === 'throughput');

    expect(coverage?.actual?.metricLabel).toBe('coverage');
    expect(coverage?.metricDelta).toBe(5);
    expect(throughput?.actual).toBeNull();
  });

  it('still pairs positionally when there is exactly one of each', () => {
    const decisionId = newDecision('Single outcome pairing');

    createExpectedOutcome(session, decisionId, { description: 'Expected work' });
    recordActualOutcome(session, decisionId, {
      description: 'Actual work, worded differently',
      status: 'achieved',
    });

    const [comparison] = compareExpectedToActual(MOCK_IDS.organization, decisionId);
    expect(comparison?.actual?.description).toBe('Actual work, worded differently');
    expect(comparison?.summary).toBe('Actual outcome met or exceeded the expected target.');
  });
});
