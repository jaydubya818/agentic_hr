import { getDb } from '@/lib/db';
import {
  careerGoals,
  dataReadinessScores,
  employeeProfiles,
  employees,
  employeeSkills,
  growthPlanItems,
  growthPlans,
  learningResources,
  opportunities,
  organizations,
  recommendationEvidence,
  recommendations,
  roleSkills,
  roles,
  skills,
  teams,
  users,
} from '@/lib/db/schema';
import type { MockDataStore } from './types';
import { loadWorkforceIntelligenceFixtures } from './workforce-intelligence-fixtures';
import {
  mapCareerGoal,
  mapDataReadinessScore,
  mapEmployee,
  mapEmployeeProfile,
  mapEmployeeSkill,
  mapGrowthPlan,
  mapGrowthPlanItem,
  mapLearningResource,
  mapOpportunity,
  mapOrganization,
  mapRecommendation,
  mapRecommendationEvidence,
  mapRole,
  mapRoleSkill,
  mapSkill,
  mapTeam,
  mapUser,
} from './db-mappers';

export async function loadSupabaseStore(): Promise<MockDataStore | null> {
  const db = getDb();
  if (!db) {
    return null;
  }

  try {
    const [
      orgRows,
      userRows,
      employeeRows,
      profileRows,
      teamRows,
      skillRows,
      employeeSkillRows,
      roleRows,
      roleSkillRows,
      goalRows,
      resourceRows,
      opportunityRows,
      planRows,
      planItemRows,
      recommendationRows,
      evidenceRows,
      readinessRows,
    ] = await Promise.all([
      db.select().from(organizations),
      db.select().from(users),
      db.select().from(employees),
      db.select().from(employeeProfiles),
      db.select().from(teams),
      db.select().from(skills),
      db.select().from(employeeSkills),
      db.select().from(roles),
      db.select().from(roleSkills),
      db.select().from(careerGoals),
      db.select().from(learningResources),
      db.select().from(opportunities),
      db.select().from(growthPlans),
      db.select().from(growthPlanItems),
      db.select().from(recommendations),
      db.select().from(recommendationEvidence),
      db.select().from(dataReadinessScores),
    ]);

    const roleSkillIndex = new Map<string, string[]>();
    for (const rs of roleSkillRows) {
      const existing = roleSkillIndex.get(rs.roleId) ?? [];
      existing.push(rs.skillId);
      roleSkillIndex.set(rs.roleId, existing);
    }

    return {
      organizations: orgRows.map(mapOrganization),
      users: userRows.map(mapUser),
      employees: employeeRows.map(mapEmployee),
      employeeProfiles: profileRows.map(mapEmployeeProfile),
      teams: teamRows.map(mapTeam),
      skills: skillRows.map(mapSkill),
      employeeSkills: employeeSkillRows.map(mapEmployeeSkill),
      roles: roleRows.map(mapRole),
      roleSkills: roleSkillRows.map(mapRoleSkill),
      careerGoals: goalRows.map(mapCareerGoal),
      learningResources: resourceRows.map(mapLearningResource),
      opportunities: opportunityRows.map((row) =>
        mapOpportunity(row, row.roleId ? (roleSkillIndex.get(row.roleId) ?? []) : []),
      ),
      growthPlans: planRows.map(mapGrowthPlan),
      growthPlanItems: planItemRows.map(mapGrowthPlanItem),
      recommendations: recommendationRows.map(mapRecommendation),
      recommendationEvidence: evidenceRows.map(mapRecommendationEvidence),
      dataReadinessScores: readinessRows.map(mapDataReadinessScore),
      ...loadWorkforceIntelligenceFixtures(),
    };
  } catch (error) {
    console.warn('[data-provider] Supabase store load failed; falling back to mock data.', error);
    return null;
  }
}
