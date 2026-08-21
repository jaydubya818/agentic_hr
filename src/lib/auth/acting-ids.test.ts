import { afterEach, describe, expect, it } from 'vitest';

import { DEMO_EMPLOYEE_ID, DEMO_MANAGER_EMPLOYEE_ID, DEMO_USER_ID } from '@/lib/mock/ids';
import type { SessionContext } from '@/types/session';
import {
  resolveActingEmployeeId,
  resolveActingManagerEmployeeId,
  resolveActingUserId,
} from './acting-ids';

/**
 * These three resolvers sit between the session cookie and every manager and
 * employee page. The demo-fixture branch is a mock-data convenience; if it
 * ever leaked into live mode, a signed-in user would be grounded on the demo
 * organization's employee instead of their own record. Pin both branches.
 */

const LIVE_SESSION: SessionContext = {
  userId: 'live-user-id',
  organizationId: 'live-org-id',
  employeeId: 'live-employee-id',
  roles: ['employee'],
  activeRole: 'employee',
};

function useMockMode(): void {
  process.env.USE_MOCK_DATA = 'true';
}

function useLiveMode(): void {
  process.env.USE_MOCK_DATA = 'false';
  process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/growthos';
}

describe('acting id resolution', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('grounds every resolver on the demo fixtures in mock mode', () => {
    useMockMode();
    expect(resolveActingUserId(null)).toBe(DEMO_USER_ID);
    expect(resolveActingEmployeeId(null)).toBe(DEMO_EMPLOYEE_ID);
    expect(resolveActingManagerEmployeeId(null)).toBe(DEMO_MANAGER_EMPLOYEE_ID);
  });

  it('ignores the session in mock mode and still returns the demo fixtures', () => {
    useMockMode();
    expect(resolveActingUserId(LIVE_SESSION)).toBe(DEMO_USER_ID);
    expect(resolveActingEmployeeId(LIVE_SESSION)).toBe(DEMO_EMPLOYEE_ID);
    expect(resolveActingManagerEmployeeId(LIVE_SESSION)).toBe(DEMO_MANAGER_EMPLOYEE_ID);
  });

  it('grounds every resolver on the session in live mode, never the demo fixtures', () => {
    useLiveMode();
    expect(resolveActingUserId(LIVE_SESSION)).toBe('live-user-id');
    expect(resolveActingEmployeeId(LIVE_SESSION)).toBe('live-employee-id');
    expect(resolveActingManagerEmployeeId(LIVE_SESSION)).toBe('live-employee-id');
  });

  it('returns null rather than a demo fixture when live mode has no session', () => {
    useLiveMode();
    expect(resolveActingUserId(null)).toBeNull();
    expect(resolveActingEmployeeId(null)).toBeNull();
    expect(resolveActingManagerEmployeeId(null)).toBeNull();
  });

  it('returns null rather than a demo fixture when the session has no employee row', () => {
    useLiveMode();
    const withoutEmployee: SessionContext = { ...LIVE_SESSION, employeeId: undefined };
    expect(resolveActingEmployeeId(withoutEmployee)).toBeNull();
    expect(resolveActingManagerEmployeeId(withoutEmployee)).toBeNull();
  });
});
