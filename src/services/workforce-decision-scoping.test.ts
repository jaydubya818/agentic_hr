import { describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import { getMockStore } from '@/services/data-provider/mock-provider';
import {
  getWorkforceDecision,
  listWorkforceDecisions,
} from '@/services/workforce-decision-service';
import type { SessionContext } from '@/types/session';

function makeSession(overrides: Partial<SessionContext>): SessionContext {
  return {
    userId: MOCK_IDS.users.alex,
    organizationId: MOCK_IDS.organization,
    employeeId: MOCK_IDS.employees.alex,
    roles: ['employee'],
    activeRole: 'employee',
    ...overrides,
  };
}

describe('workforce-decision-service session scoping', () => {
  it('returns no decisions for a plain employee session', () => {
    const decisions = listWorkforceDecisions(makeSession({ roles: ['employee'] }));
    expect(decisions).toHaveLength(0);
  });

  it('returns only organization decisions for an HR session', () => {
    const decisions = listWorkforceDecisions(
      makeSession({ roles: ['hr_admin'], activeRole: 'hr' }),
    );
    expect(decisions.length).toBeGreaterThan(0);
    expect(decisions.every((d) => d.organizationId === MOCK_IDS.organization)).toBe(true);
  });

  it('returns nothing for an HR session from another organization', () => {
    const decisions = listWorkforceDecisions(
      makeSession({
        roles: ['hr_admin'],
        activeRole: 'hr',
        organizationId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
      }),
    );
    expect(decisions).toHaveLength(0);
  });

  it('excludes another organization\'s detail rows recorded against the same decision id', () => {
    const store = getMockStore();
    const decisionId = '99999999-9999-4999-8999-999999999991';
    const timestamp = new Date().toISOString();
    const foreignOutcome = {
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
      organizationId: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
      decisionId,
      outcomeType: 'actual' as const,
      description: 'Foreign-organization outcome for the same decision id',
      status: 'achieved' as const,
      metricLabel: null,
      metricValue: null,
      targetValue: null,
      recordedAt: timestamp,
      recordedByEmployeeId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.decisionOutcomes.push(foreignOutcome);
    try {
      const detail = getWorkforceDecision(
        makeSession({ roles: ['hr_admin'], activeRole: 'hr' }),
        decisionId,
      );
      expect(detail).not.toBeNull();
      expect(detail!.outcomes.some((o) => o.id === foreignOutcome.id)).toBe(false);
      expect(
        detail!.outcomes.every((o) => o.organizationId === MOCK_IDS.organization),
      ).toBe(true);
    } finally {
      store.decisionOutcomes.splice(
        store.decisionOutcomes.findIndex((o) => o.id === foreignOutcome.id),
        1,
      );
    }
  });

  it('limits a manager to owned, team, or participant decisions', () => {
    const decisions = listWorkforceDecisions(
      makeSession({
        userId: MOCK_IDS.users.jordan,
        employeeId: MOCK_IDS.employees.jordan,
        roles: ['employee', 'manager'],
        activeRole: 'manager',
      }),
    );
    expect(decisions.every((d) => d.organizationId === MOCK_IDS.organization)).toBe(true);
  });
});
