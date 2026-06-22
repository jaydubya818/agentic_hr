import { HrBarChartPanel, HrFunnelChartPanel } from '@/components/hr/HrCharts';
import { HrInsightList } from '@/components/hr/HrInsightCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dataProvider } from '@/services/data-provider';

export default function MobilityInsightsPage() {
  const insights = dataProvider.getMobilityInsights();

  return (
    <>
      <PageHeader
        title="Internal Mobility"
        description="Mobility interest, match volume, blockers, and pipeline indicators — aggregate analytics only."
        breadcrumbs={['HR', 'Internal Mobility']}
      />

      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Open opportunities"
            value={String(insights.openOpportunities)}
            hint="Internal roles and stretch assignments"
          />
          <KpiCard
            label="Match rate"
            value={`${insights.matchRatePct}%`}
            hint="Employees with ≥1 viable match"
          />
          <KpiCard
            label="Mobility interest"
            value={String(insights.employeesWithInterest)}
            hint="Active career goal signals"
          />
          <KpiCard
            label="Pipeline stages"
            value={String(insights.pipelineStages.length)}
            hint="Funnel tracking (mock)"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <HrFunnelChartPanel
            title="Mobility pipeline"
            description="Aggregate funnel from interest to placement"
            stages={insights.pipelineStages}
          />

          <HrBarChartPanel
            title="Top skills in demand"
            description="Skills required across open internal opportunities"
            data={insights.topSkillsInDemand.map((s) => ({
              name: s.skillName,
              value: s.opportunityCount,
            }))}
          />
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Pipeline blockers</CardTitle>
            <CardDescription>Aggregate counts — not tied to named individuals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.blockers.map((blocker) => (
              <div key={blocker.label} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">{blocker.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{blocker.explanation}</p>
                  </div>
                  <p className="text-2xl font-semibold text-foreground">{blocker.count}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <HrInsightList recommendations={insights.recommendations} />
      </div>
    </>
  );
}
