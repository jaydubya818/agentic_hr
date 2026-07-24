import { describe, expect, it } from 'vitest';

import { clampActiveRoleToHeldRoles } from './session-context';

describe('clampActiveRoleToHeldRoles', () => {
  it('keeps the hr view for hr_admin and org_admin', () => {
    expect(clampActiveRoleToHeldRoles('hr', ['hr_admin'])).toBe('hr');
    expect(clampActiveRoleToHeldRoles('hr', ['employee', 'org_admin'])).toBe('hr');
  });

  it('demotes the hr view for non-hr roles', () => {
    expect(clampActiveRoleToHeldRoles('hr', ['employee'])).toBe('employee');
    expect(clampActiveRoleToHeldRoles('hr', ['employee', 'manager'])).toBe('employee');
    expect(clampActiveRoleToHeldRoles('hr', [])).toBe('employee');
  });

  it('keeps the manager view for manager and hr roles', () => {
    expect(clampActiveRoleToHeldRoles('manager', ['employee', 'manager'])).toBe('manager');
    expect(clampActiveRoleToHeldRoles('manager', ['hr_admin'])).toBe('manager');
  });

  it('demotes the manager view for plain employees', () => {
    expect(clampActiveRoleToHeldRoles('manager', ['employee'])).toBe('employee');
    expect(clampActiveRoleToHeldRoles('manager', ['executive_readonly'])).toBe('employee');
  });

  it('always allows the employee view', () => {
    expect(clampActiveRoleToHeldRoles('employee', [])).toBe('employee');
    expect(clampActiveRoleToHeldRoles('employee', ['hr_admin'])).toBe('employee');
  });
});
