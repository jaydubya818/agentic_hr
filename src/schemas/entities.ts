import { z } from 'zod';
import {
  agentMessageRoleSchema,
  careerGoalStatusSchema,
  confidenceLevelSchema,
  conversationStatusSchema,
  evidenceTypeSchema,
  growthPlanItemStatusSchema,
  growthPlanItemTypeSchema,
  growthPlanStatusSchema,
  learningFormatSchema,
  opportunityStatusSchema,
  readinessScopeTypeSchema,
  recommendationStatusSchema,
  recommendationTypeSchema,
  roleSkillImportanceSchema,
  skillSourceSchema,
  userRoleSchema,
} from './enums';
import {
  confidenceScoreSchema,
  dateSchema,
  proficiencyLevelSchema,
  timestampSchema,
  uuidSchema,
} from './common';

export const organizationSchema = z.object({
  id: uuidSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  settings: z.record(z.string(), z.unknown()).default({}),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const userSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  authUserId: uuidSchema.nullable().optional(),
  email: z.string().email(),
  fullName: z.string().min(1),
  avatarUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const userRoleRecordSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
  role: userRoleSchema,
  grantedAt: timestampSchema,
  grantedBy: uuidSchema.nullable().optional(),
});

export const teamSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  name: z.string().min(1),
  department: z.string().nullable().optional(),
  managerEmployeeId: uuidSchema.nullable().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const roleSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  title: z.string().min(1),
  level: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const employeeSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  userId: uuidSchema,
  teamId: uuidSchema.nullable().optional(),
  managerId: uuidSchema.nullable().optional(),
  jobTitle: z.string().min(1),
  department: z.string().nullable().optional(),
  hireDate: dateSchema.nullable().optional(),
  currentRoleId: uuidSchema.nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const employeeProfileSchema = z.object({
  id: uuidSchema,
  employeeId: uuidSchema,
  bio: z.string().nullable().optional(),
  careerSummary: z.string().nullable().optional(),
  onboardingCompletedAt: timestampSchema.nullable().optional(),
  inferredSkillsVisible: z.boolean().default(true),
  preferences: z.record(z.string(), z.unknown()).default({}),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const managerSchema = z.object({
  id: uuidSchema,
  employeeId: uuidSchema,
  teamId: uuidSchema,
  createdAt: timestampSchema,
});

export const skillSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  name: z.string().min(1),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const employeeSkillSchema = z.object({
  id: uuidSchema,
  employeeId: uuidSchema,
  skillId: uuidSchema,
  source: skillSourceSchema,
  proficiencyLevel: proficiencyLevelSchema.nullable().optional(),
  confidence: confidenceScoreSchema.nullable().optional(),
  evidenceSummary: z.string().nullable().optional(),
  confirmedAt: timestampSchema.nullable().optional(),
  confirmedBy: uuidSchema.nullable().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const roleSkillSchema = z.object({
  id: uuidSchema,
  roleId: uuidSchema,
  skillId: uuidSchema,
  importance: roleSkillImportanceSchema,
  minProficiency: proficiencyLevelSchema.nullable().optional(),
  createdAt: timestampSchema,
});

export const careerGoalSchema = z.object({
  id: uuidSchema,
  employeeId: uuidSchema,
  targetRoleId: uuidSchema.nullable().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  timelineMonths: z.number().int().positive().nullable().optional(),
  status: careerGoalStatusSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const learningResourceSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  url: z.string().url().nullable().optional(),
  provider: z.string().nullable().optional(),
  durationHours: z.number().positive().nullable().optional(),
  skillIds: z.array(uuidSchema).default([]),
  format: learningFormatSchema,
  isActive: z.boolean().default(true),
  createdAt: timestampSchema,
});

export const opportunitySchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  roleId: uuidSchema.nullable().optional(),
  department: z.string().nullable().optional(),
  requiredSkillIds: z.array(uuidSchema).default([]),
  status: opportunityStatusSchema,
  postedAt: timestampSchema,
  createdAt: timestampSchema,
});

export const growthPlanSchema = z.object({
  id: uuidSchema,
  employeeId: uuidSchema,
  careerGoalId: uuidSchema.nullable().optional(),
  targetRoleId: uuidSchema.nullable().optional(),
  title: z.string().min(1),
  status: growthPlanStatusSchema,
  startDate: dateSchema,
  endDate: dateSchema.nullable().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const growthPlanItemSchema = z.object({
  id: uuidSchema,
  growthPlanId: uuidSchema,
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  milestoneDay: z.union([z.literal(30), z.literal(60), z.literal(90)]),
  itemType: growthPlanItemTypeSchema,
  skillId: uuidSchema.nullable().optional(),
  learningResourceId: uuidSchema.nullable().optional(),
  status: growthPlanItemStatusSchema,
  dueDate: dateSchema.nullable().optional(),
  sortOrder: z.number().int().default(0),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const recommendationEvidenceSchema = z.object({
  id: uuidSchema,
  recommendationId: uuidSchema,
  evidenceType: evidenceTypeSchema,
  referenceId: uuidSchema.nullable().optional(),
  label: z.string().min(1),
  detail: z.string().nullable().optional(),
  createdAt: timestampSchema,
});

export const recommendationSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  employeeId: uuidSchema,
  agentId: z.string().min(1),
  type: recommendationTypeSchema,
  title: z.string().min(5).max(200),
  explanation: z.string().min(20).max(2000),
  confidence: confidenceScoreSchema,
  confidenceLevel: confidenceLevelSchema,
  status: recommendationStatusSchema,
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const agentConversationSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  userId: uuidSchema,
  employeeId: uuidSchema.nullable().optional(),
  agentId: z.string().min(1),
  contextType: z.string().nullable().optional(),
  status: conversationStatusSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const agentMessageSchema = z.object({
  id: uuidSchema,
  conversationId: uuidSchema,
  role: agentMessageRoleSchema,
  content: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
  governancePassed: z.boolean().default(true),
  createdAt: timestampSchema,
});

export const dataReadinessScoreSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  scopeType: readinessScopeTypeSchema,
  scopeId: uuidSchema.nullable().optional(),
  overallScore: z.number().int().min(0).max(100),
  confirmedSkillsPct: z.number().min(0).max(100).nullable().optional(),
  profileCompletenessPct: z.number().min(0).max(100).nullable().optional(),
  roleMappingPct: z.number().min(0).max(100).nullable().optional(),
  activePlansPct: z.number().min(0).max(100).nullable().optional(),
  calculatedAt: timestampSchema,
  createdAt: timestampSchema,
});

export const auditLogSchema = z.object({
  id: uuidSchema,
  organizationId: uuidSchema,
  userId: uuidSchema.nullable().optional(),
  action: z.string().min(1),
  entityType: z.string().min(1),
  entityId: uuidSchema.nullable().optional(),
  details: z.record(z.string(), z.unknown()).default({}),
  ipAddress: z.string().nullable().optional(),
  createdAt: timestampSchema,
});

export const permissionSchema = z.object({
  id: uuidSchema,
  role: userRoleSchema,
  resource: z.string().min(1),
  action: z.string().min(1),
  createdAt: timestampSchema,
});

export const createRecommendationInputSchema = z.object({
  type: recommendationTypeSchema,
  title: z.string().min(5).max(200),
  explanation: z.string().min(20).max(2000),
  confidence: confidenceScoreSchema,
  evidence: z
    .array(
      z.object({
        evidenceType: evidenceTypeSchema,
        referenceId: uuidSchema.optional(),
        label: z.string().min(1),
        detail: z.string().optional(),
      }),
    )
    .min(1),
});
