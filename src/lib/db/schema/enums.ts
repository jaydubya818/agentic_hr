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

export const decisionTypeEnum = pgEnum('decision_type', [
  'team_composition',
  'skill_development',
  'work_redesign',
  'project_assignment',
  'capability_building',
  'learning_investment',
  'internal_mobility_exploration',
  'coaching_intervention',
]);

export const decisionStatusEnum = pgEnum('decision_status', [
  'draft',
  'proposed',
  'under_review',
  'approved',
  'implemented',
  'cancelled',
  'archived',
]);

export const scenarioTypeEnum = pgEnum('scenario_type', [
  'current_state',
  'future_state',
  'comparison',
]);

export const scenarioStatusEnum = pgEnum('scenario_status', [
  'draft',
  'active',
  'archived',
  'completed',
]);

export const roleTaskChangeTypeEnum = pgEnum('role_task_change_type', [
  'add',
  'remove',
  'increase',
  'decrease',
  'automate',
  'delegate',
]);

export const outcomeStatusEnum = pgEnum('outcome_status', [
  'pending',
  'on_track',
  'achieved',
  'partially_achieved',
  'missed',
  'cancelled',
]);

export const contextEntityTypeEnum = pgEnum('context_entity_type', [
  'employee',
  'skill',
  'role',
  'team',
  'project',
  'business_priority',
  'learning_resource',
  'opportunity',
]);

export const contextRelationshipTypeEnum = pgEnum('context_relationship_type', [
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

export const proposedActionTypeEnum = pgEnum('proposed_action_type', [
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

export const proposedActionStatusEnum = pgEnum('proposed_action_status', [
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'applied',
  'dismissed',
]);
