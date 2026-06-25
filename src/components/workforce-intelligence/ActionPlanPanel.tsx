'use client';

import type { AgentActionPlanDetail } from '@/services/agent-action-service';
import { ProposedActionItem } from '@/components/workforce-intelligence/ProposedActionItem';
import { HumanReviewBadge } from '@/components/workforce-intelligence/HumanReviewBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ActionPlanPanelProps {
  actionPlan: AgentActionPlanDetail;
  onAddToGrowthPlan?: (actionId: string) => void;
  onSaveAsDecision?: () => void;
  onSendForReview?: () => void;
  onDismiss?: () => void;
}

export function ActionPlanPanel({
  actionPlan,
  onAddToGrowthPlan,
  onSaveAsDecision,
  onSendForReview,
  onDismiss,
}: ActionPlanPanelProps) {
  const needsReview =
    actionPlan.governanceStatus === 'flagged' ||
    actionPlan.actions.some((a) => a.status === 'pending_review');

  return (
    <Card className="border-[#0D9488]/30">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{actionPlan.title}</CardTitle>
            <CardDescription>{actionPlan.summary}</CardDescription>
          </div>
          {needsReview && <HumanReviewBadge />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {actionPlan.actions.map((action) => (
          <ProposedActionItem
            key={action.id}
            action={action}
            onAddToGrowthPlan={onAddToGrowthPlan}
          />
        ))}
        <div className="flex flex-wrap gap-2 pt-2">
          {onSaveAsDecision && (
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
              onClick={onSaveAsDecision}
            >
              Save as decision
            </button>
          )}
          {onSendForReview && (
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
              onClick={onSendForReview}
            >
              Send for review
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
              onClick={onDismiss}
            >
              Dismiss
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
