import { NextResponse } from 'next/server';

import { writeErrorResponse } from '@/lib/api/write-error-response';
import {
  canReadOrganizationWorkforceData,
  canReadTeamScopedEmployeeData,
  isManagerRole,
} from '@/lib/auth/rbac';
import { getSessionContext } from '@/lib/auth/session-context';
import { logAuditEvent } from '@/services/audit-service';
import { updateWorkforceDecisionInputSchema } from '@/schemas/workforce-intelligence';
import { updateWorkforceDecisionInDb } from '@/services/data-provider/workforce-intelligence-persistence';
import {
  getWorkforceDecision,
  updateWorkforceDecision,
} from '@/services/workforce-decision-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (
    !canReadTeamScopedEmployeeData(session.roles) &&
    !canReadOrganizationWorkforceData(session.roles)
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const decision = getWorkforceDecision(session, id);
  if (!decision) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ decision });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isManagerRole(session.roles) && !canReadOrganizationWorkforceData(session.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  let decision;
  try {
    const body = updateWorkforceDecisionInputSchema.parse(await request.json());
    decision = updateWorkforceDecision(session, id, body);
  } catch (error) {
    return writeErrorResponse(error);
  }

  if (!decision) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  await updateWorkforceDecisionInDb(decision);
  logAuditEvent({
    session,
    action: 'decision.updated',
    entityType: 'workforce_decision',
    entityId: decision.id,
    details: { status: decision.status },
  });
  return NextResponse.json({ decision });
}
