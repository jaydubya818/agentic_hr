import { NextResponse } from 'next/server';

import { ACTIVE_ROLE_COOKIE, SESSION_COOKIE } from '@/lib/auth/constants';
import { checkLoginRateLimit, clearLoginRateLimit } from '@/lib/auth/login-rate-limit';
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

  // Guard the types before use: a non-string email would throw inside the
  // rate limiter and surface as a 500 instead of a 400.
  if (typeof body.email !== 'string' || body.email.trim() === '') {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  // Bound credential sizes up front: the email becomes an in-memory
  // rate-limit key (multi-kilobyte keys would bloat the tracking table) and
  // no real credential approaches these limits (RFC 5321 caps addresses at
  // 254 characters).
  if (body.email.length > 254 || (typeof body.password === 'string' && body.password.length > 512)) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
  }

  const response = NextResponse.json({ redirectTo: '/employee/home' });

  if (!shouldUseMockData()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Authentication is not configured' }, { status: 503 });
    }
    if (typeof body.password !== 'string' || body.password === '') {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const rate = checkLoginRateLimit(body.email);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again later.' },
        {
          status: 429,
          headers: rate.retryAfterMs
            ? { 'Retry-After': String(Math.ceil(rate.retryAfterMs / 1000)) }
            : undefined,
        },
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (!error && data.user) {
      clearLoginRateLimit(body.email);
      response.cookies.set(SESSION_COOKIE, JSON.stringify({ authenticated: true, userId: data.user.id }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      response.cookies.set(ACTIVE_ROLE_COOKIE, 'employee', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
      return response;
    }

    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  response.cookies.set(SESSION_COOKIE, createMockSessionCookie(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  response.cookies.set(ACTIVE_ROLE_COOKIE, 'employee', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
