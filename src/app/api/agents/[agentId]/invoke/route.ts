import { NextResponse } from 'next/server';
import { getSessionContext } from '@/lib/auth/session-context';
import { AgentAccessError, invokeAgent } from '@/services/agent-service';
import { isAgentId } from '@/types/agent';

interface InvokeBody {
  message?: string;
  context?: {
    employeeId?: string;
    teamId?: string;
    contextType?: string;
  };
  conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
}

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

  let body: InvokeBody;
  try {
    body = (await request.json()) as InvokeBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

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
      message: body.message.trim(),
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
