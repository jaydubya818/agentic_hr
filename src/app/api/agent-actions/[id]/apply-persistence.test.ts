import { beforeEach, describe, expect, it, vi } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import type { SessionContext } from '@/types/session';
import { PATCH as updateAction } from './route';

/**
 * Regression for backlog 2026-08-30: applying an agent action to a growth
 * plan pushed the new item into the in-memory store only. In Supabase mode
 * that store is a cache which `updateAgentProposedActionInDb` clears on its
 * success path two statements later, so the item vanished on the very request
 * that marked the action 'applied' -- and the already-applied guard then made
 * the apply unrepeatable. The route must hand the item to the persistence
 * layer, and must do so before the action update that clears the cache.
 */

// Fixture action 01 targets Alex, who holds the one active growth plan. Jordan
// has no growth plan at all, so an action retargeted at him cannot be applied.
const ALEX_ACTION_ID = '16161616-1616-4161-8161-161616161601';
const JORDAN_ACTION_ID = '16161616-1616-4161-8161-1616161616a2';

vi.mock('@/lib/auth/session-context', () => ({
  getSessionContext: vi.fn(),
}));

vi.mock('@/services/data-provider/workforce-intelligence-persistence', () => ({
  persistGrowthPlanItem: vi.fn(() => Promise.resolve()),
  updateAgentProposedActionInDb: vi.fn(() => Promise.resolve(false)),
}));

import { getSessionContext } from '@/lib/auth/session-context';
import {
  persistGrowthPlanItem,
  updateAgentProposedActionInDb,
} from '@/services/data-provider/workforce-intelligence-persistence';

function hrSession(): SessionContext {
  return {
    userId: MOCK_IDS.users.riley,
    organizationId: MOCK_IDS.organization,
    roles: ['hr_admin'],
    activeRole: 'hr',
  };
}

function apply(id: string) {
  return updateAction(
    new Request(`http://localhost/api/agent-actions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'applied', applyToGrowthPlan: true }),
    }),
    { params: Promise.resolve({ id }) },
  );
}

describe('applying an action persists the growth-plan item it creates', () => {
  beforeEach(() => {
    vi.mocked(getSessionContext).mockReset().mockResolvedValue(hrSession());
    vi.mocked(persistGrowthPlanItem).mockClear();
    vi.mocked(updateAgentProposedActionInDb).mockClear();
  });

  it('hands the new item to the persistence layer, scoped to the session organization', async () => {
    const { getMockStore } = await import('@/services/data-provider/mock-provider');
    const before = getMockStore().growthPlanItems.length;

    const response = await apply(ALEX_ACTION_ID);
    expect(response.status).toBe(200);

    const store = getMockStore();
    expect(store.growthPlanItems.length).toBe(before + 1);
    const item = store.growthPlanItems.at(-1)!;
    expect(persistGrowthPlanItem).toHaveBeenCalledTimes(1);
    expect(persistGrowthPlanItem).toHaveBeenCalledWith(MOCK_IDS.organization, item);
    expect(item.growthPlanId).toBe(MOCK_IDS.growthPlans.alex);
  });

  it('writes the item before the action update that clears the store cache', async () => {
    const order: string[] = [];
    vi.mocked(persistGrowthPlanItem).mockImplementation(async () => {
      order.push('item');
    });
    vi.mocked(updateAgentProposedActionInDb).mockImplementation(async () => {
      order.push('action');
      return true;
    });

    // The fixture action was applied by the previous test; use a fresh clone
    // of it so this apply is a first apply.
    const { getMockStore } = await import('@/services/data-provider/mock-provider');
    const store = getMockStore();
    const base = store.agentProposedActions.find((a) => a.id === ALEX_ACTION_ID)!;
    const freshId = '16161616-1616-4161-8161-1616161616a1';
    store.agentProposedActions.push({ ...base, id: freshId, status: 'approved' });

    expect((await apply(freshId)).status).toBe(200);
    expect(order).toEqual(['item', 'action']);
  });

  it('persists nothing when there is no active plan to apply to', async () => {
    const { getMockStore } = await import('@/services/data-provider/mock-provider');
    const store = getMockStore();
    const base = store.agentProposedActions.find((a) => a.id === ALEX_ACTION_ID)!;
    store.agentProposedActions.push({
      ...base,
      id: JORDAN_ACTION_ID,
      status: 'approved',
      targetEmployeeId: MOCK_IDS.employees.jordan,
    });

    const response = await apply(JORDAN_ACTION_ID);
    expect(response.status).toBe(409);
    expect(persistGrowthPlanItem).not.toHaveBeenCalled();
    expect(updateAgentProposedActionInDb).not.toHaveBeenCalled();
  });

  it('persists nothing on a plain status update', async () => {
    const response = await updateAction(
      new Request(`http://localhost/api/agent-actions/${ALEX_ACTION_ID}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      }),
      { params: Promise.resolve({ id: ALEX_ACTION_ID }) },
    );
    expect(response.status).toBe(200);
    expect(persistGrowthPlanItem).not.toHaveBeenCalled();
    expect(updateAgentProposedActionInDb).toHaveBeenCalledTimes(1);
  });
});
