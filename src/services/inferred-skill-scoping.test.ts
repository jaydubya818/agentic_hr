import { describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
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
});
