import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { HrBarChartPanel } from '@/components/hr/HrCharts';
import { HrInsightList } from '@/components/hr/HrInsightCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/auth/session-context';
import { dataProvider } from '@/services/data-provider';

const trendLabel = {
  up: 'Growing',
  stable: 'Stable',
  down: 'Needs attention',
} as const;

export default async function TalentDensityPage() {
  const session = await getSessionContext();
  if (!session) {
    redirect('/login');
  }

  const report = dataProvider.getTalentDensityReport(session.organizationId);

  return (
    <>
      <PageHeader
        title="Talent Density"
        description="Simplified talent concentration indicators — depth of skills and critical coverage, not individual rankings."
        breadcrumbs={['HR', 'Talent Density']}
      />

      <div className="space-y-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Overall density indicator</CardTitle>
            <CardDescription>{report.explanation}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-5xl font-semibold tracking-tight">{report.overallDensityScore}</p>
              <p className="mt-1 text-sm text-muted-foreground">Simplified MVP density score</p>
            </div>
            <div className="w-full max-w-xs">
              <ConfidenceIndicator value={report.confidence} size="sm" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <KpiCard
            label="Pipeline strength"
            value={`${report.pipelineStrength}`}
            hint="Plans, mobility, and readiness combined"
          />
          <KpiCard
            label="Skills tracked"
            value={String(report.topSkillsByDepth.length)}
            hint="Top skills by average depth"
          />
        </div>

        <HrBarChartPanel
          title="Top skills by depth"
          description="Average proficiency and employee coverage (aggregate)"
          data={report.topSkillsByDepth.map((s) => ({
            name: s.skillName.length > 14 ? `${s.skillName.slice(0, 12)}…` : s.skillName,
            value: s.avgProficiency,
          }))}
        />

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Department density</CardTitle>
              <CardDescription>Relative skill depth by department</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {report.departmentDensity.map((dept) => (
                <div
                  key={dept.department}
                  className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{dept.department}</p>
                    <p className="text-xs text-muted-foreground">{trendLabel[dept.trend]}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{dept.trend}</Badge>
                    <span className="text-lg font-semibold">{dept.densityScore}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Critical skill coverage</CardTitle>
              <CardDescription>Coverage vs target for priority capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.criticalSkillCoverage.map((skill) => (
                <div key={skill.skillName} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{skill.skillName}</span>
                    <span className="text-muted-foreground">
                      {skill.coveragePct}% / {skill.targetPct}% target
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${Math.min(100, skill.coveragePct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <HrInsightList recommendations={report.recommendations} />
      </div>
    </>
  );
}
