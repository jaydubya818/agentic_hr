import { describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import {
  applyActionToGrowthPlan,
  getActionPlan,
  updateProposedActionStatus,
} from '@/services/agent-action-service';
import { getMockStore } from '@/services/data-provider/mock-provider';

const ORG_ID = MOCK_IDS.organization;
const OTHER_ORG_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

describe('agent-action-service organization scoping', () => {
  it("excludes another organization's action rows recorded against the same plan id", () => {
    const store = getMockStore();
    const planId = MOCK_IDS.actionPlans.employeeGrowth;
    const timestamp = new Date().toISOString();
    const foreignAction = {
      id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4',
      organizationId: OTHER_ORG_ID,
      actionPlanId: planId,
      actionType: 'learning_assignment' as const,
      title: 'Foreign-organization action for the same plan id',
      description: null,
      status: 'draft' as const,
      targetEmployeeId: null,
      referenceId: null,
      confidence: null,
      explanation: null,
      metadata: {},
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    store.agentProposedActions.push(foreignAction);
    try {
      const detail = getActionPlan(planId);
      expect(detail).not.toBeNull();
      expect(detail!.actions.some((a) => a.id === foreignAction.id)).toBe(false);
      expect(detail!.actions.every((a) => a.organizationId === ORG_ID)).toBe(true);
    } finally {
      store.agentProposedActions.splice(
        store.agentProposedActions.findIndex((a) => a.id === foreignAction.id),
        1,
      );
    }
  });

  it('returns the plan when the requested organization owns it', () => {
    const detail = getActionPlan(MOCK_IDS.actionPlans.employeeGrowth, ORG_ID);
    expect(detail).not.toBeNull();
    expect(detail!.organizationId).toBe(ORG_ID);
  });

  it('conceals a plan from another organization', () => {
    const detail = getActionPlan(MOCK_IDS.actionPlans.employeeGrowth, OTHER_ORG_ID);
    expect(detail).toBeNull();
  });

  it('does not update actions belonging to another organization', () => {
    const action = getMockStore().agentProposedActions[0]!;
    const before = action.status;

    const result = updateProposedActionStatus(OTHER_ORG_ID, action.id, {
      status: 'approved',
    });

    expect(result).toBeNull();
    expect(getMockStore().agentProposedActions[0]!.status).toBe(before);
  });

  it('updates actions within the caller organization', () => {
    const action = getMockStore().agentProposedActions[0]!;

    const result = updateProposedActionStatus(ORG_ID, action.id, {
      status: 'pending_review',
    });

    expect(result).not.toBeNull();
    expect(result!.status).toBe('pending_review');
  });

  it('refuses to apply an action from another organization to a growth plan', () => {
    const action = getMockStore().agentProposedActions[0]!;

    const applied = applyActionToGrowthPlan(OTHER_ORG_ID, action.id, MOCK_IDS.employees.alex);

    expect(applied).toBeNull();
  });

  it('refuses to apply an action to an unknown or cross-organization employee', () => {
    const action = getMockStore().agentProposedActions[0]!;

    const applied = applyActionToGrowthPlan(ORG_ID, action.id, OTHER_ORG_ID);

    expect(applied).toBeNull();
  });

  it('applies an in-organization action to the employee growth plan', () => {
    const store = getMockStore();
    const action = store.agentProposedActions[0]!;
    const itemsBefore = store.growthPlanItems.length;

    const applied = applyActionToGrowthPlan(ORG_ID, action.id, MOCK_IDS.employees.alex);

    expect(applied).not.toBeNull();
    expect(store.growthPlanItems.length).toBe(itemsBefore + 1);
    expect(store.growthPlanItems.at(-1)).toBe(applied);
    expect(store.agentProposedActions[0]!.status).toBe('applied');
  });
});
