import { NextResponse } from 'next/server';

import {
  canReadOrganizationWorkforceData,
  canReadTeamScopedEmployeeData,
  isManagerRole,
} from '@/lib/auth/rbac';
import { getSessionContext } from '@/lib/auth/session-context';
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

  if (!canReadTeamScopedEmployeeData(session.roles) && !canReadOrganizationWorkforceData(session.roles)) {
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

  if (!isManagerRole(session.roles) && !canReadOrganizationWorkforceData(session.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = updateWorkforceDecisionInputSchema.parse(await request.json());
    const decision = updateWorkforceDecision(session, id, body);
    if (!decision) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await updateWorkforceDecisionInDb(decision);
    return NextResponse.json({ decision });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 },
    );
  }
}
