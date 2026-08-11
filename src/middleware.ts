import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ACTIVE_ROLE_COOKIE, SESSION_COOKIE } from '@/lib/auth/constants';
import type { DemoRole } from '@/lib/auth/types';

const PUBLIC_PATHS = ['/login'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function getActiveRole(request: NextRequest): DemoRole {
  const role = request.cookies.get(ACTIVE_ROLE_COOKIE)?.value;
  if (role === 'manager' || role === 'hr') return role;
  return 'employee';
}

function isAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (!session) return false;
  try {
    const parsed = JSON.parse(session) as { authenticated?: boolean };
    return Boolean(parsed.authenticated);
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  const authenticated = isAuthenticated(request);

  if (!authenticated && !isPublicPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    // Carry the requested path so the login page can return the user there
    // after sign-in instead of always landing on the employee home.
    loginUrl.search = '';
    if (pathname !== '/') {
      loginUrl.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (authenticated && pathname === '/login') {
    const role = getActiveRole(request);
    const home =
      role === 'hr' ? '/hr/home' : role === 'manager' ? '/manager/home' : '/employee/home';
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = home;
    return NextResponse.redirect(homeUrl);
  }

  if (authenticated && pathname.startsWith('/hr')) {
    const role = getActiveRole(request);
    if (role !== 'hr') {
      const forbiddenUrl = request.nextUrl.clone();
      forbiddenUrl.pathname = '/forbidden';
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  if (authenticated && pathname.startsWith('/manager')) {
    const role = getActiveRole(request);
    if (role !== 'manager' && role !== 'hr') {
      const forbiddenUrl = request.nextUrl.clone();
      forbiddenUrl.pathname = '/forbidden';
      return NextResponse.redirect(forbiddenUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
