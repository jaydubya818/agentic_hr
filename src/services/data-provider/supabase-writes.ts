import { eq } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import { employeeProfiles, growthPlanItems, growthPlans } from '@/lib/db/schema';
import type { GrowthPlanItem } from './types';
import { clearSupabaseStoreCache } from './store-runtime';

export interface UpdateGrowthProfileInput {
  employeeId: string;
  bio?: string | null;
  careerSummary?: string | null;
  preferences?: Record<string, unknown>;
  inferredSkillsVisible?: boolean;
}

export interface UpdateGrowthPlanItemProgressInput {
  itemId: string;
  status: GrowthPlanItem['status'];
}

function profileMetadataFromInput(input: UpdateGrowthProfileInput, existing?: Record<string, unknown>) {
  return {
    ...existing,
    careerSummary: input.careerSummary ?? existing?.careerSummary ?? null,
    inferredSkillsVisible:
      input.inferredSkillsVisible ?? (existing?.inferredSkillsVisible as boolean | undefined) ?? true,
    preferences: input.preferences ?? (existing?.preferences as Record<string, unknown> | undefined) ?? {},
  };
}

export async function updateGrowthProfile(input: UpdateGrowthProfileInput): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  const [profile] = await db
    .select()
    .from(employeeProfiles)
    .where(eq(employeeProfiles.employeeId, input.employeeId))
    .limit(1);

  if (!profile) return false;

  const metadata = profileMetadataFromInput(
    input,
    (profile.metadata as Record<string, unknown> | null) ?? undefined,
  );

  await db
    .update(employeeProfiles)
    .set({
      bio: input.bio ?? profile.bio,
      metadata,
      updatedAt: new Date(),
    })
    .where(eq(employeeProfiles.id, profile.id));

  clearSupabaseStoreCache();
  return true;
}

export async function updateGrowthPlanItemProgress(
  input: UpdateGrowthPlanItemProgressInput,
): Promise<boolean> {
  const db = getDb();
  if (!db) return false;

  const result = await db
    .update(growthPlanItems)
    .set({
      status: input.status,
      completedAt: input.status === 'completed' ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(growthPlanItems.id, input.itemId))
    .returning({ id: growthPlanItems.id });

  if (result.length === 0) return false;
  clearSupabaseStoreCache();
  return true;
}

export async function touchGrowthPlanUpdatedAt(growthPlanId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db
    .update(growthPlans)
    .set({ updatedAt: new Date() })
    .where(eq(growthPlans.id, growthPlanId));
  clearSupabaseStoreCache();
}
