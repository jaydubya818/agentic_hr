import { getDb } from '@/lib/db';
import {
  agentActionPlans,
  agentProposedActions,
  businessPriorities,
  decisionEvidence,
  decisionOutcomes,
  decisionParticipants,
  projectMemberships,
  projects,
  roleEvolutionScenarios,
  roleTaskChanges,
  teamScenarioRoles,
  teamScenarioSkills,
  teamScenarios,
  workforceContextEdges,
  workforceDecisions,
} from '@/lib/db/schema';
import type { MockDataStore } from './types';
import { loadWorkforceIntelligenceFixtures } from './workforce-intelligence-fixtures';
import {
  mapAgentActionPlan,
  mapAgentProposedAction,
  mapBusinessPriority,
  mapDecisionEvidence,
  mapDecisionOutcome,
  mapDecisionParticipant,
  mapProject,
  mapProjectMembership,
  mapRoleEvolutionScenario,
  mapRoleTaskChange,
  mapTeamScenario,
  mapTeamScenarioRole,
  mapTeamScenarioSkill,
  mapWorkforceContextEdge,
  mapWorkforceDecision,
} from './workforce-intelligence-mappers';
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

function pickDbOrFixture<T>(dbRows: T[], fixtureRows: T[]): T[] {
  return dbRows.length > 0 ? dbRows : fixtureRows;
}

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
      businessPriorityRows,
      projectRows,
      projectMembershipRows,
      contextEdgeRows,
      workforceDecisionRows,
      decisionEvidenceRows,
      decisionOutcomeRows,
      decisionParticipantRows,
      teamScenarioRows,
      teamScenarioRoleRows,
      teamScenarioSkillRows,
      roleEvolutionScenarioRows,
      roleTaskChangeRows,
      agentActionPlanRows,
      agentProposedActionRows,
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
      db.select().from(businessPriorities),
      db.select().from(projects),
      db.select().from(projectMemberships),
      db.select().from(workforceContextEdges),
      db.select().from(workforceDecisions),
      db.select().from(decisionEvidence),
      db.select().from(decisionOutcomes),
      db.select().from(decisionParticipants),
      db.select().from(teamScenarios),
      db.select().from(teamScenarioRoles),
      db.select().from(teamScenarioSkills),
      db.select().from(roleEvolutionScenarios),
      db.select().from(roleTaskChanges),
      db.select().from(agentActionPlans),
      db.select().from(agentProposedActions),
    ]);

    const roleSkillIndex = new Map<string, string[]>();
    for (const rs of roleSkillRows) {
      const existing = roleSkillIndex.get(rs.roleId) ?? [];
      existing.push(rs.skillId);
      roleSkillIndex.set(rs.roleId, existing);
    }

    const fixtures = loadWorkforceIntelligenceFixtures();
    const businessPrioritiesMapped = businessPriorityRows.map(mapBusinessPriority);
    const projectsMapped = projectRows.map(mapProject);
    const projectMembershipsMapped = projectMembershipRows.map(mapProjectMembership);
    const workforceContextEdgesMapped = contextEdgeRows.map(mapWorkforceContextEdge);
    const workforceDecisionsMapped = workforceDecisionRows.map(mapWorkforceDecision);
    const decisionEvidenceMapped = decisionEvidenceRows.map(mapDecisionEvidence);
    const decisionOutcomesMapped = decisionOutcomeRows.map(mapDecisionOutcome);
    const decisionParticipantsMapped = decisionParticipantRows.map(mapDecisionParticipant);
    const teamScenariosMapped = teamScenarioRows.map(mapTeamScenario);
    const teamScenarioRolesMapped = teamScenarioRoleRows.map(mapTeamScenarioRole);
    const teamScenarioSkillsMapped = teamScenarioSkillRows.map(mapTeamScenarioSkill);
    const roleEvolutionScenariosMapped = roleEvolutionScenarioRows.map(mapRoleEvolutionScenario);
    const roleTaskChangesMapped = roleTaskChangeRows.map(mapRoleTaskChange);
    const agentActionPlansMapped = agentActionPlanRows.map(mapAgentActionPlan);
    const agentProposedActionsMapped = agentProposedActionRows.map(mapAgentProposedAction);

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
      businessPriorities: pickDbOrFixture(businessPrioritiesMapped, fixtures.businessPriorities),
      projects: pickDbOrFixture(projectsMapped, fixtures.projects),
      projectMemberships: pickDbOrFixture(projectMembershipsMapped, fixtures.projectMemberships),
      workforceContextEdges: pickDbOrFixture(
        workforceContextEdgesMapped,
        fixtures.workforceContextEdges,
      ),
      workforceDecisions: pickDbOrFixture(workforceDecisionsMapped, fixtures.workforceDecisions),
      decisionEvidence: pickDbOrFixture(decisionEvidenceMapped, fixtures.decisionEvidence),
      decisionOutcomes: pickDbOrFixture(decisionOutcomesMapped, fixtures.decisionOutcomes),
      decisionParticipants: pickDbOrFixture(
        decisionParticipantsMapped,
        fixtures.decisionParticipants,
      ),
      teamScenarios: pickDbOrFixture(teamScenariosMapped, fixtures.teamScenarios),
      teamScenarioRoles: pickDbOrFixture(teamScenarioRolesMapped, fixtures.teamScenarioRoles),
      teamScenarioSkills: pickDbOrFixture(teamScenarioSkillsMapped, fixtures.teamScenarioSkills),
      roleEvolutionScenarios: pickDbOrFixture(
        roleEvolutionScenariosMapped,
        fixtures.roleEvolutionScenarios,
      ),
      roleTaskChanges: pickDbOrFixture(roleTaskChangesMapped, fixtures.roleTaskChanges),
      agentActionPlans: pickDbOrFixture(agentActionPlansMapped, fixtures.agentActionPlans),
      agentProposedActions: pickDbOrFixture(
        agentProposedActionsMapped,
        fixtures.agentProposedActions,
      ),
    };
  } catch (error) {
    console.warn('[data-provider] Supabase store load failed; falling back to mock data.', error);
    return null;
  }
}
