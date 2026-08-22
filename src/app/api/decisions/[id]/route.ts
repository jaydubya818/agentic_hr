import { NextResponse } from 'next/server';

import { writeErrorResponse } from '@/lib/api/write-error-response';
import {
  canReadIndividualEmployeeData,
  canReadTeamScopedEmployeeData,
  canWriteOrganizationWorkforceData,
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

  // A single decision is an individual-level read, not an aggregate: the detail
  // payload carries `ownerEmployeeId` and a `participants` list naming
  // employees and their roles on the decision. `canReadOrganizationWorkforceData`
  // admits `executive_readonly`, which is why this used to answer 200 for a
  // role that BACKEND_STRUCTURE 6.1 grants `view_org_data: aggregate` only and
  // that SECURITY_AND_PRIVACY 6.1 gives "no individual PII" -- 6.2 Example 6
  // requires a 403 for exactly this shape of request.
  //
  // Gating on `canReadIndividualEmployeeData` reuses the rule already written
  // down for individual reads instead of restating it here. The org-wide
  // *list* endpoint keeps `canReadOrganizationWorkforceData`: aggregate access
  // to the decision list is the role's documented purpose, and narrowing that
  // is a separate product question tracked in the backlog.
  if (
    !canReadTeamScopedEmployeeData(session.roles) &&
    !canReadIndividualEmployeeData(session.roles)
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

  if (!isManagerRole(session.roles) && !canWriteOrganizationWorkforceData(session.roles)) {
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
