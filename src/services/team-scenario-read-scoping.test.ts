import { describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import { getMockStore } from '@/services/data-provider/mock-provider';
import {
  compareTeamScenarios,
  getRoleEvolutionScenario,
  getTeamScenario,
} from '@/services/team-scenario-service';
import type { SessionContext } from '@/types/session';

const FOREIGN_ORG_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

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

describe('team-scenario-service read scoping', () => {
  it('returns a role evolution scenario for its own organization', () => {
    const scenario = getRoleEvolutionScenario(
      MOCK_IDS.organization,
      MOCK_IDS.roleEvolution.qaToAiQuality,
    );
    expect(scenario).not.toBeNull();
    expect(scenario?.organizationId).toBe(MOCK_IDS.organization);
  });

  it('conceals a role evolution scenario from another organization', () => {
    const scenario = getRoleEvolutionScenario(FOREIGN_ORG_ID, MOCK_IDS.roleEvolution.qaToAiQuality);
    expect(scenario).toBeNull();
  });

  it('compares scenarios within the owning organization', () => {
    const comparison = compareTeamScenarios(
      MOCK_IDS.organization,
      MOCK_IDS.teamScenarios.productQualityCurrent,
      MOCK_IDS.teamScenarios.productQualityFuture,
    );
    expect(comparison.current).not.toBeNull();
    expect(comparison.future).not.toBeNull();
  });

  it("excludes another organization's detail rows recorded against the same scenario id", () => {
    const store = getMockStore();
    const scenarioId = MOCK_IDS.teamScenarios.productQualityCurrent;
    const foreignSkill = {
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
      organizationId: FOREIGN_ORG_ID,
      scenarioId,
      skillId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
      demandLevel: 5,
      supplyLevel: 1,
      gap: 4,
      notes: null,
      createdAt: new Date().toISOString(),
    };
    store.teamScenarioSkills.push(foreignSkill);
    try {
      const detail = getTeamScenario(
        makeSession({ roles: ['hr_admin'], activeRole: 'hr' }),
        scenarioId,
      );
      expect(detail).not.toBeNull();
      expect(detail!.skills.some((skill) => skill.id === foreignSkill.id)).toBe(false);
      expect(detail!.skills.every((skill) => skill.organizationId === MOCK_IDS.organization)).toBe(
        true,
      );

      const comparison = compareTeamScenarios(
        MOCK_IDS.organization,
        scenarioId,
        MOCK_IDS.teamScenarios.productQualityFuture,
      );
      expect(comparison.current!.skills.some((skill) => skill.id === foreignSkill.id)).toBe(false);
    } finally {
      store.teamScenarioSkills.splice(
        store.teamScenarioSkills.findIndex((skill) => skill.id === foreignSkill.id),
        1,
      );
    }
  });

  it('conceals scenario comparison details from another organization', () => {
    const comparison = compareTeamScenarios(
      FOREIGN_ORG_ID,
      MOCK_IDS.teamScenarios.productQualityCurrent,
      MOCK_IDS.teamScenarios.productQualityFuture,
    );
    expect(comparison.current).toBeNull();
    expect(comparison.future).toBeNull();
    expect(comparison.skillDeltas).toHaveLength(0);
    expect(comparison.roleDeltas).toHaveLength(0);
  });
});
