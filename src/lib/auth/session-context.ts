import { eq } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import { employees, userRoles, users } from '@/lib/db/schema';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { shouldUseMockData } from '@/services/data-provider/provider-config';
import type { SessionContext } from '@/types/session';
import type { UserRole } from './types';
import { demoRoleToUserRoles, getMockSession } from './mock-session';

function resolveOrganizationId(orgId: string): string {
  return orgId === 'org-techforward' ? '11111111-1111-4111-8111-111111111111' : orgId;
}

async function getSupabaseBackedSessionContext(): Promise<SessionContext | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData.user;
  if (!authUser) return null;

  const db = getDb();
  if (!db) return null;

  const [userRow] = await db
    .select()
    .from(users)
    .where(eq(users.authUserId, authUser.id))
    .limit(1);

  let resolvedUser = userRow;

  if (!resolvedUser && authUser.email) {
    const [byEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, authUser.email.toLowerCase()))
      .limit(1);

    if (byEmail) {
      await db
        .update(users)
        .set({ authUserId: authUser.id, updatedAt: new Date() })
        .where(eq(users.id, byEmail.id));
      resolvedUser = { ...byEmail, authUserId: authUser.id };
    }
  }

  if (!resolvedUser) return null;

  const roleRows = await db
    .select({ role: userRoles.role })
    .from(userRoles)
    .where(eq(userRoles.userId, resolvedUser.id));

  const roles: UserRole[] =
    roleRows.length > 0
      ? roleRows.map((r) => r.role as UserRole)
      : demoRoleToUserRoles('employee');

  const [employeeRow] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.userId, resolvedUser.id))
    .limit(1);

  const mockSession = await getMockSession();
  const activeRole = mockSession?.activeRole ?? 'employee';

  return {
    userId: resolvedUser.id,
    organizationId: resolveOrganizationId(resolvedUser.organizationId),
    employeeId: employeeRow?.id,
    roles,
    activeRole,
  };
}

export async function getSessionContext(): Promise<SessionContext | null> {
  if (!shouldUseMockData()) {
    const supabaseSession = await getSupabaseBackedSessionContext();
    if (supabaseSession) return supabaseSession;
  }

  const session = await getMockSession();
  if (!session) return null;

  const { dataProvider } = await import('@/services/data-provider');
  const employee = dataProvider.getEmployeeByUserId(session.userId);

  return {
    userId: session.userId,
    organizationId: resolveOrganizationId(session.organizationId),
    employeeId: employee?.id,
    roles: demoRoleToUserRoles(session.activeRole),
    activeRole: session.activeRole,
  };
}
