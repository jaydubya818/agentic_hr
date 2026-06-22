import { describe, expect, it } from 'vitest';

import {
  canManageUserRoles,
  canReadAuditLogs,
  canReadOrganizationWorkforceData,
  canReadTeamScopedEmployeeData,
  isManagerRole,
  userHasRole,
} from './rbac';

describe('rbac helpers', () => {
  it('detects manager and HR admin capabilities', () => {
    expect(isManagerRole(['employee', 'manager'])).toBe(true);
    expect(canReadTeamScopedEmployeeData(['manager'])).toBe(true);
    expect(canReadAuditLogs(['manager'])).toBe(false);
    expect(canReadAuditLogs(['hr_admin'])).toBe(true);
    expect(canReadOrganizationWorkforceData(['executive_readonly'])).toBe(true);
    expect(canManageUserRoles(['org_admin'])).toBe(true);
    expect(canManageUserRoles(['hr_admin'])).toBe(false);
  });

  it('checks explicit role membership', () => {
    expect(userHasRole(['employee'], 'employee')).toBe(true);
    expect(userHasRole(['employee'], 'manager')).toBe(false);
  });
});
