import { NextResponse } from 'next/server';

import { getSessionContext } from '@/lib/auth/session-context';
import { updateAgentProposedActionInputSchema } from '@/schemas/workforce-intelligence';
import {
  applyActionToGrowthPlan,
  updateProposedActionStatus,
} from '@/services/agent-action-service';
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

    const action = updateProposedActionStatus(id, updateInput);
    if (!action) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (applyToGrowthPlan && employeeId) {
      applyActionToGrowthPlan(id, employeeId);
    }

    return NextResponse.json({ action });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 },
    );
  }
}
