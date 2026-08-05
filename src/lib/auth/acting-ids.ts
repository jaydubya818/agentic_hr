import { DEMO_EMPLOYEE_ID, DEMO_MANAGER_EMPLOYEE_ID, DEMO_USER_ID } from '@/lib/mock/ids';
import { shouldUseMockData } from '@/services/data-provider/provider-config';
import type { SessionContext } from '@/types/session';

/**
 * Demo-fixture identities are a mock-data convenience: the demo login is a
 * single user (Alex) who role-switches into the demo manager's (Jordan's)
 * view. Live mode must ground every page on the session's own records and
 * never fall back to demo fixtures (docs/SECURITY_AND_PRIVACY.md, "deny on
 * ambiguity").
 */

export function resolveActingUserId(session: SessionContext | null): string | null {
  if (shouldUseMockData()) return DEMO_USER_ID;
  return session?.userId ?? null;
}

export function resolveActingEmployeeId(session: SessionContext | null): string | null {
  if (shouldUseMockData()) return DEMO_EMPLOYEE_ID;
  return session?.employeeId ?? null;
}

/** Manager views render the demo manager's team in mock mode. */
export function resolveActingManagerEmployeeId(session: SessionContext | null): string | null {
  if (shouldUseMockData()) return DEMO_MANAGER_EMPLOYEE_ID;
  return session?.employeeId ?? null;
}
