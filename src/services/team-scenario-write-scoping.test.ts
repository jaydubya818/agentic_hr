import { describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import { createTeamScenario, updateTeamScenario } from '@/services/team-scenario-service';
import type { SessionContext } from '@/types/session';

const FOREIGN_TEAM_ID = 'ffffffff-ffff-4fff-8fff-fffffffffff1';

function makeSession(overrides: Partial<SessionContext>): SessionContext {
  return {
    userId: MOCK_IDS.users.jordan,
    organizationId: MOCK_IDS.organization,
    employeeId: MOCK_IDS.employees.jordan,
    roles: ['employee', 'manager'],
    activeRole: 'manager',
    ...overrides,
  };
}

function baseInput(teamId: string) {
  return {
    title: 'Scenario scoping test',
    teamId,
    scenarioType: 'future_state' as const,
  };
}

describe('team-scenario-service write scoping', () => {
  it('rejects creation for a team the manager does not manage', () => {
    expect(() => createTeamScenario(makeSession({}), baseInput(MOCK_IDS.teams.product))).toThrow(
      'Forbidden',
    );
  });

  it('rejects creation for a team outside the organization', () => {
    expect(() => createTeamScenario(makeSession({}), baseInput(FOREIGN_TEAM_ID))).toThrow(
      'Unknown team',
    );
  });

  it('rejects HR creation for an unknown team id', () => {
    expect(() =>
      createTeamScenario(
        makeSession({ roles: ['hr_admin'], activeRole: 'hr' }),
        baseInput(FOREIGN_TEAM_ID),
      ),
    ).toThrow('Unknown team');
  });

  it('allows a manager to create a scenario for a managed team', () => {
    const scenario = createTeamScenario(makeSession({}), baseInput(MOCK_IDS.teams.platform));
    expect(scenario.teamId).toBe(MOCK_IDS.teams.platform);
    expect(scenario.organizationId).toBe(MOCK_IDS.organization);
  });

  it('rejects retargeting an accessible scenario to an unmanaged team', () => {
    const session = makeSession({});
    const scenario = createTeamScenario(session, baseInput(MOCK_IDS.teams.platform));
    expect(() =>
      updateTeamScenario(session, scenario.id, { teamId: MOCK_IDS.teams.product }),
    ).toThrow('Forbidden');
  });

  it('allows HR to create a scenario for any organization team', () => {
    const scenario = createTeamScenario(
      makeSession({ roles: ['hr_admin'], activeRole: 'hr' }),
      baseInput(MOCK_IDS.teams.product),
    );
    expect(scenario.teamId).toBe(MOCK_IDS.teams.product);
  });
});
