import { describe, expect, it } from 'vitest';

import {
  mapEmployee,
  mapEmployeeSkill,
  mapGrowthPlan,
  mapGrowthPlanItem,
  mapOpportunity,
} from '@/services/data-provider/db-mappers';

/**
 * Date and null handling in the Postgres mappers.
 *
 * Two private helpers sit under every mapper in this file:
 *
 *   toIso(v)      -- `v` as an ISO string, or the Unix epoch when `v` is nullish
 *   toDateOnly(v) -- the first ten characters of `v.toISOString()`, or null
 *
 * Both are consequential for an HR record and neither had a test. `toDateOnly`
 * in particular truncates in **UTC**, while every column it reads is declared
 * `timestamp(..., { withTimezone: true })` in src/lib/db/schema/tables.ts --
 * so the calendar day it returns depends on the offset the value was written
 * at, not on the day anyone entered.
 *
 * Characterization tests. They pin what the mappers do today; the comments
 * mark the two places where that is a latent correctness problem rather than
 * a deliberate choice.
 */

const AT = new Date('2026-01-01T00:00:00.000Z');
const EPOCH = new Date(0).toISOString();

const employeeRow = {
  id: 'emp-1',
  organizationId: 'org-1',
  userId: 'user-1',
  title: 'Staff Engineer',
  department: 'Platform',
  hireDate: null as Date | null,
  managerId: null,
  teamId: null,
  isActive: true,
  createdAt: AT,
  updatedAt: AT,
};

describe('hire date truncation is UTC, not the offset the date was written at', () => {
  it('keeps the calendar day for a western-hemisphere local midnight', () => {
    // Midnight in New York is 05:00 UTC the same day.
    const hireDate = new Date('2024-03-15T00:00:00-05:00');
    expect(mapEmployee({ ...employeeRow, hireDate }).hireDate).toBe('2024-03-15');
  });

  // Latent bug, pinned deliberately. `hire_date` is a `timestamptz` used as a
  // calendar date. Midnight at any offset *east* of UTC is the previous day in
  // UTC, so an employee hired on the 15th in Sydney reads back as the 14th --
  // and tenure computed from this field is a day long for that whole cohort.
  it('loses a day for an eastern-hemisphere local midnight', () => {
    const hireDate = new Date('2024-03-15T00:00:00+10:00');
    expect(mapEmployee({ ...employeeRow, hireDate }).hireDate).toBe('2024-03-14');
  });

  // The same field written late in the day west of UTC rolls the other way.
  it('gains a day for a late western-hemisphere timestamp', () => {
    const hireDate = new Date('2024-03-15T23:30:00-05:00');
    expect(mapEmployee({ ...employeeRow, hireDate }).hireDate).toBe('2024-03-16');
  });

  it('reports a missing hire date as null rather than inventing one', () => {
    expect(mapEmployee({ ...employeeRow, hireDate: null }).hireDate).toBeNull();
  });
});

describe('mapEmployee substitutes for missing identity columns', () => {
  it('falls a null userId back to the employee id, not null', () => {
    // Callers that treat `userId` as a users-table foreign key will therefore
    // look up an id that belongs to `employees`.
    expect(mapEmployee({ ...employeeRow, userId: null }).userId).toBe('emp-1');
  });

  it('gives an employee with no title the placeholder job title', () => {
    expect(mapEmployee({ ...employeeRow, title: null }).jobTitle).toBe('Team Member');
  });

  it('leaves a null department null', () => {
    expect(mapEmployee({ ...employeeRow, department: null }).department).toBeNull();
  });
});

describe('a nullish timestamp becomes the Unix epoch, not null', () => {
  const opportunityRow = {
    id: 'opp-1',
    organizationId: 'org-1',
    title: 'Platform reliability rotation',
    description: null,
    roleId: null,
    department: null,
    status: 'open' as const,
    postedAt: null as Date | null,
    createdAt: AT,
  };

  it('uses createdAt when postedAt is missing', () => {
    expect(mapOpportunity(opportunityRow, []).postedAt).toBe(AT.toISOString());
  });

  // Latent bug, pinned deliberately. `toIso` returns `new Date(0)` for a
  // nullish input, so a row missing both timestamps is dated 1970 rather than
  // reported as unknown -- and 1970 sorts first in every "most recent" list.
  it('dates a row missing every timestamp to 1970', () => {
    const undated = mapOpportunity(
      { ...opportunityRow, postedAt: null, createdAt: null as unknown as Date },
      [],
    );
    expect(undated.postedAt).toBe(EPOCH);
    expect(undated.createdAt).toBe(EPOCH);
  });
});

