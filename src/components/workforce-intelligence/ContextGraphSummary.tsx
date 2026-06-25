'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ContextGraph } from '@/services/context-graph-service';

interface ContextGraphSummaryProps {
  graph: ContextGraph;
}

export function ContextGraphSummary({ graph }: ContextGraphSummaryProps) {
  const relationshipCounts = graph.edges.reduce<Record<string, number>>((acc, edge) => {
    acc[edge.relationshipType] = (acc[edge.relationshipType] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Context graph</CardTitle>
        <CardDescription>
          {graph.center.label} — {graph.nodes.length} connected entities, {graph.edges.length}{' '}
          relationships
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {Object.entries(relationshipCounts).map(([type, count]) => (
          <Badge key={type} variant="secondary">
            {type.replace(/_/g, ' ')} ({count})
          </Badge>
        ))}
      </CardContent>
    </Card>
  );
}
