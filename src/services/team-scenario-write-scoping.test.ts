import { describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import { getMockStore } from '@/services/data-provider/mock-provider';
import { createTeamScenario, updateTeamScenario } from '@/services/team-scenario-service';
import type { SessionContext } from '@/types/session';

const FOREIGN_TEAM_ID = 'ffffffff-ffff-4fff-8fff-fffffffffff1';
const FOREIGN_ORGANIZATION_ID = 'ffffffff-ffff-4fff-8fff-fffffffffff9';

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

  it('rejects executive_readonly creation: the role is read-only', () => {
    // PILOT_PERSISTENCE_RELEASE 6: "Read-only, aggregate-first access".
    // executive_readonly shares the aggregate read predicate with HR, so a
    // write gate built on that predicate handed it create access.
    expect(() =>
      createTeamScenario(
        makeSession({ roles: ['executive_readonly'], employeeId: undefined }),
        baseInput(MOCK_IDS.teams.platform),
      ),
    ).toThrow('Forbidden');
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

  it('rejects executive_readonly updates: reaching a scenario is not permission to change it', () => {
    const scenario = createTeamScenario(makeSession({}), baseInput(MOCK_IDS.teams.platform));
    expect(() =>
      updateTeamScenario(
        makeSession({ roles: ['executive_readonly'], employeeId: undefined }),
        scenario.id,
        { title: 'renamed by an executive' },
      ),
    ).toThrow('Forbidden');
  });

  it('allows the managing manager to update a scenario without retargeting it', () => {
    const session = makeSession({});
    const scenario = createTeamScenario(session, baseInput(MOCK_IDS.teams.platform));
    expect(updateTeamScenario(session, scenario.id, { title: 'refined title' })?.title).toBe(
      'refined title',
    );
  });

  it('allows HR to create a scenario for any organization team', () => {
    const scenario = createTeamScenario(
      makeSession({ roles: ['hr_admin'], activeRole: 'hr' }),
      baseInput(MOCK_IDS.teams.product),
    );
    expect(scenario.teamId).toBe(MOCK_IDS.teams.product);
  });
  it('updates the caller\'s row when another organization shares the identifier', () => {
    const session = makeSession({});
    const scenario = createTeamScenario(session, baseInput(MOCK_IDS.teams.platform));

    // Same identifier, different organization, listed first so an
    // organization-blind lookup would take it.
    const store = getMockStore();
    const foreign = { ...scenario, organizationId: FOREIGN_ORGANIZATION_ID, title: 'foreign' };
    store.teamScenarios.unshift(foreign);

    const updated = updateTeamScenario(session, scenario.id, { title: 'renamed' });

    expect(updated?.organizationId).toBe(MOCK_IDS.organization);
    expect(foreign.title).toBe('foreign');
    expect(
      store.teamScenarios.find(
        (s) => s.id === scenario.id && s.organizationId === MOCK_IDS.organization,
      )?.title,
    ).toBe('renamed');

    store.teamScenarios.splice(store.teamScenarios.indexOf(foreign), 1);
  });
});
