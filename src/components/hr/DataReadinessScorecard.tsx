import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DataReadinessScore } from '@/services/data-provider/types';

interface DataReadinessScorecardProps {
  score: DataReadinessScore;
  title?: string;
  description?: string;
}

function DimensionBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

export function DataReadinessScorecard({
  score,
  title = 'Skills data readiness',
  description = 'Aggregate quality of skills, profiles, and growth plan coverage',
}: DataReadinessScorecardProps) {
  const confidence = (score.overallScore ?? 0) / 100;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-5xl font-semibold tracking-tight text-foreground">{score.overallScore}</p>
            <p className="mt-1 text-sm text-muted-foreground">Overall readiness score (0–100)</p>
          </div>
          <div className="w-full max-w-xs">
            <ConfidenceIndicator value={confidence} size="sm" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DimensionBar label="Confirmed skills" value={score.confirmedSkillsPct ?? 0} />
          <DimensionBar label="Profile completeness" value={score.profileCompletenessPct ?? 0} />
          <DimensionBar label="Role mapping" value={score.roleMappingPct ?? 0} />
          <DimensionBar label="Active growth plans" value={score.activePlansPct ?? 0} />
        </div>
      </CardContent>
    </Card>
  );
}
