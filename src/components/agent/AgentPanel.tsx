'use client';

import { useCallback, useState } from 'react';
import { Bot, Loader2, Send } from 'lucide-react';
import { GovernanceBlockNotice } from '@/components/agent/GovernanceBlockNotice';
import { RecommendationCard } from '@/components/shared/RecommendationCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AgentId, AgentRecommendationResult, AgentResult } from '@/types/agent';
import type { Recommendation, RecommendationEvidence } from '@/services/data-provider/types';
import { ActionPlanPanel } from '@/components/workforce-intelligence/ActionPlanPanel';

// Keep in sync with MAX_HISTORY_MESSAGES in the invoke route; sending more
// history than the API accepts fails validation and bricks the conversation.
const HISTORY_LIMIT = 20;

const AGENT_LABELS: Record<AgentId, string> = {
  'employee-growth': 'Employee Growth Agent',
  supermanager: 'Supermanager Agent',
  'skills-intelligence': 'Skills Intelligence Agent',
  'dynamic-learning': 'Dynamic Learning Agent',
  'internal-mobility': 'Internal Mobility Agent',
  governance: 'Governance Agent',
};

const STARTER_PROMPTS: Partial<Record<AgentId, string[]>> = {
  'employee-growth': [
    'What career paths fit my goal?',
    'Help me build a 30/60/90 growth plan',
    'Prep for my next 1:1 with my manager',
    'Demo: governance block',
  ],
  supermanager: [
    'Coaching prompts for my team',
    'Stretch assignments for my direct reports',
    'Team capability plan suggestions',
  ],
  'skills-intelligence': ['What are my skill gaps?', 'Show inferred vs confirmed skills'],
  'dynamic-learning': ['Learning resources for my skill gaps'],
  'internal-mobility': ['What internal opportunities match my profile?'],
};

interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
  blocked?: boolean;
}

interface AgentPanelProps {
  agentId: AgentId;
  title?: string;
  description?: string;
  context?: {
    employeeId?: string;
    teamId?: string;
    contextType?: string;
  };
  className?: string;
}

function toRecommendationCardProps(
  rec: AgentRecommendationResult,
): Recommendation & { evidence: RecommendationEvidence[] } {
  return {
    id: rec.id,
    organizationId: rec.organizationId,
    employeeId: rec.employeeId,
    agentId: rec.agentId,
    type: rec.type,
    title: rec.title,
    explanation: rec.explanation,
    confidence: rec.confidence,
    confidenceLevel: rec.confidenceLevel,
    status: rec.status,
    metadata: { governanceStatus: rec.governanceStatus },
    createdAt: rec.createdAt,
    updatedAt: rec.createdAt,
    evidence: rec.evidence.map((e, index) => ({
      id: `${rec.id}-ev-${index}`,
      recommendationId: rec.id,
      evidenceType: e.evidenceType,
      referenceId: e.referenceId ?? null,
      label: e.label,
      detail: e.detail ?? null,
      createdAt: rec.createdAt,
    })),
  };
}

