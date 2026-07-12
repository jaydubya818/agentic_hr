import { NextResponse } from 'next/server';

import { getSessionContext } from '@/lib/auth/session-context';
import {
  agentProposedActionSchema,
  createAgentActionPlanInputSchema,
} from '@/schemas/workforce-intelligence';
import { validateActionPlan } from '@/services/action-plan-governance';
import { createActionPlanFromInput } from '@/services/agent-action-service';
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

export async function POST(request: Request) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let plan;
  try {
    const body = createActionPlanRequestSchema.parse(await request.json());
    const { actions, ...planInput } = body;

    const validation = validateActionPlan(actions);
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
    const message = error instanceof Error ? error.message : 'Invalid request';
    const status = message === 'Forbidden' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  await persistAgentActionPlan(plan);
  return NextResponse.json({ plan }, { status: 201 });
}
