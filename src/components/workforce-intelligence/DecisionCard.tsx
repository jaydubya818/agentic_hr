'use client';

import Link from 'next/link';

import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { WorkforceDecision } from '@/schemas/workforce-intelligence';

interface DecisionCardProps {
  decision: WorkforceDecision;
  detailHref: string;
}

export function DecisionCard({ decision, detailHref }: DecisionCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-base">{decision.title}</CardTitle>
          <CardDescription>{decision.description}</CardDescription>
        </div>
        <Badge variant="secondary">{decision.status.replace(/_/g, ' ')}</Badge>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{decision.decisionType.replace(/_/g, ' ')}</Badge>
        {decision.confidence != null && (
          <ConfidenceIndicator value={decision.confidence} size="sm" />
        )}
        </div>
        <Button variant="outline" size="sm" render={<Link href={detailHref} />}>
          View details
        </Button>
      </CardContent>
    </Card>
  );
}
