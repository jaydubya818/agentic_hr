import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  canReadOrganizationWorkforceData,
  isManagerRole,
} from '@/lib/auth/rbac';
import { getSessionContext } from '@/lib/auth/session-context';
import { logAuditEvent } from '@/services/audit-service';
import {
  createExpectedOutcome,
  recordActualOutcome,
} from '@/services/decision-outcome-service';
import { persistDecisionOutcome } from '@/services/data-provider/workforce-intelligence-persistence';

const createOutcomeRequestSchema = z.object({
  outcomeType: z.enum(['expected', 'actual']).optional().default('expected'),
  description: z.string().min(1),
  status: z
    .enum(['pending', 'on_track', 'achieved', 'partially_achieved', 'missed', 'cancelled'])
    .optional(),
  metricLabel: z.string().nullable().optional(),
  metricValue: z.number().nullable().optional(),
  targetValue: z.number().nullable().optional(),
  recordedAt: z.string().datetime().nullable().optional(),
  recordedByEmployeeId: z.string().uuid().nullable().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isManagerRole(session.roles) && !canReadOrganizationWorkforceData(session.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  let outcome;
  try {
    const payload = createOutcomeRequestSchema.parse(await request.json());

    const { outcomeType, ...rest } = payload;
    const outcomeInput = {
      ...rest,
      status: rest.status ?? (outcomeType === 'actual' ? 'achieved' : 'pending'),
    };

    outcome =
      outcomeType === 'actual'
        ? recordActualOutcome(session, id, outcomeInput)
        : createExpectedOutcome(session, id, outcomeInput);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    const status = message === 'Forbidden' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  if (!outcome) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await persistDecisionOutcome(outcome);
  logAuditEvent({
    session,
    action: 'decision.outcome_recorded',
    entityType: 'decision_outcome',
    entityId: outcome.id,
    details: { decisionId: id, outcomeType: outcome.outcomeType, status: outcome.status },
  });
  return NextResponse.json({ outcome }, { status: 201 });
}
