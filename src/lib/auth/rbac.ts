import type { z } from 'zod';

import { userRoleSchema } from '@/schemas/enums';

type UserRole = z.infer<typeof userRoleSchema>;

const ROLE_RANK: Record<UserRole, number> = {
  employee: 1,
  manager: 2,
  hr_admin: 3,
  org_admin: 4,
  executive_readonly: 2,
};

export function userHasRole(roles: UserRole[], role: UserRole): boolean {
  return roles.includes(role);
}

export function userHasAnyRole(roles: UserRole[], allowed: UserRole[]): boolean {
  return allowed.some((role) => roles.includes(role));
}

export function isEmployeeRole(roles: UserRole[]): boolean {
  return roles.includes('employee');
}

export function isManagerRole(roles: UserRole[]): boolean {
  return roles.includes('manager');
}

export function isHrAdminRole(roles: UserRole[]): boolean {
  return roles.includes('hr_admin');
}

export function isOrgAdminRole(roles: UserRole[]): boolean {
  return roles.includes('org_admin');
}

export function isExecutiveReadonlyRole(roles: UserRole[]): boolean {
  return roles.includes('executive_readonly');
}

export function canReadAuditLogs(roles: UserRole[]): boolean {
  return userHasAnyRole(roles, ['hr_admin', 'org_admin']);
}

export function canManageUserRoles(roles: UserRole[]): boolean {
  return roles.includes('org_admin');
}

export function canReadTeamScopedEmployeeData(roles: UserRole[]): boolean {
  return userHasAnyRole(roles, ['manager', 'hr_admin', 'org_admin']);
}

export function canReadOrganizationWorkforceData(roles: UserRole[]): boolean {
  return userHasAnyRole(roles, ['hr_admin', 'org_admin', 'executive_readonly']);
}

/**
 * Org-wide read of an *identified individual's* record, as opposed to the
 * aggregates covered by `canReadOrganizationWorkforceData`.
 *
 * `executive_readonly` is deliberately excluded: SECURITY_AND_PRIVACY.md 6.1
 * grants that role "aggregated dashboards only; no individual PII", and 6.2
 * Example 6 requires a 403 when an executive requests one employee's summary.
 */
export function canReadIndividualEmployeeData(roles: UserRole[]): boolean {
  return userHasAnyRole(roles, ['hr_admin', 'org_admin']);
}

export function highestRole(roles: UserRole[]): UserRole | null {
  if (roles.length === 0) return null;
  return roles.reduce((best, role) => (ROLE_RANK[role] > ROLE_RANK[best] ? role : best), roles[0]!);
}
