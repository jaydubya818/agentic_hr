import { NextResponse } from 'next/server';

import { getSessionContext } from '@/lib/auth/session-context';
import {
  reviewInferredSkill,
  type InferredSkillReviewAction,
} from '@/services/inferred-skill-service';

const ALLOWED = new Set<InferredSkillReviewAction>(['confirm', 'reject']);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { action?: string };

  if (!body.action || !ALLOWED.has(body.action as InferredSkillReviewAction)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const result = await reviewInferredSkill({
    session,
    employeeSkillId: id,
    action: body.action as InferredSkillReviewAction,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.reason ?? 'Failed' }, { status: 400 });
  }

  return NextResponse.json({ id, action: body.action, ok: true });
}
