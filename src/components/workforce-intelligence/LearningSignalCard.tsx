'use client';

import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { LearningSignal } from '@/services/organizational-learning-service';

interface LearningSignalCardProps {
  signal: LearningSignal;
}

export function LearningSignalCard({ signal }: LearningSignalCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{signal.title}</CardTitle>
          <Badge variant="outline">{signal.category}</Badge>
        </div>
        <CardDescription>{signal.evidenceCount} supporting data points</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm">{signal.insight}</p>
        <ConfidenceIndicator value={signal.confidence} size="sm" />
      </CardContent>
    </Card>
  );
}
