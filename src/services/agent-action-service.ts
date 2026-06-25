import { randomUUID } from 'crypto';

import type { z } from 'zod';

import {
  createAgentActionPlanInputSchema,
  updateAgentProposedActionInputSchema,
  type AgentActionPlan,
  type AgentProposedAction,
} from '@/schemas/workforce-intelligence';
import { getMockStore } from '@/services/data-provider/mock-provider';
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

export function createActionPlanFromInput(
  session: SessionContext,
  input: CreatePlanInput,
  proposedActions: Omit<AgentProposedAction, 'id' | 'organizationId' | 'actionPlanId' | 'createdAt' | 'updatedAt'>[],
): AgentActionPlanDetail {
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
  actionId: string,
  input: UpdateActionInput,
): AgentProposedAction | null {
  const store = getMockStore();
  const index = store.agentProposedActions.findIndex((a) => a.id === actionId);
  if (index < 0) return null;

  const updated: AgentProposedAction = {
    ...store.agentProposedActions[index]!,
    ...input,
    updatedAt: nowIso(),
  };
  store.agentProposedActions[index] = updated;
  return updated;
}

export function applyActionToGrowthPlan(actionId: string, employeeId: string): boolean {
  const store = getMockStore();
  const action = store.agentProposedActions.find((a) => a.id === actionId);
  if (!action) return false;

  const growthPlan = store.growthPlans.find(
    (p) => p.employeeId === employeeId && (p.status === 'active' || p.status === 'draft'),
  );
  if (!growthPlan) return false;

  const timestamp = nowIso();
  store.growthPlanItems.push({
    id: randomUUID(),
    growthPlanId: growthPlan.id,
    itemType: action.actionType === 'learning_assignment' ? 'learning' : 'skill',
    title: action.title,
    description: action.description ?? action.explanation ?? null,
    status: 'pending',
    milestoneDay: 30,
    skillId: action.referenceId ?? null,
    learningResourceId: null,
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
