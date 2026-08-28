import { afterEach, describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import {
  getCareerPaths,
  getManagerDashboard,
  getMockStore,
} from '@/services/data-provider/mock-provider';
import { invokeAgent } from '@/services/agent-service';

/**
 * The mock/Supabase store holds every tenant's rows at once --
 * `loadSupabaseStore()` issues one unfiltered `select` per table and caches the
 * result in a module-level singleton. A read whose predicate is a *status*
 * rather than an *id* (`isActive`, `status === 'open'`, `department === ...`, a
 * skill-id set membership) therefore collects other organizations' rows unless
 * it also names an organization.
 *
 * These tests seed one foreign-organization row into each of the three catalog
 * tables and pin that none of them reaches a demo-organization caller. Every
 * case is red against the pre-fix source.
 */
const FOREIGN_ORG = '99999999-9999-4999-8999-999999999999';
const TIMESTAMP = '2026-01-15T10:00:00.000Z';
const DEMO_SKILL_ID = '40000000-0000-4000-8000-000000000003';

const FOREIGN_ROLE_TITLE = 'Foreign Org Principal Architect';
const FOREIGN_OPPORTUNITY_TITLE = 'Foreign Org Confidential Opening';
const FOREIGN_RESOURCE_TITLE = 'Foreign Org Internal Playbook';

/**
 * Seeded at the *front* of each array on purpose: every leaking read ends in a
 * `.slice(0, n)`, and `loadSupabaseStore()` selects without an `ORDER BY`, so
 * a foreign row arriving first is a legitimate ordering, not a contrived one.
 */
function seedForeignCatalogRows(): void {
  const store = getMockStore();

  store.roles.unshift({
    id: 'ffffffff-0000-4000-8000-000000000001',
    organizationId: FOREIGN_ORG,
    title: FOREIGN_ROLE_TITLE,
    level: 'IC5',
    department: 'Engineering',
    description: null,
    isActive: true,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  });

  store.opportunities.unshift({
    id: 'ffffffff-0000-4000-8000-000000000002',
    organizationId: FOREIGN_ORG,
    title: FOREIGN_OPPORTUNITY_TITLE,
    description: FOREIGN_OPPORTUNITY_TITLE,
    roleId: null,
    department: 'Engineering',
    requiredSkillIds: [],
    status: 'open',
    postedAt: TIMESTAMP,
    createdAt: TIMESTAMP,
  });

  store.learningResources.unshift({
    id: 'ffffffff-0000-4000-8000-000000000003',
    organizationId: FOREIGN_ORG,
    title: FOREIGN_RESOURCE_TITLE,
    description: FOREIGN_RESOURCE_TITLE,
    url: null,
    provider: 'Other Co',
    durationHours: 1,
    skillIds: [DEMO_SKILL_ID],
    format: 'course',
    isActive: true,
    createdAt: TIMESTAMP,
  });
}

function removeForeignCatalogRows(): void {
  const store = getMockStore();
  store.roles = store.roles.filter((r) => r.organizationId !== FOREIGN_ORG);
  store.opportunities = store.opportunities.filter((o) => o.organizationId !== FOREIGN_ORG);
  store.learningResources = store.learningResources.filter(
    (l) => l.organizationId !== FOREIGN_ORG,
  );
}

const DEMO_SESSION = {
  userId: MOCK_IDS.users.alex,
  organizationId: MOCK_IDS.organization,
  employeeId: MOCK_IDS.employees.alex,
  roles: ['employee'] as const,
  activeRole: 'employee' as const,
};

describe('cross-organization scoping of the role, opportunity and learning catalogs', () => {
  afterEach(() => {
    removeForeignCatalogRows();
  });

  it('never proposes another organization’s role as a career path', () => {
    seedForeignCatalogRows();
    const titles = getCareerPaths(MOCK_IDS.employees.alex).map((p) => p.role.title);
    expect(titles).not.toContain(FOREIGN_ROLE_TITLE);
    expect(titles.length).toBeGreaterThan(0);
  });

  it('never suggests another organization’s opportunity on a career path', () => {
    seedForeignCatalogRows();
    const suggested = getCareerPaths(MOCK_IDS.employees.alex).flatMap((p) =>
      p.suggestedOpportunities.map((o) => o.title),
    );
    expect(suggested).not.toContain(FOREIGN_OPPORTUNITY_TITLE);
  });

  it('never suggests another organization’s learning resource on a career path', () => {
    seedForeignCatalogRows();
    const suggested = getCareerPaths(MOCK_IDS.employees.alex).flatMap((p) =>
      p.suggestedLearning.map((l) => l.title),
    );
    expect(suggested).not.toContain(FOREIGN_RESOURCE_TITLE);
  });

  it('keeps another organization’s opening out of the manager dashboard', () => {
    seedForeignCatalogRows();
    const dashboard = getManagerDashboard(MOCK_IDS.employees.jordan);
    expect(dashboard).not.toBeNull();
    const titles = dashboard!.stretchOpportunities.map((o) => o.title);
    expect(titles).not.toContain(FOREIGN_OPPORTUNITY_TITLE);
    expect(titles.length).toBeGreaterThan(0);
  });

  it('keeps another organization’s opening out of internal-mobility recommendations', async () => {
    seedForeignCatalogRows();
    const result = await invokeAgent('internal-mobility', {
      session: { ...DEMO_SESSION, roles: [...DEMO_SESSION.roles] },
      message: 'What internal moves fit me?',
    });
    const titles = result.recommendations.map((r) => r.title);
    expect(titles).not.toContain(FOREIGN_OPPORTUNITY_TITLE);
    expect(titles.length).toBeGreaterThan(0);
  });

  it('keeps another organization’s catalog out of dynamic-learning recommendations', async () => {
    seedForeignCatalogRows();
    const result = await invokeAgent('dynamic-learning', {
      session: { ...DEMO_SESSION, roles: [...DEMO_SESSION.roles] },
      message: 'What should I learn next?',
    });
    const titles = result.recommendations.map((r) => r.title);
    expect(titles).not.toContain(FOREIGN_RESOURCE_TITLE);
  });
});
