import { NextResponse } from 'next/server';

import { canReadOrganizationWorkforceData, isManagerRole } from '@/lib/auth/rbac';
import { getSessionContext } from '@/lib/auth/session-context';
import { logAuditEvent } from '@/services/audit-service';
import { dataProvider } from '@/services/data-provider';
import { updateRecommendationStatusInDb } from '@/services/data-provider/supabase-persistence';
import type { SessionContext } from '@/types/session';

const ALLOWED_STATUSES = new Set(['accepted', 'dismissed']);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  let body: { status?: string };
  try {
    body = (await request.json()) as { status?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.status || !ALLOWED_STATUSES.has(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const forbidden = checkRecommendationAccess(session, id);
  if (forbidden) return forbidden;

  const status = body.status as 'accepted' | 'dismissed';
  const persisted = await updateRecommendationStatusInDb(id, status, session.organizationId);

  logAuditEvent({
    session,
    action: `recommendation.${status}`,
    entityType: 'recommendation',
    entityId: id,
    details: { persisted },
  });

  return NextResponse.json({ id, status, persisted });
}

/**
 * A recommendation may only be accepted or dismissed by its owning employee,
 * that employee's direct manager, or HR. When the row is not present in the
 * active store (e.g. a cold live-mode cache) we defer to the organization
 * scoping enforced by the persistence layer.
 */
function checkRecommendationAccess(session: SessionContext, id: string): NextResponse | null {
  const recommendation = dataProvider
    .getMockStore()
    .recommendations.find((rec) => rec.id === id);
  if (!recommendation) return null;

  if (recommendation.organizationId !== session.organizationId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const isSelf =
    session.employeeId != null && session.employeeId === recommendation.employeeId;
  const isManagerOfEmployee =
    isManagerRole(session.roles) &&
    session.employeeId != null &&
    dataProvider.isDirectReport(session.employeeId, recommendation.employeeId);
  if (!isSelf && !isManagerOfEmployee && !canReadOrganizationWorkforceData(session.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}
