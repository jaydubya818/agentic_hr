import { cookies } from 'next/headers';
import type { DemoRole, MockSession, UserRole } from './types';
import { DEMO_USER_ID } from '@/lib/mock/ids';
import { ACTIVE_ROLE_COOKIE, SESSION_COOKIE } from './constants';

const DEFAULT_SESSION: MockSession = {
  userId: DEMO_USER_ID,
  email: 'alex.chen@techforward.io',
  fullName: 'Alex Chen',
  organizationId: 'org-techforward',
  organizationName: 'TechForward Inc.',
  roles: ['employee', 'manager'],
  activeRole: 'employee',
  onboardingCompleted: true,
};

export function createMockSessionCookie(): string {
  return JSON.stringify({ authenticated: true, userId: DEFAULT_SESSION.userId });
}

export async function getMockSession(): Promise<MockSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const parsed = JSON.parse(sessionCookie.value) as { authenticated?: boolean };
    if (!parsed.authenticated) {
      return null;
    }
  } catch {
    return null;
  }

  const activeRoleCookie = cookieStore.get(ACTIVE_ROLE_COOKIE)?.value as DemoRole | undefined;
  const activeRole: DemoRole =
    activeRoleCookie === 'manager' || activeRoleCookie === 'hr' || activeRoleCookie === 'employee'
      ? activeRoleCookie
      : 'employee';

  return { ...DEFAULT_SESSION, activeRole };
}

export function demoRoleToUserRoles(role: DemoRole): UserRole[] {
  switch (role) {
    case 'employee':
      return ['employee'];
    case 'manager':
      return ['employee', 'manager'];
    case 'hr':
      return ['hr_admin'];
    default:
      return ['employee'];
  }
}

export function canAccessHrRoutes(role: DemoRole): boolean {
  return role === 'hr';
}

export function canAccessManagerRoutes(role: DemoRole): boolean {
  return role === 'manager' || role === 'hr';
}

export function canAccessEmployeeRoutes(): boolean {
  return true;
}
