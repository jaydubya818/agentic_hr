import { z } from 'zod';
import { confidenceScoreSchema, timestampSchema, uuidSchema } from './common';

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const decisionTypeSchema = z.enum([
  'team_composition',
  'skill_development',
  'work_redesign',
  'project_assignment',
  'capability_building',
  'learning_investment',
  'internal_mobility_exploration',
  'coaching_intervention',
]);

export const decisionStatusSchema = z.enum([
  'draft',
  'proposed',
  'under_review',
  'approved',
  'implemented',
  'cancelled',
  'archived',
]);

export const scenarioTypeSchema = z.enum(['current_state', 'future_state', 'comparison']);

export const scenarioStatusSchema = z.enum(['draft', 'active', 'archived', 'completed']);

export const roleTaskChangeTypeSchema = z.enum([
  'add',
  'remove',
  'increase',
  'decrease',
  'automate',
  'delegate',
]);

export const outcomeStatusSchema = z.enum([
  'pending',
  'on_track',
  'achieved',
  'partially_achieved',
  'missed',
  'cancelled',
]);

export const contextEntityTypeSchema = z.enum([
  'employee',
  'skill',
  'role',
  'team',
  'project',
  'business_priority',
  'learning_resource',
  'opportunity',
]);

export const contextRelationshipTypeSchema = z.enum([
  'has_skill',
  'requires_skill',
  'works_on',
  'supports',
  'member_of',
  'reports_to',
  'aligned_with',
  'at_risk_for',
  'interested_in',
  'depends_on',
]);

export const proposedActionTypeSchema = z.enum([
  'skill_development',
  'learning_assignment',
  'stretch_assignment',
  'coaching_prompt',
  'growth_plan_item',
  'team_capability_action',
  'mobility_exploration',
  'work_redesign_suggestion',
  'conversation_prep',
]);

export const proposedActionStatusSchema = z.enum([
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'applied',
  'dismissed',
]);

export const ALLOWED_ACTION_TYPES = [
  'skill_development',
  'learning_assignment',
  'stretch_assignment',
  'coaching_prompt',
  'growth_plan_item',
  'team_capability_action',
  'mobility_exploration',
  'work_redesign_suggestion',
  'conversation_prep',
] as const;

export const DISALLOWED_ACTION_TYPES = [
  'termination',
  'layoff',
  'compensation_change',
  'promotion_decision',
  'performance_rating',
  'hiring_decision',
  'succession_decision',
  'punitive_label',
] as const;

// ---------------------------------------------------------------------------
// Entity schemas
// ---------------------------------------------------------------------------

export const businessPrioritySchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  quarter: z.string().nullable().optional(),
  status: z.enum(['active', 'planned', 'completed', 'paused']).default('active'),
  ownerEmployeeId: uuidSchema.nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const projectSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  businessPriorityId: uuidSchema.nullable().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('active'),
  startDate: timestampSchema.nullable().optional(),
  endDate: timestampSchema.nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const projectMembershipSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  projectId: uuidSchema,
  employeeId: uuidSchema,
  role: z.string().nullable().optional(),
  allocationPct: z.number().min(0).max(100).nullable().optional(),
  joinedAt: timestampSchema.nullable().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const workforceContextEdgeSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  sourceEntityType: contextEntityTypeSchema,
  sourceEntityId: uuidSchema,
  targetEntityType: contextEntityTypeSchema,
  targetEntityId: uuidSchema,
  relationshipType: contextRelationshipTypeSchema,
  strength: confidenceScoreSchema.nullable().optional(),
  label: z.string().nullable().optional(),
  explanation: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const workforceDecisionSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  decisionType: decisionTypeSchema,
  status: decisionStatusSchema.default('draft'),
  teamId: uuidSchema.nullable().optional(),
  businessPriorityId: uuidSchema.nullable().optional(),
  ownerEmployeeId: uuidSchema.nullable().optional(),
  rationale: z.string().nullable().optional(),
  confidence: confidenceScoreSchema.nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const decisionEvidenceSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  decisionId: uuidSchema,
  evidenceType: z.enum(['skill', 'role_requirement', 'data_point', 'context_edge', 'project', 'priority']),
  referenceId: uuidSchema.nullable().optional(),
  label: z.string().min(1),
  detail: z.string().nullable().optional(),
  confidence: confidenceScoreSchema.nullable().optional(),
  createdAt: timestampSchema,
});

export const decisionOutcomeSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  decisionId: uuidSchema,
  outcomeType: z.enum(['expected', 'actual']),
  description: z.string().min(1),
  status: outcomeStatusSchema.default('pending'),
  metricLabel: z.string().nullable().optional(),
  metricValue: z.number().nullable().optional(),
  targetValue: z.number().nullable().optional(),
  recordedAt: timestampSchema.nullable().optional(),
  recordedByEmployeeId: uuidSchema.nullable().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const decisionParticipantSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  decisionId: uuidSchema,
  employeeId: uuidSchema,
  role: z.enum(['owner', 'contributor', 'reviewer', 'stakeholder']).default('contributor'),
  createdAt: timestampSchema,
});

