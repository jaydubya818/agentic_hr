import { randomUUID } from 'crypto';

import type { z } from 'zod';

import {
  createAgentActionPlanInputSchema,
  updateAgentProposedActionInputSchema,
  type AgentActionPlan,
  type AgentProposedAction,
} from '@/schemas/workforce-intelligence';
import { canReadOrganizationWorkforceData, isManagerRole } from '@/lib/auth/rbac';
import { getEmployee, getMockStore, isDirectReport } from '@/services/data-provider/mock-provider';
import type { SessionContext } from '@/types/session';
import { validateActionPlan, filterDisallowedActions } from '@/services/action-plan-governance';

type CreatePlanInput = z.infer<typeof createAgentActionPlanInputSchema>;
type UpdateActionInput = z.infer<typeof updateAgentProposedActionInputSchema>;

export interface AgentActionPlanDetail extends AgentActionPlan {
  actions: AgentProposedAction[];
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Action plans may only be created within the caller's write scope: a plan
 * team must be managed by the caller, and the plan employee plus every action
 * target must be the caller, one of their direct reports, or (for org-wide
 * roles) any employee in the organization.
 */
function assertActionPlanWriteScope(
  session: SessionContext,
  input: CreatePlanInput,
  proposedActions: Pick<AgentProposedAction, 'targetEmployeeId'>[],
): void {
  const isOrgWide = canReadOrganizationWorkforceData(session.roles);

  if (input.teamId != null) {
    const team = getMockStore().teams.find((t) => t.id === input.teamId);
    if (!team || team.organizationId !== session.organizationId) {
      throw new Error('Unknown team for this organization');
    }
    if (!isOrgWide && team.managerEmployeeId !== session.employeeId) {
      throw new Error('Forbidden');
    }
  }

  const employeeIds = new Set<string>();
  if (input.employeeId != null) employeeIds.add(input.employeeId);
  for (const action of proposedActions) {
    if (action.targetEmployeeId != null) employeeIds.add(action.targetEmployeeId);
  }

  for (const employeeId of employeeIds) {
    const employee = getEmployee(employeeId);
    if (!employee || employee.organizationId !== session.organizationId) {
      throw new Error('Unknown employee for this organization');
    }
    if (isOrgWide || employeeId === session.employeeId) continue;
    const managesEmployee =
      isManagerRole(session.roles) &&
      session.employeeId != null &&
      isDirectReport(session.employeeId, employeeId);
    if (!managesEmployee) {
      throw new Error('Forbidden');
    }
  }
}

export function createActionPlanFromInput(
  session: SessionContext,
  input: CreatePlanInput,
  proposedActions: Omit<
    AgentProposedAction,
    'id' | 'organizationId' | 'actionPlanId' | 'createdAt' | 'updatedAt'
  >[],
): AgentActionPlanDetail {
  assertActionPlanWriteScope(session, input, proposedActions);

  const validation = validateActionPlan(proposedActions);
  if (!validation.valid) {
    throw new Error(validation.errors.join('; '));
  }

  const allowedActions = filterDisallowedActions(proposedActions);
  const store = getMockStore();
  const timestamp = nowIso();

  const plan: AgentActionPlan = {
    id: randomUUID(),
    organizationId: session.organizationId,
    agentId: input.agentId,
    employeeId: input.employeeId ?? null,
    teamId: input.teamId ?? null,
    title: input.title,
    summary: input.summary ?? null,
    sourceDecisionId: input.sourceDecisionId ?? null,
    governanceStatus: validation.flagged ? 'flagged' : 'passed',
    metadata: input.metadata ?? {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const actions: AgentProposedAction[] = allowedActions.map((action) => ({
    ...action,
    id: randomUUID(),
    organizationId: session.organizationId,
    actionPlanId: plan.id,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  store.agentActionPlans.push(plan);
  store.agentProposedActions.push(...actions);

  return { ...plan, actions };
}

/**
 * List action plans visible to the session: org-wide roles see every plan in
 * the organization; managers additionally see plans for their teams and
 * direct reports; employees see plans for themselves or actions targeting
 * them.
 */
export function listActionPlansForSession(session: SessionContext): AgentActionPlanDetail[] {
  const store = getMockStore();
  const withActions = (plan: AgentActionPlan): AgentActionPlanDetail => ({
    ...plan,
    actions: store.agentProposedActions.filter((a) => a.actionPlanId === plan.id),
  });

  const orgPlans = store.agentActionPlans
    .filter((p) => p.organizationId === session.organizationId)
    .map(withActions);

  if (canReadOrganizationWorkforceData(session.roles)) {
    return orgPlans;
  }

  const employeeId = session.employeeId;
  if (!employeeId) return [];

  const isManager = isManagerRole(session.roles);
  const managedTeamIds = isManager
    ? store.teams.filter((t) => t.managerEmployeeId === employeeId).map((t) => t.id)
    : [];

  const inScope = (candidateId: string | null | undefined): boolean =>
    candidateId != null &&
    (candidateId === employeeId || (isManager && isDirectReport(employeeId, candidateId)));

  return orgPlans.filter(
    (plan) =>
      inScope(plan.employeeId) ||
      (plan.teamId != null && managedTeamIds.includes(plan.teamId)) ||
      plan.actions.some((a) => inScope(a.targetEmployeeId)),
  );
}

export function getActionPlan(planId: string): AgentActionPlanDetail | null {
  const store = getMockStore();
  const plan = store.agentActionPlans.find((p) => p.id === planId);
  if (!plan) return null;

  return {
    ...plan,
    actions: store.agentProposedActions.filter((a) => a.actionPlanId === planId),
  };
}

export function updateProposedActionStatus(
  organizationId: string,
  actionId: string,
  input: UpdateActionInput,
): AgentProposedAction | null {
  const store = getMockStore();
  const index = store.agentProposedActions.findIndex(
    (a) => a.id === actionId && a.organizationId === organizationId,
  );
  if (index < 0) return null;

  const updated: AgentProposedAction = {
    ...store.agentProposedActions[index]!,
    ...input,
    updatedAt: nowIso(),
  };
  store.agentProposedActions[index] = updated;
  return updated;
}

export function applyActionToGrowthPlan(
  organizationId: string,
  actionId: string,
  employeeId: string,
): boolean {
  const store = getMockStore();
  const action = store.agentProposedActions.find(
    (a) => a.id === actionId && a.organizationId === organizationId,
  );
  if (!action) return false;

  const employee = getEmployee(employeeId);
  if (!employee || employee.organizationId !== organizationId) return false;

  const growthPlan = store.growthPlans.find(
    (p) => p.employeeId === employeeId && (p.status === 'active' || p.status === 'draft'),
  );
  if (!growthPlan) return false;

  const timestamp = nowIso();
  // referenceId is polymorphic per actionType: route it to the matching
  // growth-plan FK column so a learning resource id never lands in skill_id.
  const isLearningItem = action.actionType === 'learning_assignment';
  store.growthPlanItems.push({
    id: randomUUID(),
    growthPlanId: growthPlan.id,
    itemType: isLearningItem ? 'learning' : 'skill',
    title: action.title,
    description: action.description ?? action.explanation ?? null,
    status: 'pending',
    milestoneDay: 30,
    skillId: isLearningItem ? null : (action.referenceId ?? null),
    learningResourceId: isLearningItem ? (action.referenceId ?? null) : null,
    dueDate: null,
    sortOrder: store.growthPlanItems.filter((i) => i.growthPlanId === growthPlan.id).length,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  action.status = 'applied';
  action.updatedAt = timestamp;
  return true;
}

export function listActionPlansForOrganization(organizationId: string): AgentActionPlanDetail[] {
  const store = getMockStore();
  return store.agentActionPlans
    .filter((p) => p.organizationId === organizationId)
    .map((plan) => ({
      ...plan,
      actions: store.agentProposedActions.filter((a) => a.actionPlanId === plan.id),
    }));
}
