import { getMockStore } from '@/services/data-provider/mock-provider';
import { isDirectReport } from '@/services/data-provider/mock-provider';
import type {
  BusinessPriority,
  ContextEntityType,
  ContextRelationshipType,
  WorkforceContextEdge,
} from '@/schemas/workforce-intelligence';

export interface ContextGraphNode {
  entityType: ContextEntityType;
  entityId: string;
  label: string;
}

export interface ContextGraphEdgeView {
  id: string;
  source: ContextGraphNode;
  target: ContextGraphNode;
  relationshipType: ContextRelationshipType;
  strength: number | null;
  label: string | null;
  explanation: string | null;
}

export interface ContextGraph {
  center: ContextGraphNode;
  nodes: ContextGraphNode[];
  edges: ContextGraphEdgeView[];
}

function resolveEntityLabel(
  entityType: ContextEntityType,
  entityId: string,
  store: ReturnType<typeof getMockStore>,
): string {
  switch (entityType) {
    case 'employee': {
      const employee = store.employees.find((e) => e.id === entityId);
      if (!employee) return entityId;
      const user = store.users.find((u) => u.id === employee.userId);
      return user?.fullName ?? employee.jobTitle ?? entityId;
    }
    case 'skill':
      return store.skills.find((s) => s.id === entityId)?.name ?? entityId;
    case 'role':
      return store.roles.find((r) => r.id === entityId)?.title ?? entityId;
    case 'team':
      return store.teams.find((t) => t.id === entityId)?.name ?? entityId;
    case 'project':
      return store.projects.find((p) => p.id === entityId)?.name ?? entityId;
    case 'business_priority':
      return store.businessPriorities.find((p) => p.id === entityId)?.title ?? entityId;
    case 'learning_resource':
      return store.learningResources.find((r) => r.id === entityId)?.title ?? entityId;
    case 'opportunity':
      return store.opportunities.find((o) => o.id === entityId)?.title ?? entityId;
    default: {
      const _exhaustive: never = entityType;
      return _exhaustive;
    }
  }
}

function buildGraphFromEdges(
  centerType: ContextEntityType,
  centerId: string,
  edges: WorkforceContextEdge[],
  store: ReturnType<typeof getMockStore>,
): ContextGraph {
  const center: ContextGraphNode = {
    entityType: centerType,
    entityId: centerId,
    label: resolveEntityLabel(centerType, centerId, store),
  };

  const nodeMap = new Map<string, ContextGraphNode>();
  nodeMap.set(`${centerType}:${centerId}`, center);

  const edgeViews: ContextGraphEdgeView[] = edges.map((edge) => {
    const sourceKey = `${edge.sourceEntityType}:${edge.sourceEntityId}`;
    const targetKey = `${edge.targetEntityType}:${edge.targetEntityId}`;

    if (!nodeMap.has(sourceKey)) {
      nodeMap.set(sourceKey, {
        entityType: edge.sourceEntityType,
        entityId: edge.sourceEntityId,
        label: resolveEntityLabel(edge.sourceEntityType, edge.sourceEntityId, store),
      });
    }
    if (!nodeMap.has(targetKey)) {
      nodeMap.set(targetKey, {
        entityType: edge.targetEntityType,
        entityId: edge.targetEntityId,
        label: resolveEntityLabel(edge.targetEntityType, edge.targetEntityId, store),
      });
    }

    return {
      id: edge.id,
      source: nodeMap.get(sourceKey)!,
      target: nodeMap.get(targetKey)!,
      relationshipType: edge.relationshipType,
      strength: edge.strength ?? null,
      label: edge.label ?? null,
      explanation: edge.explanation ?? null,
    };
  });

  return {
    center,
    nodes: [...nodeMap.values()],
    edges: edgeViews,
  };
}

function edgesForEntity(
  entityType: ContextEntityType,
  entityId: string,
  organizationId?: string,
): WorkforceContextEdge[] {
  const store = getMockStore();
  return store.workforceContextEdges.filter(
    (edge) =>
      // Join on organization as well as entity id (matching the plan-detail
      // scoping in agent-action-service) so another organization's edge
      // recorded against the same identifier can never enter a scoped graph.
      (organizationId === undefined || edge.organizationId === organizationId) &&
      ((edge.sourceEntityType === entityType && edge.sourceEntityId === entityId) ||
        (edge.targetEntityType === entityType && edge.targetEntityId === entityId)),
  );
}

export function getEmployeeContextGraph(
  employeeId: string,
  organizationId?: string,
): ContextGraph | null {
  const store = getMockStore();
  const employee = store.employees.find((e) => e.id === employeeId);
  if (!employee) return null;
  // Do not reveal cross-organization employees; treat them as not found.
  if (organizationId !== undefined && employee.organizationId !== organizationId) return null;

  const edges = edgesForEntity('employee', employeeId, organizationId);
  return buildGraphFromEdges('employee', employeeId, edges, store);
}

