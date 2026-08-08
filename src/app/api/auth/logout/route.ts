import { NextResponse } from 'next/server';

import { ACTIVE_ROLE_COOKIE, SESSION_COOKIE } from '@/lib/auth/constants';
import { getSessionContext } from '@/lib/auth/session-context';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/services/audit-service';
import { shouldUseMockData } from '@/services/data-provider/provider-config';

export async function POST() {
  // Resolve the session before clearing it so the audit entry can attribute
  // the sign-out (SECURITY_AND_PRIVACY 8.1: logout is a logged auth action).
  const session = await getSessionContext();
  if (session) {
    logAuditEvent({
      session,
      action: 'auth.logout',
      entityType: 'user',
      entityId: session.userId,
    });
  }

  if (!shouldUseMockData()) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      try {
        // Revoke the Supabase auth session so its cookies cannot outlive ours.
        await supabase.auth.signOut();
      } catch {
        // Still clear our own cookies below; the Supabase session will expire.
      }
    }
  }

  const response = NextResponse.json({ redirectTo: '/login' });
  const expired = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
  response.cookies.set(SESSION_COOKIE, '', expired);
  response.cookies.set(ACTIVE_ROLE_COOKIE, '', expired);

  return response;
}
