import { and, eq } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import {
  agentActionPlans,
  agentProposedActions,
  decisionOutcomes,
  growthPlanItems,
  teamScenarios,
  workforceDecisions,
} from '@/lib/db/schema';
import type { AgentActionPlanDetail } from '@/services/agent-action-service';
import type { GrowthPlanItem } from './types';
import type {
  AgentProposedAction,
  DecisionOutcome,
  TeamScenario,
  WorkforceDecision,
} from '@/schemas/workforce-intelligence';
import { clearSupabaseStoreCache } from './store-runtime';
import { shouldPersistWrites } from './persistence-config';

export async function persistWorkforceDecision(decision: WorkforceDecision): Promise<void> {
  if (!shouldPersistWrites()) return;

  const db = getDb();
  if (!db) return;

  await db.insert(workforceDecisions).values({
    id: decision.id,
    organizationId: decision.organizationId,
    title: decision.title,
    description: decision.description,
    decisionType: decision.decisionType,
    status: decision.status,
    teamId: decision.teamId,
    businessPriorityId: decision.businessPriorityId,
    ownerEmployeeId: decision.ownerEmployeeId,
    rationale: decision.rationale,
    confidence: decision.confidence,
    metadata: decision.metadata ?? {},
    createdAt: new Date(decision.createdAt),
    updatedAt: new Date(decision.updatedAt),
  });

  clearSupabaseStoreCache();
}

export async function updateWorkforceDecisionInDb(
  decision: WorkforceDecision,
): Promise<boolean> {
  if (!shouldPersistWrites()) return false;

  const db = getDb();
  if (!db) return false;

  const result = await db
    .update(workforceDecisions)
    .set({
      title: decision.title,
      description: decision.description,
      decisionType: decision.decisionType,
      status: decision.status,
      teamId: decision.teamId,
      businessPriorityId: decision.businessPriorityId,
      ownerEmployeeId: decision.ownerEmployeeId,
      rationale: decision.rationale,
      confidence: decision.confidence,
      metadata: decision.metadata ?? {},
      updatedAt: new Date(decision.updatedAt),
    })
    .where(
      and(
        eq(workforceDecisions.id, decision.id),
        eq(workforceDecisions.organizationId, decision.organizationId),
      ),
    )
    .returning({ id: workforceDecisions.id });

  if (result.length === 0) return false;
  clearSupabaseStoreCache();
  return true;
}

export async function persistDecisionOutcome(outcome: DecisionOutcome): Promise<void> {
  if (!shouldPersistWrites()) return;

  const db = getDb();
  if (!db) return;

  await db.insert(decisionOutcomes).values({
    id: outcome.id,
    organizationId: outcome.organizationId,
    decisionId: outcome.decisionId,
    outcomeType: outcome.outcomeType,
    description: outcome.description,
    status: outcome.status,
    metricLabel: outcome.metricLabel,
    metricValue: outcome.metricValue,
    targetValue: outcome.targetValue,
    recordedAt: outcome.recordedAt ? new Date(outcome.recordedAt) : null,
    recordedByEmployeeId: outcome.recordedByEmployeeId,
    createdAt: new Date(outcome.createdAt),
    updatedAt: new Date(outcome.updatedAt),
  });

  clearSupabaseStoreCache();
}

export async function persistTeamScenario(scenario: TeamScenario): Promise<void> {
  if (!shouldPersistWrites()) return;

  const db = getDb();
  if (!db) return;

  await db.insert(teamScenarios).values({
    id: scenario.id,
    organizationId: scenario.organizationId,
    title: scenario.title,
    description: scenario.description,
    teamId: scenario.teamId,
    scenarioType: scenario.scenarioType,
    status: scenario.status,
    businessPriorityId: scenario.businessPriorityId,
    rationale: scenario.rationale,
    confidence: scenario.confidence,
    metadata: scenario.metadata ?? {},
    createdAt: new Date(scenario.createdAt),
    updatedAt: new Date(scenario.updatedAt),
  });

  clearSupabaseStoreCache();
}

