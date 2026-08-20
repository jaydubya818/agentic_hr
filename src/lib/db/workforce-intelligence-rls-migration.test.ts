import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Companion to `rls-migration.test.ts`, which pins the Phase 8 tables.
 *
 * The Workforce Intelligence tables arrived in a separate pair of migrations
 * and had no equivalent guard, so a table added to 0002 without a matching
 * policy in 0003 would have shipped readable across tenants with nothing
 * failing. The table list is therefore *derived* from 0002 rather than
 * hand-copied: adding a table there is what makes this test demand a policy.
 */
const TABLES_MIGRATION = join(
  process.cwd(),
  'drizzle/migrations/0002_workforce_intelligence.sql',
);
const RLS_MIGRATION = join(
  process.cwd(),
  'drizzle/migrations/0003_workforce_intelligence_rls.sql',
);

const tablesSql = readFileSync(TABLES_MIGRATION, 'utf8');
const rlsSql = readFileSync(RLS_MIGRATION, 'utf8');

const WI_TABLES = [...tablesSql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?"([a-z_]+)"/g)].map(
  (m) => m[1]!,
);

/** Write access is spelled either `_write` or `_manage_hr`, or split per verb. */
const WRITE_POLICY_SUFFIXES = ['write', 'manage_hr', 'insert', 'update', 'delete_hr'];

function policiesFor(table: string): string[] {
  const pattern = new RegExp(`CREATE POLICY (\\S+) ON public\\.${table}\\b`, 'g');
  return [...rlsSql.matchAll(pattern)].map((m) => m[1]!);
}

describe('workforce-intelligence RLS migration (0003)', () => {
  it('0002 declares the tables this test is meant to cover', () => {
    expect(WI_TABLES.length).toBeGreaterThan(0);
    expect(WI_TABLES).toContain('workforce_decisions');
  });

  it.each(WI_TABLES)('enables row level security on %s', (table) => {
    expect(rlsSql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
  });

  it.each(WI_TABLES)('gives %s a read policy and a write policy', (table) => {
    const policies = policiesFor(table);
    expect(policies, `no policies for ${table}`).not.toHaveLength(0);
    expect(
      policies.some((name) => name === `${table}_select`),
      `no select policy for ${table}`,
    ).toBe(true);
    expect(
      policies.some((name) =>
        WRITE_POLICY_SUFFIXES.some((suffix) => name === `${table}_${suffix}`),
      ),
      `no write policy for ${table}`,
    ).toBe(true);
  });

  it('scopes every policy to the caller organization', () => {
    // A policy that forgets tenant scoping is the one failure mode that turns
    // multi-tenant HR data into shared data.
    const blocks = rlsSql.split(/(?=CREATE POLICY )/).filter((b) => b.startsWith('CREATE POLICY'));
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      const name = /CREATE POLICY (\S+)/.exec(block)![1];
      const body = block.split(';')[0]!;
      expect(
        /is_same_organization|organization_id/.test(body),
        `policy ${name} is not organization-scoped`,
      ).toBe(true);
    }
  });

  it('never grants unconditional access', () => {
    expect(rlsSql).not.toMatch(/USING\s*\(\s*true\s*\)/i);
    expect(rlsSql).not.toMatch(/WITH\s+CHECK\s*\(\s*true\s*\)/i);
  });

  it('keeps decision deliberation off the employee read path', () => {
    // BACKEND_STRUCTURE 6.1: employees do not read decision deliberation.
    expect(rlsSql).toContain('user_can_read_workforce_decision');
    expect(rlsSql).not.toMatch(/workforce_decisions_select_employee/);
  });
});
