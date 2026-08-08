import { NextResponse } from 'next/server';
import { ACTIVE_ROLE_COOKIE } from '@/lib/auth/constants';
import { userHasAnyRole } from '@/lib/auth/rbac';
import { getSessionContext } from '@/lib/auth/session-context';
import type { DemoRole } from '@/lib/auth/types';
import { logAuditEvent } from '@/services/audit-service';
import { shouldUseMockData } from '@/services/data-provider/provider-config';

export async function POST(request: Request) {
  let body: { role?: DemoRole };
  try {
    body = (await request.json()) as { role?: DemoRole };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const role = body.role;

  if (role !== 'employee' && role !== 'manager' && role !== 'hr') {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const session = await getSessionContext();

  // Role cookies are only issued to signed-in callers; an anonymous request
  // must not receive one even in mock mode (deny on ambiguity).
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!shouldUseMockData()) {
    // In live mode the role switcher may only select views the caller's
    // database-backed roles actually grant.
    const allowed =
      role === 'employee' ||
      (role === 'manager' && userHasAnyRole(session.roles, ['manager', 'hr_admin', 'org_admin'])) ||
      (role === 'hr' && userHasAnyRole(session.roles, ['hr_admin', 'org_admin']));
    if (!allowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Role switches are a documented audit event (BACKEND_STRUCTURE 11.1,
  // EVALS_AND_GOVERNANCE 14.1: role.switched).
  logAuditEvent({
    session,
    action: 'role.switched',
    entityType: 'user',
    entityId: session.userId,
    details: { fromRole: session.activeRole, toRole: role },
  });

  const response = NextResponse.json({ success: true, role });
  response.cookies.set(ACTIVE_ROLE_COOKIE, role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
