import { z } from 'zod';

export const userRoleSchema = z.enum([
  'employee',
  'manager',
  'hr_admin',
  'org_admin',
  'executive_readonly',
]);

export const skillSourceSchema = z.enum(['confirmed', 'inferred']);

export const careerGoalStatusSchema = z.enum(['active', 'achieved', 'archived']);

export const growthPlanStatusSchema = z.enum(['draft', 'active', 'completed', 'archived']);

export const growthPlanItemTypeSchema = z.enum(['skill', 'learning', 'project', 'conversation']);

export const growthPlanItemStatusSchema = z.enum(['pending', 'in_progress', 'completed']);

export const learningFormatSchema = z.enum(['course', 'book', 'workshop', 'mentorship']);

export const opportunityStatusSchema = z.enum(['open', 'filled', 'closed']);

export const recommendationTypeSchema = z.enum([
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

export const confidenceLevelSchema = z.enum(['high', 'medium', 'low']);

export const recommendationStatusSchema = z.enum(['pending', 'accepted', 'dismissed', 'expired']);

export const evidenceTypeSchema = z.enum([
  'skill',
  'role_requirement',
  'learning_resource',
  'opportunity',
  'data_point',
]);

export const agentMessageRoleSchema = z.enum(['user', 'assistant', 'system']);

export const conversationStatusSchema = z.enum(['active', 'completed']);

export const readinessScopeTypeSchema = z.enum(['organization', 'department', 'team']);

export const roleSkillImportanceSchema = z.enum(['required', 'preferred']);
