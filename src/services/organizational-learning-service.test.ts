import { describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
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
