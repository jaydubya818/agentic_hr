import { NextResponse } from 'next/server';
import { ACTIVE_ROLE_COOKIE } from '@/lib/auth/constants';
import type { DemoRole } from '@/lib/auth/types';

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

  const response = NextResponse.json({ success: true, role });
  response.cookies.set(ACTIVE_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
