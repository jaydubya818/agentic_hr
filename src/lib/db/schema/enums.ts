import { pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', [
  'employee',
  'manager',
  'hr_admin',
  'org_admin',
  'executive_readonly',
]);

export const skillSourceEnum = pgEnum('skill_source', ['confirmed', 'inferred']);

export const careerGoalStatusEnum = pgEnum('career_goal_status', [
  'active',
  'achieved',
  'archived',
]);

export const growthPlanStatusEnum = pgEnum('growth_plan_status', [
  'draft',
  'active',
  'completed',
  'archived',
]);

export const growthPlanItemTypeEnum = pgEnum('growth_plan_item_type', [
  'skill',
  'learning',
  'project',
  'conversation',
]);

export const growthPlanItemStatusEnum = pgEnum('growth_plan_item_status', [
  'pending',
  'in_progress',
  'completed',
]);

export const learningFormatEnum = pgEnum('learning_format', [
  'course',
  'book',
  'workshop',
  'mentorship',
]);

export const opportunityStatusEnum = pgEnum('opportunity_status', ['open', 'filled', 'closed']);

export const recommendationTypeEnum = pgEnum('recommendation_type', [
  'career_path',
  'skill_gap',
  'learning',
  'growth_plan',
  'coaching',
  'stretch_assignment',
  'mobility',
  'team_action',
  'capability_plan',
]);

export const confidenceLevelEnum = pgEnum('confidence_level', ['high', 'medium', 'low']);

export const recommendationStatusEnum = pgEnum('recommendation_status', [
  'pending',
  'accepted',
  'dismissed',
  'expired',
]);

export const governanceStatusEnum = pgEnum('governance_status', ['passed', 'blocked', 'flagged']);

export const evidenceTypeEnum = pgEnum('evidence_type', [
  'skill',
  'role_requirement',
  'learning_resource',
  'opportunity',
  'data_point',
]);

export const agentMessageRoleEnum = pgEnum('agent_message_role', ['user', 'assistant', 'system']);

export const conversationStatusEnum = pgEnum('conversation_status', ['active', 'completed']);

export const readinessScopeTypeEnum = pgEnum('readiness_scope_type', [
  'organization',
  'department',
  'team',
]);

export const roleSkillImportanceEnum = pgEnum('role_skill_importance', ['required', 'preferred']);
