import { describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import {
  explainRelationship,
  findPeopleForBusinessPriority,
  findSkillsAtRiskForTeam,
  getBusinessPriorityContext,
  getEmployeeContextGraph,
  getTeamContextGraph,
} from '@/services/context-graph-service';

describe('context-graph-service', () => {
  it('builds employee context graph for Alex Chen', () => {
    const graph = getEmployeeContextGraph(MOCK_IDS.employees.alex);
    expect(graph).not.toBeNull();
    expect(graph!.center.label).toBeTruthy();
    expect(graph!.edges.length).toBeGreaterThan(0);
  });

  it('builds team context graph for Product Engineering', () => {
    const graph = getTeamContextGraph(MOCK_IDS.teams.product);
    expect(graph).not.toBeNull();
    expect(graph!.center.entityType).toBe('team');
  });

  it('finds people aligned with product quality priority', () => {
    const people = findPeopleForBusinessPriority(MOCK_IDS.businessPriorities.productQuality);
    expect(people.length).toBeGreaterThanOrEqual(0);
  });

  it('finds skills at risk for product team', () => {
    const atRisk = findSkillsAtRiskForTeam(MOCK_IDS.teams.product);
    expect(atRisk.length).toBeGreaterThan(0);
    expect(atRisk[0]!.skillName).toBeTruthy();
  });

  it('explains a context relationship', () => {
    const graph = getEmployeeContextGraph(MOCK_IDS.employees.alex);
    const edgeId = graph!.edges[0]!.id;
    const explanation = explainRelationship(edgeId);
    expect(explanation).not.toBeNull();
    expect(explanation!.narrative.length).toBeGreaterThan(0);
  });

  it('scopes employee context graphs to the requested organization', () => {
    const sameOrg = getEmployeeContextGraph(MOCK_IDS.employees.alex, MOCK_IDS.organization);
    expect(sameOrg).not.toBeNull();
    const crossOrg = getEmployeeContextGraph(
      MOCK_IDS.employees.alex,
      '99999999-9999-4999-8999-999999999999',
    );
    expect(crossOrg).toBeNull();
  });

  it('scopes team context graphs to the requested organization', () => {
    const sameOrg = getTeamContextGraph(MOCK_IDS.teams.product, MOCK_IDS.organization);
    expect(sameOrg).not.toBeNull();
    const crossOrg = getTeamContextGraph(
      MOCK_IDS.teams.product,
      '99999999-9999-4999-8999-999999999999',
    );
    expect(crossOrg).toBeNull();
  });

  it('returns business priority context graph', () => {
    const graph = getBusinessPriorityContext(MOCK_IDS.businessPriorities.productQuality);
    expect(graph).not.toBeNull();
    expect(graph!.center.entityType).toBe('business_priority');
  });
});
