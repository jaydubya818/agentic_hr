'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OutcomeComparison } from '@/services/decision-outcome-service';
import { summarizeOutcomeStatus } from '@/services/decision-outcome-service';

interface DecisionOutcomeComparisonProps {
  comparisons: OutcomeComparison[];
}

export function DecisionOutcomeComparison({ comparisons }: DecisionOutcomeComparisonProps) {
  if (comparisons.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          No expected outcomes defined yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Expected vs actual outcomes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {comparisons.map((comparison, index) => (
          <div key={comparison.expected?.id ?? index} className="rounded-lg border p-4 space-y-2">
            <p className="font-medium">{comparison.expected?.description}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Expected</p>
                <Badge variant="outline">
                  {summarizeOutcomeStatus(comparison.expected?.status ?? 'pending')}
                </Badge>
                {comparison.expected?.targetValue != null && (
                  <p className="text-sm">Target: {comparison.expected.targetValue}</p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Actual</p>
                {comparison.actual ? (
                  <>
                    <Badge variant="secondary">
                      {summarizeOutcomeStatus(comparison.actual.status)}
                    </Badge>
                    {comparison.actual.metricValue != null && (
                      <p className="text-sm">Recorded: {comparison.actual.metricValue}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Not recorded</p>
                )}
              </div>
            </div>
            <p className="text-sm">{comparison.summary}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
