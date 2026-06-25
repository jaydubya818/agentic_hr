import { NextResponse } from 'next/server';

import {
  canReadOrganizationWorkforceData,
  canReadTeamScopedEmployeeData,
} from '@/lib/auth/rbac';
import { getSessionContext } from '@/lib/auth/session-context';
import {
  canAccessTeamContext,
  getTeamContextGraph,
} from '@/services/context-graph-service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const isHr = canReadOrganizationWorkforceData(session.roles);
  const isManager = canReadTeamScopedEmployeeData(session.roles);

  if (!isHr && !isManager) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!canAccessTeamContext(session.employeeId, id, isHr)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const graph = getTeamContextGraph(id);
  if (!graph) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ graph });
}
