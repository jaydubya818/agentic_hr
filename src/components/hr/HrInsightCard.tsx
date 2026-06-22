import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { HrInsightRecommendation } from '@/services/data-provider/types';

interface HrInsightCardProps {
  recommendation: HrInsightRecommendation;
}

export function HrInsightCard({ recommendation }: HrInsightCardProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{recommendation.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{recommendation.explanation}</p>
        <ConfidenceIndicator value={recommendation.confidence} size="sm" />
      </CardContent>
    </Card>
  );
}

interface HrInsightListProps {
  recommendations: HrInsightRecommendation[];
  title?: string;
}

export function HrInsightList({ recommendations, title = 'Recommended actions' }: HrInsightListProps) {
  if (recommendations.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {recommendations.map((rec) => (
          <HrInsightCard key={rec.title} recommendation={rec} />
        ))}
      </div>
    </section>
  );
}