export function getTeamContextGraph(teamId: string, organizationId?: string): ContextGraph | null {
  const store = getMockStore();
  const team = store.teams.find((t) => t.id === teamId);
  if (!team) return null;
  // Do not reveal cross-organization teams; treat them as not found.
  if (organizationId !== undefined && team.organizationId !== organizationId) return null;

  const edges = edgesForEntity('team', teamId, organizationId);
  return buildGraphFromEdges('team', teamId, edges, store);
}

export function getBusinessPriorityContext(
  priorityId: string,
  organizationId?: string,
): ContextGraph | null {
  const store = getMockStore();
  const priority = store.businessPriorities.find((p) => p.id === priorityId);
  if (!priority) return null;
  // Do not reveal cross-organization priorities; treat them as not found.
  if (organizationId !== undefined && priority.organizationId !== organizationId) return null;

  const edges = edgesForEntity('business_priority', priorityId, organizationId);
  return buildGraphFromEdges('business_priority', priorityId, edges, store);
}

export function findPeopleForBusinessPriority(
  priorityId: string,
  organizationId?: string,
): Array<{
  employeeId: string;
  fullName: string;
  relationshipType: ContextRelationshipType;
  explanation: string | null;
}> {
  const store = getMockStore();
  const priority = store.businessPriorities.find((p) => p.id === priorityId);
  if (!priority) return [];
  // Do not reveal cross-organization priorities; treat them as having no people.
  if (organizationId !== undefined && priority.organizationId !== organizationId) return [];

  const results: Array<{
    employeeId: string;
    fullName: string;
    relationshipType: ContextRelationshipType;
    explanation: string | null;
  }> = [];

  for (const edge of store.workforceContextEdges) {
    if (
      (organizationId === undefined || edge.organizationId === organizationId) &&
      edge.targetEntityType === 'business_priority' &&
      edge.targetEntityId === priorityId &&
      edge.sourceEntityType === 'employee'
    ) {
      const employee = store.employees.find((e) => e.id === edge.sourceEntityId);
      const user = employee ? store.users.find((u) => u.id === employee.userId) : undefined;
      results.push({
        employeeId: edge.sourceEntityId,
        fullName: user?.fullName ?? employee?.jobTitle ?? edge.sourceEntityId,
        relationshipType: edge.relationshipType,
        explanation: edge.explanation ?? null,
      });
    }
  }

  return results;
}

export function findSkillsAtRiskForTeam(
  teamId: string,
  organizationId?: string,
): Array<{
  skillId: string;
  skillName: string;
  strength: number | null;
  explanation: string | null;
}> {
  const store = getMockStore();
  const team = store.teams.find((t) => t.id === teamId);
  if (!team) return [];
  // Do not reveal cross-organization teams; treat them as having no at-risk skills.
  if (organizationId !== undefined && team.organizationId !== organizationId) return [];

  return store.workforceContextEdges
    .filter(
      (edge) =>
        (organizationId === undefined || edge.organizationId === organizationId) &&
        edge.sourceEntityType === 'team' &&
        edge.sourceEntityId === teamId &&
        edge.targetEntityType === 'skill' &&
        edge.relationshipType === 'at_risk_for',
    )
    .map((edge) => ({
      skillId: edge.targetEntityId,
      skillName: store.skills.find((s) => s.id === edge.targetEntityId)?.name ?? edge.targetEntityId,
      strength: edge.strength ?? null,
      explanation: edge.explanation ?? null,
    }));
}

export function explainRelationship(
  edgeId: string,
  organizationId?: string,
): {
  edge: WorkforceContextEdge;
  sourceLabel: string;
  targetLabel: string;
  narrative: string;
} | null {
  const store = getMockStore();
  const edge = store.workforceContextEdges.find((e) => e.id === edgeId);
  if (!edge) return null;
  // Do not reveal cross-organization edges; treat them as not found.
  if (organizationId !== undefined && edge.organizationId !== organizationId) return null;

  const sourceLabel = resolveEntityLabel(edge.sourceEntityType, edge.sourceEntityId, store);
  const targetLabel = resolveEntityLabel(edge.targetEntityType, edge.targetEntityId, store);
  const narrative =
    edge.explanation ?? `${sourceLabel} ${edge.relationshipType.replace(/_/g, ' ')} ${targetLabel}`;

  return { edge, sourceLabel, targetLabel, narrative };
}

export function listBusinessPriorities(organizationId: string): BusinessPriority[] {
  return getMockStore().businessPriorities.filter((p) => p.organizationId === organizationId);
}

export function canAccessEmployeeContext(
  viewerEmployeeId: string | undefined,
  targetEmployeeId: string,
  isHr: boolean,
): boolean {
  if (isHr) return true;
  if (!viewerEmployeeId) return false;
  if (viewerEmployeeId === targetEmployeeId) return true;
  return isDirectReport(viewerEmployeeId, targetEmployeeId);
}

export function canAccessTeamContext(
  viewerEmployeeId: string | undefined,
  teamId: string,
  isHr: boolean,
): boolean {
  if (isHr) return true;
  const store = getMockStore();
  const team = store.teams.find((t) => t.id === teamId);
  if (!team) return false;
  return team.managerEmployeeId === viewerEmployeeId;
}
