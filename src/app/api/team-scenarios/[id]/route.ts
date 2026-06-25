import { NextResponse } from 'next/server';

import {
  canReadOrganizationWorkforceData,
  canReadTeamScopedEmployeeData,
  isManagerRole,
} from '@/lib/auth/rbac';
import { getSessionContext } from '@/lib/auth/session-context';
import { updateTeamScenarioInputSchema } from '@/schemas/workforce-intelligence';
import { updateTeamScenarioInDb } from '@/services/data-provider/workforce-intelligence-persistence';
import { getTeamScenario, updateTeamScenario } from '@/services/team-scenario-service';

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
  const scenario = getTeamScenario(session, id);
  if (!scenario) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ scenario });
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
    const body = updateTeamScenarioInputSchema.parse(await request.json());
    const scenario = updateTeamScenario(session, id, body);
    if (!scenario) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await updateTeamScenarioInDb(scenario);
    return NextResponse.json({ scenario });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 },
    );
  }
}
