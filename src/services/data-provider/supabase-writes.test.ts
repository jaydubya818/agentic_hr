import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Characterization of `supabase-writes.ts`, the module that issues the three
 * direct Postgres writes on the growth-profile / growth-plan path (bio and
 * preferences, item progress, and the plan's `updatedAt` touch). It had no
 * test of its own. Every function is `getDb() ?? return false/void` guarded,
 * and `updateGrowthProfile`'s metadata merge has a three-way fallback
 * (input -> existing row -> default) worth pinning on its own.
 */

vi.mock('@/lib/db', () => ({ getDb: vi.fn() }));
vi.mock('./store-runtime', () => ({ clearSupabaseStoreCache: vi.fn() }));

import { getDb } from '@/lib/db';
import {
  touchGrowthPlanUpdatedAt,
  updateGrowthPlanItemProgress,
  updateGrowthProfile,
} from './supabase-writes';
import { clearSupabaseStoreCache } from './store-runtime';

/** A Drizzle-shaped fake covering the select/update chains this module uses. */
function fakeDb(opts: { selectRows?: unknown[]; updateResult?: unknown; returningRows?: unknown[] }) {
  const selectChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(async () => opts.selectRows ?? []),
  };
  const whereResult = {
    then: (resolve: (value: unknown) => void) => resolve(opts.updateResult),
    returning: vi.fn(async () => opts.returningRows ?? []),
  };
  const setFn = vi.fn(() => ({ where: vi.fn(() => whereResult) }));
  return { select: vi.fn(() => selectChain), update: vi.fn(() => ({ set: setFn })), setFn };
}

beforeEach(() => {
  vi.mocked(getDb).mockReset();
  vi.mocked(clearSupabaseStoreCache).mockReset();
});

describe('updateGrowthProfile', () => {
  it('returns false with no db configured, and touches nothing', async () => {
    vi.mocked(getDb).mockReturnValue(null as never);
    const result = await updateGrowthProfile({ employeeId: 'e1' });
    expect(result).toBe(false);
    expect(clearSupabaseStoreCache).not.toHaveBeenCalled();
  });

  it('returns false when no profile row exists for the employee', async () => {
    const db = fakeDb({ selectRows: [] });
    vi.mocked(getDb).mockReturnValue(db as never);
    const result = await updateGrowthProfile({ employeeId: 'e1', bio: 'new bio' });
    expect(result).toBe(false);
    expect(db.update).not.toHaveBeenCalled();
  });

  it('keeps the existing bio and metadata fields when the input omits them', async () => {
    const db = fakeDb({
      selectRows: [{ id: 'p1', bio: 'old bio', metadata: { careerSummary: 'old summary', preferences: { a: 1 } } }],
    });
    vi.mocked(getDb).mockReturnValue(db as never);
    const result = await updateGrowthProfile({ employeeId: 'e1' });
    expect(result).toBe(true);
    expect(db.setFn).toHaveBeenCalledWith(
      expect.objectContaining({
        bio: 'old bio',
        metadata: { careerSummary: 'old summary', inferredSkillsVisible: true, preferences: { a: 1 } },
      }),
    );
    expect(clearSupabaseStoreCache).toHaveBeenCalledTimes(1);
  });

  it('overrides bio and metadata fields the input provides', async () => {
    const db = fakeDb({
      selectRows: [{ id: 'p1', bio: 'old bio', metadata: { careerSummary: 'old summary' } }],
    });
    vi.mocked(getDb).mockReturnValue(db as never);
    await updateGrowthProfile({
      employeeId: 'e1',
      bio: 'new bio',
      careerSummary: 'new summary',
      inferredSkillsVisible: false,
    });
    expect(db.setFn).toHaveBeenCalledWith(
      expect.objectContaining({
        bio: 'new bio',
        metadata: expect.objectContaining({
          careerSummary: 'new summary',
          inferredSkillsVisible: false,
        }),
      }),
    );
  });

  // The row's stored metadata may itself be null (never set); the merge
  // must not throw reading properties off it in that case.
  it('defaults preferences to {} and inferredSkillsVisible to true when the row has no metadata at all', async () => {
    const db = fakeDb({ selectRows: [{ id: 'p1', bio: null, metadata: null }] });
    vi.mocked(getDb).mockReturnValue(db as never);
    await updateGrowthProfile({ employeeId: 'e1' });
    expect(db.setFn).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { careerSummary: null, inferredSkillsVisible: true, preferences: {} },
      }),
    );
  });
});

describe('updateGrowthPlanItemProgress', () => {
  it('returns false with no db configured', async () => {
    vi.mocked(getDb).mockReturnValue(null as never);
    const result = await updateGrowthPlanItemProgress({ itemId: 'i1', status: 'completed' });
    expect(result).toBe(false);
    expect(clearSupabaseStoreCache).not.toHaveBeenCalled();
  });

  it('returns false when the update matches no row', async () => {
    const db = fakeDb({ returningRows: [] });
    vi.mocked(getDb).mockReturnValue(db as never);
    const result = await updateGrowthPlanItemProgress({ itemId: 'missing', status: 'in_progress' });
    expect(result).toBe(false);
    expect(clearSupabaseStoreCache).not.toHaveBeenCalled();
  });

  it('sets completedAt to a Date on completed, and returns true', async () => {
    const db = fakeDb({ returningRows: [{ id: 'i1' }] });
    vi.mocked(getDb).mockReturnValue(db as never);
    const result = await updateGrowthPlanItemProgress({ itemId: 'i1', status: 'completed' });
    expect(result).toBe(true);
    expect(db.setFn).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'completed', completedAt: expect.any(Date) }),
    );
    expect(clearSupabaseStoreCache).toHaveBeenCalledTimes(1);
  });

  it('sets completedAt to null for any non-completed status', async () => {
    const db = fakeDb({ returningRows: [{ id: 'i1' }] });
    vi.mocked(getDb).mockReturnValue(db as never);
    await updateGrowthPlanItemProgress({ itemId: 'i1', status: 'in_progress' });
    expect(db.setFn).toHaveBeenCalledWith(expect.objectContaining({ status: 'in_progress', completedAt: null }));
  });
});

describe('touchGrowthPlanUpdatedAt', () => {
  it('no-ops without throwing when no db is configured', async () => {
    vi.mocked(getDb).mockReturnValue(null as never);
    await expect(touchGrowthPlanUpdatedAt('plan-1')).resolves.toBeUndefined();
    expect(clearSupabaseStoreCache).not.toHaveBeenCalled();
  });

  it('updates updatedAt and clears the store cache when a db is configured', async () => {
    const db = fakeDb({});
    vi.mocked(getDb).mockReturnValue(db as never);
    await touchGrowthPlanUpdatedAt('plan-1');
    expect(db.setFn).toHaveBeenCalledWith(expect.objectContaining({ updatedAt: expect.any(Date) }));
    expect(clearSupabaseStoreCache).toHaveBeenCalledTimes(1);
  });
});
