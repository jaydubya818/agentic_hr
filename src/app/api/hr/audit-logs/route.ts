import { NextResponse } from 'next/server';

import { canReadAuditLogs } from '@/lib/auth/rbac';
import { getSessionContext } from '@/lib/auth/session-context';
import { listAuditLogsForOrganization } from '@/services/audit-service';

export async function GET() {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canReadAuditLogs(session.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const logs = await listAuditLogsForOrganization(session.organizationId);
  return NextResponse.json({ logs });
}
