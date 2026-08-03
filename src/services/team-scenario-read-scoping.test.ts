import { describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import {
  compareTeamScenarios,
  getRoleEvolutionScenario,
} from '@/services/team-scenario-service';

const FOREIGN_ORG_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

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
    const scenario = getRoleEvolutionScenario(
      FOREIGN_ORG_ID,
      MOCK_IDS.roleEvolution.qaToAiQuality,
    );
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
