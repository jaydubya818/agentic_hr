import { describe, expect, it } from 'vitest';

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
