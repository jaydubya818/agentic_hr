'use client';

import { ArrowRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { ContextGraphEdgeView } from '@/services/context-graph-service';

interface RelationshipCardProps {
  edge: ContextGraphEdgeView;
}

export function RelationshipCard({ edge }: RelationshipCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="space-y-2 pt-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{edge.source.label}</span>
          <Badge variant="outline">{edge.relationshipType.replace(/_/g, ' ')}</Badge>
          <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
          <span className="font-medium">{edge.target.label}</span>
        </div>
        {edge.label && <p className="text-sm text-muted-foreground">{edge.label}</p>}
        {edge.explanation && <p className="text-sm">{edge.explanation}</p>}
        {edge.strength != null && (
          <p className="text-xs text-muted-foreground">
            Strength: {Math.round(edge.strength * 100)}%
          </p>
        )}
      </CardContent>
    </Card>
  );
}
