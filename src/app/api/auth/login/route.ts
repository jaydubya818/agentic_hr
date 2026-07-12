import { NextResponse } from 'next/server';

import { ACTIVE_ROLE_COOKIE, SESSION_COOKIE } from '@/lib/auth/constants';
import { createMockSessionCookie } from '@/lib/auth/mock-session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { shouldUseMockData } from '@/services/data-provider/provider-config';

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const response = NextResponse.json({ redirectTo: '/employee/home' });

  if (!shouldUseMockData()) {
    const supabase = await createSupabaseServerClient();
    if (supabase && body.password) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });

      if (!error && data.user) {
        response.cookies.set(SESSION_COOKIE, JSON.stringify({ authenticated: true, userId: data.user.id }), {
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

      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
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