export function AgentPanel({
  agentId,
  title,
  description,
  context,
  className,
}: AgentPanelProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [recommendations, setRecommendations] = useState<AgentRecommendationResult[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseMode, setResponseMode] = useState<'mock' | 'live' | 'fallback' | null>(null);
  const [governanceStatus, setGovernanceStatus] = useState<string | null>(null);
  const [actionPlan, setActionPlan] = useState<AgentResult['actionPlan'] | null>(null);

  const invoke = useCallback(
    async (message: string) => {
      if (!message.trim() || loading) return;

      setLoading(true);
      setError(null);
      setMessages((prev) => [...prev, { role: 'user', content: message.trim() }]);

      try {
        const response = await fetch(`/api/agents/${agentId}/invoke`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message.trim(),
            context,
            conversationHistory: messages
              .slice(-HISTORY_LIMIT)
              .map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? 'Agent request failed');
        }

        const payload = (await response.json()) as { data: AgentResult };
        const result = payload.data;
        const mode = (result.metadata.responseMode ?? result.metadata.mode) as
          | 'mock'
          | 'live'
          | 'fallback'
          | undefined;
        setResponseMode(mode ?? 'mock');
        setGovernanceStatus(result.governanceStatus);

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: result.response,
            blocked: result.governanceBlocked,
          },
        ]);

        if (result.recommendations.length > 0) {
          setRecommendations((prev) => [...result.recommendations, ...prev]);
        }
        if (result.actionPlan) {
          setActionPlan(result.actionPlan);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
        setInput('');
      }
    },
    [agentId, context, loading, messages],
  );

  const starters = STARTER_PROMPTS[agentId] ?? [];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="size-5 text-[#1E4D8C]" aria-hidden />
              {title ?? AGENT_LABELS[agentId]}
            </CardTitle>
            <CardDescription>
              {description ??
                'Development-focused guidance from your profile data. Every suggestion includes explanation, confidence, and evidence.'}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary">
              {loading
                ? 'Thinking…'
                : responseMode === 'live'
                  ? 'Live response'
                  : responseMode === 'fallback'
                    ? 'Fallback (mock)'
                    : 'Mock mode'}
            </Badge>
            {governanceStatus === 'flagged' && (
              <Badge variant="outline" className="text-amber-800">
                Review recommended
              </Badge>
            )}
            {governanceStatus === 'blocked' && (
              <Badge variant="outline" className="text-amber-800">
                Governance blocked
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {starters.length > 0 && messages.length === 0 && (
          <div className="flex flex-wrap gap-2">
            {starters.map((prompt) => (
              <Button
                key={prompt}
                type="button"
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={() => invoke(prompt)}
              >
                {prompt}
              </Button>
            ))}
          </div>
        )}

        {messages.length > 0 && (
          <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border bg-muted/30 p-3">
            {messages.map((msg, index) => (
              <div
                key={`${msg.role}-${index}`}
                className={
                  msg.role === 'user'
                    ? 'ml-8 rounded-lg bg-[#1E4D8C]/10 px-3 py-2 text-sm'
                    : 'mr-8 rounded-lg bg-background px-3 py-2 text-sm shadow-sm'
                }
              >
                {msg.blocked ? (
                  <p className="text-amber-800">{msg.content}</p>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {messages.some((m) => m.blocked) && <GovernanceBlockNotice />}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Agent recommendations</p>
            <div className="grid gap-3">
              {recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={toRecommendationCardProps(rec)}
                />
              ))}
            </div>
          </div>
        )}

        {actionPlan && (
          <ActionPlanPanel
            actionPlan={actionPlan}
            onAddToGrowthPlan={(actionId) => {
              void fetch(`/api/agent-actions/${actionId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  status: 'applied',
                  applyToGrowthPlan: true,
                  employeeId: context?.employeeId,
                }),
              })
                .then((res) => {
                  if (!res.ok) setError('Could not add the action to the growth plan.');
                })
                .catch(() => setError('Could not add the action to the growth plan.'));
            }}
            onSaveAsDecision={() => {
              void fetch('/api/decisions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: actionPlan.title,
                  description: actionPlan.summary,
                  decisionType: 'skill_development',
                  status: 'draft',
                }),
              })
                .then((res) => {
                  if (!res.ok) setError('Could not save the plan as a decision.');
                })
                .catch(() => setError('Could not save the plan as a decision.'));
            }}
            onSendForReview={() => {
              void Promise.all(
                actionPlan.actions.map((action) =>
                  fetch(`/api/agent-actions/${action.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'pending_review' }),
                  }),
                ),
              )
                .then((responses) => {
                  if (responses.some((res) => !res.ok)) {
                    setError('Could not send every action for review.');
                  }
                })
                .catch(() => setError('Could not send every action for review.'));
            }}
            onDismiss={() => setActionPlan(null)}
          />
        )}

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void invoke(input);
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about growth paths, skills, learning, or mobility..."
            rows={2}
            disabled={loading}
            className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50"
            aria-label="Message to agent"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Send">
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
