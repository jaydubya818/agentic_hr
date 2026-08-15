import { NextResponse } from 'next/server';

import { writeErrorResponse } from '@/lib/api/write-error-response';
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
  let body: { action?: string };
  try {
    body = (await request.json()) as { action?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.action || !ALLOWED.has(body.action as InferredSkillReviewAction)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  // A persistence failure must not escape as an unhandled rejection: the
  // shared helper maps known write errors and re-throws the rest so they
  // surface as generic 500s without leaking internal error text.
  let result;
  try {
    result = await reviewInferredSkill({
      session,
      employeeSkillId: id,
      action: body.action as InferredSkillReviewAction,
    });
  } catch (error) {
    return writeErrorResponse(error);
  }

  if (!result.ok) {
    return NextResponse.json({ error: result.reason ?? 'Failed' }, { status: result.status ?? 400 });
  }

  return NextResponse.json({ id, action: body.action, ok: true });
}
