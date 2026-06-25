import { z } from 'zod';

import {
  agentActionPlanSchema,
  agentProposedActionSchema,
  businessPrioritySchema,
  decisionEvidenceSchema,
  decisionOutcomeSchema,
  decisionParticipantSchema,
  projectMembershipSchema,
  projectSchema,
  roleEvolutionScenarioSchema,
  roleTaskChangeSchema,
  teamScenarioRoleSchema,
  teamScenarioSchema,
  teamScenarioSkillSchema,
  workforceContextEdgeSchema,
  workforceDecisionSchema,
} from '@/schemas/workforce-intelligence';
import businessPrioritiesData from '../../../data/mock/business-priorities.json';
import projectsData from '../../../data/mock/projects.json';
import projectMembershipsData from '../../../data/mock/project-memberships.json';
import workforceContextEdgesData from '../../../data/mock/workforce-context-edges.json';
import workforceDecisionsData from '../../../data/mock/workforce-decisions.json';
import decisionEvidenceData from '../../../data/mock/decision-evidence.json';
import decisionOutcomesData from '../../../data/mock/decision-outcomes.json';
import decisionParticipantsData from '../../../data/mock/decision-participants.json';
import teamScenariosData from '../../../data/mock/team-scenarios.json';
import teamScenarioRolesData from '../../../data/mock/team-scenario-roles.json';
import teamScenarioSkillsData from '../../../data/mock/team-scenario-skills.json';
import roleEvolutionScenariosData from '../../../data/mock/role-evolution-scenarios.json';
import roleTaskChangesData from '../../../data/mock/role-task-changes.json';
import agentActionPlansData from '../../../data/mock/agent-action-plans.json';
import agentProposedActionsData from '../../../data/mock/agent-proposed-actions.json';
import type { MockDataStore } from './types';

function parseArray<T>(schema: { parse: (data: unknown) => T }, data: unknown, label: string): T {
  try {
    return schema.parse(data);
  } catch (error) {
    throw new Error(`Invalid mock data for ${label}: ${String(error)}`);
  }
}

type WorkforceIntelligenceSlice = Pick<
  MockDataStore,
  | 'businessPriorities'
  | 'projects'
  | 'projectMemberships'
  | 'workforceContextEdges'
  | 'workforceDecisions'
  | 'decisionEvidence'
  | 'decisionOutcomes'
  | 'decisionParticipants'
  | 'teamScenarios'
  | 'teamScenarioRoles'
  | 'teamScenarioSkills'
  | 'roleEvolutionScenarios'
  | 'roleTaskChanges'
  | 'agentActionPlans'
  | 'agentProposedActions'
>;

export function loadWorkforceIntelligenceFixtures(): WorkforceIntelligenceSlice {
  return {
    businessPriorities: parseArray(
      z.array(businessPrioritySchema),
      businessPrioritiesData,
      'businessPriorities',
    ),
    projects: parseArray(z.array(projectSchema), projectsData, 'projects'),
    projectMemberships: parseArray(
      z.array(projectMembershipSchema),
      projectMembershipsData,
      'projectMemberships',
    ),
    workforceContextEdges: parseArray(
      z.array(workforceContextEdgeSchema),
      workforceContextEdgesData,
      'workforceContextEdges',
    ),
    workforceDecisions: parseArray(
      z.array(workforceDecisionSchema),
      workforceDecisionsData,
      'workforceDecisions',
    ),
    decisionEvidence: parseArray(
      z.array(decisionEvidenceSchema),
      decisionEvidenceData,
      'decisionEvidence',
    ),
    decisionOutcomes: parseArray(
      z.array(decisionOutcomeSchema),
      decisionOutcomesData,
      'decisionOutcomes',
    ),
    decisionParticipants: parseArray(
      z.array(decisionParticipantSchema),
      decisionParticipantsData,
      'decisionParticipants',
    ),
    teamScenarios: parseArray(z.array(teamScenarioSchema), teamScenariosData, 'teamScenarios'),
    teamScenarioRoles: parseArray(
      z.array(teamScenarioRoleSchema),
      teamScenarioRolesData,
      'teamScenarioRoles',
    ),
    teamScenarioSkills: parseArray(
      z.array(teamScenarioSkillSchema),
      teamScenarioSkillsData,
      'teamScenarioSkills',
    ),
    roleEvolutionScenarios: parseArray(
      z.array(roleEvolutionScenarioSchema),
      roleEvolutionScenariosData,
      'roleEvolutionScenarios',
    ),
    roleTaskChanges: parseArray(
      z.array(roleTaskChangeSchema),
      roleTaskChangesData,
      'roleTaskChanges',
    ),
    agentActionPlans: parseArray(
      z.array(agentActionPlanSchema),
      agentActionPlansData,
      'agentActionPlans',
    ),
    agentProposedActions: parseArray(
      z.array(agentProposedActionSchema),
      agentProposedActionsData,
      'agentProposedActions',
    ),
  };
}
