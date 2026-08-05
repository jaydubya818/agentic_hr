import organizationData from '../../../data/mock/organization.json';
import usersData from '../../../data/mock/users.json';
import employeesData from '../../../data/mock/employees.json';
import employeeProfilesData from '../../../data/mock/employee-profiles.json';
import teamsData from '../../../data/mock/teams.json';
import skillsData from '../../../data/mock/skills.json';
import employeeSkillsData from '../../../data/mock/employee-skills.json';
import rolesData from '../../../data/mock/roles.json';
import roleSkillsData from '../../../data/mock/role-skills.json';
import careerGoalsData from '../../../data/mock/career-goals.json';
import learningResourcesData from '../../../data/mock/learning-resources.json';
import opportunitiesData from '../../../data/mock/opportunities.json';
import growthPlansData from '../../../data/mock/growth-plans.json';
import growthPlanItemsData from '../../../data/mock/growth-plan-items.json';
import recommendationsData from '../../../data/mock/recommendations.json';
import recommendationEvidenceData from '../../../data/mock/recommendation-evidence.json';
import dataReadinessData from '../../../data/mock/data-readiness.json';
import { loadWorkforceIntelligenceFixtures } from './workforce-intelligence-fixtures';
import { z } from 'zod';
import {
  careerGoalSchema,
  dataReadinessScoreSchema,
  employeeProfileSchema,
  employeeSchema,
  employeeSkillSchema,
  growthPlanItemSchema,
  growthPlanSchema,
  learningResourceSchema,
  opportunitySchema,
  organizationSchema,
  recommendationEvidenceSchema,
  recommendationSchema,
  roleSchema,
  roleSkillSchema,
  skillSchema,
  teamSchema,
  userSchema,
} from '@/schemas';
import { getConfidenceLevel } from '@/lib/format/confidence';
import { shouldUseSupabaseProvider } from './provider-config';
import { getCachedSupabaseStore } from './store-runtime';
import type {
  CareerGoal,
  CareerPathMatch,
  CoachingPrompt,
  CoachingPromptCategory,
  DataReadinessScore,
  Employee,
  EmployeeProfile,
  EmployeeSkill,
  EmployeeSummaryForManager,
  GrowthPlan,
  GrowthPlanItem,
  HrDashboard,
  HrInsightRecommendation,
  ManagerConversationPrep,
  ManagerDashboard,
  ManagerTeamMemberSummary,
  MobilityInsights,
  MockDataStore,
  Opportunity,
  Organization,
  Recommendation,
  RecommendationEvidence,
  Role,
  Skill,
  SkillGap,
  SkillsReadinessReport,
  Team,
  TeamCapabilityPlan,
  TeamSkillsMatrix,
  TeamSkillsMatrixMember,
  TalentDensityReport,
  User,
  WorkforceReadinessReport,
} from './types';

function parseArray<T>(schema: { parse: (data: unknown) => T }, data: unknown, label: string): T {
  try {
    return schema.parse(data);
  } catch (error) {
    throw new Error(`Invalid mock data for ${label}: ${String(error)}`);
  }
}

function loadStore(): MockDataStore {
  return {
    organizations: parseArray(z.array(organizationSchema), organizationData, 'organization'),
    users: parseArray(z.array(userSchema), usersData, 'users'),
    employees: parseArray(z.array(employeeSchema), employeesData, 'employees'),
    employeeProfiles: parseArray(z.array(employeeProfileSchema), employeeProfilesData, 'employeeProfiles'),
    teams: parseArray(z.array(teamSchema), teamsData, 'teams'),
    skills: parseArray(z.array(skillSchema), skillsData, 'skills'),
    employeeSkills: parseArray(z.array(employeeSkillSchema), employeeSkillsData, 'employeeSkills'),
    roles: parseArray(z.array(roleSchema), rolesData, 'roles'),
    roleSkills: parseArray(z.array(roleSkillSchema), roleSkillsData, 'roleSkills'),
    careerGoals: parseArray(z.array(careerGoalSchema), careerGoalsData, 'careerGoals'),
    learningResources: parseArray(z.array(learningResourceSchema), learningResourcesData, 'learningResources'),
    opportunities: parseArray(z.array(opportunitySchema), opportunitiesData, 'opportunities'),
    growthPlans: parseArray(z.array(growthPlanSchema), growthPlansData, 'growthPlans'),
    growthPlanItems: parseArray(z.array(growthPlanItemSchema), growthPlanItemsData, 'growthPlanItems'),
    recommendations: parseArray(z.array(recommendationSchema), recommendationsData, 'recommendations'),
    recommendationEvidence: parseArray(
      z.array(recommendationEvidenceSchema),
      recommendationEvidenceData,
      'recommendationEvidence',
    ),
    dataReadinessScores: parseArray(
      z.array(dataReadinessScoreSchema),
      dataReadinessData,
      'dataReadinessScores',
    ),
    ...loadWorkforceIntelligenceFixtures(),
  };
}

let store: MockDataStore | null = null;

export function getMockStore(): MockDataStore {
  if (shouldUseSupabaseProvider()) {
    const cached = getCachedSupabaseStore();
    if (cached) {
      return cached;
    }
  }
  if (!store) {
    store = loadStore();
  }
  return store;
}

export function getCurrentUser(userId: string): User | undefined {
  return getMockStore().users.find((u) => u.id === userId);
}

export function getEmployeeByUserId(userId: string): Employee | undefined {
  return getMockStore().employees.find((e) => e.userId === userId);
}

export function getEmployeeProfile(employeeId: string): EmployeeProfile | undefined {
  return getMockStore().employeeProfiles.find((p) => p.employeeId === employeeId);
}

export function getEmployee(employeeId: string): Employee | undefined {
  return getMockStore().employees.find((e) => e.id === employeeId);
}

export function getOrganization(organizationId?: string): Organization | undefined {
  const data = getMockStore().organizations;
  if (!organizationId) return data[0];
  return data.find((o) => o.id === organizationId);
}

export function getTeamMembers(managerEmployeeId: string): Employee[] {
  const { employees } = getMockStore();
  return employees.filter((e) => e.managerId === managerEmployeeId && e.isActive);
}

export function getSkills(organizationId?: string): Skill[] {
  const orgId = organizationId ?? getOrganization()?.id;
  return getMockStore().skills.filter((s) => s.organizationId === orgId && s.isActive);
}

export function getEmployeeSkills(employeeId: string): EmployeeSkill[] {
  return getMockStore().employeeSkills.filter((es) => es.employeeId === employeeId);
}

export function getCareerGoals(employeeId: string): CareerGoal[] {
  return getMockStore().careerGoals.filter((g) => g.employeeId === employeeId);
}

