import { describe, expect, it, beforeEach } from 'vitest';
import { clearAuditLogs } from './audit-service';
import { createAgentRecommendations, validateRecommendationInput } from './recommendation-service';
import type { SessionContext } from '@/types/session';

const TEST_SESSION: SessionContext = {
  userId: '22222222-2222-4222-8222-222222222221',
  organizationId: '11111111-1111-4111-8111-111111111111',
  employeeId: '33333333-3333-4333-8333-333333333331',
  roles: ['employee'],
  activeRole: 'employee',
};

describe('recommendation-service', () => {
  beforeEach(() => {
    clearAuditLogs();
  });

  it('QM-05 validates recommendation schema with evidence', () => {
    const input = validateRecommendationInput({
      type: 'learning',
      title: 'Take the system design workshop',
      explanation:
        'This workshop closes a documented skill gap for your Staff Engineer development path.',
      confidence: 0.74,
      evidence: [
        {
          evidenceType: 'learning_resource',
          label: 'System Design Foundations',
          detail: 'Internal catalog',
        },
      ],
    });
    expect(input.confidence).toBe(0.74);
    expect(input.evidence).toHaveLength(1);
  });

  it('rejects recommendations without evidence', () => {
    expect(() =>
      validateRecommendationInput({
        type: 'learning',
        title: 'Take the system design workshop',
        explanation:
          'This workshop closes a documented skill gap for your Staff Engineer development path.',
        confidence: 0.74,
        evidence: [],
      }),
    ).toThrow();
  });

  it('creates agent recommendations with confidence levels', () => {
    const results = createAgentRecommendations({
      session: TEST_SESSION,
      agentId: 'employee-growth',
      employeeId: TEST_SESSION.employeeId!,
      inputs: [
        {
          type: 'career_path',
          title: 'Staff Engineer is a strong near-term path',
          explanation:
            'Your confirmed TypeScript and API design skills align with Staff Engineer requirements.',
          confidence: 0.82,
          evidence: [{ evidenceType: 'skill', label: 'TypeScript', detail: 'Confirmed' }],
        },
      ],
      governanceStatus: 'passed',
    });
    expect(results).toHaveLength(1);
    expect(results[0]?.confidenceLevel).toBe('high');
    expect(results[0]?.governanceStatus).toBe('passed');
  });
});