export const teamScenarioSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  teamId: uuidSchema,
  scenarioType: scenarioTypeSchema,
  status: scenarioStatusSchema.default('draft'),
  businessPriorityId: uuidSchema.nullable().optional(),
  rationale: z.string().nullable().optional(),
  confidence: confidenceScoreSchema.nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const teamScenarioRoleSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  scenarioId: uuidSchema,
  roleId: uuidSchema,
  headcount: z.number().int().min(0).default(1),
  notes: z.string().nullable().optional(),
  createdAt: timestampSchema,
});

export const teamScenarioSkillSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  scenarioId: uuidSchema,
  skillId: uuidSchema,
  demandLevel: z.number().int().min(1).max(5),
  supplyLevel: z.number().int().min(0).max(5),
  gap: z.number().int(),
  notes: z.string().nullable().optional(),
  createdAt: timestampSchema,
});

export const roleEvolutionScenarioSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  currentRoleId: uuidSchema,
  futureRoleId: uuidSchema.nullable().optional(),
  futureRoleTitle: z.string().nullable().optional(),
  status: scenarioStatusSchema.default('draft'),
  rationale: z.string().nullable().optional(),
  confidence: confidenceScoreSchema.nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const roleTaskChangeSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  roleEvolutionScenarioId: uuidSchema,
  taskDescription: z.string().min(1),
  changeType: roleTaskChangeTypeSchema,
  impactLevel: z.enum(['low', 'medium', 'high']).default('medium'),
  notes: z.string().nullable().optional(),
  createdAt: timestampSchema,
});

export const agentActionPlanSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  agentId: z.string().min(1),
  employeeId: uuidSchema.nullable().optional(),
  teamId: uuidSchema.nullable().optional(),
  title: z.string().min(1),
  summary: z.string().nullable().optional(),
  sourceDecisionId: uuidSchema.nullable().optional(),
  governanceStatus: z.enum(['passed', 'blocked', 'flagged']).default('passed'),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const agentProposedActionSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  actionPlanId: uuidSchema,
  actionType: proposedActionTypeSchema,
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  status: proposedActionStatusSchema.default('draft'),
  targetEmployeeId: uuidSchema.nullable().optional(),
  referenceId: uuidSchema.nullable().optional(),
  confidence: confidenceScoreSchema.nullable().optional(),
  explanation: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

export const createWorkforceDecisionInputSchema = workforceDecisionSchema
  .omit({ id: true, organizationId: true, createdAt: true, updatedAt: true })
  .partial({ status: true, metadata: true });

export const updateWorkforceDecisionInputSchema = createWorkforceDecisionInputSchema.partial();

export const createTeamScenarioInputSchema = teamScenarioSchema
  .omit({ id: true, organizationId: true, createdAt: true, updatedAt: true })
  .partial({ status: true, metadata: true });

export const updateTeamScenarioInputSchema = createTeamScenarioInputSchema.partial();

export const createDecisionOutcomeInputSchema = decisionOutcomeSchema.omit({
  id: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
});

export const createAgentActionPlanInputSchema = agentActionPlanSchema
  .omit({ id: true, organizationId: true, createdAt: true, updatedAt: true })
  .partial({ governanceStatus: true, metadata: true });

export const updateAgentProposedActionInputSchema = z.object({
  status: proposedActionStatusSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type DecisionType = z.infer<typeof decisionTypeSchema>;
export type DecisionStatus = z.infer<typeof decisionStatusSchema>;
export type ScenarioType = z.infer<typeof scenarioTypeSchema>;
export type ScenarioStatus = z.infer<typeof scenarioStatusSchema>;
export type RoleTaskChangeType = z.infer<typeof roleTaskChangeTypeSchema>;
export type OutcomeStatus = z.infer<typeof outcomeStatusSchema>;
export type ContextEntityType = z.infer<typeof contextEntityTypeSchema>;
export type ContextRelationshipType = z.infer<typeof contextRelationshipTypeSchema>;
export type ProposedActionType = z.infer<typeof proposedActionTypeSchema>;
export type ProposedActionStatus = z.infer<typeof proposedActionStatusSchema>;

export type BusinessPriority = z.infer<typeof businessPrioritySchema>;
export type Project = z.infer<typeof projectSchema>;
export type ProjectMembership = z.infer<typeof projectMembershipSchema>;
export type WorkforceContextEdge = z.infer<typeof workforceContextEdgeSchema>;
export type WorkforceDecision = z.infer<typeof workforceDecisionSchema>;
export type DecisionEvidence = z.infer<typeof decisionEvidenceSchema>;
export type DecisionOutcome = z.infer<typeof decisionOutcomeSchema>;
export type DecisionParticipant = z.infer<typeof decisionParticipantSchema>;
export type TeamScenario = z.infer<typeof teamScenarioSchema>;
export type TeamScenarioRole = z.infer<typeof teamScenarioRoleSchema>;
export type TeamScenarioSkill = z.infer<typeof teamScenarioSkillSchema>;
export type RoleEvolutionScenario = z.infer<typeof roleEvolutionScenarioSchema>;
export type RoleTaskChange = z.infer<typeof roleTaskChangeSchema>;
export type AgentActionPlan = z.infer<typeof agentActionPlanSchema>;
export type AgentProposedAction = z.infer<typeof agentProposedActionSchema>;
