import { NextResponse } from 'next/server';

import {
  canReadOrganizationWorkforceData,
  isManagerRole,
} from '@/lib/auth/rbac';
import { getSessionContext } from '@/lib/auth/session-context';
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

  try {
    const body = patchBodySchema.parse(await request.json());
    const { applyToGrowthPlan, employeeId, ...updateInput } = body;

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

    return NextResponse.json({ action: latestAction });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 },
    );
  }
}
