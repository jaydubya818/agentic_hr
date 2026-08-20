import { NextResponse } from 'next/server';

import { writeErrorResponse } from '@/lib/api/write-error-response';
import { getSessionContext } from '@/lib/auth/session-context';
import {
  agentProposedActionSchema,
  createAgentActionPlanInputSchema,
} from '@/schemas/workforce-intelligence';
import { validateActionPlan } from '@/services/action-plan-governance';
import {
  createActionPlanFromInput,
  listActionPlansForSession,
} from '@/services/agent-action-service';
import { logAuditEvent } from '@/services/audit-service';
import { persistAgentActionPlan } from '@/services/data-provider/workforce-intelligence-persistence';
import { z } from 'zod';

const createActionPlanRequestSchema = createAgentActionPlanInputSchema.extend({
  actions: z.array(
    agentProposedActionSchema.omit({
      id: true,
      organizationId: true,
      actionPlanId: true,
      createdAt: true,
      updatedAt: true,
    }),
  ),
});

export async function GET() {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const plans = listActionPlansForSession(session);
  return NextResponse.json({ plans });
}

export async function POST(request: Request) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let plan;
  try {
    const body = createActionPlanRequestSchema.parse(await request.json());
    const { actions, ...planInput } = body;

    const validation = validateActionPlan(actions, planInput);
    if (!validation.valid) {
      logAuditEvent({
        session,
        action: 'action_plan_blocked',
        entityType: 'agent_action_plan',
        details: {
          agentId: planInput.agentId,
          errors: validation.errors,
          blockedActionTypes: validation.blockedActionTypes,
        },
      });
      return NextResponse.json({ error: validation.errors.join('; ') }, { status: 400 });
    }

    plan = createActionPlanFromInput(session, planInput, actions);
  } catch (error) {
    return writeErrorResponse(error);
  }

  await persistAgentActionPlan(plan);
  // Every other successful write in the API surface leaves an audit entry
  // (BACKEND_STRUCTURE 11.1); accepted plans must be as traceable as blocked
  // ones, which already log action_plan_blocked above.
  logAuditEvent({
    session,
    action: 'action_plan.created',
    entityType: 'agent_action_plan',
    entityId: plan.id,
    details: {
      agentId: plan.agentId,
      actionCount: plan.actions.length,
      governanceStatus: plan.governanceStatus,
    },
  });
  return NextResponse.json({ plan }, { status: 201 });
}
