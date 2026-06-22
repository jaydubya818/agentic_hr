import { describe, expect, it, beforeEach } from 'vitest';
import { clearAuditLogs } from './audit-service';
import { invokeAgentWithRawOutput } from './agent-service';
import { validateAgentOutput } from './governance-service';
import type { SessionContext } from '@/types/session';

const TEST_SESSION: SessionContext = {
  userId: '22222222-2222-4222-8222-222222222221',
  organizationId: '11111111-1111-4111-8111-111111111111',
  employeeId: '33333333-3333-4333-8333-333333333331',
  roles: ['employee'],
  activeRole: 'employee',
};

describe('governance-service', () => {
  beforeEach(() => {
    clearAuditLogs();
  });

  it('GV-01 blocks output containing terminate', () => {
    const result = validateAgentOutput({
      responseText: 'You should terminate this employee immediately.',
    });
    expect(result.blocked).toBe(true);
    expect(result.matchedPatterns).toContain('termination');
    expect(result.safeResponse).toBeTruthy();
  });

  it('GV-02 passes clean development output', () => {
    const result = validateAgentOutput({
      responseText:
        'Based on your skills, Staff Engineer is a strong growth direction with development-focused next steps.',
      recommendations: [
        {
          type: 'career_path',
          title: 'Staff Engineer path looks strong',
          explanation:
            'Your confirmed TypeScript and API design skills align with Staff Engineer requirements in the catalog.',
          confidence: 0.82,
          evidence: [{ evidenceType: 'skill', label: 'TypeScript', detail: 'Confirmed skill' }],
        },
      ],
    });
    expect(result.passed).toBe(true);
    expect(result.blocked).toBe(false);
  });

  it('GV-03 blocks should be promoted language', () => {
    const result = validateAgentOutput({
      responseText: 'Alex should be promoted to Staff Engineer next quarter.',
    });
    expect(result.blocked).toBe(true);
    expect(result.matchedPatterns).toContain('promotion_decision');
  });

  it('GV-04 allows promotion-ready skills development framing', () => {
    const result = validateAgentOutput({
      responseText:
        'Focus on a growth path to promotion-ready skills through system design practice and mentoring.',
    });
    expect(result.blocked).toBe(false);
  });

  it('GV-05 flags low-confidence responses for human review', () => {
    const result = validateAgentOutput({
      responseText: 'Consider optional learning resources for API design practice.',
      responseConfidence: 0.3,
    });
    expect(result.blocked).toBe(false);
    expect(result.flagged).toBe(true);
    expect(result.humanReviewRequired).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('GV-06 blocks demotion language', () => {
    const result = validateAgentOutput({
      responseText: 'This employee should be demoted to a junior role.',
    });
    expect(result.blocked).toBe(true);
    expect(result.matchedPatterns).toContain('demotion');
  });
});

describe('agent governance pipeline', () => {
  beforeEach(() => {
    clearAuditLogs();
  });

  it('demo governance trigger blocks in invokeAgent', async () => {
    const { invokeAgent } = await import('./agent-service');
    const { DEMO_GOVERNANCE_BLOCK_TRIGGER } = await import('@/lib/governance/demo-triggers');
    const result = await invokeAgent('employee-growth', {
      session: TEST_SESSION,
      message: DEMO_GOVERNANCE_BLOCK_TRIGGER,
    });
    expect(result.governanceBlocked).toBe(true);
    expect(result.metadata.responseMode ?? result.metadata.mode).toBeDefined();
  });

  it('returns safe fallback when raw output is prohibited', async () => {
    const result = await invokeAgentWithRawOutput(
      'employee-growth',
      { session: TEST_SESSION, message: 'test' },
      'Consider termination for low performers on the team.',
    );
    expect(result.governanceBlocked).toBe(true);
    expect(result.recommendations).toHaveLength(0);
    expect(result.response).toContain('development and growth');
  });
});
