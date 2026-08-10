import { beforeEach, describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import { getMockStore } from '@/services/data-provider/mock-provider';
import type { EmployeeSkill } from '@/services/data-provider/types';
import { reviewInferredSkill } from '@/services/inferred-skill-service';
import type { SessionContext } from '@/types/session';
import type { UserRole } from '@/lib/auth/types';

// Inferred skill owned by Alex (managed by Jordan) in the mock fixtures.
const ALEX_INFERRED_SKILL_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02';

function buildSession(
  employeeId: string | undefined,
  roles: UserRole[],
  activeRole: SessionContext['activeRole'],
  organizationId: string = MOCK_IDS.organization,
): SessionContext {
  return {
    userId: MOCK_IDS.users.alex,
    organizationId,
    employeeId,
    roles,
    activeRole,
  };
}

describe('inferred skill review scoping', () => {
  // Reviews now mutate the shared mock store (confirm rewrites the source,
  // reject removes the row), so restore the fixture before each test.
  let fixtureTemplate: EmployeeSkill | undefined;

  beforeEach(() => {
    const store = getMockStore();
    fixtureTemplate ??= {
      ...store.employeeSkills.find((es) => es.id === ALEX_INFERRED_SKILL_ID)!,
    };
    const index = store.employeeSkills.findIndex((es) => es.id === ALEX_INFERRED_SKILL_ID);
    if (index >= 0) {
      store.employeeSkills[index] = { ...fixtureTemplate };
    } else {
      store.employeeSkills.push({ ...fixtureTemplate });
    }
  });

  it('rejects an unrelated employee reviewing another employee skill', async () => {
    const result = await reviewInferredSkill({
      session: buildSession(MOCK_IDS.employees.morgan, ['employee'], 'employee'),
      employeeSkillId: ALEX_INFERRED_SKILL_ID,
      action: 'confirm',
    });
    expect(result).toMatchObject({ ok: false, status: 403 });
  });

  it('rejects a manager reviewing a non-direct-report skill', async () => {
    const result = await reviewInferredSkill({
      session: buildSession(MOCK_IDS.employees.morgan, ['employee', 'manager'], 'manager'),
      employeeSkillId: ALEX_INFERRED_SKILL_ID,
      action: 'reject',
    });
    expect(result).toMatchObject({ ok: false, status: 403 });
  });

  it('hides skills from sessions in another organization', async () => {
    const result = await reviewInferredSkill({
      session: buildSession(undefined, ['hr_admin'], 'hr', '99999999-0000-4000-8000-000000000000'),
      employeeSkillId: ALEX_INFERRED_SKILL_ID,
      action: 'confirm',
    });
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it('returns 404 for an unknown skill id', async () => {
    const result = await reviewInferredSkill({
      session: buildSession(MOCK_IDS.employees.alex, ['employee'], 'employee'),
      employeeSkillId: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000000',
      action: 'confirm',
    });
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it('allows the owning employee to review their own inferred skill', async () => {
    const result = await reviewInferredSkill({
      session: buildSession(MOCK_IDS.employees.alex, ['employee'], 'employee'),
      employeeSkillId: ALEX_INFERRED_SKILL_ID,
      action: 'confirm',
    });
    expect(result.ok).toBe(true);
  });

  it('allows the direct manager to review a report skill', async () => {
    const result = await reviewInferredSkill({
      session: buildSession(MOCK_IDS.employees.jordan, ['employee', 'manager'], 'manager'),
      employeeSkillId: ALEX_INFERRED_SKILL_ID,
      action: 'confirm',
    });
    expect(result.ok).toBe(true);
  });

  it('allows HR to review any in-organization skill', async () => {
    const result = await reviewInferredSkill({
      session: buildSession(MOCK_IDS.employees.sam, ['hr_admin'], 'hr'),
      employeeSkillId: ALEX_INFERRED_SKILL_ID,
      action: 'confirm',
    });
    expect(result.ok).toBe(true);
  });

  it('confirm rewrites the mock-store row so the review survives a reload', async () => {
    const result = await reviewInferredSkill({
      session: buildSession(MOCK_IDS.employees.alex, ['employee'], 'employee'),
      employeeSkillId: ALEX_INFERRED_SKILL_ID,
      action: 'confirm',
    });
    expect(result.ok).toBe(true);
    const row = getMockStore().employeeSkills.find((es) => es.id === ALEX_INFERRED_SKILL_ID);
    expect(row?.source).toBe('confirmed');
  });

  it('reject removes the mock-store row', async () => {
    const result = await reviewInferredSkill({
      session: buildSession(MOCK_IDS.employees.alex, ['employee'], 'employee'),
      employeeSkillId: ALEX_INFERRED_SKILL_ID,
      action: 'reject',
    });
    expect(result.ok).toBe(true);
    expect(
      getMockStore().employeeSkills.some((es) => es.id === ALEX_INFERRED_SKILL_ID),
    ).toBe(false);
  });

  it('rejects re-reviewing an already confirmed skill', async () => {
    await reviewInferredSkill({
      session: buildSession(MOCK_IDS.employees.alex, ['employee'], 'employee'),
      employeeSkillId: ALEX_INFERRED_SKILL_ID,
      action: 'confirm',
    });
    const result = await reviewInferredSkill({
      session: buildSession(MOCK_IDS.employees.alex, ['employee'], 'employee'),
      employeeSkillId: ALEX_INFERRED_SKILL_ID,
      action: 'confirm',
    });
    expect(result).toMatchObject({ ok: false, reason: 'Only inferred skills can be reviewed' });
  });
});
