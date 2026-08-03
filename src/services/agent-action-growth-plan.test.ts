import { describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import { applyActionToGrowthPlan } from '@/services/agent-action-service';
import { getMockStore } from '@/services/data-provider/mock-provider';
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
