import { describe, expect, it } from 'vitest';

import type { z } from 'zod';
import { userRoleSchema } from '@/schemas/enums';
import {
  canManageUserRoles,
  canReadAuditLogs,
  canReadIndividualEmployeeData,
  canReadOrganizationWorkforceData,
  canReadTeamScopedEmployeeData,
  canWriteOrganizationWorkforceData,
  isEmployeeRole,
  isExecutiveReadonlyRole,
  isHrAdminRole,
  isManagerRole,
  isOrgAdminRole,
} from './rbac';

type UserRole = z.infer<typeof userRoleSchema>;

/**
 * Application-layer mirror of PILOT_PERSISTENCE_RELEASE RLS role matrix.
 * Postgres policies are validated separately in rls-migration.test.ts.
 */
describe('RBAC role matrix (PILOT_PERSISTENCE_RELEASE)', () => {
  it('employee: own context only — no audit, org workforce, or role management', () => {
    const roles: UserRole[] = ['employee'];
    expect(isEmployeeRole(roles)).toBe(true);
    expect(canReadAuditLogs(roles)).toBe(false);
    expect(canReadOrganizationWorkforceData(roles)).toBe(false);
    expect(canReadTeamScopedEmployeeData(roles)).toBe(false);
    expect(canReadIndividualEmployeeData(roles)).toBe(false);
    expect(canManageUserRoles(roles)).toBe(false);
  });

  it('manager: team-scoped reads, no audit or org-wide workforce', () => {
    const roles: UserRole[] = ['manager'];
    expect(isManagerRole(roles)).toBe(true);
    expect(canReadTeamScopedEmployeeData(roles)).toBe(true);
    expect(canReadAuditLogs(roles)).toBe(false);
    expect(canReadOrganizationWorkforceData(roles)).toBe(false);
    expect(canManageUserRoles(roles)).toBe(false);
  });

  it('hr_admin: org workforce + audit, no org_admin role management', () => {
    const roles: UserRole[] = ['hr_admin'];
    expect(isHrAdminRole(roles)).toBe(true);
    expect(canReadAuditLogs(roles)).toBe(true);
    expect(canReadOrganizationWorkforceData(roles)).toBe(true);
    expect(canReadIndividualEmployeeData(roles)).toBe(true);
    expect(canManageUserRoles(roles)).toBe(false);
    expect(canWriteOrganizationWorkforceData(roles)).toBe(true);
  });

  it('org_admin: audit + workforce + role management', () => {
    const roles: UserRole[] = ['org_admin'];
    expect(isOrgAdminRole(roles)).toBe(true);
    expect(canReadAuditLogs(roles)).toBe(true);
    expect(canReadOrganizationWorkforceData(roles)).toBe(true);
    expect(canReadIndividualEmployeeData(roles)).toBe(true);
    expect(canManageUserRoles(roles)).toBe(true);
    expect(canWriteOrganizationWorkforceData(roles)).toBe(true);
  });

  it('executive_readonly: aggregate workforce read-only, no audit or PII management', () => {
    const roles: UserRole[] = ['executive_readonly'];
    expect(isExecutiveReadonlyRole(roles)).toBe(true);
    expect(canReadOrganizationWorkforceData(roles)).toBe(true);
    expect(canReadAuditLogs(roles)).toBe(false);
    expect(canManageUserRoles(roles)).toBe(false);
    // SECURITY_AND_PRIVACY 6.2 Example 6: an executive asking for one named
    // employee's record is a 403, even though the aggregate read is allowed.
    expect(canReadIndividualEmployeeData(roles)).toBe(false);
    expect(canWriteOrganizationWorkforceData(roles)).toBe(false);
  });
});
