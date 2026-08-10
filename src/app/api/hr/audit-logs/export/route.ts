import { NextResponse } from 'next/server';

import { canReadAuditLogs } from '@/lib/auth/rbac';
import { escapeCsvCell } from '@/lib/format/csv';
import { getSessionContext } from '@/lib/auth/session-context';
import { listAuditLogsForOrganization, logAuditEvent } from '@/services/audit-service';

export async function GET() {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canReadAuditLogs(session.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const logs = await listAuditLogsForOrganization(session.organizationId);
  const header = ['id', 'createdAt', 'action', 'entityType', 'entityId', 'userId', 'details'];
  const rows = logs.map((log) =>
    [
      log.id,
      log.createdAt,
      log.action,
      log.entityType,
      log.entityId ?? '',
      log.userId ?? '',
      JSON.stringify(log.details),
    ]
      .map((cell) => escapeCsvCell(String(cell)))
      .join(','),
  );

  const csv = [header.join(','), ...rows].join('\n');

  // Bulk export of the audit trail is itself a sensitive read; record who
  // pulled it and how much (BACKEND_STRUCTURE 11.1: audit.exported).
  logAuditEvent({
    session,
    action: 'audit.exported',
    entityType: 'audit_log',
    details: { rowCount: logs.length },
  });

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="growthos-audit-logs.csv"',
      // The audit trail is sensitive; keep the download out of shared and
      // browser caches.
      'Cache-Control': 'no-store',
    },
  });
}
