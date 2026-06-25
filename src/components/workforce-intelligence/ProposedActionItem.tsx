'use client';

import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AgentProposedAction } from '@/schemas/workforce-intelligence';

interface ProposedActionItemProps {
  action: AgentProposedAction;
  onAddToGrowthPlan?: (actionId: string) => void;
}

export function ProposedActionItem({ action, onAddToGrowthPlan }: ProposedActionItemProps) {
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-sm">{action.title}</p>
          {action.description && (
            <p className="text-sm text-muted-foreground">{action.description}</p>
          )}
        </div>
        <Badge variant="outline">{action.actionType.replace(/_/g, ' ')}</Badge>
      </div>
      {action.explanation && <p className="text-sm">{action.explanation}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {action.confidence != null && (
          <ConfidenceIndicator value={action.confidence} size="sm" />
        )}
        <Badge variant="secondary">{action.status.replace(/_/g, ' ')}</Badge>
        {onAddToGrowthPlan && action.status !== 'applied' && action.status !== 'dismissed' && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onAddToGrowthPlan(action.id)}
          >
            Add to growth plan
          </Button>
        )}
      </div>
    </div>
  );
}
