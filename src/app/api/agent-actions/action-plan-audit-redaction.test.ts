import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import type { SessionContext } from '@/types/session';
import { clearAuditLogs, getAuditLogs } from '@/services/audit-service';
import { POST as createActionPlan } from './route';

/**
 * Governance-blocked action plans must not write their own free text into the
 * audit trail in clear.
 *
 * `validateActionPlan` interpolates the caller's text into its error strings
 * ("Prohibited language detected in action plan: <title>"), and this route
 * logs `validation.errors` into `audit_logs.details`. Every other agent text
 * that reaches the trail goes through `agentContentForAudit` first, which
 * SECURITY_AND_PRIVACY 8.2 requires: a readable preview outside production, a
 * stable `sha256:` digest inside it. The blocked-plan path did not, so the one
 * string the filter has just judged too sensitive to render was the one stored
 * verbatim -- and `hr_admin` can read and CSV-export the audit trail.
 *
 * `logAgentInvocation` already handles the analogous agent-response case
 * correctly: on a block it records `scannedContent` through the redactor and
 * keeps `matchedPatterns` as the structured reason. This route now matches it,
 * keeping `blockedActionTypes` as the structured reason.
 */

vi.mock('@/lib/auth/session-context', () => ({
  getSessionContext: vi.fn(),
}));

vi.mock('@/services/data-provider/workforce-intelligence-persistence', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/services/data-provider/workforce-intelligence-persistence')
  >()),
  persistAgentActionPlan: vi.fn(() => Promise.resolve(false)),
}));

import { getSessionContext } from '@/lib/auth/session-context';

const SENSITIVE_TITLE = 'Termination plan for Alex Chen after the Q3 review';

function hrSession(): SessionContext {
  return {
    userId: MOCK_IDS.users.alex,
    organizationId: MOCK_IDS.organization,
    employeeId: MOCK_IDS.employees.alex,
    roles: ['employee', 'hr_admin'],
    activeRole: 'hr',
  };
}

function postBlockedPlan() {
  const request = new Request('http://localhost/api/agent-actions', {
    method: 'POST',
    body: JSON.stringify({
      agentId: 'supermanager',
      employeeId: MOCK_IDS.employees.alex,
      teamId: null,
      title: SENSITIVE_TITLE,
      summary: null,
      sourceDecisionId: null,
      actions: [
        {
          actionType: 'coaching_prompt',
          title: 'Prepare a growth conversation',
          description: null,
          status: 'draft',
          targetEmployeeId: MOCK_IDS.employees.alex,
          referenceId: null,
          confidence: 0.8,
          explanation: null,
          metadata: {},
        },
      ],
    }),
  });
  return createActionPlan(request);
}

function blockedEntryDetails() {
  const entry = getAuditLogs().find((log) => log.action === 'action_plan_blocked');
  expect(entry, 'expected an action_plan_blocked audit entry').toBeDefined();
  return entry!.details;
}

describe('a blocked action plan does not log its own prohibited text in clear', () => {
  const original = process.env.AUDIT_LOG_AGENT_CONTENT;

  beforeEach(() => {
    vi.mocked(getSessionContext).mockReset();
    vi.mocked(getSessionContext).mockResolvedValue(hrSession());
    clearAuditLogs();
  });

  afterEach(() => {
    if (original === undefined) delete process.env.AUDIT_LOG_AGENT_CONTENT;
    else process.env.AUDIT_LOG_AGENT_CONTENT = original;
  });

  it('rejects the plan', async () => {
    process.env.AUDIT_LOG_AGENT_CONTENT = 'false';
    const response = await postBlockedPlan();
    expect(response.status).toBe(400);
  });

  // The regression case. Red before the fix: `details.errors` carried
  // "Prohibited language detected in action plan: Termination plan for Alex
  // Chen after the Q3 review" verbatim, whatever the redaction setting.
  it('stores a digest rather than the title when content logging is off', async () => {
    process.env.AUDIT_LOG_AGENT_CONTENT = 'false';
    await postBlockedPlan();

    const details = blockedEntryDetails();
    expect(JSON.stringify(details)).not.toContain(SENSITIVE_TITLE);
    expect(JSON.stringify(details)).not.toContain('Alex Chen');

    const errors = details.errors as string[];
    expect(errors.length).toBeGreaterThan(0);
    for (const error of errors) {
      expect(error).toMatch(/^sha256:[0-9a-f]{64}$/);
    }
  });

  it('keeps the structured reason next to the redacted text', async () => {
    process.env.AUDIT_LOG_AGENT_CONTENT = 'false';
    await postBlockedPlan();

    const details = blockedEntryDetails();
    // `agentId` and `blockedActionTypes` are the audit trail's answer to
    // "why", and neither is caller free text, so both survive redaction --
    // mirroring `matchedPatterns` on the agent-invocation path.
    expect(details.agentId).toBe('supermanager');
    expect(details.blockedActionTypes).toEqual([]);
  });

  // The demo audit walkthrough (EVALS_AND_GOVERNANCE 14.1) relies on readable
  // entries outside production, so the opt-in must still produce them.
  it('keeps the readable preview when content logging is explicitly enabled', async () => {
    process.env.AUDIT_LOG_AGENT_CONTENT = 'true';
    await postBlockedPlan();

    const errors = blockedEntryDetails().errors as string[];
    expect(errors.some((error) => error.includes(SENSITIVE_TITLE))).toBe(true);
  });
});