export async function updateTeamScenarioInDb(scenario: TeamScenario): Promise<boolean> {
  if (!shouldPersistWrites()) return false;

  const db = getDb();
  if (!db) return false;

  const result = await db
    .update(teamScenarios)
    .set({
      title: scenario.title,
      description: scenario.description,
      teamId: scenario.teamId,
      scenarioType: scenario.scenarioType,
      status: scenario.status,
      businessPriorityId: scenario.businessPriorityId,
      rationale: scenario.rationale,
      confidence: scenario.confidence,
      metadata: scenario.metadata ?? {},
      updatedAt: new Date(scenario.updatedAt),
    })
    .where(
      and(
        eq(teamScenarios.id, scenario.id),
        eq(teamScenarios.organizationId, scenario.organizationId),
      ),
    )
    .returning({ id: teamScenarios.id });

  if (result.length === 0) return false;
  clearSupabaseStoreCache();
  return true;
}

export async function persistAgentActionPlan(plan: AgentActionPlanDetail): Promise<void> {
  if (!shouldPersistWrites()) return;

  const db = getDb();
  if (!db) return;

  await db.insert(agentActionPlans).values({
    id: plan.id,
    organizationId: plan.organizationId,
    agentId: plan.agentId,
    employeeId: plan.employeeId,
    teamId: plan.teamId,
    title: plan.title,
    summary: plan.summary,
    sourceDecisionId: plan.sourceDecisionId,
    governanceStatus: plan.governanceStatus,
    metadata: plan.metadata ?? {},
    createdAt: new Date(plan.createdAt),
    updatedAt: new Date(plan.updatedAt),
  });

  if (plan.actions.length > 0) {
    await db.insert(agentProposedActions).values(
      plan.actions.map((action) => ({
        id: action.id,
        organizationId: action.organizationId,
        actionPlanId: action.actionPlanId,
        actionType: action.actionType,
        title: action.title,
        description: action.description,
        status: action.status,
        targetEmployeeId: action.targetEmployeeId,
        referenceId: action.referenceId,
        confidence: action.confidence,
        explanation: action.explanation,
        metadata: action.metadata ?? {},
        createdAt: new Date(action.createdAt),
        updatedAt: new Date(action.updatedAt),
      })),
    );
  }

  clearSupabaseStoreCache();
}

export async function updateAgentProposedActionInDb(
  action: AgentProposedAction,
): Promise<boolean> {
  if (!shouldPersistWrites()) return false;

  const db = getDb();
  if (!db) return false;

  const result = await db
    .update(agentProposedActions)
    .set({
      status: action.status,
      title: action.title,
      description: action.description,
      targetEmployeeId: action.targetEmployeeId,
      referenceId: action.referenceId,
      confidence: action.confidence,
      explanation: action.explanation,
      metadata: action.metadata ?? {},
      updatedAt: new Date(action.updatedAt),
    })
    .where(
      and(
        eq(agentProposedActions.id, action.id),
        eq(agentProposedActions.organizationId, action.organizationId),
      ),
    )
    .returning({ id: agentProposedActions.id });

  if (result.length === 0) return false;
  clearSupabaseStoreCache();
  return true;
}

/**
 * Inserts the growth-plan item an applied agent action produced. The table
 * has a single polymorphic `reference_id`, so whichever of `skillId` /
 * `learningResourceId` the item carries is written there; `mapGrowthPlanItem`
 * routes it back by `itemType` on read. `milestoneDay` has no column and is
 * not persisted (backlog 2026-08-30).
 */
export async function persistGrowthPlanItem(
  organizationId: string,
  item: GrowthPlanItem,
): Promise<void> {
  if (!shouldPersistWrites()) return;

  const db = getDb();
  if (!db) return;

  await db.insert(growthPlanItems).values({
    id: item.id,
    organizationId,
    growthPlanId: item.growthPlanId,
    itemType: item.itemType,
    title: item.title,
    description: item.description ?? null,
    status: item.status,
    dueDate: item.dueDate ? new Date(item.dueDate) : null,
    referenceId: item.skillId ?? item.learningResourceId ?? null,
    sortOrder: item.sortOrder,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  });

  clearSupabaseStoreCache();
}
