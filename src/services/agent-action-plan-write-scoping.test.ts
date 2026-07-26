import { describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import { createActionPlanFromInput } from '@/services/agent-action-service';
import type { SessionContext } from '@/types/session';

const FOREIGN_EMPLOYEE_ID = 'ffffffff-ffff-4fff-8fff-fffffffffff2';
const FOREIGN_TEAM_ID = 'ffffffff-ffff-4fff-8fff-fffffffffff1';

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

function makeAction(targetEmployeeId: string | null) {
  return {
    actionType: 'skill_development' as const,
    title: 'Deepen system design skills',
    description: null,
    status: 'draft' as const,
    targetEmployeeId,
    referenceId: null,
    confidence: 0.8,
    explanation: null,
    metadata: {},
  };
}

function makePlanInput(overrides: Record<string, unknown> = {}) {
  return {
    agentId: 'employee-growth',
    title: 'Growth plan scoping test',
    ...overrides,
  };
}

describe('agent-action-plan write scoping', () => {
  it('allows an employee to create a plan for themselves', () => {
    const plan = createActionPlanFromInput(
      makeSession({}),
      makePlanInput({ employeeId: MOCK_IDS.employees.alex }),
      [makeAction(MOCK_IDS.employees.alex)],
    );
    expect(plan.employeeId).toBe(MOCK_IDS.employees.alex);
    expect(plan.organizationId).toBe(MOCK_IDS.organization);
  });

  it('rejects an employee creating a plan for another employee', () => {
    expect(() =>
      createActionPlanFromInput(
        makeSession({}),
        makePlanInput({ employeeId: MOCK_IDS.employees.morgan }),
        [],
      ),
    ).toThrow('Forbidden');
  });

  it('rejects an employee targeting another employee via a proposed action', () => {
    expect(() =>
      createActionPlanFromInput(makeSession({}), makePlanInput(), [
        makeAction(MOCK_IDS.employees.morgan),
      ]),
    ).toThrow('Forbidden');
  });

  it('allows a manager to create a plan for a direct report', () => {
    const plan = createActionPlanFromInput(
      makeSession({
        userId: MOCK_IDS.users.jordan,
        employeeId: MOCK_IDS.employees.jordan,
        roles: ['employee', 'manager'],
        activeRole: 'manager',
      }),
      makePlanInput({ employeeId: MOCK_IDS.employees.alex }),
      [makeAction(MOCK_IDS.employees.alex)],
    );
    expect(plan.employeeId).toBe(MOCK_IDS.employees.alex);
  });

  it('rejects a manager targeting an employee outside their reports', () => {
    expect(() =>
      createActionPlanFromInput(
        makeSession({
          userId: MOCK_IDS.users.jordan,
          employeeId: MOCK_IDS.employees.jordan,
          roles: ['employee', 'manager'],
          activeRole: 'manager',
        }),
        makePlanInput(),
        [makeAction(MOCK_IDS.employees.morgan)],
      ),
    ).toThrow('Forbidden');
  });

  it('rejects a manager creating a plan for a team they do not manage', () => {
    expect(() =>
      createActionPlanFromInput(
        makeSession({
          userId: MOCK_IDS.users.jordan,
          employeeId: MOCK_IDS.employees.jordan,
          roles: ['employee', 'manager'],
          activeRole: 'manager',
        }),
        makePlanInput({ teamId: MOCK_IDS.teams.product }),
        [],
      ),
    ).toThrow('Forbidden');
  });

  it('rejects a plan for a team outside the organization', () => {
    expect(() =>
      createActionPlanFromInput(makeSession({}), makePlanInput({ teamId: FOREIGN_TEAM_ID }), []),
    ).toThrow('Unknown team');
  });

  it('rejects a plan for an employee outside the organization', () => {
    expect(() =>
      createActionPlanFromInput(
        makeSession({ roles: ['hr_admin'], activeRole: 'hr' }),
        makePlanInput({ employeeId: FOREIGN_EMPLOYEE_ID }),
        [],
      ),
    ).toThrow('Unknown employee');
  });

  it('allows an org-wide role to create plans across teams and employees', () => {
    const plan = createActionPlanFromInput(
      makeSession({ roles: ['hr_admin'], activeRole: 'hr' }),
      makePlanInput({ teamId: MOCK_IDS.teams.product, employeeId: MOCK_IDS.employees.morgan }),
      [makeAction(MOCK_IDS.employees.morgan)],
    );
    expect(plan.teamId).toBe(MOCK_IDS.teams.product);
  });
});
