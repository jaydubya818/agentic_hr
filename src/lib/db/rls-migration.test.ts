import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const MIGRATION_PATH = join(process.cwd(), 'drizzle/migrations/0001_rls_rbac.sql');

const TENANT_TABLES = [
  'organizations',
  'users',
  'employees',
  'employee_profiles',
  'teams',
  'managers',
  'skills',
  'employee_skills',
  'roles',
  'role_skills',
  'career_goals',
  'learning_resources',
  'opportunities',
  'growth_plans',
  'growth_plan_items',
  'recommendations',
  'recommendation_evidence',
  'agent_conversations',
  'agent_messages',
  'data_readiness_scores',
  'audit_logs',
  'permissions',
  'user_roles',
] as const;

const HELPER_FUNCTIONS = [
  'current_app_user_id',
  'current_user_organization_id',
  'current_user_employee_id',
  'current_user_has_role',
  'current_user_is_org_admin',
  'current_user_is_hr_admin',
  'current_user_is_manager',
  'current_user_is_employee',
  'manager_can_read_employee',
  'user_can_read_employee_data',
] as const;

describe('RLS migration (0001_rls_rbac.sql)', () => {
  const sql = readFileSync(MIGRATION_PATH, 'utf8');

  it('migration file exists and is non-empty', () => {
    expect(sql.length).toBeGreaterThan(1000);
  });

  it('maps auth through users.auth_user_id', () => {
    expect(sql).toContain('auth.uid()');
    expect(sql).toContain('auth_user_id');
  });

  it('defines required helper functions', () => {
    for (const fn of HELPER_FUNCTIONS) {
      expect(sql, `missing function ${fn}`).toMatch(
        new RegExp(`CREATE OR REPLACE FUNCTION public\\.${fn}\\(`),
      );
    }
  });

  it('enables RLS on all tenant tables', () => {
    for (const table of TENANT_TABLES) {
      expect(sql, `RLS not enabled on ${table}`).toContain(
        `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`,
      );
    }
  });

  it('includes executive_readonly aggregate access without employee PII policies', () => {
    expect(sql).toContain('current_user_is_executive_readonly');
    expect(sql).toContain('data_readiness_scores_select_analytics');
    expect(sql).not.toMatch(/executive.*employees_select/i);
  });

  it('restricts audit_logs to hr/org_admin', () => {
    expect(sql).toContain('audit_logs_select_hr');
    expect(sql).not.toContain('audit_logs_select_employee');
  });

  it('grants helper execution to authenticated role', () => {
    expect(sql).toContain('GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated');
  });
});
