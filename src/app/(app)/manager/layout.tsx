import { redirect } from 'next/navigation';

import { canReadTeamScopedEmployeeData } from '@/lib/auth/rbac';
import { getSessionContext } from '@/lib/auth/session-context';

/**
 * Server-side role gate for the manager subtree. The middleware guard reads
 * the unsigned active-role cookie, which a client can set without going
 * through the demo-role endpoint's grant check; page access must also be
 * decided by the session's roles — database-backed in live mode
 * (docs/SECURITY_AND_PRIVACY.md, "deny on ambiguity").
 */
export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionContext();
  if (!session) {
    redirect('/login');
  }
  if (!canReadTeamScopedEmployeeData(session.roles)) {
    redirect('/forbidden');
  }
  return <>{children}</>;
}
