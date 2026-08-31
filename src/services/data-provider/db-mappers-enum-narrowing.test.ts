import { describe, expect, it } from 'vitest';

import {
  careerGoalStatusSchema,
  growthPlanItemStatusSchema,
  growthPlanItemTypeSchema,
  learningFormatSchema,
  roleSkillImportanceSchema,
} from '@/schemas/enums';
import {
  mapCareerGoal,
  mapGrowthPlanItem,
  mapLearningResource,
  mapRoleSkill,
} from '@/services/data-provider/db-mappers';

/**
 * The Postgres enums in `src/lib/db/schema/enums.ts` are strictly wider than
 * the application enums in `src/schemas/enums.ts`. Every mapper therefore
 * collapses the surplus members onto a permitted one, and each collapse is
 * lossy: the value the database holds is not recoverable from the entity the
 * application renders, and the JSON fixture path can never produce it.
 *
 * These are characterization tests. They pin today's behaviour so the
 * collapses are visible and a change to one of them has to be deliberate.
 * Where a collapse changes meaning rather than spelling, the case says so.
 */

const AT = new Date('2026-01-01T00:00:00.000Z');

describe('mapRoleSkill importance narrowing', () => {
  const base = {
    id: 'rs-1',
    roleId: 'role-1',
    skillId: 'skill-1',
    requiredLevel: 3,
    createdAt: AT,
  };

  it('passes the two importances the application enum shares with the database', () => {
    expect(mapRoleSkill({ ...base, importance: 'required' }).importance).toBe('required');
    expect(mapRoleSkill({ ...base, importance: 'preferred' }).importance).toBe('preferred');
  });

  // Meaning-changing: `nice_to_have` is the weakest importance in the database
  // and `preferred` is the middle one, so every gap analysis that reads this
  // field treats an optional skill as more important than it was recorded.
  it('promotes nice_to_have to preferred, the stronger of the two survivors', () => {
    expect(mapRoleSkill({ ...base, importance: 'nice_to_have' }).importance).toBe('preferred');
  });

  it('only ever emits a member of the application enum', () => {
    for (const importance of ['required', 'preferred', 'nice_to_have'] as const) {
      const mapped = mapRoleSkill({ ...base, importance }).importance;
      expect(roleSkillImportanceSchema.safeParse(mapped).success).toBe(true);
    }
  });
});

describe('mapCareerGoal status narrowing', () => {
  const base = {
    id: 'cg-1',
    employeeId: 'emp-1',
    targetRoleId: null,
    title: 'Move into platform engineering',
    description: null,
    targetDate: null,
    createdAt: AT,
    updatedAt: AT,
  };

  it('maps completed onto achieved', () => {
    expect(mapCareerGoal({ ...base, status: 'completed' }).status).toBe('achieved');
  });

  // Meaning-changing: `paused` is a goal the employee intends to resume and
  // `cancelled` is one they abandoned, but both land on `archived`, so the
  // two are indistinguishable once mapped.
  it('collapses both paused and cancelled onto archived', () => {
    expect(mapCareerGoal({ ...base, status: 'paused' }).status).toBe('archived');
    expect(mapCareerGoal({ ...base, status: 'cancelled' }).status).toBe('archived');
  });

  it('leaves the three shared statuses untouched and stays inside the enum', () => {
    for (const status of ['active', 'achieved', 'archived'] as const) {
      expect(mapCareerGoal({ ...base, status }).status).toBe(status);
    }
    for (const status of ['completed', 'paused', 'cancelled'] as const) {
      const mapped = mapCareerGoal({ ...base, status }).status;
      expect(careerGoalStatusSchema.safeParse(mapped).success).toBe(true);
    }
  });
});

describe('mapLearningResource format narrowing', () => {
  const base = {
    id: 'lr-1',
    organizationId: 'org-1',
    title: 'Distributed systems',
    description: null,
    provider: null,
    url: null,
    durationMinutes: null,
    skillIds: [],
    isActive: true,
    createdAt: AT,
  };

  it('keeps the three formats the application enum shares with the database', () => {
    for (const format of ['book', 'workshop', 'mentorship'] as const) {
      expect(mapLearningResource({ ...base, format }).format).toBe(format);
    }
  });

  // Meaning-changing: `certification` is the one format with an external
  // credential attached, and it is indistinguishable from a course afterwards.
  it('falls every other format, and a null format, back to course', () => {
    for (const format of ['article', 'video', 'certification', null] as const) {
      expect(mapLearningResource({ ...base, format }).format).toBe('course');
    }
  });

  it('only ever emits a member of the application enum', () => {
    for (const format of ['course', 'article', 'video', 'certification', null] as const) {
      const mapped = mapLearningResource({ ...base, format }).format;
      expect(learningFormatSchema.safeParse(mapped).success).toBe(true);
    }
  });
});

describe('mapGrowthPlanItem type and status narrowing', () => {
  const base = {
    id: 'gpi-1',
    growthPlanId: 'gp-1',
    title: 'Pair on the ingest rewrite',
    description: null,
    dueDate: null,
    referenceId: null,
    sortOrder: 0,
    createdAt: AT,
    updatedAt: AT,
  };

  it('maps the milestone item type onto conversation', () => {
    const item = mapGrowthPlanItem({
      ...base,
      itemType: 'milestone',
      status: 'pending',
    });
    expect(item.itemType).toBe('conversation');
    expect(growthPlanItemTypeSchema.safeParse(item.itemType).success).toBe(true);
  });

  // Meaning-changing: `skipped` records work the employee and manager agreed
  // to drop. It reappears as `pending`, i.e. as outstanding work, in every
  // completion rollup that reads this field.
  it('reports a skipped item as pending outstanding work', () => {
    const item = mapGrowthPlanItem({
      ...base,
      itemType: 'skill',
      status: 'skipped',
    });
    expect(item.status).toBe('pending');
    expect(growthPlanItemStatusSchema.safeParse(item.status).success).toBe(true);
  });

  it('leaves the shared types and statuses untouched', () => {
    for (const itemType of ['skill', 'learning', 'project', 'conversation'] as const) {
      expect(mapGrowthPlanItem({ ...base, itemType, status: 'pending' }).itemType).toBe(itemType);
    }
    for (const status of ['pending', 'in_progress', 'completed'] as const) {
      expect(mapGrowthPlanItem({ ...base, itemType: 'skill', status }).status).toBe(status);
    }
  });

  it('routes referenceId to the column matching the *narrowed* item type', () => {
    // A `milestone` row narrows to `conversation`, which owns neither
    // reference column, so a referenceId on such a row is dropped entirely.
    const milestone = mapGrowthPlanItem({
      ...base,
      itemType: 'milestone',
      status: 'pending',
      referenceId: 'skill-1',
    });
    expect(milestone.skillId).toBeNull();
    expect(milestone.learningResourceId).toBeNull();

    const skill = mapGrowthPlanItem({
      ...base,
      itemType: 'skill',
      status: 'pending',
      referenceId: 'skill-1',
    });
    expect(skill.skillId).toBe('skill-1');
    expect(skill.learningResourceId).toBeNull();
  });
});
