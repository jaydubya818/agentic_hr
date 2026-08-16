import { NextResponse } from 'next/server';

import { writeErrorResponse } from '@/lib/api/write-error-response';
import {
  canReadOrganizationWorkforceData,
  canReadTeamScopedEmployeeData,
  canWriteOrganizationWorkforceData,
  isManagerRole,
} from '@/lib/auth/rbac';
import { getSessionContext } from '@/lib/auth/session-context';
import { logAuditEvent } from '@/services/audit-service';
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

  if (
    !canReadTeamScopedEmployeeData(session.roles) &&
    !canReadOrganizationWorkforceData(session.roles)
  ) {
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

  if (!isManagerRole(session.roles) && !canWriteOrganizationWorkforceData(session.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  let scenario;
  try {
    const body = updateTeamScenarioInputSchema.parse(await request.json());
    scenario = updateTeamScenario(session, id, body);
  } catch (error) {
    return writeErrorResponse(error);
  }

  if (!scenario) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  await updateTeamScenarioInDb(scenario);
  logAuditEvent({
    session,
    action: 'team_scenario.updated',
    entityType: 'team_scenario',
    entityId: scenario.id,
    details: { teamId: scenario.teamId },
  });
  return NextResponse.json({ scenario });
}
