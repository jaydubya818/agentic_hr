import { randomUUID } from 'crypto';

import type { z } from 'zod';

import {
  createAgentActionPlanInputSchema,
  updateAgentProposedActionInputSchema,
  type AgentActionPlan,
  type AgentProposedAction,
} from '@/schemas/workforce-intelligence';
import {
  canReadOrganizationWorkforceData,
  canWriteOrganizationWorkforceData,
  isManagerRole,
} from '@/lib/auth/rbac';
import { getEmployee, getMockStore, isDirectReport } from '@/services/data-provider/mock-provider';
import type { GrowthPlanItem } from '@/services/data-provider/types';
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
  const isOrgWide = canWriteOrganizationWorkforceData(session.roles);

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

  // A plan with no team, no employee and no targeted action names nobody, so
  // neither the team check above nor the reporting check below can authorize
  // it -- both loops simply do not run. That let any signed-in caller seed
  // the organization's plan list, including `executive_readonly`, which the
  // matrix in BACKEND_STRUCTURE 6.1 grants no write permission at all. The
  // PATCH route already reserves unscoped plans for org-wide roles
  // (`managerScopeCoversPlan`, "deny on ambiguity"); creation must agree.
  if (!isOrgWide && input.teamId == null && employeeIds.size === 0) {
    throw new Error('Forbidden');
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

  const validation = validateActionPlan(proposedActions, input);
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
  // Join actions on organization as well as plan id (matching the
  // decision-detail scoping) so another organization's rows recorded against
  // the same identifier can never surface in a plan detail.
  const withActions = (plan: AgentActionPlan): AgentActionPlanDetail => ({
    ...plan,
    actions: store.agentProposedActions.filter(
      (a) => a.actionPlanId === plan.id && a.organizationId === plan.organizationId,
    ),
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

export function getActionPlan(
  planId: string,
  organizationId?: string,
): AgentActionPlanDetail | null {
  const store = getMockStore();
  const plan = store.agentActionPlans.find((p) => p.id === planId);
  if (!plan) return null;
  // Do not reveal cross-organization plans; treat them as not found. The
  // child-action join below was already organization-scoped, which is what
  // made the unscoped parent row easy to miss.
  if (organizationId !== undefined && plan.organizationId !== organizationId) return null;

  return {
    ...plan,
    actions: store.agentProposedActions.filter(
      (a) => a.actionPlanId === planId && a.organizationId === plan.organizationId,
    ),
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

/**
 * Pushes a growth-plan item for `actionId` onto the employee's active plan in
 * the in-memory store and flips the action to 'applied'. Returns the new item
 * so the caller can persist it -- the store is a cache in Supabase mode and
 * is discarded on the next write -- or null when nothing was applied.
 */
export function applyActionToGrowthPlan(
  organizationId: string,
  actionId: string,
  employeeId: string,
): GrowthPlanItem | null {
  const store = getMockStore();
  const action = store.agentProposedActions.find(
    (a) => a.id === actionId && a.organizationId === organizationId,
  );
  if (!action) return null;

  const employee = getEmployee(employeeId);
  if (!employee || employee.organizationId !== organizationId) return null;

  // Only an active plan is a valid target. Every reader of `growthPlans`
  // selects on `status === 'active'` (the employee growth page, the
  // plan-coverage rollups), so an item pushed onto a draft plan is invisible
  // to the employee it was created for -- while the caller still flips the
  // action to 'applied' below and the PATCH route's already-applied guard then
  // returns 409 for every retry. Reporting failure here keeps the apply
  // repeatable once the plan is activated.
  const growthPlan = store.growthPlans.find(
    (p) => p.employeeId === employeeId && p.status === 'active',
  );
  if (!growthPlan) return null;

  const timestamp = nowIso();
  // referenceId is polymorphic per actionType: route it to the matching
  // growth-plan FK column so a learning resource id never lands in skill_id.
  const isLearningItem = action.actionType === 'learning_assignment';
  const item: GrowthPlanItem = {
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
  };
  store.growthPlanItems.push(item);

  action.status = 'applied';
  action.updatedAt = timestamp;
  return item;
}

export function listActionPlansForOrganization(organizationId: string): AgentActionPlanDetail[] {
  const store = getMockStore();
  return store.agentActionPlans
    .filter((p) => p.organizationId === organizationId)
    .map((plan) => ({
      ...plan,
      actions: store.agentProposedActions.filter(
        (a) => a.actionPlanId === plan.id && a.organizationId === plan.organizationId,
      ),
    }));
}
