'use client';

import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RoleEvolutionDetail } from '@/services/team-scenario-service';

interface RoleEvolutionCardProps {
  scenario: RoleEvolutionDetail;
  currentRoleTitle: string;
}

export function RoleEvolutionCard({ scenario, currentRoleTitle }: RoleEvolutionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{scenario.title}</CardTitle>
        <CardDescription>{scenario.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline">{currentRoleTitle}</Badge>
          <span aria-hidden>→</span>
          <Badge variant="secondary">
            {scenario.futureRoleTitle ?? 'Evolved role'}
          </Badge>
        </div>
        {scenario.confidence != null && (
          <ConfidenceIndicator value={scenario.confidence} />
        )}
        {scenario.rationale && <p className="text-sm">{scenario.rationale}</p>}
        <div className="space-y-2">
          <p className="text-sm font-medium">Task changes</p>
          {scenario.taskChanges.map((change) => (
            <div key={change.id} className="rounded border p-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{change.changeType}</Badge>
                <Badge variant="secondary">{change.impactLevel} impact</Badge>
              </div>
              <p className="mt-1">{change.taskDescription}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
