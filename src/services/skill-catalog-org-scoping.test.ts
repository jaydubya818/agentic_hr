import { afterEach, describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import {
  getMockStore,
  getSkills,
  getTeamSkillsMatrix,
} from '@/services/data-provider/mock-provider';

/**
 * `getSkills()` with no argument falls back to `getOrganization()`, which is
 * `organizations[0]`. In single-tenant mock mode that is the demo org and the
 * fallback is invisible; against a Supabase-backed store, which loads every
 * tenant's rows with an unordered `select`, it resolves to whichever tenant
 * sorted first — and the caller gets an empty skill catalogue.
 *
 * `getTeamSkillsMatrix` relied on that fallback, so `/manager/team-skills`
 * rendered every member's skill as "Unknown skill" for every organization but
 * the first. This pins the organization-scoped read instead.
 */
const FOREIGN_ORG = '99999999-9999-4999-8999-999999999999';
const TIMESTAMP = '2026-01-15T10:00:00.000Z';

function seedForeignOrganizationFirst(): void {
  getMockStore().organizations.unshift({
    id: FOREIGN_ORG,
    name: 'Foreign Org',
    slug: 'foreign-org',
    settings: {},
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  });
}

function removeForeignOrganization(): void {
  const store = getMockStore();
  store.organizations = store.organizations.filter((o) => o.id !== FOREIGN_ORG);
}

describe('skill catalogue reads name their organization', () => {
  afterEach(() => {
    removeForeignOrganization();
  });

  it('returns the requested organization’s catalogue regardless of store order', () => {
    seedForeignOrganizationFirst();
    expect(getSkills(MOCK_IDS.organization).length).toBeGreaterThan(0);
    expect(getSkills(FOREIGN_ORG)).toHaveLength(0);
  });

  it('resolves team skill names when another organization sorts first', () => {
    seedForeignOrganizationFirst();
    const matrix = getTeamSkillsMatrix(MOCK_IDS.employees.jordan);
    expect(matrix).not.toBeNull();
    const names = matrix!.members.flatMap((m) => m.skills.map((s) => s.skillName));
    expect(names.length).toBeGreaterThan(0);
    expect(names).not.toContain('Unknown skill');
  });
});
