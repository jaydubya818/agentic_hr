'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WorkforceDecision } from '@/schemas/workforce-intelligence';

interface DecisionTimelineProps {
  decisions: WorkforceDecision[];
}

export function DecisionTimeline({ decisions }: DecisionTimelineProps) {
  const sorted = [...decisions].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Decision timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sorted.map((decision) => (
          <div key={decision.id} className="border-l-2 border-[#1E4D8C]/30 pl-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{decision.title}</p>
              <Badge variant="outline">{decision.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Updated {new Date(decision.updatedAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
