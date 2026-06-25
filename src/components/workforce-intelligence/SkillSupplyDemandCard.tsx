'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SkillSupplyDemandCardProps {
  skillName: string;
  demandLevel: number;
  supplyLevel: number;
  gap: number;
  notes?: string | null;
}

export function SkillSupplyDemandCard({
  skillName,
  demandLevel,
  supplyLevel,
  gap,
  notes,
}: SkillSupplyDemandCardProps) {
  const severity = gap >= 2 ? 'high' : gap >= 1 ? 'medium' : 'low';

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{skillName}</CardTitle>
        <CardDescription>Supply vs demand for team scenario</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Demand</span>
          <span>{demandLevel}/5</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Supply</span>
          <span>{supplyLevel}/5</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Gap</span>
          <Badge variant={severity === 'high' ? 'destructive' : 'outline'}>{gap}</Badge>
        </div>
        {notes && <p className="text-sm text-muted-foreground">{notes}</p>}
      </CardContent>
    </Card>
  );
}
