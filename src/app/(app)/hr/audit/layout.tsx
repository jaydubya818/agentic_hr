import { redirect } from 'next/navigation';

import { canReadAuditLogs } from '@/lib/auth/rbac';
import { getSessionContext } from '@/lib/auth/session-context';

/**
 * Server-side gate for the audit trail, which is narrower than the rest of the
 * HR subtree.
 *
 * `(app)/hr/layout.tsx` admits `canReadOrganizationWorkforceData`, which
 * includes `executive_readonly` because the aggregate HR dashboards are that
 * role's documented surface. The audit trail is not one of them:
 * `canReadAuditLogs` is `hr_admin` and `org_admin` only
 * (BACKEND_STRUCTURE 6.1), and `/api/hr/audit-logs` and its CSV export both
 * enforce that. Without this gate the page itself was the one HR surface whose
 * route guard was weaker than its data guard, so the role could open
 * `/hr/audit` and get a rendered page whose fetch then failed with 403.
 *
 * No data leaked -- the API is the real boundary and it held -- but every
 * other role decision in this app is made at the page layer as well as the
 * API layer (docs/SECURITY_AND_PRIVACY.md, "deny on ambiguity"), and a
 * permission surfaced only as a failed fetch cannot be reasoned about.
 *
 * Written without JSX so it stays importable from a `*.test.ts` file: the
 * repo's `tsconfig.json` sets `jsx: "preserve"` and `vitest.config.ts`
 * collects only `src/**\/*.test.ts`, so a layout containing JSX cannot be
 * exercised by a test at all.
 */
export default async function HrAuditLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionContext();
  if (!session) {
    redirect('/login');
  }
  if (!canReadAuditLogs(session.roles)) {
    redirect('/forbidden');
  }
  return children;
}
