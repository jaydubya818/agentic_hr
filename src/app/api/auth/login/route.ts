import { NextResponse } from 'next/server';

import { ACTIVE_ROLE_COOKIE, SESSION_COOKIE } from '@/lib/auth/constants';
import { createMockSessionCookie } from '@/lib/auth/mock-session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { shouldUseMockData } from '@/services/data-provider/provider-config';

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };

  if (!body.email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const response = NextResponse.json({ redirectTo: '/employee/home' });

  if (!shouldUseMockData()) {
    const supabase = await createSupabaseServerClient();
    if (supabase && body.password) {
      const { error } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });

      if (!error) {
        response.cookies.set(ACTIVE_ROLE_COOKIE, 'employee', {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });
        return response;
      }
    }
  }

  response.cookies.set(SESSION_COOKIE, createMockSessionCookie(), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  response.cookies.set(ACTIVE_ROLE_COOKIE, 'employee', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
