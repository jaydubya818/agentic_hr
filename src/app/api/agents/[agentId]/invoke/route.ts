import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getSessionContext } from '@/lib/auth/session-context';
import { AgentAccessError, invokeAgent } from '@/services/agent-service';
import { isAgentId } from '@/types/agent';

const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_MESSAGES = 20;

const invokeRequestSchema = z.object({
  message: z.string().trim().min(1, 'Message is required').max(MAX_MESSAGE_LENGTH),
  context: z
    .object({
      employeeId: z.string().max(64).optional(),
      teamId: z.string().max(64).optional(),
      contextType: z.string().max(64).optional(),
    })
    .optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(MAX_MESSAGE_LENGTH),
      }),
    )
    .max(MAX_HISTORY_MESSAGES)
    .optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  const { agentId: rawAgentId } = await params;

  if (!isAgentId(rawAgentId)) {
    return NextResponse.json({ error: 'Unknown agent' }, { status: 404 });
  }

  const session = await getSessionContext();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsedBody = invokeRequestSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: parsedBody.error.issues[0]?.message ?? 'Invalid request body' },
      { status: 400 },
    );
  }
  const body = parsedBody.data;

  const { checkAgentRateLimit } = await import('@/lib/agent/rate-limit');
  const rate = checkAgentRateLimit(session.userId);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again shortly.' },
      {
        status: 429,
        headers: rate.retryAfterMs
          ? { 'Retry-After': String(Math.ceil(rate.retryAfterMs / 1000)) }
          : undefined,
      },
    );
  }

  try {
    const result = await invokeAgent(rawAgentId, {
      session,
      message: body.message,
      context: body.context,
      conversationHistory: body.conversationHistory,
    });

    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof AgentAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
}
