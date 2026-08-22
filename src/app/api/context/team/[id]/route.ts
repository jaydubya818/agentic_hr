import { NextResponse } from 'next/server';

import {
  canReadIndividualEmployeeData,
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
  // A team context graph is not an aggregate. `buildGraphFromEdges` resolves a
  // label for every node it touches, and `resolveEntityLabel` renders an
  // `employee` node as that person's full name, so the payload names
  // identified individuals alongside the team. The sibling employee route
  // already gates on the individual-read helper for exactly this reason; this
  // route used the aggregate helper, which admits `executive_readonly` -- a
  // role BACKEND_STRUCTURE 6.1 grants `view_org_data: aggregate` only and
  // SECURITY_AND_PRIVACY 6.1 gives "no individual PII", with 6.2 Example 6
  // requiring a 403 for this shape of request.
  const isHr = canReadIndividualEmployeeData(session.roles);
  const isManager = canReadTeamScopedEmployeeData(session.roles);

  if (!isHr && !isManager) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!canAccessTeamContext(session.employeeId, id, isHr)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const graph = getTeamContextGraph(id, session.organizationId);
  if (!graph) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ graph });
}
