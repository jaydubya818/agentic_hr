import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import {
  agentMessageRoleEnum,
  careerGoalStatusEnum,
  confidenceLevelEnum,
  conversationStatusEnum,
  evidenceTypeEnum,
  governanceStatusEnum,
  growthPlanItemStatusEnum,
  growthPlanItemTypeEnum,
  growthPlanStatusEnum,
  learningFormatEnum,
  opportunityStatusEnum,
  readinessScopeTypeEnum,
  recommendationStatusEnum,
  recommendationTypeEnum,
  roleSkillImportanceEnum,
  skillSourceEnum,
  userRoleEnum,
} from './enums';

// ---------------------------------------------------------------------------
// Core tenant & identity
// ---------------------------------------------------------------------------

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  settings: jsonb('settings').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    authUserId: uuid('auth_user_id').unique(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('users_organization_id_idx').on(table.organizationId),
    uniqueIndex('users_auth_user_id_idx').on(table.authUserId),
  ],
);

export const employees = pgTable(
  'employees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    employeeNumber: text('employee_number'),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    email: text('email').notNull(),
    title: text('title'),
    department: text('department'),
    location: text('location'),
    hireDate: timestamp('hire_date', { withTimezone: true }),
    managerId: uuid('manager_id').references((): AnyPgColumn => employees.id, {
      onDelete: 'set null',
    }),
    teamId: uuid('team_id').references((): AnyPgColumn => teams.id, { onDelete: 'set null' }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('employees_organization_id_idx').on(table.organizationId),
    index('employees_manager_id_idx').on(table.managerId),
    index('employees_team_id_idx').on(table.teamId),
    index('employees_user_id_idx').on(table.userId),
  ],
);

export const employeeProfiles = pgTable(
  'employee_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    bio: text('bio'),
    careerInterests: text('career_interests').array(),
    preferredLearningStyle: text('preferred_learning_style'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('employee_profiles_organization_id_idx').on(table.organizationId),
    uniqueIndex('employee_profiles_employee_id_idx').on(table.employeeId),
  ],
);

export const teams = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    department: text('department'),
    managerEmployeeId: uuid('manager_employee_id').references((): AnyPgColumn => employees.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('teams_organization_id_idx').on(table.organizationId),
    index('teams_manager_employee_id_idx').on(table.managerEmployeeId),
  ],
);

export const managers = pgTable(
  'managers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'set null' }),
    spanOfControl: integer('span_of_control'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('managers_organization_id_idx').on(table.organizationId),
    uniqueIndex('managers_employee_id_idx').on(table.employeeId),
    index('managers_team_id_idx').on(table.teamId),
  ],
);

// ---------------------------------------------------------------------------
// Skills & roles
// ---------------------------------------------------------------------------

export const skills = pgTable(
  'skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    category: text('category'),
    description: text('description'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('skills_organization_id_idx').on(table.organizationId),
    uniqueIndex('skills_organization_id_name_idx').on(table.organizationId, table.name),
  ],
);

export const employeeSkills = pgTable(
  'employee_skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
    proficiencyLevel: integer('proficiency_level').notNull(),
    source: skillSourceEnum('source').notNull(),
    lastAssessedAt: timestamp('last_assessed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('employee_skills_organization_id_idx').on(table.organizationId),
    index('employee_skills_employee_id_idx').on(table.employeeId),
    index('employee_skills_skill_id_idx').on(table.skillId),
    uniqueIndex('employee_skills_employee_skill_idx').on(table.employeeId, table.skillId),
  ],
);

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    level: text('level'),
    department: text('department'),
    description: text('description'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('roles_organization_id_idx').on(table.organizationId)],
);

export const roleSkills = pgTable(
  'role_skills',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    skillId: uuid('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
    requiredLevel: integer('required_level').notNull(),
    importance: roleSkillImportanceEnum('importance').default('required').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('role_skills_organization_id_idx').on(table.organizationId),
    index('role_skills_role_id_idx').on(table.roleId),
    uniqueIndex('role_skills_role_skill_idx').on(table.roleId, table.skillId),
  ],
);

// ---------------------------------------------------------------------------
// Growth & learning
// ---------------------------------------------------------------------------

export const careerGoals = pgTable(
  'career_goals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    targetRoleId: uuid('target_role_id').references(() => roles.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    description: text('description'),
    targetDate: timestamp('target_date', { withTimezone: true }),
    status: careerGoalStatusEnum('status').default('active').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('career_goals_organization_id_idx').on(table.organizationId),
    index('career_goals_employee_id_idx').on(table.employeeId),
  ],
);

export const learningResources = pgTable(
  'learning_resources',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    format: learningFormatEnum('format'),
    url: text('url'),
    skillIds: uuid('skill_ids').array(),
    durationMinutes: integer('duration_minutes'),
    provider: text('provider'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('learning_resources_organization_id_idx').on(table.organizationId)],
);