export function getCareerPaths(employeeId: string): CareerPathMatch[] {
  const data = getMockStore();
  const employee = data.employees.find((e) => e.id === employeeId);
  if (!employee) return [];

  const employeeSkillRows = data.employeeSkills.filter((es) => es.employeeId === employeeId);
  const skillById = new Map(data.skills.map((s) => [s.id, s]));

  const candidateRoles = data.roles.filter(
    (r) => r.isActive && r.id !== employee.currentRoleId,
  );

  return candidateRoles.slice(0, 3).map((role, index) => {
    const requirements = data.roleSkills.filter((rs) => rs.roleId === role.id);
    const skillGaps = requirements
      .map((req) => {
        const skill = skillById.get(req.skillId);
        const current = employeeSkillRows.find((es) => es.skillId === req.skillId);
        if (!skill) return null;
        const currentLevel = current?.proficiencyLevel ?? null;
        const requiredLevel = req.minProficiency ?? 3;
        if (currentLevel !== null && currentLevel >= requiredLevel) return null;
        return { skill, currentLevel, requiredLevel };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null);

    const matchScore = Math.max(0.55, 0.9 - index * 0.08 - skillGaps.length * 0.03);
    const confidence = Math.min(0.95, matchScore + 0.05);

    return {
      role,
      matchScore,
      confidence,
      explanation: `Based on your confirmed and inferred skills, ${role.title} is a ${index === 0 ? 'strong' : 'viable'} growth direction. Gaps are development opportunities, not performance labels.`,
      skillGaps,
      suggestedLearning: data.learningResources
        .filter((lr) => lr.skillIds.some((sid) => skillGaps.some((g) => g.skill.id === sid)))
        .slice(0, 2),
      suggestedOpportunities: data.opportunities
        .filter((o) => o.status === 'open' && (o.roleId === role.id || o.roleId === null))
        .slice(0, 1),
    };
  });
}

export function getGrowthPlan(employeeId: string): {
  plan: GrowthPlan | undefined;
  items: GrowthPlanItem[];
} {
  const data = getMockStore();
  const plan = data.growthPlans.find(
    (gp) => gp.employeeId === employeeId && gp.status === 'active',
  );
  const items = plan
    ? data.growthPlanItems.filter((i) => i.growthPlanId === plan.id).sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
  return { plan, items };
}

export function getRecommendations(employeeId: string): Array<
  Recommendation & { evidence: RecommendationEvidence[] }
> {
  const data = getMockStore();
  return data.recommendations
    .filter((r) => r.employeeId === employeeId)
    .map((r) => ({
      ...r,
      evidence: data.recommendationEvidence.filter((e) => e.recommendationId === r.id),
    }));
}

export function getDataReadinessScores(organizationId?: string): DataReadinessScore[] {
  const orgId = organizationId ?? getOrganization()?.id;
  return getMockStore().dataReadinessScores.filter((s) => s.organizationId === orgId);
}

export function getTeamByManager(managerEmployeeId: string): Team | undefined {
  return getMockStore().teams.find((t) => t.managerEmployeeId === managerEmployeeId);
}

export function getRole(roleId: string): Role | undefined {
  return getMockStore().roles.find((r) => r.id === roleId);
}

export function getSkill(skillId: string): Skill | undefined {
  return getMockStore().skills.find((s) => s.id === skillId);
}

export function getManagerConversationPrep(
  employeeId: string,
): ManagerConversationPrep {
  const data = getMockStore();
  const { plan, items } = getGrowthPlan(employeeId);
  const careerGoals = getCareerGoals(employeeId);
  const employeeSkillRows = getEmployeeSkills(employeeId);
  const skillById = new Map(data.skills.map((s) => [s.id, s]));

  const activeGoal = careerGoals.find((g) => g.status === 'active');
  const targetRole = activeGoal?.targetRoleId
    ? data.roles.find((r) => r.id === activeGoal.targetRoleId)
    : undefined;

  const inferredSkills = employeeSkillRows
    .filter((es) => es.source === 'inferred')
    .map((es) => skillById.get(es.skillId))
    .filter((s): s is Skill => s != null);

  const inProgressItems = items.filter((i) => i.status === 'in_progress');

  const agenda = [
    'Review progress on your active growth plan',
    targetRole
      ? `Discuss development toward ${targetRole.title}`
      : 'Align on near-term growth priorities',
    'Identify support and stretch opportunities for the next quarter',
  ];

  const talkingPoints = [
    plan
      ? `Your ${plan.title} is active with ${items.filter((i) => i.status === 'completed').length} of ${items.length} milestones completed.`
      : 'You have growth goals documented — consider activating a structured 30/60/90 plan.',
    inProgressItems.length > 0
      ? `Current focus: ${inProgressItems.map((i) => i.title).join('; ')}.`
      : 'Several plan milestones are ready to start — discuss which to prioritize first.',
    inferredSkills.length > 0
      ? `Skills flagged for discussion: ${inferredSkills.map((s) => s.name).join(', ')} (inferred — confirm or refine together).`
      : 'Your confirmed skills profile is up to date — explore adjacent skills for your target path.',
    targetRole
      ? `Your stated goal is ${targetRole.title} over ${activeGoal?.timelineMonths ?? 12} months — ask about visibility into staff-level work.`
      : 'Share what kinds of projects energize you for the next development cycle.',
  ];

  const questionsToAsk = [
    'What opportunities do you see for me to deepen system design experience this quarter?',
    'How can I get more visibility into cross-team architecture decisions?',
    'Are there mentoring or tech-lead responsibilities that would support my growth goals?',
    'What would success look like for my current growth plan milestones?',
    'How can we adjust priorities if my learning path needs more time?',
  ];

  const nextSteps = [
    'Schedule a follow-up to review system design learning progress',
    'Request a stretch assignment aligned with platform reliability',
    'Confirm inferred skills after your next project cycle',
    plan ? 'Mark completed milestones in your growth plan before the next 1:1' : 'Create a growth plan from your career path selection',
  ];

  return {
    agenda,
    talkingPoints,
    questionsToAsk,
    skillsToDiscuss: inferredSkills.length > 0 ? inferredSkills : employeeSkillRows.slice(0, 3).map((es) => skillById.get(es.skillId)).filter((s): s is Skill => s != null),
    nextSteps,
  };
}

function getOrgId(organizationId?: string): string {
  return organizationId ?? getOrganization()?.id ?? '';
}

function getActiveEmployees(organizationId?: string): Employee[] {
  const orgId = getOrgId(organizationId);
  return getMockStore().employees.filter((e) => e.organizationId === orgId && e.isActive);
}

function getOrgOverallReadiness(organizationId?: string): DataReadinessScore | undefined {
  const orgId = getOrgId(organizationId);
  return getMockStore().dataReadinessScores.find(
    (s) => s.organizationId === orgId && s.scopeType === 'organization',
  );
}

function getDepartmentReadinessScores(organizationId?: string): Array<DataReadinessScore & { departmentName: string }> {
  const data = getMockStore();
  const orgId = getOrgId(organizationId);
  const teams = data.teams.filter((t) => t.organizationId === orgId);

  return data.dataReadinessScores
    .filter((s) => s.organizationId === orgId && s.scopeType === 'department' && s.scopeId)
    .map((score) => {
      const team = teams.find((t) => t.id === score.scopeId);
      return {
        ...score,
        departmentName: team?.department ?? team?.name ?? 'Unknown',
      };
    });
}

function computePlanAdoptionPct(organizationId?: string): number {
  const employees = getActiveEmployees(organizationId);
  if (employees.length === 0) return 0;
  const data = getMockStore();
  const withActivePlan = employees.filter((e) =>
    data.growthPlans.some((gp) => gp.employeeId === e.id && gp.status === 'active'),
  ).length;
  return Math.round((withActivePlan / employees.length) * 100);
}

function computeAdoptionByDepartment(organizationId?: string): Array<{ department: string; adoptionPct: number }> {
  const employees = getActiveEmployees(organizationId);
  const data = getMockStore();
  const byDept = new Map<string, { total: number; withPlan: number }>();

  for (const employee of employees) {
    const dept = employee.department ?? 'Unassigned';
    const current = byDept.get(dept) ?? { total: 0, withPlan: 0 };
    current.total += 1;
    if (data.growthPlans.some((gp) => gp.employeeId === employee.id && gp.status === 'active')) {
      current.withPlan += 1;
    }
    byDept.set(dept, current);
  }

  return Array.from(byDept.entries()).map(([department, stats]) => ({
    department,
    adoptionPct: stats.total === 0 ? 0 : Math.round((stats.withPlan / stats.total) * 100),
  }));
}

function computeMobilityMatchRate(organizationId?: string): {
  matchRatePct: number;
  employeesWithMatches: number;
  openOpportunities: number;
} {
  const employees = getActiveEmployees(organizationId);
  const orgId = getOrgId(organizationId);
  const openOpportunities = getMockStore().opportunities.filter(
    (o) => o.organizationId === orgId && o.status === 'open',
  ).length;

  let employeesWithMatches = 0;
  for (const employee of employees) {
    const paths = getCareerPaths(employee.id);
    const hasMatch = paths.some((p) => p.matchScore >= 0.6) || openOpportunities > 0;
    if (hasMatch) employeesWithMatches += 1;
  }

  const matchRatePct =
    employees.length === 0 ? 0 : Math.round((employeesWithMatches / employees.length) * 100);

  return { matchRatePct, employeesWithMatches, openOpportunities };
}

function computeOrgSkillGaps(organizationId?: string): Array<{
  skillName: string;
  affectedDepartments: number;
  severity: 'high' | 'medium' | 'low';
}> {
  const data = getMockStore();
  const employees = getActiveEmployees(organizationId);
  const skillById = new Map(data.skills.map((s) => [s.id, s]));
  const gapMap = new Map<string, Set<string>>();

  for (const employee of employees) {
    const employeeSkillRows = data.employeeSkills.filter((es) => es.employeeId === employee.id);
    const roleRequirements = employee.currentRoleId
      ? data.roleSkills.filter((rs) => rs.roleId === employee.currentRoleId)
      : [];

    for (const req of roleRequirements) {
      const current = employeeSkillRows.find((es) => es.skillId === req.skillId);
      const level = current?.proficiencyLevel ?? 0;
      const required = req.minProficiency ?? 3;
      if (level < required) {
        const skill = skillById.get(req.skillId);
        if (!skill) continue;
        const depts = gapMap.get(skill.name) ?? new Set<string>();
        depts.add(employee.department ?? 'Unassigned');
        gapMap.set(skill.name, depts);
      }
    }
  }

  return Array.from(gapMap.entries())
    .map(([skillName, depts]) => {
      const count = depts.size;
      const severity: 'high' | 'medium' | 'low' =
        count >= 2 ? 'high' : count === 1 ? 'medium' : 'low';
      return { skillName, affectedDepartments: count, severity };
    })
    .sort((a, b) => b.affectedDepartments - a.affectedDepartments)
    .slice(0, 5);
}

function computeWorkforceReadinessScore(organizationId?: string): number {
  const report = getWorkforceReadinessReport(organizationId);
  return report.overallReadinessScore;
}

function computeManagerEnablementScore(organizationId?: string): number {
  const data = getMockStore();
  const employees = getActiveEmployees(organizationId);
  const managers = employees.filter((e) =>
    employees.some((other) => other.managerId === e.id),
  );
  if (managers.length === 0) return 0;

  let scoreSum = 0;
  for (const manager of managers) {
    const reports = getTeamMembers(manager.id);
    const reportsWithPlans = reports.filter((r) =>
      data.growthPlans.some((gp) => gp.employeeId === r.id && gp.status === 'active'),
    ).length;
    const planPct = reports.length === 0 ? 0 : reportsWithPlans / reports.length;
    const coachingRecs = data.recommendations.filter(
      (r) => r.type === 'coaching' && reports.some((rep) => rep.id === r.employeeId),
    ).length;
    const coachingBonus = Math.min(0.2, coachingRecs * 0.05);
    scoreSum += Math.min(1, planPct * 0.8 + coachingBonus + 0.1);
  }

  return Math.round((scoreSum / managers.length) * 100);
}

function computeConfirmedInferredRatio(organizationId?: string): { confirmedPct: number; inferredPct: number } {
  const employees = getActiveEmployees(organizationId);
  const data = getMockStore();
  let confirmed = 0;
  let inferred = 0;

  for (const employee of employees) {
    const rows = data.employeeSkills.filter((es) => es.employeeId === employee.id);
    confirmed += rows.filter((r) => r.source === 'confirmed').length;
    inferred += rows.filter((r) => r.source === 'inferred').length;
  }

  const total = confirmed + inferred;
  if (total === 0) return { confirmedPct: 0, inferredPct: 0 };
  return {
    confirmedPct: Math.round((confirmed / total) * 100),
    inferredPct: Math.round((inferred / total) * 100),
  };
}

export function getHrDashboard(organizationId?: string): HrDashboard {
  const org = getOrganization(organizationId);
  const overall = getOrgOverallReadiness(organizationId);
  const deptScores = getDepartmentReadinessScores(organizationId);
  const mobility = computeMobilityMatchRate(organizationId);
  const adoptionPct = computePlanAdoptionPct(organizationId);

  const lowReadinessAlerts = deptScores
    .filter((d) => d.overallScore < 70)
    .map((d) => ({ department: d.departmentName, score: d.overallScore }))
    .sort((a, b) => a.score - b.score);

  const recommendations: HrInsightRecommendation[] = [
    {
      title: 'Increase growth plan adoption in Product',
      explanation:
        'Product teams show lower active plan rates than Engineering. Targeted manager enablement can close the gap without individual performance labels.',
      confidence: 0.82,
    },
    {
      title: 'Confirm inferred skills org-wide',
      explanation:
        'A meaningful share of skills remain inferred. A lightweight confirmation campaign improves readiness scores and mobility match quality.',
      confidence: 0.78,
    },
  ];

  if (lowReadinessAlerts.length > 0) {
    recommendations.push({
      title: `Prioritize readiness in ${lowReadinessAlerts[0]?.department ?? 'at-risk units'}`,
      explanation:
        'Department readiness scores fall below the org threshold. Focus on profile completeness and role mapping before expanding mobility programs.',
      confidence: 0.85,
    });
  }

  return {
    organizationName: org?.name ?? 'Organization',
    kpis: {
      dataReadinessScore: overall?.overallScore ?? 0,
      planAdoptionPct: adoptionPct,
      mobilityMatchRatePct: mobility.matchRatePct,
      workforceReadinessScore: computeWorkforceReadinessScore(organizationId),
      managerEnablementScore: computeManagerEnablementScore(organizationId),
    },
    topSkillGaps: computeOrgSkillGaps(organizationId),
    lowReadinessAlerts,
    adoptionByDepartment: computeAdoptionByDepartment(organizationId),
    mobilitySummary: {
      openOpportunities: mobility.openOpportunities,
      employeesWithMatches: mobility.employeesWithMatches,
      matchRatePct: mobility.matchRatePct,
    },
    recommendations,
  };
}

export function getSkillsReadinessReport(organizationId?: string): SkillsReadinessReport {
  const overall =
    getOrgOverallReadiness(organizationId) ??
    ({
      id: '00000000-0000-4000-8000-000000000000',
      organizationId: getOrgId(organizationId),
      scopeType: 'organization' as const,
      scopeId: null,
      overallScore: 0,
      confirmedSkillsPct: 0,
      profileCompletenessPct: 0,
      roleMappingPct: 0,
      activePlansPct: 0,
      calculatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    } satisfies DataReadinessScore);

  const byDepartment = getDepartmentReadinessScores(organizationId);
  const ratio = computeConfirmedInferredRatio(organizationId);

  const trends = [
    { date: '2025-10-01', score: Math.max(0, overall.overallScore - 8) },
    { date: '2025-11-01', score: Math.max(0, overall.overallScore - 5) },
    { date: '2025-12-01', score: Math.max(0, overall.overallScore - 2) },
    { date: '2026-01-01', score: overall.overallScore },
  ];

  const missingDataAreas: string[] = [];
  if ((overall.profileCompletenessPct ?? 0) < 85) {
    missingDataAreas.push('Employee profile summaries and career preferences');
  }
  if ((overall.roleMappingPct ?? 0) < 80) {
    missingDataAreas.push('Role-to-skill mapping for newer job families');
  }
  if (ratio.inferredPct > 40) {
    missingDataAreas.push('Confirmed skill attestations (high inferred ratio)');
  }
  if ((overall.activePlansPct ?? 0) < 50) {
    missingDataAreas.push('Active growth plans for employees without documented development paths');
  }

  return {
    overall,
    byDepartment,
    trends,
    dimensions: {
      completeness: overall.profileCompletenessPct ?? 0,
      freshness: Math.min(100, (overall.overallScore ?? 0) + 6),
      confidence: overall.confirmedSkillsPct ?? ratio.confirmedPct,
      confirmedVsInferred: ratio,
    },
    missingDataAreas,
    recommendations: [
      {
        title: 'Run a skills confirmation sprint',
        explanation:
          'Org-wide inferred skills reduce confidence in mobility and readiness analytics. Managers can confirm skills during regular 1:1s.',
        confidence: 0.8,
      },
      {
        title: 'Complete role mapping for Product Engineering',
        explanation:
          'Role mapping scores lag profile completeness. Updating role-skill requirements unlocks more accurate gap analysis.',
        confidence: 0.76,
      },
    ],
  };
}

export function getMobilityInsights(organizationId?: string): MobilityInsights {
  const data = getMockStore();
  const orgId = getOrgId(organizationId);
  const employees = getActiveEmployees(organizationId);
  const openOpportunities = data.opportunities.filter(
    (o) => o.organizationId === orgId && o.status === 'open',
  );
  const mobility = computeMobilityMatchRate(organizationId);
  const skillById = new Map(data.skills.map((s) => [s.id, s]));

  const employeesWithInterest = data.careerGoals.filter(
    (g) =>
      g.status === 'active' &&
      employees.some((e) => e.id === g.employeeId),
  ).length;

  const skillDemand = new Map<string, number>();
  for (const opp of openOpportunities) {
    for (const skillId of opp.requiredSkillIds) {
      const skill = skillById.get(skillId);
      if (!skill) continue;
      skillDemand.set(skill.name, (skillDemand.get(skill.name) ?? 0) + 1);
    }
  }

  const topSkillsInDemand = Array.from(skillDemand.entries())
    .map(([skillName, opportunityCount]) => ({ skillName, opportunityCount }))
    .sort((a, b) => b.opportunityCount - a.opportunityCount)
    .slice(0, 5);

  return {
    openOpportunities: openOpportunities.length,
    matchRatePct: mobility.matchRatePct,
    employeesWithInterest,
    pipelineStages: [
      { stage: 'Interest expressed', count: employeesWithInterest },
      { stage: 'Matched to opportunity', count: mobility.employeesWithMatches },
      { stage: 'In conversation', count: Math.max(1, Math.floor(mobility.employeesWithMatches * 0.4)) },
      { stage: 'Placed (mock)', count: 1 },
    ],
    topSkillsInDemand,
    blockers: [
      {
        label: 'Incomplete skills profiles',
        count: employees.filter((e) => {
          const rows = data.employeeSkills.filter((es) => es.employeeId === e.id);
          return rows.length < 3;
        }).length,
        explanation: 'Employees with sparse skill data receive fewer high-confidence mobility matches.',
      },
      {
        label: 'Unconfirmed inferred skills',
        count: Math.max(1, Math.floor(employees.length * 0.35)),
        explanation: 'Inferred skills need manager or employee confirmation before pipeline advancement.',
      },
      {
        label: 'No active growth plan',
        count: employees.filter(
          (e) => !data.growthPlans.some((gp) => gp.employeeId === e.id && gp.status === 'active'),
        ).length,
        explanation: 'Growth plans align internal moves with development intent and reduce mismatched placements.',
      },
    ],
    recommendations: [
      {
        title: 'Promote open internal opportunities',
        explanation: `${openOpportunities.length} open roles and stretch assignments are available. Visibility campaigns increase match volume without external hiring pressure.`,
        confidence: 0.84,
      },
      {
        title: 'Pair mobility interest with development plans',
        explanation:
          'Employees expressing career goals benefit from active growth plans before pipeline conversations begin.',
        confidence: 0.79,
      },
    ],
  };
}

export function getTalentDensityReport(organizationId?: string): TalentDensityReport {
  const data = getMockStore();
  const orgId = getOrgId(organizationId);
  const employees = getActiveEmployees(organizationId);
  const skillById = new Map(data.skills.map((s) => [s.id, s]));
  const orgSkills = data.skills.filter((s) => s.organizationId === orgId && s.isActive);

  const skillStats = new Map<string, { totalLevel: number; count: number }>();
  for (const employee of employees) {
    const rows = data.employeeSkills.filter((es) => es.employeeId === employee.id);
    for (const row of rows) {
      const skill = skillById.get(row.skillId);
      if (!skill) continue;
      const current = skillStats.get(skill.name) ?? { totalLevel: 0, count: 0 };
      current.totalLevel += row.proficiencyLevel ?? 0;
      current.count += 1;
      skillStats.set(skill.name, current);
    }
  }

  const topSkillsByDepth = Array.from(skillStats.entries())
    .map(([skillName, stats]) => ({
      skillName,
      avgProficiency: stats.count === 0 ? 0 : Math.round((stats.totalLevel / stats.count) * 10) / 10,
      employeeCount: stats.count,
    }))
    .sort((a, b) => b.avgProficiency - a.avgProficiency || b.employeeCount - a.employeeCount)
    .slice(0, 8);

  const deptDensity = new Map<string, { totalLevel: number; count: number }>();
  for (const employee of employees) {
    const dept = employee.department ?? 'Unassigned';
    const rows = data.employeeSkills.filter((es) => es.employeeId === employee.id);
    const current = deptDensity.get(dept) ?? { totalLevel: 0, count: 0 };
    for (const row of rows) {
      current.totalLevel += row.proficiencyLevel ?? 0;
      current.count += 1;
    }
    deptDensity.set(dept, current);
  }

  const departmentDensity = Array.from(deptDensity.entries()).map(([department, stats], index) => ({
    department,
    densityScore:
      stats.count === 0 ? 0 : Math.min(100, Math.round((stats.totalLevel / stats.count) * 22)),
    trend: (['up', 'stable', 'down'] as const)[index % 3] ?? 'stable',
  }));

  const criticalSkills = orgSkills.filter((s) =>
    ['System Design', 'TypeScript', 'Leadership', 'Product Strategy'].includes(s.name),
  );

  const criticalSkillCoverage = criticalSkills.map((skill, index) => {
    const holders = employees.filter((e) =>
      data.employeeSkills.some(
        (es) => es.employeeId === e.id && es.skillId === skill.id && (es.proficiencyLevel ?? 0) >= 3,
      ),
    ).length;
    const coveragePct =
      employees.length === 0 ? 0 : Math.round((holders / employees.length) * 100);
    return {
      skillName: skill.name,
      coveragePct,
      targetPct: 65 + index * 5,
    };
  });

  const pipelineStrength = Math.min(
    100,
    Math.round(
      (computePlanAdoptionPct(organizationId) * 0.4 +
        computeMobilityMatchRate(organizationId).matchRatePct * 0.35 +
        (getOrgOverallReadiness(organizationId)?.overallScore ?? 0) * 0.25),
    ),
  );

  return {
    overallDensityScore: Math.round(
      topSkillsByDepth.reduce((sum, s) => sum + s.avgProficiency, 0) /
        Math.max(1, topSkillsByDepth.length) *
        18,
    ),
    topSkillsByDepth,
    departmentDensity,
    criticalSkillCoverage,
    pipelineStrength,
    explanation:
      'Talent density reflects depth of confirmed and inferred skills across the organization — a simplified MVP indicator, not a performance ranking.',
    confidence: 0.77,
    recommendations: [
      {
        title: 'Deepen System Design bench strength',
        explanation:
          'System Design shows high demand in mobility and role requirements but moderate average depth. Targeted learning paths can raise coverage.',
        confidence: 0.81,
      },
      {
        title: 'Cross-pollinate skills between Engineering and Product',
        explanation:
          'Department density varies. Internal mobility and guild programs can redistribute expertise without external hiring.',
        confidence: 0.74,
      },
    ],
  };
}

export function getWorkforceReadinessReport(organizationId?: string): WorkforceReadinessReport {
  const data = getMockStore();
  const orgId = getOrgId(organizationId);
  const employees = getActiveEmployees(organizationId);
  const skillById = new Map(data.skills.map((s) => [s.id, s]));
  const roles = data.roles.filter((r) => r.organizationId === orgId && r.isActive);
  const openOpps = data.opportunities.filter((o) => o.organizationId === orgId && o.status === 'open');

  const roleReadiness = roles.map((role) => {
    const requirements = data.roleSkills.filter((rs) => rs.roleId === role.id);
    const demandLevel: 'high' | 'medium' | 'low' =
      openOpps.filter((o) => o.roleId === role.id).length >= 2
        ? 'high'
        : openOpps.some((o) => o.roleId === role.id)
          ? 'medium'
          : 'low';

    let gapCount = 0;
    const criticalGaps: string[] = [];
    for (const req of requirements) {
      const skill = skillById.get(req.skillId);
      if (!skill) continue;
      const holders = employees.filter((e) => {
        const row = data.employeeSkills.find(
          (es) => es.employeeId === e.id && es.skillId === req.skillId,
        );
        return (row?.proficiencyLevel ?? 0) >= (req.minProficiency ?? 3);
      }).length;
      if (holders < Math.max(1, Math.ceil(employees.length * 0.15))) {
        gapCount += 1;
        criticalGaps.push(skill.name);
      }
    }

    const readinessScore = Math.max(
      35,
      Math.min(100, 100 - gapCount * 12 - (demandLevel === 'high' ? 5 : 0)),
    );

    return {
      roleTitle: role.title,
      department: role.department ?? 'General',
      demandLevel,
      readinessScore,
      criticalGaps: criticalGaps.slice(0, 3),
    };
  });

  const capabilityGapMap = new Map<
    string,
    { supplyCount: number; demandCount: number }
  >();

  for (const role of roles) {
    for (const req of data.roleSkills.filter((rs) => rs.roleId === role.id)) {
      const skill = skillById.get(req.skillId);
      if (!skill) continue;
      const supplyCount = employees.filter((e) => {
        const row = data.employeeSkills.find(
          (es) => es.employeeId === e.id && es.skillId === req.skillId,
        );
        return (row?.proficiencyLevel ?? 0) >= (req.minProficiency ?? 3);
      }).length;
      const current = capabilityGapMap.get(skill.name) ?? { supplyCount: 0, demandCount: 0 };
      current.demandCount += 1;
      current.supplyCount = Math.max(current.supplyCount, supplyCount);
      capabilityGapMap.set(skill.name, current);
    }
  }

  const capabilityGaps = Array.from(capabilityGapMap.entries())
    .map(([skillName, stats]) => ({
      skillName,
      supplyCount: stats.supplyCount,
      demandCount: stats.demandCount,
      gap: Math.max(0, stats.demandCount - Math.floor(stats.supplyCount / Math.max(1, employees.length * 0.2))),
    }))
    .filter((g) => g.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 6);

  const overallReadinessScore =
    roleReadiness.length === 0
      ? 0
      : Math.round(
          roleReadiness.reduce((sum, r) => sum + r.readinessScore, 0) / roleReadiness.length,
        );

  return {
    overallReadinessScore,
    roleReadiness: roleReadiness.sort((a, b) => a.readinessScore - b.readinessScore),
    capabilityGaps,
    strategies: {
      build: [
        'Expand System Design learning paths for IC3–IC4 engineers',
        'Launch manager-led skill confirmation in Q2 planning cycle',
      ],
      buy: [
        'Consider contractor support for Platform reliability surge roles',
        'Evaluate niche technical skills only if pipeline stays below target for 2 quarters',
      ],
      borrow: [
        'Cross-team stretch assignments for Architecture Initiative',
        'Guild chair rotations to share DevEx expertise',
      ],
      redeploy: [
        'Internal transfer pipeline for Product Engineering open roles',
        'Mobility matches for employees with active career goals',
      ],
    },
    recommendations: [
      {
        title: 'Address Staff Engineer readiness gaps first',
        explanation:
          'Staff-level roles show the widest skill supply gaps relative to demand. Prioritize build and borrow strategies before expanding headcount.',
        confidence: 0.83,
      },
      {
        title: 'Align workforce planning with growth plan adoption',
        explanation:
          'Higher plan adoption correlates with clearer internal redeploy paths and reduces surprise capability shortages.',
        confidence: 0.77,
      },
    ],
  };
}

function getUserForEmployee(employee: Employee): User | undefined {
  return getMockStore().users.find((u) => u.id === employee.userId);
}

export function isDirectReport(managerEmployeeId: string, employeeId: string): boolean {
  const employee = getEmployee(employeeId);
  return Boolean(employee?.isActive && employee.managerId === managerEmployeeId);
}

function syntheticEvidence(
  recommendationId: string,
  items: Array<{ label: string; detail: string }>,
): RecommendationEvidence[] {
  return items.map((item, index) => ({
    id: `${recommendationId}-ev-${index}`,
    recommendationId,
    evidenceType: 'skill' as const,
    referenceId: null,
    label: item.label,
    detail: item.detail,
    createdAt: '2026-01-15T10:00:00.000Z',
  }));
}

function computeTeamGaps(
  memberIds: string[],
  roleId: string | null | undefined,
): SkillGap[] {
  const data = getMockStore();
  const skillById = new Map(data.skills.map((s) => [s.id, s]));
  const requirements = roleId
    ? data.roleSkills.filter((rs) => rs.roleId === roleId && rs.importance === 'required')
    : [];

  if (requirements.length === 0) {
    return [];
  }

  return requirements
    .map((req) => {
      const skill = skillById.get(req.skillId);
      if (!skill) return null;

      const affectedEmployeeIds = memberIds.filter((employeeId) => {
        const rows = data.employeeSkills.filter((es) => es.employeeId === employeeId);
        const current = rows.find((es) => es.skillId === req.skillId);
        const level = current?.proficiencyLevel ?? 0;
        return level < (req.minProficiency ?? 3);
      });

      if (affectedEmployeeIds.length === 0) return null;

      const teamCoverage = 1 - affectedEmployeeIds.length / Math.max(memberIds.length, 1);
      return {
        skill,
        requiredLevel: req.minProficiency ?? 3,
        teamCoverage,
        affectedEmployeeIds,
        explanation: `${affectedEmployeeIds.length} of ${memberIds.length} team members are below the ${skill.name} proficiency target for their current roles. This is a development gap, not a performance rating.`,
        confidence: Math.min(0.92, 0.7 + teamCoverage * 0.2),
      };
    })
    .filter((gap): gap is SkillGap => gap !== null)
    .sort((a, b) => a.teamCoverage - b.teamCoverage);
}

function buildTeamMemberSummaries(managerEmployeeId: string): ManagerTeamMemberSummary[] {
  const members = getTeamMembers(managerEmployeeId);
  return members.map((employee) => {
    const user = getUserForEmployee(employee);
    const { plan } = getGrowthPlan(employee.id);
    const careerGoals = getCareerGoals(employee.id);
    const skills = getEmployeeSkills(employee.id);
    const pendingRecommendations = getRecommendations(employee.id).filter(
      (r) => r.status === 'pending',
    ).length;

    return {
      employee,
      user: user ?? {
        id: employee.userId,
        email: '',
        fullName: employee.jobTitle,
        roles: ['employee'],
        organizationId: employee.organizationId,
        authUserId: null,
        avatarUrl: null,
        isActive: true,
        createdAt: employee.createdAt,
        updatedAt: employee.updatedAt,
      },
      growthPlanStatus: plan?.status ?? null,
      hasActiveGoal: careerGoals.some((g) => g.status === 'active'),
      skillsCount: skills.length,
      pendingRecommendations,
    };
  });
}

function buildCoachingPromptsForEmployee(
  employee: Employee,
  user: User,
): CoachingPrompt[] {
  const data = getMockStore();
  const skillById = new Map(data.skills.map((s) => [s.id, s]));
  const employeeSkills = getEmployeeSkills(employee.id);
  const { plan, items } = getGrowthPlan(employee.id);
  const careerGoals = getCareerGoals(employee.id);
  const activeGoal = careerGoals.find((g) => g.status === 'active');
  const targetRole = activeGoal?.targetRoleId ? getRole(activeGoal.targetRoleId) : undefined;
  const inferred = employeeSkills.filter((es) => es.source === 'inferred');

  const prompts: Array<{
    category: CoachingPromptCategory;
    prompt: string;
    context: string;
    explanation: string;
    confidence: number;
    evidence: Array<{ label: string; detail: string }>;
  }> = [];

  if (plan) {
    const inProgress = items.filter((i) => i.status === 'in_progress');
    prompts.push({
      category: 'growth',
      prompt: `How is progress on "${plan.title}" feeling, and what support would help you stay on track?`,
      context: `${user.fullName} has an active growth plan with ${inProgress.length} milestone(s) in progress.`,
      explanation:
        'Growth plan check-ins reinforce ownership and surface blockers early — based on documented plan status, not performance judgment.',
      confidence: 0.84,
      evidence: [
        { label: 'Active growth plan', detail: plan.title },
        { label: 'In-progress milestones', detail: String(inProgress.length) },
      ],
    });
  }

  if (targetRole) {
    prompts.push({
      category: 'growth',
      prompt: `What would help you build visibility toward ${targetRole.title} over the next quarter?`,
      context: `${user.fullName} has an active career goal targeting ${targetRole.title}.`,
      explanation:
        'Aligning near-term work with stated career goals supports development without making promotion decisions.',
      confidence: 0.79,
      evidence: [
        { label: 'Career goal', detail: targetRole.title },
        { label: 'Timeline', detail: `${activeGoal?.timelineMonths ?? 12} months` },
      ],
    });
  }

  if (inferred.length > 0) {
    const skillNames = inferred
      .map((es) => skillById.get(es.skillId)?.name)
      .filter((n): n is string => Boolean(n))
      .slice(0, 2)
      .join(', ');
    prompts.push({
      category: 'skills',
      prompt: `I'd like to confirm your experience with ${skillNames} — can you share a recent example?`,
      context: 'Inferred skills are flagged for manager-employee validation.',
      explanation:
        'Confirming inferred skills improves data quality and opens coaching on strengths — labels remain developmental.',
      confidence: 0.76,
      evidence: inferred.slice(0, 2).map((es) => ({
        label: skillById.get(es.skillId)?.name ?? 'Inferred skill',
        detail: es.evidenceSummary ?? 'Inferred from work signals',
      })),
    });
  }

  prompts.push({
    category: 'motivation',
    prompt: 'What kind of work has energized you most lately, and what would you like more of?',
    context: 'Open-ended motivation check supports engagement without rating performance.',
    explanation:
      'Understanding motivation patterns helps match stretch opportunities to interest — not punitive assessment.',
    confidence: 0.72,
    evidence: [{ label: 'Team context', detail: `${user.fullName} · ${employee.jobTitle}` }],
  });

  prompts.push({
    category: 'project_fit',
    prompt: 'Are there upcoming platform initiatives where you would like to take a lead or mentoring role?',
    context: 'Platform Engineering team has open stretch opportunities aligned with reliability work.',
    explanation:
      'Project-fit prompts connect development actions to real team needs without prescribing promotion outcomes.',
    confidence: 0.7,
    evidence: [{ label: 'Open stretch opportunities', detail: 'Platform reliability and architecture initiatives' }],
  });

  return prompts.slice(0, 4).map((p, index) => {
    const id = `coach-${employee.id}-${index}`;
    const confidenceLevel = getConfidenceLevel(p.confidence);
    return {
      id,
      employeeId: employee.id,
      employeeName: user.fullName,
      category: p.category,
      prompt: p.prompt,
      context: p.context,
      explanation: p.explanation,
      confidence: p.confidence,
      confidenceLevel,
      evidence: syntheticEvidence(id, p.evidence),
    };
  });
}

function buildStretchOpportunitiesForEmployee(employeeId: string): Array<
  Opportunity & { explanation: string; confidence: number; evidence: RecommendationEvidence[] }
> {
  const data = getMockStore();
  const employeeSkills = getEmployeeSkills(employeeId);
  const skillIds = new Set(employeeSkills.map((es) => es.skillId));

  return data.opportunities
    .filter((o) => o.status === 'open' && o.department === 'Engineering')
    .slice(0, 2)
    .map((opp, index) => {
      const overlap = opp.requiredSkillIds.filter((sid) => skillIds.has(sid)).length;
      const confidence = Math.min(0.88, 0.65 + overlap * 0.1);
      const recId = `stretch-${employeeId}-${index}`;
      return {
        ...opp,
        explanation: `${opp.title} aligns with documented skills and offers a development-focused stretch — not a hiring or promotion decision.`,
        confidence,
        evidence: syntheticEvidence(recId, [
          { label: 'Opportunity', detail: opp.title },
          { label: 'Skill overlap', detail: `${overlap} matching required skills` },
        ]),
      };
    });
}

export function getManagerDashboard(
  managerEmployeeId: string,
): ManagerDashboard | null {
  const manager = getEmployee(managerEmployeeId);
  if (!manager) return null;

  const managerUser = getUserForEmployee(manager);
  if (!managerUser) return null;

  const team = getTeamByManager(managerEmployeeId);
  const directReports = buildTeamMemberSummaries(managerEmployeeId);
  const memberIds = directReports.map((m) => m.employee.id);

  const withActivePlan = directReports.filter((m) => m.growthPlanStatus === 'active').length;
  const growthPlanAdoptionPercent =
    directReports.length > 0 ? Math.round((withActivePlan / directReports.length) * 100) : 0;

  const primaryRoleId = directReports[0]?.employee.currentRoleId;
  const skillGapAlerts = computeTeamGaps(
    memberIds,
    primaryRoleId,
  ).slice(0, 3);

  let confirmed = 0;
  let inferred = 0;
  for (const member of directReports) {
    const skills = getEmployeeSkills(member.employee.id);
    confirmed += skills.filter((s) => s.source === 'confirmed').length;
    inferred += skills.filter((s) => s.source === 'inferred').length;
  }

  const conversationsDue = directReports
    .filter((m) => m.pendingRecommendations > 0 || m.skillsCount === 0 || !m.growthPlanStatus)
    .slice(0, 4)
    .map((m) => ({
      employeeId: m.employee.id,
      employeeName: m.user.fullName,
      reason: !m.growthPlanStatus
        ? 'No active growth plan — schedule a goal-setting conversation'
        : m.pendingRecommendations > 0
          ? `${m.pendingRecommendations} pending recommendation(s) to review together`
          : 'Skills profile needs enrichment',
      dueLabel: 'This week',
    }));

  const teamActionRecommendations: Array<Recommendation & { evidence: RecommendationEvidence[] }> =
    [
      {
        id: `team-action-${managerEmployeeId}-1`,
        employeeId: managerEmployeeId,
        agentId: 'supermanager',
        type: 'team_action',
        title: 'Schedule team growth plan check-ins',
        explanation: `${growthPlanAdoptionPercent}% of your direct reports have active growth plans. A brief team sync on development priorities can improve adoption without adding performance review overhead.`,
        confidence: 0.81,
        confidenceLevel: 'high',
        status: 'pending',
        organizationId: manager.organizationId,
        metadata: {},
        createdAt: '2026-01-15T10:00:00.000Z',
        updatedAt: '2026-01-15T10:00:00.000Z',
        evidence: syntheticEvidence(`team-action-${managerEmployeeId}-1`, [
          { label: 'Growth plan adoption', detail: `${growthPlanAdoptionPercent}% of direct reports` },
          { label: 'Team size', detail: `${directReports.length} direct reports` },
        ]),
      },
      ...(skillGapAlerts[0]
        ? [
            {
              id: `team-action-${managerEmployeeId}-2`,
              employeeId: managerEmployeeId,
              agentId: 'skills-intelligence',
              type: 'team_action' as const,
              title: `Address ${skillGapAlerts[0].skill.name} coverage gap`,
              explanation: skillGapAlerts[0].explanation,
              confidence: skillGapAlerts[0].confidence,
              confidenceLevel: getConfidenceLevel(skillGapAlerts[0].confidence),
              status: 'pending' as const,
              organizationId: manager.organizationId,
              metadata: {},
              createdAt: '2026-01-15T10:00:00.000Z',
              updatedAt: '2026-01-15T10:00:00.000Z',
              evidence: syntheticEvidence(`team-action-${managerEmployeeId}-2`, [
                {
                  label: 'Affected team members',
                  detail: String(skillGapAlerts[0].affectedEmployeeIds.length),
                },
                {
                  label: 'Target proficiency',
                  detail: `Level ${skillGapAlerts[0].requiredLevel}`,
                },
              ]),
            },
          ]
        : []),
    ];

  const stretchOpportunities = getMockStore().opportunities
    .filter((o) => o.status === 'open' && o.department === 'Engineering')
    .slice(0, 3);

  return {
    manager,
    managerUser,
    team,
    directReports,
    growthPlanAdoptionPercent,
    teamActionRecommendations,
    skillGapAlerts,
    conversationsDue,
    stretchOpportunities,
    skillsOverview: { confirmed, inferred, total: confirmed + inferred },
  };
}

export function getTeamSkillsMatrix(
  managerEmployeeId: string,
): TeamSkillsMatrix | null {
  const manager = getEmployee(managerEmployeeId);
  if (!manager) return null;

  const team = getTeamByManager(managerEmployeeId);
  const members = getTeamMembers(managerEmployeeId);
  const skillById = new Map(getSkills().map((s) => [s.id, s]));
  const memberIds = members.map((m) => m.id);
  const primaryRoleId = members[0]?.currentRoleId;

  const matrixMembers: TeamSkillsMatrixMember[] = members.map((employee) => {
    const user = getUserForEmployee(employee);
    const skills = getEmployeeSkills(employee.id);
    const { plan } = getGrowthPlan(employee.id);
    return {
      employeeId: employee.id,
      fullName: user?.fullName ?? employee.jobTitle,
      jobTitle: employee.jobTitle,
      skills: skills.map((es) => ({
        ...es,
        skillName: skillById.get(es.skillId)?.name ?? 'Unknown skill',
      })),
      growthPlanStatus: plan?.status ?? null,
      confirmedCount: skills.filter((s) => s.source === 'confirmed').length,
      inferredCount: skills.filter((s) => s.source === 'inferred').length,
    };
  });

  const teamGaps = computeTeamGaps(memberIds, primaryRoleId);
  const totalMembers = matrixMembers.length;
  const membersWithActivePlan = matrixMembers.filter((m) => m.growthPlanStatus === 'active').length;
  const avgConfirmedSkills =
    totalMembers > 0
      ? Math.round(
          matrixMembers.reduce((sum, m) => sum + m.confirmedCount, 0) / totalMembers,
        )
      : 0;
  const avgInferredSkills =
    totalMembers > 0
      ? Math.round(
          matrixMembers.reduce((sum, m) => sum + m.inferredCount, 0) / totalMembers,
        )
      : 0;

  return {
    team,
    members: matrixMembers,
    teamGaps,
    readinessSnapshot: {
      avgConfirmedSkills,
      avgInferredSkills,
      membersWithActivePlan,
      totalMembers,
    },
  };
}

export function getCoachingPrompts(
  managerEmployeeId: string,
): CoachingPrompt[] {
  const members = getTeamMembers(managerEmployeeId);
  return members.flatMap((employee) => {
    const user = getUserForEmployee(employee);
    if (!user) return [];
    return buildCoachingPromptsForEmployee(employee, user);
  });
}

export function getEmployeeSummaryForManager(
  managerEmployeeId: string,
  employeeId: string,
): EmployeeSummaryForManager | null {
  if (!isDirectReport(managerEmployeeId, employeeId)) {
    return null;
  }

  const employee = getEmployee(employeeId);
  if (!employee) return null;

  const user = getUserForEmployee(employee);
  if (!user) return null;

  const data = getMockStore();
  const skillById = new Map(data.skills.map((s) => [s.id, s]));
  const profile = getEmployeeProfile(employeeId);
  const skills = getEmployeeSkills(employeeId)
    .map((es) => {
      const skill = skillById.get(es.skillId);
      return skill ? { ...es, skill } : null;
    })
    .filter((row): row is EmployeeSkill & { skill: Skill } => row !== null);
  const careerGoals = getCareerGoals(employeeId);
  const { plan, items } = getGrowthPlan(employeeId);
  const coachingActions = getRecommendations(employeeId).filter(
    (r) => r.type === 'coaching' || r.type === 'growth_plan' || r.type === 'learning',
  );
  const coachingPrompts = buildCoachingPromptsForEmployee(employee, user);
  const stretchOpportunities = buildStretchOpportunitiesForEmployee(employeeId);

  return {
    employee,
    user,
    profile,
    skills,
    careerGoals,
    growthPlan: plan,
    growthPlanItems: items,
    coachingActions,
    stretchOpportunities,
    coachingPrompts,
  };
}

export function getTeamCapabilityPlan(
  managerEmployeeId: string,
): TeamCapabilityPlan | null {
  const matrix = getTeamSkillsMatrix(managerEmployeeId);
  if (!matrix) return null;

  const manager = getEmployee(managerEmployeeId);
  if (!manager) return null;

  const skillDepth = new Map<string, { skill: Skill; totalLevel: number; count: number }>();

  for (const member of matrix.members) {
    for (const es of member.skills) {
      const skill = getSkill(es.skillId);
      if (!skill) continue;
      const existing = skillDepth.get(skill.id) ?? { skill, totalLevel: 0, count: 0 };
      existing.totalLevel += es.proficiencyLevel ?? 0;
      existing.count += 1;
      skillDepth.set(skill.id, existing);
    }
  }

  const topSkills = [...skillDepth.values()]
    .map((entry) => ({
      skill: entry.skill,
      depthScore: entry.count > 0 ? Math.round((entry.totalLevel / entry.count) * 25) : 0,
    }))
    .sort((a, b) => b.depthScore - a.depthScore)
    .slice(0, 5);

  const talentScore = Math.min(
    100,
    Math.round(
      (matrix.readinessSnapshot.membersWithActivePlan / Math.max(matrix.members.length, 1)) * 40 +
        matrix.readinessSnapshot.avgConfirmedSkills * 8 +
        (topSkills[0]?.depthScore ?? 0) * 0.3,
    ),
  );

  const reskillingSuggestions = matrix.teamGaps.slice(0, 3).map((gap) => ({
    skill: gap.skill,
    affectedCount: gap.affectedEmployeeIds.length,
    suggestion: `Run a team learning sprint focused on ${gap.skill.name}`,
    explanation: gap.explanation,
    confidence: gap.confidence,
  }));

  const recommendedActions: Array<Recommendation & { evidence: RecommendationEvidence[] }> =
    matrix.teamGaps.slice(0, 2).map((gap, index) => {
      const recId = `capability-${managerEmployeeId}-${index}`;
      return {
        id: recId,
        employeeId: managerEmployeeId,
        agentId: 'supermanager',
        type: 'capability_plan',
        title: `Close ${gap.skill.name} gap across the team`,
        explanation: gap.explanation,
        confidence: gap.confidence,
        confidenceLevel: getConfidenceLevel(gap.confidence),
        status: 'pending',
        organizationId: manager.organizationId,
        metadata: {},
        createdAt: '2026-01-15T10:00:00.000Z',
        updatedAt: '2026-01-15T10:00:00.000Z',
        evidence: syntheticEvidence(recId, [
          { label: 'Team members affected', detail: String(gap.affectedEmployeeIds.length) },
          { label: 'Required proficiency', detail: `Level ${gap.requiredLevel}` },
        ]),
      };
    });

  return {
    teamGoals: [
      'Increase confirmed skills coverage across Platform Engineering',
      'Raise active growth plan adoption to 80% by end of quarter',
      'Close top collective skill gaps through paired learning and stretch work',
    ],
    collectiveGaps: matrix.teamGaps,
    recommendedActions,
    reskillingSuggestions,
    talentDensity: {
      score: talentScore,
      explanation:
        'Simplified talent density reflects growth plan adoption, confirmed skills depth, and team skill concentration — indicative only, not a performance ranking.',
      topSkills,
      confidence: 0.74,
    },
    timelineItems: [
      {
        quarter: 'Q1',
        title: 'Baseline team skills assessment',
        description: 'Confirm inferred skills in 1:1s and document collective gaps.',
      },
      {
        quarter: 'Q2',
        title: 'Targeted reskilling sprint',
        description: 'Address top team gaps with learning resources and stretch assignments.',
      },
      {
        quarter: 'Q3',
        title: 'Capability review',
        description: 'Reassess coverage and adjust team development actions.',
      },
    ],
  };
}
