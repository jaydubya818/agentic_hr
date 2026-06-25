import { NextResponse } from 'next/server';

import {
  canReadOrganizationWorkforceData,
  canReadTeamScopedEmployeeData,
  isManagerRole,
} from '@/lib/auth/rbac';
import { getSessionContext } from '@/lib/auth/session-context';
import { createWorkforceDecisionInputSchema } from '@/schemas/workforce-intelligence';
import {
  createWorkforceDecision,
  listWorkforceDecisions,
} from '@/services/workforce-decision-service';

export async function GET() {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canReadTeamScopedEmployeeData(session.roles) && !canReadOrganizationWorkforceData(session.roles)) {
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

  if (!isManagerRole(session.roles) && !canReadOrganizationWorkforceData(session.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = createWorkforceDecisionInputSchema.parse(await request.json());
    const decision = createWorkforceDecision(session, body);
    return NextResponse.json({ decision }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 },
    );
  }
}
