import { index, integer, jsonb, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { organizations, employees, teams, roles } from './tables';
import {
  contextEntityTypeEnum,
  contextRelationshipTypeEnum,
  decisionStatusEnum,
  decisionTypeEnum,
  governanceStatusEnum,
  outcomeStatusEnum,
  proposedActionStatusEnum,
  proposedActionTypeEnum,
  roleTaskChangeTypeEnum,
  scenarioStatusEnum,
  scenarioTypeEnum,
} from './enums';

// ---------------------------------------------------------------------------
// Business context
// ---------------------------------------------------------------------------

export const businessPriorities = pgTable(
  'business_priorities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    quarter: text('quarter'),
    status: text('status').default('active').notNull(),
    ownerEmployeeId: uuid('owner_employee_id').references(() => employees.id, {
      onDelete: 'set null',
    }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('business_priorities_organization_id_idx').on(table.organizationId),
    index('business_priorities_owner_employee_id_idx').on(table.ownerEmployeeId),
  ],
);

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    businessPriorityId: uuid('business_priority_id').references(() => businessPriorities.id, {
      onDelete: 'set null',
    }),
    status: text('status').default('active').notNull(),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('projects_organization_id_idx').on(table.organizationId),
    index('projects_business_priority_id_idx').on(table.businessPriorityId),
  ],
);

export const projectMemberships = pgTable(
  'project_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    role: text('role'),
    allocationPct: real('allocation_pct'),
    joinedAt: timestamp('joined_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('project_memberships_organization_id_idx').on(table.organizationId),
    index('project_memberships_project_id_idx').on(table.projectId),
    index('project_memberships_employee_id_idx').on(table.employeeId),
  ],
);

export const workforceContextEdges = pgTable(
  'workforce_context_edges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    sourceEntityType: contextEntityTypeEnum('source_entity_type').notNull(),
    sourceEntityId: uuid('source_entity_id').notNull(),
    targetEntityType: contextEntityTypeEnum('target_entity_type').notNull(),
    targetEntityId: uuid('target_entity_id').notNull(),
    relationshipType: contextRelationshipTypeEnum('relationship_type').notNull(),
    strength: real('strength'),
    label: text('label'),
    explanation: text('explanation'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('workforce_context_edges_organization_id_idx').on(table.organizationId),
    index('workforce_context_edges_source_idx').on(table.sourceEntityType, table.sourceEntityId),
    index('workforce_context_edges_target_idx').on(table.targetEntityType, table.targetEntityId),
  ],
);

// ---------------------------------------------------------------------------
// Workforce decisions
// ---------------------------------------------------------------------------

export const workforceDecisions = pgTable(
  'workforce_decisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    decisionType: decisionTypeEnum('decision_type').notNull(),
    status: decisionStatusEnum('status').default('draft').notNull(),
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'set null' }),
    businessPriorityId: uuid('business_priority_id').references(() => businessPriorities.id, {
      onDelete: 'set null',
    }),
    ownerEmployeeId: uuid('owner_employee_id').references(() => employees.id, {
      onDelete: 'set null',
    }),
    rationale: text('rationale'),
    confidence: real('confidence'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('workforce_decisions_organization_id_idx').on(table.organizationId),
    index('workforce_decisions_team_id_idx').on(table.teamId),
    index('workforce_decisions_status_idx').on(table.status),
  ],
);

export const decisionEvidence = pgTable(
  'decision_evidence',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    decisionId: uuid('decision_id')
      .notNull()
      .references(() => workforceDecisions.id, { onDelete: 'cascade' }),
    evidenceType: text('evidence_type').notNull(),
    referenceId: uuid('reference_id'),
    label: text('label').notNull(),
    detail: text('detail'),
    confidence: real('confidence'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('decision_evidence_organization_id_idx').on(table.organizationId),
    index('decision_evidence_decision_id_idx').on(table.decisionId),
  ],
);

export const decisionOutcomes = pgTable(
  'decision_outcomes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    decisionId: uuid('decision_id')
      .notNull()
      .references(() => workforceDecisions.id, { onDelete: 'cascade' }),
    outcomeType: text('outcome_type').notNull(),
    description: text('description').notNull(),
    status: outcomeStatusEnum('status').default('pending').notNull(),
    metricLabel: text('metric_label'),
    metricValue: real('metric_value'),
    targetValue: real('target_value'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }),
    recordedByEmployeeId: uuid('recorded_by_employee_id').references(() => employees.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('decision_outcomes_organization_id_idx').on(table.organizationId),
    index('decision_outcomes_decision_id_idx').on(table.decisionId),
  ],
);

