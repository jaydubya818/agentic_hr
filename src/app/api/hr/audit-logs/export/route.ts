import { NextResponse } from 'next/server';

import { canReadAuditLogs } from '@/lib/auth/rbac';
import { getSessionContext } from '@/lib/auth/session-context';
import { listAuditLogsForOrganization } from '@/services/audit-service';

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

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
      .map((cell) => escapeCsv(String(cell)))
      .join(','),
  );

  const csv = [header.join(','), ...rows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="growthos-audit-logs.csv"',
    },
  });
}
