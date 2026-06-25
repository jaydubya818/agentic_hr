import { NextResponse } from 'next/server';

import { canReadOrganizationWorkforceData } from '@/lib/auth/rbac';
import { getSessionContext } from '@/lib/auth/session-context';
import {
  getDecisionPatterns,
  getLearningSignalsForAgent,
  getOutcomePatternsByActionType,
  getRecommendationEffectiveness,
} from '@/services/organizational-learning-service';

export async function GET() {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!canReadOrganizationWorkforceData(session.roles)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const organizationId = session.organizationId;

  return NextResponse.json({
    decisionPatterns: getDecisionPatterns(organizationId),
    outcomePatternsByActionType: getOutcomePatternsByActionType(organizationId),
    recommendationEffectiveness: getRecommendationEffectiveness(organizationId),
    learningSignals: getLearningSignalsForAgent(organizationId),
  });
}
