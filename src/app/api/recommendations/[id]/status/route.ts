import { NextResponse } from 'next/server';

import { getSessionContext } from '@/lib/auth/session-context';
import { logAuditEvent } from '@/services/audit-service';
import { updateRecommendationStatusInDb } from '@/services/data-provider/supabase-persistence';

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
