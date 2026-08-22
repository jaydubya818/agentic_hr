import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearAuditLogs,
  getAuditLogs,
  listAuditLogsForOrganization,
  logAgentInvocation,
  logAgentResponse,
  logAuditEvent,
  logRecommendationBlocked,
} from './audit-service';
import type { SessionContext } from '@/types/session';

const SESSION: SessionContext = {
  userId: '22222222-2222-4222-8222-222222222221',
  organizationId: '11111111-1111-4111-8111-111111111111',
  employeeId: '33333333-3333-4333-8333-333333333331',
  roles: ['employee'],
  activeRole: 'employee',
};

describe('audit-service', () => {
  beforeEach(() => {
    clearAuditLogs();
  });

  it('records agent responses with mode and governance status', () => {
    logAgentResponse({
      session: SESSION,
      agentId: 'employee-growth',
      responseMode: 'mock',
      governanceStatus: 'passed',
      responsePreview: 'Growth path summary',
    });
    const logs = getAuditLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]?.action).toBe('agent.response');
    expect(logs[0]?.details.responseMode).toBe('mock');
  });

  // `AUDIT_LOG_AGENT_CONTENT` is set explicitly rather than left to NODE_ENV so
  // this pins the production-shaped behaviour wherever the suite runs.
  it('records the scanned governance text as a digest, separately from the prompt', () => {
    const previous = process.env.AUDIT_LOG_AGENT_CONTENT;
    process.env.AUDIT_LOG_AGENT_CONTENT = 'false';
    try {
      logAgentInvocation({
        session: SESSION,
        agentId: 'employee-growth',
        message: 'How do I grow into a staff role?',
        governanceStatus: 'blocked',
        blocked: true,
        matchedPatterns: ['termination'],
        scannedContent: 'You should terminate this employee immediately.',
      });
      const details = getAuditLogs()[0]?.details as Record<string, string>;
      expect(details.scannedContentPreview).toMatch(/^sha256:[0-9a-f]{64}$/);
      // The verdict must be attributable to the text it was made about, which
      // is the agent's output -- not the employee's prompt.
      expect(details.scannedContentPreview).not.toBe(details.messagePreview);
      expect(JSON.stringify(details)).not.toContain('terminate this employee');
    } finally {
      if (previous === undefined) delete process.env.AUDIT_LOG_AGENT_CONTENT;
      else process.env.AUDIT_LOG_AGENT_CONTENT = previous;
    }
  });

  it('records blocked recommendations without exposing full prompts', () => {
    logRecommendationBlocked({
      session: SESSION,
      agentId: 'employee-growth',
      matchedPatterns: ['termination'],
    });
    const entry = getAuditLogs()[0];
    expect(entry?.action).toBe('recommendation.blocked');
    expect(entry?.details.matchedPatterns).toEqual(['termination']);
  });

  it('lists organization logs newest-first, matching the database read', async () => {
    logAuditEvent({ session: SESSION, action: 'first.event', entityType: 'user' });
    logAuditEvent({ session: SESSION, action: 'second.event', entityType: 'user' });
    const logs = await listAuditLogsForOrganization(SESSION.organizationId);
    expect(logs.map((l) => l.action)).toEqual(['second.event', 'first.event']);
  });
});