export const decisionParticipants = pgTable(
  'decision_participants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    decisionId: uuid('decision_id')
      .notNull()
      .references(() => workforceDecisions.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    role: text('role').default('contributor').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('decision_participants_organization_id_idx').on(table.organizationId),
    index('decision_participants_decision_id_idx').on(table.decisionId),
  ],
);

// ---------------------------------------------------------------------------
// Team scenarios & role evolution
// ---------------------------------------------------------------------------

export const teamScenarios = pgTable(
  'team_scenarios',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'cascade' }),
    scenarioType: scenarioTypeEnum('scenario_type').notNull(),
    status: scenarioStatusEnum('status').default('draft').notNull(),
    businessPriorityId: uuid('business_priority_id').references(() => businessPriorities.id, {
      onDelete: 'set null',
    }),
    rationale: text('rationale'),
    confidence: real('confidence'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('team_scenarios_organization_id_idx').on(table.organizationId),
    index('team_scenarios_team_id_idx').on(table.teamId),
  ],
);

export const teamScenarioRoles = pgTable(
  'team_scenario_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    scenarioId: uuid('scenario_id')
      .notNull()
      .references(() => teamScenarios.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    headcount: integer('headcount').default(1).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('team_scenario_roles_organization_id_idx').on(table.organizationId),
    index('team_scenario_roles_scenario_id_idx').on(table.scenarioId),
  ],
);

export const teamScenarioSkills = pgTable(
  'team_scenario_skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    scenarioId: uuid('scenario_id')
      .notNull()
      .references(() => teamScenarios.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id').notNull(),
    demandLevel: integer('demand_level').notNull(),
    supplyLevel: integer('supply_level').notNull(),
    gap: integer('gap').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('team_scenario_skills_organization_id_idx').on(table.organizationId),
    index('team_scenario_skills_scenario_id_idx').on(table.scenarioId),
  ],
);

export const roleEvolutionScenarios = pgTable(
  'role_evolution_scenarios',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    currentRoleId: uuid('current_role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    futureRoleId: uuid('future_role_id').references(() => roles.id, { onDelete: 'set null' }),
    futureRoleTitle: text('future_role_title'),
    status: scenarioStatusEnum('status').default('draft').notNull(),
    rationale: text('rationale'),
    confidence: real('confidence'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('role_evolution_scenarios_organization_id_idx').on(table.organizationId)],
);

export const roleTaskChanges = pgTable(
  'role_task_changes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    roleEvolutionScenarioId: uuid('role_evolution_scenario_id')
      .notNull()
      .references(() => roleEvolutionScenarios.id, { onDelete: 'cascade' }),
    taskDescription: text('task_description').notNull(),
    changeType: roleTaskChangeTypeEnum('change_type').notNull(),
    impactLevel: text('impact_level').default('medium').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('role_task_changes_organization_id_idx').on(table.organizationId),
    index('role_task_changes_scenario_id_idx').on(table.roleEvolutionScenarioId),
  ],
);

// ---------------------------------------------------------------------------
// Agent action plans
// ---------------------------------------------------------------------------

export const agentActionPlans = pgTable(
  'agent_action_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    agentId: text('agent_id').notNull(),
    employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'set null' }),
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    summary: text('summary'),
    sourceDecisionId: uuid('source_decision_id').references(() => workforceDecisions.id, {
      onDelete: 'set null',
    }),
    governanceStatus: governanceStatusEnum('governance_status').default('passed').notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('agent_action_plans_organization_id_idx').on(table.organizationId),
    index('agent_action_plans_employee_id_idx').on(table.employeeId),
  ],
);

export const agentProposedActions = pgTable(
  'agent_proposed_actions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    actionPlanId: uuid('action_plan_id')
      .notNull()
      .references(() => agentActionPlans.id, { onDelete: 'cascade' }),
    actionType: proposedActionTypeEnum('action_type').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    status: proposedActionStatusEnum('status').default('draft').notNull(),
    targetEmployeeId: uuid('target_employee_id').references(() => employees.id, {
      onDelete: 'set null',
    }),
    referenceId: uuid('reference_id'),
    confidence: real('confidence'),
    explanation: text('explanation'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('agent_proposed_actions_organization_id_idx').on(table.organizationId),
    index('agent_proposed_actions_action_plan_id_idx').on(table.actionPlanId),
  ],
);