describe('mapGrowthPlan start date fallback chain', () => {
  const planRow = {
    id: 'gp-1',
    employeeId: 'emp-1',
    title: '30/60/90',
    status: 'active' as const,
    startDate: null as Date | null,
    targetDate: null as Date | null,
    createdAt: new Date('2025-06-02T12:00:00.000Z'),
    updatedAt: AT,
  };

  it('prefers the recorded start date', () => {
    const plan = mapGrowthPlan({ ...planRow, startDate: new Date('2025-07-01T12:00:00.000Z') });
    expect(plan.startDate).toBe('2025-07-01');
  });

  it('falls back to the row creation date when no start date is recorded', () => {
    expect(mapGrowthPlan(planRow).startDate).toBe('2025-06-02');
  });

  // The literal in the third position is only reachable when `createdAt` is
  // also nullish, at which point `toIso` would have said 1970 -- so the two
  // fallbacks in this file disagree about what an unknown date looks like.
  it('falls back to a hard-coded 2026-01-01 when the creation date is missing too', () => {
    const plan = mapGrowthPlan({ ...planRow, createdAt: null as unknown as Date });
    expect(plan.startDate).toBe('2026-01-01');
  });

  it('leaves a missing target date as a null end date', () => {
    expect(mapGrowthPlan(planRow).endDate).toBeNull();
  });
});

describe('mapGrowthPlanItem derives milestoneDay from sortOrder', () => {
  const itemRow = {
    id: 'gpi-1',
    growthPlanId: 'gp-1',
    itemType: 'skill' as const,
    title: 'Ship the ingest rewrite',
    description: null,
    status: 'pending' as const,
    dueDate: null as Date | null,
    referenceId: null,
    sortOrder: 0,
    createdAt: AT,
    updatedAt: AT,
  };

  // `growth_plan_items` has no `milestone_day` column, so the mapper invents
  // one from `sortOrder`. This is the 2026-08-30 backlog item, pinned here so
  // the shape of the derivation is visible: it can emit at most one Day-30 and
  // one Day-60 item per plan, and everything from the third item on is Day-90.
  it('buckets 0 to Day 30, 1 to Day 60 and everything above to Day 90', () => {
    expect(mapGrowthPlanItem({ ...itemRow, sortOrder: 0 }).milestoneDay).toBe(30);
    expect(mapGrowthPlanItem({ ...itemRow, sortOrder: 1 }).milestoneDay).toBe(60);
    expect(mapGrowthPlanItem({ ...itemRow, sortOrder: 2 }).milestoneDay).toBe(90);
    expect(mapGrowthPlanItem({ ...itemRow, sortOrder: 7 }).milestoneDay).toBe(90);
  });

  it('treats a negative sortOrder as Day 30', () => {
    expect(mapGrowthPlanItem({ ...itemRow, sortOrder: -1 }).milestoneDay).toBe(30);
  });

  it('truncates the due date to a UTC calendar day', () => {
    const item = mapGrowthPlanItem({ ...itemRow, dueDate: new Date('2026-02-10T23:00:00-08:00') });
    expect(item.dueDate).toBe('2026-02-11');
  });
});

describe('mapEmployeeSkill derives confidence and confirmation', () => {
  const skillRow = {
    id: 'es-1',
    employeeId: 'emp-1',
    skillId: 'skill-1',
    source: 'confirmed' as const,
    proficiencyLevel: 3,
    createdAt: AT,
    updatedAt: new Date('2026-02-02T00:00:00.000Z'),
  };

  it('scales proficiency 0-5 onto confidence 0-1', () => {
    expect(mapEmployeeSkill({ ...skillRow, proficiencyLevel: 0 }).confidence).toBe(0);
    expect(mapEmployeeSkill({ ...skillRow, proficiencyLevel: 3 }).confidence).toBe(0.6);
    expect(mapEmployeeSkill({ ...skillRow, proficiencyLevel: 5 }).confidence).toBe(1);
  });

  it('clamps an out-of-range proficiency into 0-1 rather than rejecting it', () => {
    expect(mapEmployeeSkill({ ...skillRow, proficiencyLevel: 9 }).confidence).toBe(1);
    expect(mapEmployeeSkill({ ...skillRow, proficiencyLevel: -2 }).confidence).toBe(0);
  });

  // `confirmed_at` is not stored, so the mapper reports the row's last update
  // as the confirmation time. Any later edit to the row moves the date on
  // which the employee is recorded as having confirmed the skill.
  it('reports updatedAt as the confirmation time for a confirmed skill', () => {
    const mapped = mapEmployeeSkill(skillRow);
    expect(mapped.confirmedAt).toBe('2026-02-02T00:00:00.000Z');
    expect(mapped.confirmedBy).toBeNull();
  });

  it('leaves an inferred skill unconfirmed', () => {
    expect(mapEmployeeSkill({ ...skillRow, source: 'inferred' }).confirmedAt).toBeNull();
  });
});
