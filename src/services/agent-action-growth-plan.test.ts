import { describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import { applyActionToGrowthPlan } from '@/services/agent-action-service';
import { getGrowthPlan, getMockStore } from '@/services/data-provider/mock-provider';
import type { AgentProposedAction } from '@/schemas/workforce-intelligence';

const ORG_ID = MOCK_IDS.organization;

function cloneAction(overrides: Partial<AgentProposedAction>): AgentProposedAction {
  const base = getMockStore().agentProposedActions[0]!;
  return { ...base, ...overrides };
}

describe('applyActionToGrowthPlan referenceId routing', () => {
  it('routes a learning-assignment referenceId to the learning resource column', () => {
    const store = getMockStore();
    const learningResourceId = '77777777-7777-4777-8777-777777777771';
    const action = cloneAction({
      id: '77777777-7777-4777-8777-777777777772',
      actionType: 'learning_assignment',
      referenceId: learningResourceId,
    });
    store.agentProposedActions.push(action);

    const applied = applyActionToGrowthPlan(ORG_ID, action.id, MOCK_IDS.employees.alex);

    expect(applied).toBe(true);
    const item = store.growthPlanItems.at(-1)!;
    expect(item.itemType).toBe('learning');
    expect(item.learningResourceId).toBe(learningResourceId);
    expect(item.skillId).toBeNull();
  });

  it('routes a skill-development referenceId to the skill column', () => {
    const store = getMockStore();
    const skillId = '77777777-7777-4777-8777-777777777773';
    const action = cloneAction({
      id: '77777777-7777-4777-8777-777777777774',
      actionType: 'skill_development',
      referenceId: skillId,
    });
    store.agentProposedActions.push(action);

    const applied = applyActionToGrowthPlan(ORG_ID, action.id, MOCK_IDS.employees.alex);

    expect(applied).toBe(true);
    const item = store.growthPlanItems.at(-1)!;
    expect(item.itemType).toBe('skill');
    expect(item.skillId).toBe(skillId);
    expect(item.learningResourceId).toBeNull();
  });
});

describe('applyActionToGrowthPlan plan selection', () => {
  it('refuses a draft-only plan instead of writing an item no reader surfaces', () => {
    const store = getMockStore();
    const employeeId = MOCK_IDS.employees.jordan;
    const draftPlanId = '55555555-5555-4555-8555-5555555555f1';
    const now = new Date().toISOString();

    // Jordan has no growth plan in the fixtures. A draft plan is the state a
    // freshly created plan is in: `growth_plans.status` defaults to 'draft'.
    store.growthPlans.push({
      id: draftPlanId,
      employeeId,
      careerGoalId: null,
      targetRoleId: null,
      title: 'Draft plan',
      status: 'draft',
      startDate: '2026-03-01',
      endDate: null,
      createdAt: now,
      updatedAt: now,
    } as never);

    const action = cloneAction({
      id: '77777777-7777-4777-8777-7777777777f1',
      actionType: 'skill_development',
      status: 'approved',
    });
    store.agentProposedActions.push(action);

    const applied = applyActionToGrowthPlan(ORG_ID, action.id, employeeId);

    // Every reader of growthPlans selects on status === 'active', so applying
    // into a draft plan produced an item the employee could never see while
    // burning the action's one-shot 'applied' status -- the PATCH route's 409
    // already-applied guard then made the apply unrepeatable.
    expect(applied).toBe(false);
    expect(store.agentProposedActions.find((a) => a.id === action.id)!.status).toBe('approved');
    expect(store.growthPlanItems.filter((i) => i.growthPlanId === draftPlanId)).toHaveLength(0);

    const { plan, items } = getGrowthPlan(employeeId);
    expect(plan).toBeUndefined();
    expect(items).toHaveLength(0);
  });
});
