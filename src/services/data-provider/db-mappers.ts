import { getConfidenceLevel } from '@/lib/format/confidence';
import type {
  CareerGoal,
  DataReadinessScore,
  Employee,
  EmployeeProfile,
  EmployeeSkill,
  GrowthPlan,
  GrowthPlanItem,
  LearningResource,
  Opportunity,
  Organization,
  Recommendation,
  RecommendationEvidence,
  Role,
  RoleSkill,
  Skill,
  Team,
  User,
} from './types';

/**
 * ISO-8601 string for a timestamp column. Nullish values collapse to the Unix
 * epoch -- a sentinel, not a date; see the open 2026-08-31 backlog item.
 * Shared with workforce-intelligence-mappers.ts; keep exactly one copy.
 */
export function toIso(value: Date | string | null | undefined): string {
  if (!value) return new Date(0).toISOString();
  return value instanceof Date ? value.toISOString() : value;
}

function toDateOnly(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const iso = value instanceof Date ? value.toISOString() : value;
  return iso.slice(0, 10);
}

type JsonRecord = Record<string, unknown>;

export function mapOrganization(row: {
  id: string;
  name: string;
  slug: string;
  settings: unknown;
  createdAt: Date;
  updatedAt: Date;
}): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    settings: (row.settings as JsonRecord) ?? {},
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapUser(row: {
  id: string;
  organizationId: string;
  authUserId: string | null;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    id: row.id,
    organizationId: row.organizationId,
    authUserId: row.authUserId,
    email: row.email,
    fullName: row.displayName,
    avatarUrl: row.avatarUrl,
    isActive: row.isActive,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapEmployee(row: {
  id: string;
  organizationId: string;
  userId: string | null;
  title: string | null;
  department: string | null;
  hireDate: Date | null;
  managerId: string | null;
  teamId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Employee {
  return {
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId ?? row.id,
    jobTitle: row.title ?? 'Team Member',
    department: row.department,
    hireDate: toDateOnly(row.hireDate),
    managerId: row.managerId,
    teamId: row.teamId,
    currentRoleId: null,
    isActive: row.isActive,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapEmployeeProfile(row: {
  id: string;
  employeeId: string;
  bio: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): EmployeeProfile {
  const metadata = (row.metadata as JsonRecord) ?? {};
  return {
    id: row.id,
    employeeId: row.employeeId,
    bio: row.bio,
    careerSummary: typeof metadata.careerSummary === 'string' ? metadata.careerSummary : null,
    onboardingCompletedAt:
      typeof metadata.onboardingCompletedAt === 'string' ? metadata.onboardingCompletedAt : null,
    inferredSkillsVisible:
      typeof metadata.inferredSkillsVisible === 'boolean' ? metadata.inferredSkillsVisible : true,
    preferences: (metadata.preferences as JsonRecord) ?? {},
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapTeam(row: {
  id: string;
  organizationId: string;
  name: string;
  department: string | null;
  managerEmployeeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Team {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    department: row.department,
    managerEmployeeId: row.managerEmployeeId,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapSkill(row: {
  id: string;
  organizationId: string;
  name: string;
  category: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Skill {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    category: row.category,
    description: row.description,
    isActive: row.isActive,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapEmployeeSkill(row: {
  id: string;
  employeeId: string;
  skillId: string;
  source: 'confirmed' | 'inferred';
  proficiencyLevel: number;
  createdAt: Date;
  updatedAt: Date;
}): EmployeeSkill {
  const confidence = Math.min(1, Math.max(0, row.proficiencyLevel / 5));
  return {
    id: row.id,
    employeeId: row.employeeId,
    skillId: row.skillId,
    source: row.source,
    proficiencyLevel: row.proficiencyLevel,
    confidence,
    evidenceSummary: null,
    confirmedAt: row.source === 'confirmed' ? toIso(row.updatedAt) : null,
    confirmedBy: null,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapRole(row: {
  id: string;
  organizationId: string;
  title: string;
  level: string | null;
  department: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Role {
  return {
    id: row.id,
    organizationId: row.organizationId,
    title: row.title,
    level: row.level,
    department: row.department,
    description: row.description,
    isActive: row.isActive,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function normalizeRoleSkillImportance(
  importance: 'required' | 'preferred' | 'nice_to_have',
): RoleSkill['importance'] {
  return importance === 'nice_to_have' ? 'preferred' : importance;
}

export function mapRoleSkill(row: {
  id: string;
  roleId: string;
  skillId: string;
  requiredLevel: number;
  importance: 'required' | 'preferred' | 'nice_to_have';
  createdAt: Date;
}): RoleSkill {
  return {
    id: row.id,
    roleId: row.roleId,
    skillId: row.skillId,
    importance: normalizeRoleSkillImportance(row.importance),
    minProficiency: row.requiredLevel,
    createdAt: toIso(row.createdAt),
  };
}

function normalizeCareerGoalStatus(
  status: 'active' | 'achieved' | 'archived' | 'completed' | 'paused' | 'cancelled',
): CareerGoal['status'] {
  if (status === 'completed') return 'achieved';
  if (status === 'paused' || status === 'cancelled') return 'archived';
  return status;
}

export function mapCareerGoal(row: {
  id: string;
  employeeId: string;
  targetRoleId: string | null;
  title: string;
  description: string | null;
  targetDate: Date | null;
  status: 'active' | 'achieved' | 'archived' | 'completed' | 'paused' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}): CareerGoal {
  return {
    id: row.id,
    employeeId: row.employeeId,
    targetRoleId: row.targetRoleId,
    title: row.title,
    description: row.description,
    timelineMonths: null,
    status: normalizeCareerGoalStatus(row.status),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function normalizeLearningFormat(
  format:
    | 'course'
    | 'book'
    | 'workshop'
    | 'mentorship'
    | 'article'
    | 'video'
    | 'certification'
    | null,
): LearningResource['format'] {
  if (format === 'book' || format === 'workshop' || format === 'mentorship') {
    return format;
  }
  return 'course';
}

export function mapLearningResource(row: {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  format:
    | 'course'
    | 'book'
    | 'workshop'
    | 'mentorship'
    | 'article'
    | 'video'
    | 'certification'
    | null;
  url: string | null;
  skillIds: string[] | null;
  durationMinutes: number | null;
  provider: string | null;
  isActive: boolean;
  createdAt: Date;
}): LearningResource {
  return {
    id: row.id,
    organizationId: row.organizationId,
    title: row.title,
    description: row.description,
    url: row.url,
    provider: row.provider,
    durationHours: row.durationMinutes ? row.durationMinutes / 60 : null,
    skillIds: row.skillIds ?? [],
    format: normalizeLearningFormat(row.format),
    isActive: row.isActive,
    createdAt: toIso(row.createdAt),
  };
}

function normalizeOpportunityStatus(
  status: 'open' | 'closed' | 'filled' | 'draft',
): Opportunity['status'] {
  return status === 'draft' ? 'open' : status;
}

export function mapOpportunity(
  row: {
    id: string;
    organizationId: string;
    title: string;
    description: string | null;
    roleId: string | null;
    department: string | null;
    status: 'open' | 'closed' | 'filled' | 'draft';
    postedAt: Date | null;
    createdAt: Date;
  },
  requiredSkillIds: string[],
): Opportunity {
  return {
    id: row.id,
    organizationId: row.organizationId,
    title: row.title,
    description: row.description,
    roleId: row.roleId,
    department: row.department,
    requiredSkillIds,
    status: normalizeOpportunityStatus(row.status),
    postedAt: toIso(row.postedAt ?? row.createdAt),
    createdAt: toIso(row.createdAt),
  };
}

export function mapGrowthPlan(row: {
  id: string;
  employeeId: string;
  title: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  startDate: Date | null;
  targetDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): GrowthPlan {
  return {
    id: row.id,
    employeeId: row.employeeId,
    careerGoalId: null,
    targetRoleId: null,
    title: row.title,
    status: row.status,
    startDate: toDateOnly(row.startDate) ?? toDateOnly(row.createdAt) ?? '2026-01-01',
    endDate: toDateOnly(row.targetDate),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function milestoneDayFromSortOrder(sortOrder: number): 30 | 60 | 90 {
  if (sortOrder <= 0) return 30;
  if (sortOrder === 1) return 60;
  return 90;
}

function normalizeGrowthPlanItemType(
  itemType: 'skill' | 'learning' | 'project' | 'conversation' | 'milestone',
): GrowthPlanItem['itemType'] {
  return itemType === 'milestone' ? 'conversation' : itemType;
}

function normalizeGrowthPlanItemStatus(
  status: 'pending' | 'in_progress' | 'completed' | 'skipped',
): GrowthPlanItem['status'] {
  return status === 'skipped' ? 'pending' : status;
}

export function mapGrowthPlanItem(row: {
  id: string;
  growthPlanId: string;
  itemType: 'skill' | 'learning' | 'project' | 'conversation' | 'milestone';
  title: string;
  description: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  dueDate: Date | null;
  referenceId: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): GrowthPlanItem {
  const milestoneDay = milestoneDayFromSortOrder(row.sortOrder);
  const itemType = normalizeGrowthPlanItemType(row.itemType);
  const skillId = itemType === 'skill' ? row.referenceId : null;
  const learningResourceId = itemType === 'learning' ? row.referenceId : null;

  return {
    id: row.id,
    growthPlanId: row.growthPlanId,
    title: row.title,
    description: row.description,
    milestoneDay,
    itemType,
    skillId,
    learningResourceId,
    status: normalizeGrowthPlanItemStatus(row.status),
    dueDate: toDateOnly(row.dueDate),
    sortOrder: row.sortOrder,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapRecommendation(row: {
  id: string;
  organizationId: string;
  employeeId: string;
  agentId: string;
  type: Recommendation['type'];
  title: string;
  explanation: string;
  confidenceScore: number | null;
  confidence: 'low' | 'medium' | 'high';
  status: Recommendation['status'];
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}): Recommendation {
  const score = row.confidenceScore ?? (row.confidence === 'high' ? 0.85 : row.confidence === 'medium' ? 0.65 : 0.4);
  return {
    id: row.id,
    organizationId: row.organizationId,
    employeeId: row.employeeId,
    agentId: row.agentId,
    type: row.type,
    title: row.title,
    explanation: row.explanation,
    confidence: score,
    confidenceLevel: getConfidenceLevel(score),
    status: row.status,
    metadata: (row.metadata as JsonRecord) ?? {},
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

export function mapRecommendationEvidence(row: {
  id: string;
  recommendationId: string;
  evidenceType: RecommendationEvidence['evidenceType'];
  referenceId: string | null;
  label: string;
  detail: string | null;
  createdAt: Date;
}): RecommendationEvidence {
  return {
    id: row.id,
    recommendationId: row.recommendationId,
    evidenceType: row.evidenceType,
    referenceId: row.referenceId,
    label: row.label,
    detail: row.detail,
    createdAt: toIso(row.createdAt),
  };
}

export function mapDataReadinessScore(row: {
  id: string;
  organizationId: string;
  scopeType: DataReadinessScore['scopeType'];
  scopeId: string | null;
  overallScore: number;
  dimensions: unknown;
  calculatedAt: Date;
  createdAt: Date;
}): DataReadinessScore {
  const dimensions = (row.dimensions as JsonRecord) ?? {};
  const num = (key: string) => (typeof dimensions[key] === 'number' ? dimensions[key] : null);
  return {
    id: row.id,
    organizationId: row.organizationId,
    scopeType: row.scopeType,
    scopeId: row.scopeId,
    overallScore: Math.round(row.overallScore),
    confirmedSkillsPct: num('confirmedSkillsPct'),
    profileCompletenessPct: num('profileCompletenessPct'),
    roleMappingPct: num('roleMappingPct'),
    activePlansPct: num('activePlansPct'),
    calculatedAt: toIso(row.calculatedAt),
    createdAt: toIso(row.createdAt),
  };
}
