'use client';

import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DecisionEvidence } from '@/schemas/workforce-intelligence';

interface DecisionEvidenceListProps {
  evidence: DecisionEvidence[];
}

export function DecisionEvidenceList({ evidence }: DecisionEvidenceListProps) {
  if (evidence.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-sm text-muted-foreground">
          No evidence recorded for this decision yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Evidence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {evidence.map((item) => (
          <div key={item.id} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium">{item.label}</p>
              {item.confidence != null && (
                <ConfidenceIndicator value={item.confidence} size="sm" />
              )}
            </div>
            {item.detail && <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>}
            <p className="mt-1 text-xs text-muted-foreground">{item.evidenceType}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
