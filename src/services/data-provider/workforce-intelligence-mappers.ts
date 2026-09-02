import type {
  AgentActionPlan,
  AgentProposedAction,
  BusinessPriority,
  DecisionEvidence,
  DecisionOutcome,
  DecisionParticipant,
  Project,
  ProjectMembership,
  RoleEvolutionScenario,
  RoleTaskChange,
  TeamScenario,
  TeamScenarioRole,
  TeamScenarioSkill,
  WorkforceContextEdge,
  WorkforceDecision,
} from '@/schemas/workforce-intelligence';

// Shared with db-mappers.ts so the two Postgres read paths cannot disagree
// about what an unknown date looks like (backlog 2026-09-01). The epoch
// sentinel it returns for a nullish value is the open 2026-08-31 item.
import { toIso } from './db-mappers';

function jsonMetadata(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function mapBusinessPriority(row: {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  quarter: string | null;
  status: string;
  ownerEmployeeId: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): BusinessPriority {
  return {
    id: row.id,
    organizationId: row.organizationId,
    title: row.title,
    description: row.description,
    quarter: row.quarter,
    status: row.status as BusinessPriority['status'],
    ownerEmployeeId: row.ownerEmployeeId,
    metadata: jsonMetadata(row.metadata),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapProject(row: {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  businessPriorityId: string | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): Project {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    description: row.description,
    businessPriorityId: row.businessPriorityId,
    status: row.status as Project['status'],
    startDate: row.startDate ? toIso(row.startDate) : null,
    endDate: row.endDate ? toIso(row.endDate) : null,
    metadata: jsonMetadata(row.metadata),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapProjectMembership(row: {
  id: string;
  organizationId: string;
  projectId: string;
  employeeId: string;
  role: string | null;
  allocationPct: number | null;
  joinedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ProjectMembership {
  return {
    id: row.id,
    organizationId: row.organizationId,
    projectId: row.projectId,
    employeeId: row.employeeId,
    role: row.role,
    allocationPct: row.allocationPct,
    joinedAt: row.joinedAt ? toIso(row.joinedAt) : null,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapWorkforceContextEdge(row: {
  id: string;
  organizationId: string;
  sourceEntityType: WorkforceContextEdge['sourceEntityType'];
  sourceEntityId: string;
  targetEntityType: WorkforceContextEdge['targetEntityType'];
  targetEntityId: string;
  relationshipType: WorkforceContextEdge['relationshipType'];
  strength: number | null;
  label: string | null;
  explanation: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): WorkforceContextEdge {
  return {
    id: row.id,
    organizationId: row.organizationId,
    sourceEntityType: row.sourceEntityType,
    sourceEntityId: row.sourceEntityId,
    targetEntityType: row.targetEntityType,
    targetEntityId: row.targetEntityId,
    relationshipType: row.relationshipType,
    strength: row.strength,
    label: row.label,
    explanation: row.explanation,
    metadata: jsonMetadata(row.metadata),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapWorkforceDecision(row: {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  decisionType: WorkforceDecision['decisionType'];
  status: WorkforceDecision['status'];
  teamId: string | null;
  businessPriorityId: string | null;
  ownerEmployeeId: string | null;
  rationale: string | null;
  confidence: number | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): WorkforceDecision {
  return {
    id: row.id,
    organizationId: row.organizationId,
    title: row.title,
    description: row.description,
    decisionType: row.decisionType,
    status: row.status,
    teamId: row.teamId,
    businessPriorityId: row.businessPriorityId,
    ownerEmployeeId: row.ownerEmployeeId,
    rationale: row.rationale,
    confidence: row.confidence,
    metadata: jsonMetadata(row.metadata),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapDecisionEvidence(row: {
  id: string;
  organizationId: string;
  decisionId: string;
  evidenceType: string;
  referenceId: string | null;
  label: string;
  detail: string | null;
  confidence: number | null;
  createdAt: Date;
}): DecisionEvidence {
  return {
    id: row.id,
    organizationId: row.organizationId,
    decisionId: row.decisionId,
    evidenceType: row.evidenceType as DecisionEvidence['evidenceType'],
    referenceId: row.referenceId,
    label: row.label,
    detail: row.detail,
    confidence: row.confidence,
    createdAt: toIso(row.createdAt),
  };
}

export function mapDecisionOutcome(row: {
  id: string;
  organizationId: string;
  decisionId: string;
  outcomeType: string;
  description: string;
  status: DecisionOutcome['status'];
  metricLabel: string | null;
  metricValue: number | null;
  targetValue: number | null;
  recordedAt: Date | null;
  recordedByEmployeeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): DecisionOutcome {
  return {
    id: row.id,
    organizationId: row.organizationId,
    decisionId: row.decisionId,
    outcomeType: row.outcomeType as DecisionOutcome['outcomeType'],
    description: row.description,
    status: row.status,
    metricLabel: row.metricLabel,
    metricValue: row.metricValue,
    targetValue: row.targetValue,
    recordedAt: row.recordedAt ? toIso(row.recordedAt) : null,
    recordedByEmployeeId: row.recordedByEmployeeId,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapDecisionParticipant(row: {
  id: string;
  organizationId: string;
  decisionId: string;
  employeeId: string;
  role: string;
  createdAt: Date;
}): DecisionParticipant {
  return {
    id: row.id,
    organizationId: row.organizationId,
    decisionId: row.decisionId,
    employeeId: row.employeeId,
    role: row.role as DecisionParticipant['role'],
    createdAt: toIso(row.createdAt),
  };
}

export function mapTeamScenario(row: {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  teamId: string;
  scenarioType: TeamScenario['scenarioType'];
  status: TeamScenario['status'];
  businessPriorityId: string | null;
  rationale: string | null;
  confidence: number | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): TeamScenario {
  return {
    id: row.id,
    organizationId: row.organizationId,
    title: row.title,
    description: row.description,
    teamId: row.teamId,
    scenarioType: row.scenarioType,
    status: row.status,
    businessPriorityId: row.businessPriorityId,
    rationale: row.rationale,
    confidence: row.confidence,
    metadata: jsonMetadata(row.metadata),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapTeamScenarioRole(row: {
  id: string;
  organizationId: string;
  scenarioId: string;
  roleId: string;
  headcount: number;
  notes: string | null;
  createdAt: Date;
}): TeamScenarioRole {
  return {
    id: row.id,
    organizationId: row.organizationId,
    scenarioId: row.scenarioId,
    roleId: row.roleId,
    headcount: row.headcount,
    notes: row.notes,
    createdAt: toIso(row.createdAt),
  };
}

export function mapTeamScenarioSkill(row: {
  id: string;
  organizationId: string;
  scenarioId: string;
  skillId: string;
  demandLevel: number;
  supplyLevel: number;
  gap: number;
  notes: string | null;
  createdAt: Date;
}): TeamScenarioSkill {
  return {
    id: row.id,
    organizationId: row.organizationId,
    scenarioId: row.scenarioId,
    skillId: row.skillId,
    demandLevel: row.demandLevel,
    supplyLevel: row.supplyLevel,
    gap: row.gap,
    notes: row.notes,
    createdAt: toIso(row.createdAt),
  };
}

export function mapRoleEvolutionScenario(row: {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  currentRoleId: string;
  futureRoleId: string | null;
  futureRoleTitle: string | null;
  status: RoleEvolutionScenario['status'];
  rationale: string | null;
  confidence: number | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): RoleEvolutionScenario {
  return {
    id: row.id,
    organizationId: row.organizationId,
    title: row.title,
    description: row.description,
    currentRoleId: row.currentRoleId,
    futureRoleId: row.futureRoleId,
    futureRoleTitle: row.futureRoleTitle,
    status: row.status,
    rationale: row.rationale,
    confidence: row.confidence,
    metadata: jsonMetadata(row.metadata),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapRoleTaskChange(row: {
  id: string;
  organizationId: string;
  roleEvolutionScenarioId: string;
  taskDescription: string;
  changeType: RoleTaskChange['changeType'];
  impactLevel: string;
  notes: string | null;
  createdAt: Date;
}): RoleTaskChange {
  return {
    id: row.id,
    organizationId: row.organizationId,
    roleEvolutionScenarioId: row.roleEvolutionScenarioId,
    taskDescription: row.taskDescription,
    changeType: row.changeType,
    impactLevel: row.impactLevel as RoleTaskChange['impactLevel'],
    notes: row.notes,
    createdAt: toIso(row.createdAt),
  };
}

export function mapAgentActionPlan(row: {
  id: string;
  organizationId: string;
  agentId: string;
  employeeId: string | null;
  teamId: string | null;
  title: string;
  summary: string | null;
  sourceDecisionId: string | null;
  governanceStatus: AgentActionPlan['governanceStatus'];
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): AgentActionPlan {
  return {
    id: row.id,
    organizationId: row.organizationId,
    agentId: row.agentId,
    employeeId: row.employeeId,
    teamId: row.teamId,
    title: row.title,
    summary: row.summary,
    sourceDecisionId: row.sourceDecisionId,
    governanceStatus: row.governanceStatus,
    metadata: jsonMetadata(row.metadata),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapAgentProposedAction(row: {
  id: string;
  organizationId: string;
  actionPlanId: string;
  actionType: AgentProposedAction['actionType'];
  title: string;
  description: string | null;
  status: AgentProposedAction['status'];
  targetEmployeeId: string | null;
  referenceId: string | null;
  confidence: number | null;
  explanation: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): AgentProposedAction {
  return {
    id: row.id,
    organizationId: row.organizationId,
    actionPlanId: row.actionPlanId,
    actionType: row.actionType,
    title: row.title,
    description: row.description,
    status: row.status,
    targetEmployeeId: row.targetEmployeeId,
    referenceId: row.referenceId,
    confidence: row.confidence,
    explanation: row.explanation,
    metadata: jsonMetadata(row.metadata),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}
