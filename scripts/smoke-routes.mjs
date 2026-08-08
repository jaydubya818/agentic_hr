#!/usr/bin/env node
/**
 * HTTP smoke test for GrowthOS routes (requires running server).
 * Usage: npm run dev (separate terminal) then npm run smoke
 */
const BASE = process.env.SMOKE_BASE_URL ?? 'http://localhost:3000';
const SESSION_COOKIE = 'growthos-session';
const ROLE_COOKIE = 'growthos-active-role';
const SESSION_VALUE = encodeURIComponent(
  JSON.stringify({ authenticated: true, userId: '22222222-2222-4222-8222-222222222221' }),
);

const PUBLIC_ROUTES = ['/login'];

const ROUTES_BY_ROLE = {
  employee: [
    '/employee/home',
    '/employee/growth-profile',
    '/employee/career-paths',
    '/employee/growth-plan',
    '/employee/manager-conversation',
    '/settings',
    '/onboarding',
  ],
  manager: [
    '/manager/home',
    '/manager/team-skills',
    '/manager/coaching',
    '/manager/team-capability-plan',
    '/manager/decisions',
    '/manager/decisions/99999999-9999-4999-8999-999999999991',
    '/manager/team-scenarios',
    '/manager/team-scenarios/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '/manager/employee/33333333-3333-4333-8333-333333333331',
    '/settings',
  ],
  hr: [
    '/hr/home',
    '/hr/skills-readiness',
    '/hr/mobility-insights',
    '/hr/talent-density',
    '/hr/workforce-readiness',
    '/hr/audit',
    '/hr/decisions',
    '/hr/decisions/99999999-9999-4999-8999-999999999991',
    '/hr/work-design',
    '/hr/work-design/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '/hr/organizational-learning',
    '/settings',
  ],
};

async function fetchRoute(path, role) {
  const headers = {
    Cookie: `${SESSION_COOKIE}=${SESSION_VALUE}; ${ROLE_COOKIE}=${role}`,
  };
  const response = await fetch(`${BASE}${path}`, { redirect: 'manual', headers });
  return { path, status: response.status, ok: response.status >= 200 && response.status < 400 };
}

async function main() {
  const failures = [];

  for (const path of PUBLIC_ROUTES) {
    const response = await fetch(`${BASE}${path}`, { redirect: 'manual' });
    if (response.status < 200 || response.status >= 400) {
      failures.push(`${path} → ${response.status}`);
    } else {
      console.log(`OK  ${path} (${response.status})`);
    }
  }

  for (const [role, routes] of Object.entries(ROUTES_BY_ROLE)) {
    for (const path of routes) {
      const result = await fetchRoute(path, role);
      if (result.ok) {
        console.log(`OK  [${role}] ${path} (${result.status})`);
      } else {
        failures.push(`[${role}] ${path} → ${result.status}`);
      }
    }
  }

  {
    const headers = {
      Cookie: `${SESSION_COOKIE}=${SESSION_VALUE}; ${ROLE_COOKIE}=employee`,
    };
    const response = await fetch(`${BASE}/hr/home`, { redirect: 'manual', headers });
    const location = response.headers.get('location') ?? '';
    const redirectsToForbidden =
      (response.status === 307 || response.status === 308 || response.status === 302) &&
      location.includes('forbidden');
    if (redirectsToForbidden) {
      console.log(`OK  [employee] /hr/home → forbidden (${response.status})`);
    } else {
      failures.push(`[employee] /hr/home expected forbidden redirect, got ${response.status}`);
    }
  }

  {
    const headers = {
      Cookie: `${SESSION_COOKIE}=${SESSION_VALUE}; ${ROLE_COOKIE}=employee`,
    };
    const response = await fetch(`${BASE}/api/auth/logout`, { method: 'POST', headers });
    const setCookies = response.headers.getSetCookie();
    const clearsSession = setCookies.some(
      (cookie) => cookie.startsWith(`${SESSION_COOKIE}=`) && /max-age=0/i.test(cookie),
    );
    if (response.status === 200 && clearsSession) {
      console.log(`OK  POST /api/auth/logout clears ${SESSION_COOKIE} (200)`);
    } else {
      failures.push(
        `POST /api/auth/logout expected 200 clearing ${SESSION_COOKIE}, got ${response.status}`,
      );
    }
  }

  if (failures.length > 0) {
    console.error('\nSmoke test failures:');
    failures.forEach((f) => console.error(`  - ${f}`));
    process.exit(1);
  }

  console.log('\nAll smoke routes passed.');
}

main().catch((error) => {
  console.error('Smoke test error:', error.message);
  console.error(`Is the dev server running at ${BASE}?`);
  process.exit(1);
});
