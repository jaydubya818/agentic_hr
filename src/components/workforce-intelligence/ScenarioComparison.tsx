'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TeamScenarioDetail } from '@/services/team-scenario-service';

interface ScenarioComparisonProps {
  current: TeamScenarioDetail | null;
  future: TeamScenarioDetail | null;
  skillDeltas: Array<{
    skillId: string;
    currentGap: number | null;
    futureGap: number | null;
    delta: number | null;
  }>;
}

export function ScenarioComparison({ current, future, skillDeltas }: ScenarioComparisonProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[current, future].map((scenario, index) => (
        <Card key={scenario?.id ?? index}>
          <CardHeader>
            <CardTitle className="text-base">
              {scenario?.title ?? (index === 0 ? 'Current state' : 'Future state')}
            </CardTitle>
            <CardDescription>{scenario?.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {scenario?.roles.map((role) => (
              <div key={role.id} className="flex justify-between text-sm">
                <span>Role headcount</span>
                <Badge variant="outline">{role.headcount}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Skill gap deltas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {skillDeltas.map((delta) => (
            <div key={delta.skillId} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-mono text-xs">{delta.skillId.slice(0, 8)}…</span>
              <span>
                {delta.currentGap ?? '—'} → {delta.futureGap ?? '—'}
              </span>
              {delta.delta != null && (
                <Badge variant={delta.delta < 0 ? 'secondary' : 'outline'}>
                  Δ {delta.delta}
                </Badge>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
