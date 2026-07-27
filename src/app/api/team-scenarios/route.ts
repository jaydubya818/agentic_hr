import { NextResponse } from 'next/server';

import {
  canReadOrganizationWorkforceData,
  canReadTeamScopedEmployeeData,
  isManagerRole,
} from '@/lib/auth/rbac';
import { getSessionContext } from '@/lib/auth/session-context';
import { logAuditEvent } from '@/services/audit-service';
import { createTeamScenarioInputSchema } from '@/schemas/workforce-intelligence';
import { persistTeamScenario } from '@/services/data-provider/workforce-intelligence-persistence';
import { createTeamScenario, listTeamScenarios } from '@/services/team-scenario-service';

export async function GET() {
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

  const scenarios = listTeamScenarios(session);
  return NextResponse.json({ scenarios });
}

export async function POST(request: Request) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isManagerRole(session.roles) && !canReadOrganizationWorkforceData(session.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let scenario;
  try {
    const body = createTeamScenarioInputSchema.parse(await request.json());
    scenario = createTeamScenario(session, body);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request';
    const status = message === 'Forbidden' ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  await persistTeamScenario(scenario);
  logAuditEvent({
    session,
    action: 'team_scenario.created',
    entityType: 'team_scenario',
    entityId: scenario.id,
    details: { teamId: scenario.teamId, scenarioType: scenario.scenarioType },
  });
  return NextResponse.json({ scenario }, { status: 201 });
}
