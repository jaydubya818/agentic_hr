import { afterEach, describe, expect, it, vi } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import { AgentAccessError, invokeAgent } from '@/services/agent-service';
import type { SessionContext } from '@/types/session';
import type { UserRole } from '@/lib/auth/types';

const ORG_ID = MOCK_IDS.organization;

function buildSession(
  employeeId: string,
  roles: UserRole[],
  activeRole: SessionContext['activeRole'],
): SessionContext {
  return {
    userId: MOCK_IDS.users.alex,
    organizationId: ORG_ID,
    employeeId,
    roles,
    activeRole,
  };
}

describe('agent invocation employee-context scoping', () => {
  it('rejects an employee requesting another employee context', async () => {
    await expect(
      invokeAgent('employee-growth', {
        session: buildSession(MOCK_IDS.employees.alex, ['employee'], 'employee'),
        message: 'What should I focus on next?',
        context: { employeeId: MOCK_IDS.employees.morgan, contextType: 'growth-profile' },
      }),
    ).rejects.toBeInstanceOf(AgentAccessError);
  });

  it('rejects a manager requesting a non-direct-report context', async () => {
    await expect(
      invokeAgent('employee-growth', {
        session: buildSession(MOCK_IDS.employees.jordan, ['employee', 'manager'], 'manager'),
        message: 'What should this employee focus on next?',
        context: { employeeId: MOCK_IDS.employees.morgan, contextType: 'growth-profile' },
      }),
    ).rejects.toBeInstanceOf(AgentAccessError);
  });

  it('rejects an executive_readonly session targeting another employee', async () => {
    // SECURITY_AND_PRIVACY 6.1: aggregates only, no individual PII.
    await expect(
      invokeAgent('employee-growth', {
        session: buildSession(MOCK_IDS.employees.alex, ['executive_readonly'], 'employee'),
        message: 'What should this employee focus on next?',
        context: { employeeId: MOCK_IDS.employees.morgan, contextType: 'growth-profile' },
      }),
    ).rejects.toBeInstanceOf(AgentAccessError);
  });

  it('rejects an HR session targeting an employee in another organization', async () => {
    const session = buildSession(MOCK_IDS.employees.jordan, ['employee', 'hr_admin'], 'hr');
    await expect(
      invokeAgent('employee-growth', {
        session: { ...session, organizationId: '99999999-9999-4999-8999-999999999999' },
        message: 'What should this employee focus on next?',
        context: { employeeId: MOCK_IDS.employees.alex, contextType: 'growth-profile' },
      }),
    ).rejects.toBeInstanceOf(AgentAccessError);
  });

  it('allows an employee to use their own context', async () => {
    const result = await invokeAgent('employee-growth', {
      session: buildSession(MOCK_IDS.employees.alex, ['employee'], 'employee'),
      message: 'What should I focus on next?',
      context: { employeeId: MOCK_IDS.employees.alex, contextType: 'growth-profile' },
    });
    expect(result.agentId).toBe('employee-growth');
    expect(result.governanceBlocked).toBe(false);
  });

  it('allows a manager to use a direct-report context', async () => {
    const result = await invokeAgent('employee-growth', {
      session: buildSession(MOCK_IDS.employees.jordan, ['employee', 'manager'], 'manager'),
      message: 'What should this employee focus on next?',
      context: { employeeId: MOCK_IDS.employees.alex, contextType: 'growth-profile' },
    });
    expect(result.agentId).toBe('employee-growth');
  });

  it('allows HR to use any employee context', async () => {
    const result = await invokeAgent('employee-growth', {
      session: buildSession(MOCK_IDS.employees.alex, ['hr_admin'], 'hr'),
      message: 'What should this employee focus on next?',
      context: { employeeId: MOCK_IDS.employees.morgan, contextType: 'growth-profile' },
    });
    expect(result.agentId).toBe('employee-growth');
  });
});

describe('supermanager employee-context scoping without an employee record', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('falls back to the demo manager in mock mode', async () => {
    const result = await invokeAgent('supermanager', {
      session: buildSession(undefined as unknown as string, ['employee', 'manager'], 'manager'),
      message: 'How is my team doing?',
      context: { employeeId: MOCK_IDS.employees.alex, contextType: 'coaching' },
    });
    expect(result.agentId).toBe('supermanager');
  });

  it('denies access in live mode instead of using the demo-manager fallback', async () => {
    vi.stubEnv('USE_MOCK_DATA', 'false');
    await expect(
      invokeAgent('supermanager', {
        session: buildSession(undefined as unknown as string, ['employee', 'manager'], 'manager'),
        message: 'How is my team doing?',
        context: { employeeId: MOCK_IDS.employees.alex, contextType: 'coaching' },
      }),
    ).rejects.toBeInstanceOf(AgentAccessError);
  });
});

describe('agent grounding without an employee record', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('grounds on the demo employee in mock mode', async () => {
    const result = await invokeAgent('employee-growth', {
      session: buildSession(undefined as unknown as string, ['employee'], 'employee'),
      message: 'What should I focus on next?',
    });
    expect(result.metadata?.employeeId).toBe(MOCK_IDS.employees.alex);
  });

  it('denies invocation in live mode instead of grounding on demo fixtures', async () => {
    vi.stubEnv('USE_MOCK_DATA', 'false');
    await expect(
      invokeAgent('employee-growth', {
        session: buildSession(undefined as unknown as string, ['employee'], 'employee'),
        message: 'What should I focus on next?',
      }),
    ).rejects.toBeInstanceOf(AgentAccessError);
  });
});
