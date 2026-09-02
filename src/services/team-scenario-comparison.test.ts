import { afterEach, describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import { getMockStore } from '@/services/data-provider/mock-provider';
import { compareTeamScenarios } from '@/services/team-scenario-service';
import type { TeamScenario, TeamScenarioRole, TeamScenarioSkill } from '@/schemas/workforce-intelligence';

/**
 * The arithmetic in `compareTeamScenarios`. The scoping tests establish which
 * rows it may read; nothing pinned what it computes from them, and the two
 * delta tables follow different rules for a row that exists on one side only:
 *
 *   roleDeltas   -- a missing role reads as headcount 0, so delta is signed
 *                   headcount (a role only in `future` is +n, only in
 *                   `current` is -n)
 *   skillDeltas  -- a missing skill reads as gap null, and a null on either
 *                   side makes the delta null rather than +/-gap
 *
 * Characterization tests; the comments mark where the behaviour is a
 * consequence of the implementation rather than an evident product choice.
 */

const ORG = MOCK_IDS.organization;
const CURRENT = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1';
const FUTURE = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2';
const ROLE_A = 'dddddddd-dddd-4ddd-8ddd-dddddddddda1';
const ROLE_B = 'dddddddd-dddd-4ddd-8ddd-dddddddddda2';
const ROLE_C = 'dddddddd-dddd-4ddd-8ddd-dddddddddda3';
const SKILL_X = 'dddddddd-dddd-4ddd-8ddd-ddddddddddb1';
const SKILL_Y = 'dddddddd-dddd-4ddd-8ddd-ddddddddddb2';
const SKILL_Z = 'dddddddd-dddd-4ddd-8ddd-ddddddddddb3';

const NOW = '2026-09-02T00:00:00.000Z';
let seq = 0;
function nextId(): string {
  seq += 1;
  return `dddddddd-dddd-4ddd-8ddd-ddddddddd${String(seq).padStart(3, '0')}`;
}

function scenario(id: string): TeamScenario {
  return {
    id,
    organizationId: ORG,
    title: `Scenario ${id.slice(-1)}`,
    description: null,
    teamId: MOCK_IDS.teams.product,
    scenarioType: id === CURRENT ? 'current_state' : 'future_state',
    status: 'draft',
    businessPriorityId: null,
    rationale: null,
    confidence: null,
    metadata: {},
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function role(scenarioId: string, roleId: string, headcount: number): TeamScenarioRole {
  return { id: nextId(), organizationId: ORG, scenarioId, roleId, headcount, notes: null, createdAt: NOW };
}

function skill(
  scenarioId: string,
  skillId: string,
  levels: { demand: number; supply: number; gap: number },
): TeamScenarioSkill {
  return {
    id: nextId(),
    organizationId: ORG,
    scenarioId,
    skillId,
    demandLevel: levels.demand,
    supplyLevel: levels.supply,
    gap: levels.gap,
    notes: null,
    createdAt: NOW,
  };
}

const store = getMockStore();
const pushed = { scenarios: [] as TeamScenario[], roles: [] as TeamScenarioRole[], skills: [] as TeamScenarioSkill[] };

function seed(input: { scenarios: TeamScenario[]; roles: TeamScenarioRole[]; skills: TeamScenarioSkill[] }) {
  store.teamScenarios.push(...input.scenarios);
  store.teamScenarioRoles.push(...input.roles);
  store.teamScenarioSkills.push(...input.skills);
  pushed.scenarios.push(...input.scenarios);
  pushed.roles.push(...input.roles);
  pushed.skills.push(...input.skills);
}

afterEach(() => {
  for (const s of pushed.scenarios) store.teamScenarios.splice(store.teamScenarios.indexOf(s), 1);
  for (const r of pushed.roles) store.teamScenarioRoles.splice(store.teamScenarioRoles.indexOf(r), 1);
  for (const k of pushed.skills) store.teamScenarioSkills.splice(store.teamScenarioSkills.indexOf(k), 1);
  pushed.scenarios.length = 0;
  pushed.roles.length = 0;
  pushed.skills.length = 0;
});

describe('roleDeltas', () => {
  it('is future minus current headcount, with an absent side counted as zero', () => {
    seed({
      scenarios: [scenario(CURRENT), scenario(FUTURE)],
      roles: [
        role(CURRENT, ROLE_A, 3),
        role(FUTURE, ROLE_A, 5),
        role(CURRENT, ROLE_B, 2), // retired in the future scenario
        role(FUTURE, ROLE_C, 4), // new in the future scenario
      ],
      skills: [],
    });

    const { roleDeltas } = compareTeamScenarios(ORG, CURRENT, FUTURE);
    expect(roleDeltas).toEqual([
      { roleId: ROLE_A, currentHeadcount: 3, futureHeadcount: 5, delta: 2 },
      { roleId: ROLE_B, currentHeadcount: 2, futureHeadcount: 0, delta: -2 },
      { roleId: ROLE_C, currentHeadcount: 0, futureHeadcount: 4, delta: 4 },
    ]);
  });

  // Roles are keyed by roleId; a second row for the same role on one side is
  // not summed, the first row wins. The schema does not forbid the duplicate.
  it('takes the first row when a scenario lists the same role twice', () => {
    seed({
      scenarios: [scenario(CURRENT), scenario(FUTURE)],
      roles: [role(CURRENT, ROLE_A, 1), role(CURRENT, ROLE_A, 6), role(FUTURE, ROLE_A, 2)],
      skills: [],
    });
    const { roleDeltas } = compareTeamScenarios(ORG, CURRENT, FUTURE);
    expect(roleDeltas).toEqual([{ roleId: ROLE_A, currentHeadcount: 1, futureHeadcount: 2, delta: 1 }]);
  });
});

describe('skillDeltas', () => {
  it('is future minus current gap, and null when either side is missing', () => {
    seed({
      scenarios: [scenario(CURRENT), scenario(FUTURE)],
      roles: [],
      skills: [
        skill(CURRENT, SKILL_X, { demand: 4, supply: 1, gap: 3 }),
        skill(FUTURE, SKILL_X, { demand: 4, supply: 3, gap: 1 }), // gap closing
        skill(CURRENT, SKILL_Y, { demand: 3, supply: 3, gap: 0 }), // dropped later
        skill(FUTURE, SKILL_Z, { demand: 5, supply: 0, gap: 5 }), // newly demanded
      ],
    });

    const { skillDeltas } = compareTeamScenarios(ORG, CURRENT, FUTURE);
    expect(skillDeltas).toEqual([
      { skillId: SKILL_X, currentGap: 3, futureGap: 1, delta: -2 },
      // Unlike a role, a skill absent from one side does not read as zero.
      { skillId: SKILL_Y, currentGap: 0, futureGap: null, delta: null },
      { skillId: SKILL_Z, currentGap: null, futureGap: 5, delta: null },
    ]);
  });

  // The stored `gap` is authoritative. It is not recomputed from demand and
  // supply, so a row whose gap disagrees with its levels is reported as-is.
  it('reports the stored gap rather than recomputing demand minus supply', () => {
    seed({
      scenarios: [scenario(CURRENT), scenario(FUTURE)],
      roles: [],
      skills: [
        skill(CURRENT, SKILL_X, { demand: 5, supply: 1, gap: 2 }),
        skill(FUTURE, SKILL_X, { demand: 5, supply: 1, gap: 2 }),
      ],
    });
    const { skillDeltas } = compareTeamScenarios(ORG, CURRENT, FUTURE);
    expect(skillDeltas).toEqual([{ skillId: SKILL_X, currentGap: 2, futureGap: 2, delta: 0 }]);
  });

  it('treats a gap of zero as a value, not as missing', () => {
    seed({
      scenarios: [scenario(CURRENT), scenario(FUTURE)],
      roles: [],
      skills: [
        skill(CURRENT, SKILL_X, { demand: 2, supply: 2, gap: 0 }),
        skill(FUTURE, SKILL_X, { demand: 4, supply: 2, gap: 2 }),
      ],
    });
    expect(compareTeamScenarios(ORG, CURRENT, FUTURE).skillDeltas[0]).toEqual({
      skillId: SKILL_X,
      currentGap: 0,
      futureGap: 2,
      delta: 2,
    });
  });
});

describe('when one scenario id does not resolve', () => {
  // Pinned rather than endorsed: an unknown future id produces a delta table
  // in which every current role leaves and every current skill loses its
  // delta, while `future` is null. A caller that renders `roleDeltas` without
  // first checking `future` shows a mass departure for a typo.
  it('still reports every current role as leaving when the future id is unknown', () => {
    seed({
      scenarios: [scenario(CURRENT)],
      roles: [role(CURRENT, ROLE_A, 3)],
      skills: [skill(CURRENT, SKILL_X, { demand: 4, supply: 1, gap: 3 })],
    });
    const comparison = compareTeamScenarios(ORG, CURRENT, 'dddddddd-dddd-4ddd-8ddd-000000000000');
    expect(comparison.current).not.toBeNull();
    expect(comparison.future).toBeNull();
    expect(comparison.roleDeltas).toEqual([
      { roleId: ROLE_A, currentHeadcount: 3, futureHeadcount: 0, delta: -3 },
    ]);
    expect(comparison.skillDeltas).toEqual([{ skillId: SKILL_X, currentGap: 3, futureGap: null, delta: null }]);
  });

  it('attaches the organization-scoped rows to each resolved scenario', () => {
    const rows = {
      scenarios: [scenario(CURRENT), scenario(FUTURE)],
      roles: [role(CURRENT, ROLE_A, 1), role(FUTURE, ROLE_A, 1)],
      skills: [skill(FUTURE, SKILL_X, { demand: 1, supply: 1, gap: 0 })],
    };
    seed(rows);
    const { current, future } = compareTeamScenarios(ORG, CURRENT, FUTURE);
    expect(current).toMatchObject({ id: CURRENT, roles: [rows.roles[0]], skills: [] });
    expect(future).toMatchObject({ id: FUTURE, roles: [rows.roles[1]], skills: [rows.skills[0]] });
  });
});