export const opportunities = pgTable(
  'opportunities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    roleId: uuid('role_id').references(() => roles.id, { onDelete: 'set null' }),
    department: text('department'),
    location: text('location'),
    status: opportunityStatusEnum('status').default('open').notNull(),
    postedAt: timestamp('posted_at', { withTimezone: true }),
    closesAt: timestamp('closes_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('opportunities_organization_id_idx').on(table.organizationId)],
);

export const growthPlans = pgTable(
  'growth_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    status: growthPlanStatusEnum('status').default('draft').notNull(),
    startDate: timestamp('start_date', { withTimezone: true }),
    targetDate: timestamp('target_date', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('growth_plans_organization_id_idx').on(table.organizationId),
    index('growth_plans_employee_id_idx').on(table.employeeId),
  ],
);

export const growthPlanItems = pgTable(
  'growth_plan_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    growthPlanId: uuid('growth_plan_id')
      .notNull()
      .references(() => growthPlans.id, { onDelete: 'cascade' }),
    itemType: growthPlanItemTypeEnum('item_type').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    status: growthPlanItemStatusEnum('status').default('pending').notNull(),
    dueDate: timestamp('due_date', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    referenceId: uuid('reference_id'),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('growth_plan_items_organization_id_idx').on(table.organizationId),
    index('growth_plan_items_growth_plan_id_idx').on(table.growthPlanId),
  ],
);

// ---------------------------------------------------------------------------
// Recommendations & evidence
// ---------------------------------------------------------------------------

export const recommendations = pgTable(
  'recommendations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    agentId: text('agent_id').notNull(),
    type: recommendationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    explanation: text('explanation').notNull(),
    confidence: confidenceLevelEnum('confidence').notNull(),
    confidenceScore: real('confidence_score'),
    status: recommendationStatusEnum('status').default('pending').notNull(),
    governanceStatus: governanceStatusEnum('governance_status').default('passed').notNull(),
    metadata: jsonb('metadata').default({}),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('recommendations_organization_id_idx').on(table.organizationId),
    index('recommendations_employee_id_idx').on(table.employeeId),
    index('recommendations_agent_id_idx').on(table.agentId),
    index('recommendations_status_idx').on(table.status),
  ],
);

export const recommendationEvidence = pgTable(
  'recommendation_evidence',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    recommendationId: uuid('recommendation_id')
      .notNull()
      .references(() => recommendations.id, { onDelete: 'cascade' }),
    evidenceType: evidenceTypeEnum('evidence_type').notNull(),
    referenceId: uuid('reference_id'),
    label: text('label').notNull(),
    detail: text('detail'),
    sortOrder: integer('sort_order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('recommendation_evidence_organization_id_idx').on(table.organizationId),
    index('recommendation_evidence_recommendation_id_idx').on(table.recommendationId),
  ],
);

// ---------------------------------------------------------------------------
// Agents & audit
// ---------------------------------------------------------------------------

export const agentConversations = pgTable(
  'agent_conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    agentId: text('agent_id').notNull(),
    title: text('title'),
    status: conversationStatusEnum('status').default('active').notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('agent_conversations_organization_id_idx').on(table.organizationId),
    index('agent_conversations_user_id_idx').on(table.userId),
    index('agent_conversations_agent_id_idx').on(table.agentId),
  ],
);

export const agentMessages = pgTable(
  'agent_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => agentConversations.id, { onDelete: 'cascade' }),
    role: agentMessageRoleEnum('role').notNull(),
    content: text('content').notNull(),
    agentId: text('agent_id'),
    governancePassed: boolean('governance_passed').default(true).notNull(),
    governanceStatus: governanceStatusEnum('governance_status').default('passed').notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('agent_messages_organization_id_idx').on(table.organizationId),
    index('agent_messages_conversation_id_idx').on(table.conversationId),
  ],
);

export const dataReadinessScores = pgTable(
  'data_readiness_scores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    scopeType: readinessScopeTypeEnum('scope_type').notNull(),
    scopeId: uuid('scope_id'),
    overallScore: real('overall_score').notNull(),
    dimensions: jsonb('dimensions').notNull(),
    calculatedAt: timestamp('calculated_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('data_readiness_scores_organization_id_idx').on(table.organizationId),
    index('data_readiness_scores_scope_idx').on(table.scopeType, table.scopeId),
  ],
);

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    resourceType: text('resource_type').notNull(),
    resourceId: uuid('resource_id'),
    details: jsonb('details').default({}),
    ipAddress: text('ip_address'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('audit_logs_organization_id_idx').on(table.organizationId),
    index('audit_logs_user_id_idx').on(table.userId),
    index('audit_logs_action_idx').on(table.action),
    index('audit_logs_created_at_idx').on(table.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// RBAC (policies applied in Phase 8B)
// ---------------------------------------------------------------------------

export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull().unique(),
    description: text('description'),
    resource: text('resource').notNull(),
    action: text('action').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex('permissions_resource_action_idx').on(table.resource, table.action)],
);

export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: userRoleEnum('role').notNull(),
    grantedBy: uuid('granted_by').references(() => users.id, { onDelete: 'set null' }),
    grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('user_roles_organization_id_idx').on(table.organizationId),
    index('user_roles_user_id_idx').on(table.userId),
    uniqueIndex('user_roles_user_role_idx').on(table.userId, table.role),
  ],
);
