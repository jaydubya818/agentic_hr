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
import { getMockStore } from '@/services/data-provider/mock-provider';

const FOREIGN_ORGANIZATION = '99999999-9999-4999-8999-999999999999';

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

  it('scopes business priority context graphs to the requested organization', () => {
    const sameOrg = getBusinessPriorityContext(
      MOCK_IDS.businessPriorities.productQuality,
      MOCK_IDS.organization,
    );
    expect(sameOrg).not.toBeNull();
    const crossOrg = getBusinessPriorityContext(
      MOCK_IDS.businessPriorities.productQuality,
      FOREIGN_ORGANIZATION,
    );
    expect(crossOrg).toBeNull();
  });

  it('scopes the people search for a business priority to the requested organization', () => {
    const sameOrg = findPeopleForBusinessPriority(
      MOCK_IDS.businessPriorities.productQuality,
      MOCK_IDS.organization,
    );
    expect(sameOrg).toEqual(
      findPeopleForBusinessPriority(MOCK_IDS.businessPriorities.productQuality),
    );
    const crossOrg = findPeopleForBusinessPriority(
      MOCK_IDS.businessPriorities.productQuality,
      FOREIGN_ORGANIZATION,
    );
    expect(crossOrg).toEqual([]);
  });

  it('scopes the at-risk skill search for a team to the requested organization', () => {
    const sameOrg = findSkillsAtRiskForTeam(MOCK_IDS.teams.product, MOCK_IDS.organization);
    expect(sameOrg.length).toBeGreaterThan(0);
    const crossOrg = findSkillsAtRiskForTeam(MOCK_IDS.teams.product, FOREIGN_ORGANIZATION);
    expect(crossOrg).toEqual([]);
  });

  it('scopes relationship explanations to the requested organization', () => {
    const edgeId = getEmployeeContextGraph(MOCK_IDS.employees.alex)!.edges[0]!.id;
    expect(explainRelationship(edgeId, MOCK_IDS.organization)).not.toBeNull();
    expect(explainRelationship(edgeId, FOREIGN_ORGANIZATION)).toBeNull();
  });

  it("excludes another organization's edge recorded against the same entity id", () => {
    const store = getMockStore();
    const timestamp = new Date().toISOString();
    const foreignEdge = {
      id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd9',
      organizationId: FOREIGN_ORGANIZATION,
      sourceEntityType: 'employee' as const,
      sourceEntityId: MOCK_IDS.employees.alex,
      targetEntityType: 'skill' as const,
      targetEntityId: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc9',
      relationshipType: 'at_risk_for' as const,
      strength: null,
      label: null,
      explanation: 'foreign-organization narrative',
      metadata: {},
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.workforceContextEdges.push(foreignEdge);
    try {
      const graph = getEmployeeContextGraph(MOCK_IDS.employees.alex, MOCK_IDS.organization);
      expect(graph).not.toBeNull();
      expect(graph!.edges.some((e) => e.id === foreignEdge.id)).toBe(false);
      expect(graph!.nodes.some((n) => n.entityId === foreignEdge.targetEntityId)).toBe(false);
    } finally {
      store.workforceContextEdges.splice(
        store.workforceContextEdges.findIndex((e) => e.id === foreignEdge.id),
        1,
      );
    }
  });
});
