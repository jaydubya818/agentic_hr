'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { OutcomePatternByAction } from '@/services/organizational-learning-service';

interface OutcomePatternCardProps {
  pattern: OutcomePatternByAction;
}

export function OutcomePatternCard({ pattern }: OutcomePatternCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{pattern.actionType.replace(/_/g, ' ')}</CardTitle>
        <CardDescription>Outcome patterns by action type</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Applied</span>
          <Badge variant="secondary">{pattern.appliedCount}</Badge>
        </div>
        <div className="flex justify-between">
          <span>Success rate</span>
          <span>{Math.round(pattern.successRate * 100)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Avg confidence</span>
          <span>{Math.round(pattern.avgConfidence * 100)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
