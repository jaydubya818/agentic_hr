import { describe, expect, it } from 'vitest';

import { canAccessHrRoutes, canAccessManagerRoutes, demoRoleToUserRoles } from './mock-session';
import { getNavForRole, getRoleAreaLabel } from './navigation';
import { clampActiveRoleToHeldRoles } from './session-context';
import {
  canReadAuditLogs,
  canReadOrganizationWorkforceData,
  canReadTeamScopedEmployeeData,
  isManagerRole,
} from './rbac';
import type { DemoRole } from './types';

/**
 * `DemoRole` (three view names, carried in an unsigned cookie) and `UserRole`
 * (five permission roles) are different vocabularies, and `demoRoleToUserRoles`
 * is the only translation between them. In mock mode `getSessionContext` uses
 * it directly to build `SessionContext.roles`, so it decides what every RBAC
 * predicate in the application answers -- and it had no test.
 */

const DEMO_ROLES: DemoRole[] = ['employee', 'manager', 'hr'];

describe('demoRoleToUserRoles', () => {
  it('grants a plain employee exactly the employee role', () => {
    expect(demoRoleToUserRoles('employee')).toEqual(['employee']);
  });

  it('grants the manager view both employee and manager, so managers keep their own record', () => {
    expect(demoRoleToUserRoles('manager')).toEqual(['employee', 'manager']);
  });

  // Asymmetry worth knowing about: the hr view is *not* additive. It drops the
  // employee role, so an hr_admin session has no employee-scoped grants at all.
  it('grants the hr view hr_admin alone, without the employee role', () => {
    expect(demoRoleToUserRoles('hr')).toEqual(['hr_admin']);
    expect(demoRoleToUserRoles('hr')).not.toContain('employee');
  });

  // The two most privileged roles have no demo view. Every `org_admin` and
  // `executive_readonly` code path is therefore unreachable from a mock-mode
  // session and is exercised only by a live Supabase-backed one.
  it('never mints org_admin or executive_readonly', () => {
    for (const role of DEMO_ROLES) {
      expect(demoRoleToUserRoles(role)).not.toContain('org_admin');
      expect(demoRoleToUserRoles(role)).not.toContain('executive_readonly');
    }
  });
});

describe('the nav offered to a demo role matches the permissions that role is granted', () => {
  it('shows the audit log only in the view whose roles may read audit logs', () => {
    for (const role of DEMO_ROLES) {
      const showsAudit = getNavForRole(role).some((item) => item.href === '/hr/audit');
      expect(showsAudit).toBe(canReadAuditLogs(demoRoleToUserRoles(role)));
    }
  });

  it('shows /hr/* routes only to a view granted org-wide workforce data', () => {
    for (const role of DEMO_ROLES) {
      const showsHr = getNavForRole(role).some((item) => item.href.startsWith('/hr/'));
      expect(showsHr).toBe(canReadOrganizationWorkforceData(demoRoleToUserRoles(role)));
    }
  });

  it('shows /manager/* routes only to a view granted team-scoped employee data', () => {
    for (const role of DEMO_ROLES) {
      const showsManager = getNavForRole(role).some((item) => item.href.startsWith('/manager/'));
      const roles = demoRoleToUserRoles(role);
      // hr_admin satisfies `canReadTeamScopedEmployeeData` but is deliberately
      // given the HR nav instead of the manager nav, so the implication only
      // runs one way: a manager link implies the grant, not the reverse.
      if (showsManager) expect(canReadTeamScopedEmployeeData(roles)).toBe(true);
      if (showsManager) expect(isManagerRole(roles)).toBe(true);
    }
  });

  it('gives every view the settings footer and no view a duplicate link', () => {
    for (const role of DEMO_ROLES) {
      const nav = getNavForRole(role);
      const hrefs = nav.map((item) => item.href);
      expect(hrefs).toContain('/settings');
      expect(new Set(hrefs).size).toBe(hrefs.length);
    }
  });

  it('makes the manager view a strict superset of the employee view', () => {
    const employee = getNavForRole('employee').map((i) => i.href);
    const manager = getNavForRole('manager').map((i) => i.href);
    for (const href of employee) expect(manager).toContain(href);
    expect(manager.length).toBeGreaterThan(employee.length);
  });

  // The hr view is not a superset: it drops the employee nav entirely, which
  // is the nav-level counterpart of `demoRoleToUserRoles('hr')` dropping the
  // employee role. An hr_admin has no route to their own growth profile.
  it('does not offer the hr view any employee-scoped route', () => {
    const hr = getNavForRole('hr').map((i) => i.href);
    expect(hr.some((href) => href.startsWith('/employee/'))).toBe(false);
  });

  it('labels each view distinctly', () => {
    const labels = DEMO_ROLES.map(getRoleAreaLabel);
    expect(labels).toEqual(['Employee', 'Manager', 'HR']);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe('the route helpers agree with the nav they are paired with', () => {
  it('permits the hr routes to the hr view only', () => {
    expect(DEMO_ROLES.filter(canAccessHrRoutes)).toEqual(['hr']);
  });

  // `canAccessManagerRoutes` admits the hr view even though the HR nav links
  // to no /manager route, so HR reaches those pages by direct navigation only.
  it('permits the manager routes to both the manager and hr views', () => {
    expect(DEMO_ROLES.filter(canAccessManagerRoutes)).toEqual(['manager', 'hr']);
  });
});

describe('clamping the unsigned cookie is consistent with the demo translation', () => {
  it('lets each demo view survive the clamp against the roles it maps to', () => {
    for (const role of DEMO_ROLES) {
      expect(clampActiveRoleToHeldRoles(role, demoRoleToUserRoles(role))).toBe(role);
    }
  });

  it('demotes an executive_readonly session to the employee view for every request', () => {
    // executive_readonly holds neither hr_admin/org_admin nor manager, so the
    // clamp gives it the employee view -- the aggregate HR dashboards the role
    // exists for are not reachable from its own navigation.
    for (const role of DEMO_ROLES) {
      expect(clampActiveRoleToHeldRoles(role, ['executive_readonly'])).toBe('employee');
    }
  });
});
