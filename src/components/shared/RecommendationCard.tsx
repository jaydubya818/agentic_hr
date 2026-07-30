'use client';

import { useState } from 'react';
import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RecommendationEvidence, Recommendation } from '@/services/data-provider/types';

const TYPE_LABELS: Record<Recommendation['type'], string> = {
  career_path: 'Career Path',
  skill_gap: 'Skill Gap',
  learning: 'Learning',
  growth_plan: 'Growth Plan',
  coaching: 'Coaching',
  stretch_assignment: 'Stretch Assignment',
  mobility: 'Mobility',
  team_action: 'Team Action',
  capability_plan: 'Capability Plan',
};

interface RecommendationCardProps {
  recommendation: Recommendation & { evidence: RecommendationEvidence[] };
  className?: string;
  showActions?: boolean;
}

export function RecommendationCard({
  recommendation,
  className,
  showActions = true,
}: RecommendationCardProps) {
  const [status, setStatus] = useState(recommendation.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  async function updateStatus(next: 'accepted' | 'dismissed') {
    setIsUpdating(true);
    setUpdateError(null);
    try {
      const response = await fetch(`/api/recommendations/${recommendation.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (response.ok) {
        setStatus(next);
      } else {
        setUpdateError('Could not update this recommendation. Try again.');
      }
    } catch {
      // A network failure would otherwise surface as an unhandled rejection
      // and leave the card looking interactive with no feedback.
      setUpdateError('Could not update this recommendation. Check your connection and try again.');
    } finally {
      setIsUpdating(false);
    }
  }

  if (status === 'dismissed') {
    return null;
  }

  const createdDate = new Date(recommendation.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <Badge variant="secondary">{TYPE_LABELS[recommendation.type]}</Badge>
          <ConfidenceIndicator
            value={recommendation.confidence}
            level={recommendation.confidenceLevel}
            size="sm"
            className="w-32"
          />
        </div>
        <CardTitle className="text-lg leading-snug">{recommendation.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{recommendation.explanation}</p>
        {recommendation.evidence.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Evidence
            </p>
            <ul className="space-y-1.5">
              {recommendation.evidence.map((item) => (
                <li key={item.id} className="text-sm text-foreground">
                  <span className="font-medium">{item.label}</span>
                  {item.detail && (
                    <span className="text-muted-foreground"> — {item.detail}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Created {createdDate}</p>
      </CardContent>
      {showActions && status === 'pending' && (
        <CardFooter className="flex-wrap gap-2 border-t pt-4">
          <Button size="sm" disabled={isUpdating} onClick={() => updateStatus('accepted')}>
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isUpdating}
            onClick={() => updateStatus('dismissed')}
          >
            Dismiss
          </Button>
          {updateError ? (
            <p role="alert" className="w-full text-sm text-destructive">
              {updateError}
            </p>
          ) : null}
        </CardFooter>
      )}
      {status === 'accepted' && (
        <CardFooter className="border-t pt-4">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
            Accepted
          </Badge>
        </CardFooter>
      )}
    </Card>
  );
}
