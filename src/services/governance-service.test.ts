import { describe, expect, it, beforeEach } from 'vitest';
import { clearAuditLogs } from './audit-service';
import { invokeAgentWithRawOutput } from './agent-service';
import {
  HUMAN_IN_THE_LOOP_MESSAGE,
  validateAgentOutput,
  withHumanReviewNotice,
} from './governance-service';
import { MAX_AGENT_RESPONSE_LENGTH } from '@/lib/ai/schemas/agent-response';
import type { SessionContext } from '@/types/session';

const TEST_SESSION: SessionContext = {
  userId: '22222222-2222-4222-8222-222222222221',
  organizationId: '11111111-1111-4111-8111-111111111111',
  employeeId: '33333333-3333-4333-8333-333333333331',
  roles: ['employee'],
  activeRole: 'employee',
};

describe('withHumanReviewNotice', () => {
  it('appends the reminder to a short reply', () => {
    const result = withHumanReviewNotice('Focus on system design depth.');
    expect(result).toBe(`Focus on system design depth.\n\n${HUMAN_IN_THE_LOOP_MESSAGE}`);
  });

  it('keeps a maximum-length reply within the cap the invoke route enforces', () => {
    const atCap = 'a'.repeat(MAX_AGENT_RESPONSE_LENGTH);
    const result = withHumanReviewNotice(atCap);
    expect(result.length).toBeLessThanOrEqual(MAX_AGENT_RESPONSE_LENGTH);
    expect(result.endsWith(HUMAN_IN_THE_LOOP_MESSAGE)).toBe(true);
  });
});

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

  it('GV-05 flags the whole low-confidence band, not just below 0.4', () => {
    // EVALS_AND_GOVERNANCE 7.2 puts the low band at 0.00-0.49 and 8.1 asks
    // for human review under 0.5, so 0.45 must not pass unflagged while the
    // UI renders it as low confidence.
    const result = validateAgentOutput({
      responseText: 'Consider optional learning resources for API design practice.',
      responseConfidence: 0.45,
    });
    expect(result.flagged).toBe(true);
    expect(result.humanReviewRequired).toBe(true);
  });

  it('GV-05 leaves the medium band unflagged', () => {
    const result = validateAgentOutput({
      responseText: 'Consider optional learning resources for API design practice.',
      responseConfidence: 0.5,
    });
    expect(result.flagged).toBe(false);
    expect(result.humanReviewRequired).toBe(false);
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

  it('demo governance trigger leaves blocked audit-trail entries', async () => {
    const { invokeAgent } = await import('./agent-service');
    const { DEMO_GOVERNANCE_BLOCK_TRIGGER } = await import('@/lib/governance/demo-triggers');
    const { getAuditLogs } = await import('./audit-service');
    await invokeAgent('employee-growth', {
      session: TEST_SESSION,
      message: DEMO_GOVERNANCE_BLOCK_TRIGGER,
    });
    const actions = getAuditLogs().map((entry) => entry.action);
    expect(actions).toContain('agent.invocation.blocked');
    expect(actions).toContain('recommendation.blocked');
  });

  // The blocked path returns before `logAgentResponse`, so the output that was
  // actually blocked used to reach no audit event at all: the entry named the
  // matched pattern, and its only content field was a digest of the employee's
  // prompt -- a different string from the one the filter judged. A reviewer
  // could see that a block happened but not what it was about.
  it('records the blocked output, not just the prompt, on a blocked invocation', async () => {
    const { invokeAgent } = await import('./agent-service');
    const { DEMO_GOVERNANCE_BLOCK_TRIGGER } = await import('@/lib/governance/demo-triggers');
    const { getAuditLogs } = await import('./audit-service');
    await invokeAgent('employee-growth', {
      session: TEST_SESSION,
      message: DEMO_GOVERNANCE_BLOCK_TRIGGER,
    });
    const blocked = getAuditLogs().find((e) => e.action === 'agent.invocation.blocked');
    const details = blocked?.details as Record<string, string | undefined>;
    expect(details.scannedContentPreview).toBeDefined();
    // The scanned form is the agent's output; the prompt is the trigger phrase.
    // If these ever coincide the wrong string is being recorded.
    expect(details.scannedContentPreview).not.toBe(details.messagePreview);
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
