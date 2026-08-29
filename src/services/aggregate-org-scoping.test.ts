import { describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import {
  getCoachingPrompts,
  getDataReadinessScores,
  getHrDashboard,
  getManagerDashboard,
  getMobilityInsights,
  getMockStore,
  getSkills,
  getSkillsReadinessReport,
  getTalentDensityReport,
  getTeamCapabilityPlan,
  getTeamSkillsMatrix,
  getWorkforceReadinessReport,
} from '@/services/data-provider/mock-provider';

/**
 * A data-driven counterpart to the per-function org-scoping suites.
 *
 * Those tests each seed one foreign row and assert against one named read.
 * This one seeds a foreign row into *every* store table that carries an
 * `organizationId`, then serialises the output of every organization-scoped
 * aggregate and asserts the marker string appears in none of them. It is
 * deliberately shaped as a sweep rather than a case list: a read added later
 * that forgets its organization term is caught without anyone remembering to
 * write a matching test, which is how the ten reads fixed on 2026-08-28 stayed
 * invisible for seven nights.
 *
 * Only tables with their own `organizationId` are seeded. Child tables such as
 * `growthPlanItems`, `recommendationEvidence` and `roleSkills` are joined to
 * their parent by a uuid and carry no organization of their own, so a foreign
 * row there is not a tenant boundary crossing and seeding one would assert a
 * property the data model does not have.
 */
const FOREIGN_ORG = '99999999-9999-4999-8999-999999999999';
const MARK = 'FOREIGN_ORG_MARKER';
/**
 * Every seeded id shares this prefix, so an aggregate that surfaces a foreign
 * row as a bare identifier — with none of its free text — is caught too.
 */
const FOREIGN_ID_PREFIX = 'ffffffff-0000-4000-8000-';

/** Free-text fields that surface in a rendered aggregate. */
const DISPLAY_FIELDS = [
  'bio',
  'careerSummary',
  'description',
  'detail',
  'explanation',
  'fullName',
  'jobTitle',
  'label',
  'name',
  'rationale',
  'summary',
  'title',
];

let seq = 0;
function foreignId(): string {
  seq += 1;
  return `${FOREIGN_ID_PREFIX}${String(seq).padStart(12, '0')}`;
}

/**
 * Clone the first row of each organization-scoped table, restamp it onto a
 * foreign organization and mark its free text. The clone keeps the demo row's
 * shape, so this needs no per-table fixture and does not drift when a column
 * is added.
 */
function seedForeignOrganizationRows(): void {
  const store = getMockStore() as unknown as Record<string, unknown[]>;
  const foreignIds: Record<string, string> = {};

  for (const table of Object.keys(store)) {
    const rows = store[table];
    if (!Array.isArray(rows) || rows.length === 0) continue;
    const template = rows[0] as Record<string, unknown> | undefined;
    if (typeof template !== 'object' || template === null) continue;
    if (!('organizationId' in template)) continue;

    const clone: Record<string, unknown> = { ...template };
    clone.id = foreignId();
    clone.organizationId = FOREIGN_ORG;
    for (const field of DISPLAY_FIELDS) {
      if (typeof clone[field] === 'string') clone[field] = `${MARK} ${table}`;
    }
    if (typeof clone.email === 'string') clone.email = `marker@${table}.invalid`;
    foreignIds[table] = clone.id as string;
    // Seeded at the front: `loadSupabaseStore()` selects without an ORDER BY
    // and several of these reads end in a `.slice(0, n)`, so a foreign row
    // arriving first is a legitimate ordering rather than a contrived one.
    rows.unshift(clone);
  }

  // Make the foreign employee a plausible active member of its own
  // organization rather than a dangling row, so employee-walking aggregates
  // have something to find.
  const employee = (store.employees as Record<string, unknown>[])[0]!;
  employee.userId = foreignIds.users!;
  employee.teamId = foreignIds.teams!;
  employee.managerId = null;
  employee.isActive = true;
  employee.department = 'Engineering';
  (store.teams as Record<string, unknown>[])[0]!.managerEmployeeId = foreignIds.employees!;
  (store.recommendations as Record<string, unknown>[])[0]!.employeeId = foreignIds.employees!;
}

function serialize(value: unknown): string {
  return JSON.stringify(value ?? null);
}

describe('organization-scoped aggregates conceal foreign-tenant rows', () => {
  it('leaks no foreign row into any organization-scoped read', () => {
    seedForeignOrganizationRows();
    const store = getMockStore();
    const orgId = MOCK_IDS.organization;
    const managerTeam = store.teams.find(
      (t) => t.organizationId === orgId && t.managerEmployeeId != null,
    );
    expect(managerTeam, 'demo fixtures must contain a managed team').toBeDefined();
    const managerId = managerTeam!.managerEmployeeId!;

    const reads: Array<[string, () => unknown]> = [
      ['getHrDashboard', () => getHrDashboard(orgId)],
      ['getSkillsReadinessReport', () => getSkillsReadinessReport(orgId)],
      ['getMobilityInsights', () => getMobilityInsights(orgId)],
      ['getTalentDensityReport', () => getTalentDensityReport(orgId)],
      ['getWorkforceReadinessReport', () => getWorkforceReadinessReport(orgId)],
      ['getDataReadinessScores', () => getDataReadinessScores(orgId)],
      ['getSkills', () => getSkills(orgId)],
      ['getManagerDashboard', () => getManagerDashboard(managerId)],
      ['getTeamSkillsMatrix', () => getTeamSkillsMatrix(managerId)],
      ['getCoachingPrompts', () => getCoachingPrompts(managerId)],
      ['getTeamCapabilityPlan', () => getTeamCapabilityPlan(managerId)],
    ];

    const leaks = reads
      .filter(([, read]) => {
        const json = serialize(read());
        return json.includes(MARK) || json.includes(FOREIGN_ID_PREFIX);
      })
      .map(([name]) => name);

    expect(leaks).toEqual([]);
  });
});
