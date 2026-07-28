import { NextResponse } from 'next/server';

import { writeErrorResponse } from '@/lib/api/write-error-response';
import { canReadOrganizationWorkforceData, isManagerRole } from '@/lib/auth/rbac';
import { getSessionContext } from '@/lib/auth/session-context';
import { logAuditEvent } from '@/services/audit-service';
import { updateAgentProposedActionInputSchema } from '@/schemas/workforce-intelligence';
import {
  applyActionToGrowthPlan,
  updateProposedActionStatus,
} from '@/services/agent-action-service';
import { getMockStore, isDirectReport } from '@/services/data-provider/mock-provider';
import { updateAgentProposedActionInDb } from '@/services/data-provider/workforce-intelligence-persistence';
import { z } from 'zod';

interface RouteParams {
  params: Promise<{ id: string }>;
}

const patchBodySchema = updateAgentProposedActionInputSchema.extend({
  applyToGrowthPlan: z.boolean().optional(),
  employeeId: z.string().uuid().optional(),
});

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  let parsed;
  try {
    parsed = patchBodySchema.parse(await request.json());
  } catch (error) {
    return writeErrorResponse(error);
  }

  const { applyToGrowthPlan, employeeId, ...updateInput } = parsed;

  const existing = getMockStore().agentProposedActions.find(
    (candidate) => candidate.id === id && candidate.organizationId === session.organizationId,
  );
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // A proposed action may only be updated by its target employee, that
  // employee's direct manager, or an org-wide role. Actions without a target
  // employee (plan/team level) require a manager or org-wide role.
  const isOrgWide = canReadOrganizationWorkforceData(session.roles);
  const isSelfTarget =
    existing.targetEmployeeId != null && existing.targetEmployeeId === session.employeeId;
  const isManagerOfTarget =
    isManagerRole(session.roles) &&
    session.employeeId != null &&
    existing.targetEmployeeId != null &&
    isDirectReport(session.employeeId, existing.targetEmployeeId);
  const isManagerForPlanAction = existing.targetEmployeeId == null && isManagerRole(session.roles);
  if (!isOrgWide && !isSelfTarget && !isManagerOfTarget && !isManagerForPlanAction) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const action = updateProposedActionStatus(session.organizationId, id, updateInput);
  if (!action) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (applyToGrowthPlan && employeeId) {
    const canApplyForEmployee =
      canReadOrganizationWorkforceData(session.roles) ||
      employeeId === session.employeeId ||
      (isManagerRole(session.roles) &&
        session.employeeId != null &&
        isDirectReport(session.employeeId, employeeId));
    if (!canApplyForEmployee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    applyActionToGrowthPlan(session.organizationId, id, employeeId);
  }

  const latestAction =
    getMockStore().agentProposedActions.find((candidate) => candidate.id === id) ?? action;
  await updateAgentProposedActionInDb(latestAction);

  logAuditEvent({
    session,
    action: 'agent_action.updated',
    entityType: 'agent_proposed_action',
    entityId: id,
    details: {
      status: latestAction.status,
      appliedToGrowthPlan: Boolean(applyToGrowthPlan && employeeId),
    },
  });

  return NextResponse.json({ action: latestAction });
}
