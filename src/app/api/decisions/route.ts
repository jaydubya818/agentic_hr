import { NextResponse } from 'next/server';

import { writeErrorResponse } from '@/lib/api/write-error-response';
import {
  canReadOrganizationWorkforceData,
  canReadTeamScopedEmployeeData,
  canWriteOrganizationWorkforceData,
  isManagerRole,
} from '@/lib/auth/rbac';
import { getSessionContext } from '@/lib/auth/session-context';
import { logAuditEvent } from '@/services/audit-service';
import { createWorkforceDecisionInputSchema } from '@/schemas/workforce-intelligence';
import { persistWorkforceDecision } from '@/services/data-provider/workforce-intelligence-persistence';
import {
  createWorkforceDecision,
  listWorkforceDecisions,
} from '@/services/workforce-decision-service';

export async function GET() {
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

  const decisions = listWorkforceDecisions(session);
  return NextResponse.json({ decisions });
}

export async function POST(request: Request) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isManagerRole(session.roles) && !canWriteOrganizationWorkforceData(session.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let decision;
  try {
    const body = createWorkforceDecisionInputSchema.parse(await request.json());
    decision = createWorkforceDecision(session, body);
  } catch (error) {
    return writeErrorResponse(error);
  }

  await persistWorkforceDecision(decision);
  logAuditEvent({
    session,
    action: 'decision.created',
    entityType: 'workforce_decision',
    entityId: decision.id,
    details: { decisionType: decision.decisionType, teamId: decision.teamId },
  });
  return NextResponse.json({ decision }, { status: 201 });
}
