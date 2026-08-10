import { describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import { getMockStore } from '@/services/data-provider/mock-provider';
import {
  getDecisionPatterns,
  getLearningSignalsForAgent,
  getOutcomePatternsByActionType,
  getRecommendationEffectiveness,
} from '@/services/organizational-learning-service';

const FOREIGN_ORG_ID = '99999999-9999-4999-8999-999999999999';

describe('organizational-learning-service', () => {
  it('aggregates decision patterns for the fixture organization', () => {
    const patterns = getDecisionPatterns(MOCK_IDS.organization);
    expect(patterns.length).toBeGreaterThan(0);
    for (const pattern of patterns) {
      expect(pattern.count).toBeGreaterThan(0);
      expect(pattern.avgConfidence).toBeGreaterThanOrEqual(0);
      expect(pattern.avgConfidence).toBeLessThanOrEqual(1);
    }
  });

  it('aggregates outcome patterns and recommendation effectiveness in range', () => {
    for (const pattern of getOutcomePatternsByActionType(MOCK_IDS.organization)) {
      expect(pattern.successRate).toBeGreaterThanOrEqual(0);
      expect(pattern.successRate).toBeLessThanOrEqual(1);
    }
    for (const item of getRecommendationEffectiveness(MOCK_IDS.organization)) {
      expect(item.acceptanceRate).toBeGreaterThanOrEqual(0);
      expect(item.acceptanceRate).toBeLessThanOrEqual(1);
    }
  });

  it('averages confidence only over decisions that record one', () => {
    const store = getMockStore();
    const timestamp = new Date().toISOString();
    const base = {
      organizationId: MOCK_IDS.organization,
      decisionType: 'internal_mobility_exploration' as const,
      status: 'draft' as const,
      teamId: null,
      businessPriorityId: null,
      ownerEmployeeId: null,
      description: null,
      rationale: null,
      metadata: {},
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const scored = {
      ...base,
      id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
      title: 'Scored decision',
      confidence: 0.8,
    };
    const unscored = {
      ...base,
      id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2',
      title: 'Unscored decision',
      confidence: null,
    };
    store.workforceDecisions.push(scored, unscored);
    try {
      const pattern = getDecisionPatterns(MOCK_IDS.organization).find(
        (p) => p.decisionType === 'internal_mobility_exploration',
      );
      expect(pattern?.count).toBe(2);
      // The unscored decision must not drag the average toward zero.
      expect(pattern?.avgConfidence).toBeCloseTo(0.8);
    } finally {
      store.workforceDecisions.splice(
        store.workforceDecisions.findIndex((d) => d.id === scored.id),
        1,
      );
      store.workforceDecisions.splice(
        store.workforceDecisions.findIndex((d) => d.id === unscored.id),
        1,
      );
    }
  });

  it('returns no aggregates for another organization (cross-org concealment)', () => {
    expect(getDecisionPatterns(FOREIGN_ORG_ID)).toEqual([]);
    expect(getOutcomePatternsByActionType(FOREIGN_ORG_ID)).toEqual([]);
    expect(getRecommendationEffectiveness(FOREIGN_ORG_ID)).toEqual([]);
    expect(getLearningSignalsForAgent(FOREIGN_ORG_ID)).toEqual([]);
  });

  it('emits learning signals grounded in fixture evidence', () => {
    const signals = getLearningSignalsForAgent(MOCK_IDS.organization);
    expect(signals.length).toBeGreaterThan(0);
    for (const signal of signals) {
      expect(signal.evidenceCount).toBeGreaterThan(0);
      expect(signal.insight.length).toBeGreaterThan(0);
    }
  });
});
