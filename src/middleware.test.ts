import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { ACTIVE_ROLE_COOKIE, SESSION_COOKIE } from '@/lib/auth/constants';
import { middleware } from './middleware';

function request(pathname: string, cookies: { session?: string; role?: string } = {}): NextRequest {
  const req = new NextRequest(new URL(pathname, 'https://growthos.test'));
  if (cookies.session !== undefined) req.cookies.set(SESSION_COOKIE, cookies.session);
  if (cookies.role !== undefined) req.cookies.set(ACTIVE_ROLE_COOKIE, cookies.role);
  return req;
}

const SIGNED_IN = JSON.stringify({ authenticated: true, userId: 'user-1' });

function destination(response: Response): string | null {
  const location = response.headers.get('location');
  return location ? new URL(location).pathname : null;
}

describe('route guard middleware', () => {
  it('sends an anonymous request to /login and remembers where it was going', () => {
    const response = middleware(request('/employee/growth-plan'));
    const location = response.headers.get('location');
    expect(location).not.toBeNull();
    const url = new URL(location!);
    expect(url.pathname).toBe('/login');
    expect(url.searchParams.get('next')).toBe('/employee/growth-plan');
  });

  it('treats an unparseable or unauthenticated session cookie as signed out', () => {
    expect(destination(middleware(request('/employee/home', { session: 'not-json' })))).toBe(
      '/login',
    );
    expect(
      destination(
        middleware(
          request('/employee/home', { session: JSON.stringify({ authenticated: false }) }),
        ),
      ),
    ).toBe('/login');
  });

  it('sends an employee to /forbidden on the HR and manager subtrees', () => {
    expect(
      destination(middleware(request('/hr/home', { session: SIGNED_IN, role: 'employee' }))),
    ).toBe('/forbidden');
    expect(
      destination(middleware(request('/manager/home', { session: SIGNED_IN, role: 'employee' }))),
    ).toBe('/forbidden');
  });

  it('treats an unrecognized role cookie as employee rather than trusting it', () => {
    // The cookie is client-controlled and unsigned, so anything that is not
    // one of the known elevated roles must fall back to the lowest one.
    expect(
      destination(middleware(request('/hr/home', { session: SIGNED_IN, role: 'org_admin' }))),
    ).toBe('/forbidden');
  });

  it('lets HR into both subtrees and a manager into /manager only', () => {
    expect(
      middleware(request('/hr/home', { session: SIGNED_IN, role: 'hr' })).headers.get('location'),
    ).toBeNull();
    expect(
      middleware(request('/manager/home', { session: SIGNED_IN, role: 'hr' })).headers.get(
        'location',
      ),
    ).toBeNull();
    expect(
      middleware(request('/manager/home', { session: SIGNED_IN, role: 'manager' })).headers.get(
        'location',
      ),
    ).toBeNull();
    expect(
      destination(middleware(request('/hr/home', { session: SIGNED_IN, role: 'manager' }))),
    ).toBe('/forbidden');
  });

  it('bounces a signed-in visitor off /login to their role home', () => {
    expect(destination(middleware(request('/login', { session: SIGNED_IN, role: 'hr' })))).toBe(
      '/hr/home',
    );
    expect(
      destination(middleware(request('/login', { session: SIGNED_IN, role: 'manager' }))),
    ).toBe('/manager/home');
    expect(destination(middleware(request('/login', { session: SIGNED_IN })))).toBe(
      '/employee/home',
    );
  });

  it('leaves API routes to their own session checks', () => {
    expect(
      middleware(request('/api/agents/employee-growth/invoke')).headers.get('location'),
    ).toBeNull();
  });
});
