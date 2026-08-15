import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import { getMockStore } from '@/services/data-provider/mock-provider';
import type { EmployeeSkill } from '@/services/data-provider/types';
import { reviewInferredSkill } from '@/services/inferred-skill-service';
import type { SessionContext } from '@/types/session';

// Inferred skill owned by Alex in the mock fixtures.
const ALEX_INFERRED_SKILL_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02';

const persistWrites = vi.hoisted(() => ({ value: false }));
const failingDb = vi.hoisted(() => ({
  update: () => {
    throw new Error('connection terminated');
  },
  delete: () => {
    throw new Error('connection terminated');
  },
}));

vi.mock('@/services/data-provider/persistence-config', () => ({
  shouldPersistWrites: () => persistWrites.value,
}));

vi.mock('@/lib/db', () => ({
  getDb: () => failingDb,
  isDatabaseConfigured: () => true,
}));

const alexSession: SessionContext = {
  userId: MOCK_IDS.users.alex,
  organizationId: MOCK_IDS.organization,
  employeeId: MOCK_IDS.employees.alex,
  roles: ['employee'],
  activeRole: 'employee',
};

describe('inferred skill review persistence ordering', () => {
  let fixture: EmployeeSkill;

  beforeEach(() => {
    const store = getMockStore();
    const index = store.employeeSkills.findIndex((es) => es.id === ALEX_INFERRED_SKILL_ID);
    fixture ??= { ...store.employeeSkills[index]! };
    if (index >= 0) {
      store.employeeSkills[index] = { ...fixture };
    } else {
      store.employeeSkills.push({ ...fixture });
    }
    persistWrites.value = false;
  });

  afterEach(() => {
    persistWrites.value = false;
  });

  it('keeps a rejected row in the store when the database delete fails', async () => {
    persistWrites.value = true;

    await expect(
      reviewInferredSkill({
        session: alexSession,
        employeeSkillId: ALEX_INFERRED_SKILL_ID,
        action: 'reject',
      }),
    ).rejects.toThrow('connection terminated');

    const store = getMockStore();
    expect(store.employeeSkills.find((es) => es.id === ALEX_INFERRED_SKILL_ID)).toBeDefined();
  });

  it('leaves the row inferred when the database confirm write fails', async () => {
    persistWrites.value = true;

    await expect(
      reviewInferredSkill({
        session: alexSession,
        employeeSkillId: ALEX_INFERRED_SKILL_ID,
        action: 'confirm',
      }),
    ).rejects.toThrow('connection terminated');

    const store = getMockStore();
    expect(store.employeeSkills.find((es) => es.id === ALEX_INFERRED_SKILL_ID)?.source).toBe(
      'inferred',
    );
  });

  it('still mirrors the review into the store when persistence is off', async () => {
    const result = await reviewInferredSkill({
      session: alexSession,
      employeeSkillId: ALEX_INFERRED_SKILL_ID,
      action: 'confirm',
    });

    expect(result.ok).toBe(true);
    const store = getMockStore();
    expect(store.employeeSkills.find((es) => es.id === ALEX_INFERRED_SKILL_ID)?.source).toBe(
      'confirmed',
    );
  });
});
