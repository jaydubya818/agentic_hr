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
import type { SessionContext } from '@/types/session';
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
  // employee (plan/team level) require an org-wide role or a manager within
  // the plan's scope; any-manager access would let a manager approve or
  // apply another team's plan actions.
  const isOrgWide = canReadOrganizationWorkforceData(session.roles);
  const isSelfTarget =
    existing.targetEmployeeId != null && existing.targetEmployeeId === session.employeeId;
  const isManagerOfTarget =
    isManagerRole(session.roles) &&
    session.employeeId != null &&
    existing.targetEmployeeId != null &&
    isDirectReport(session.employeeId, existing.targetEmployeeId);
  const isManagerForPlanAction =
    existing.targetEmployeeId == null && managerScopeCoversPlan(session, existing.actionPlanId);
  if (!isOrgWide && !isSelfTarget && !isManagerOfTarget && !isManagerForPlanAction) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (applyToGrowthPlan) {
    // Applying is what flips the action to 'applied'; accepting a different
    // status in the same request would immediately overwrite that flip and
    // reopen the already-applied guard below for a duplicate apply.
    if (updateInput.status !== undefined && updateInput.status !== 'applied') {
      return NextResponse.json(
        { error: "status must be 'applied' when applying to a growth plan" },
        { status: 400 },
      );
    }
    // The first successful apply flips the action to 'applied'; honoring a
    // repeat request would push a duplicate growth-plan item for the same
    // action (the UI button stays clickable until the status refreshes).
    if (existing.status === 'applied') {
      return NextResponse.json(
        { error: 'Action has already been applied to a growth plan' },
        { status: 409 },
      );
    }
    // A targeted action always lands on its own target's growth plan; the
    // caller-supplied employeeId only selects the employee for plan/team-level
    // actions. Honoring a mismatched body employeeId would let a caller apply
    // an action proposed for one employee to a different employee's plan.
    const applyEmployeeId = existing.targetEmployeeId ?? employeeId;
    if (!applyEmployeeId) {
      return NextResponse.json(
        { error: 'employeeId is required to apply a plan-level action' },
        { status: 400 },
      );
    }
    const canApplyForEmployee =
      canReadOrganizationWorkforceData(session.roles) ||
      applyEmployeeId === session.employeeId ||
      (isManagerRole(session.roles) &&
        session.employeeId != null &&
        isDirectReport(session.employeeId, applyEmployeeId));
    if (!canApplyForEmployee) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Applying before the status update keeps the store untouched on failure,
    // so a rejected apply cannot leave an action marked applied with no
    // growth-plan item behind it.
    if (!applyActionToGrowthPlan(session.organizationId, id, applyEmployeeId)) {
      return NextResponse.json(
        { error: 'No active or draft growth plan to apply the action to' },
        { status: 409 },
      );
    }
  }

  const action = updateProposedActionStatus(session.organizationId, id, updateInput);
  if (!action) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
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
      appliedToGrowthPlan: Boolean(applyToGrowthPlan),
    },
  });

  return NextResponse.json({ action: latestAction });
}

/**
 * Write scope for a plan-level action (no target employee): the caller must
 * manage the plan's team, or the plan's employee must be the caller or one of
 * their direct reports. Plans carrying neither a team nor an employee are
 * reserved for org-wide roles (deny on ambiguity).
 */
function managerScopeCoversPlan(session: SessionContext, actionPlanId: string): boolean {
  if (!isManagerRole(session.roles) || session.employeeId == null) return false;
  const store = getMockStore();
  const plan = store.agentActionPlans.find((p) => p.id === actionPlanId);
  if (!plan) return false;
  if (plan.teamId != null) {
    return store.teams.some(
      (t) => t.id === plan.teamId && t.managerEmployeeId === session.employeeId,
    );
  }
  if (plan.employeeId != null) {
    return (
      plan.employeeId === session.employeeId ||
      isDirectReport(session.employeeId, plan.employeeId)
    );
  }
  return false;
}
