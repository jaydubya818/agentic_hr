export const USER_ROLES = [
  'employee',
  'manager',
  'hr_admin',
  'org_admin',
  'executive_readonly',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type DemoRole = 'employee' | 'manager' | 'hr';

export interface MockSession {
  userId: string;
  email: string;
  fullName: string;
  organizationId: string;
  organizationName: string;
  roles: UserRole[];
  activeRole: DemoRole;
  onboardingCompleted: boolean;
}
