import { DataReadinessScorecard } from '@/components/hr/DataReadinessScorecard';
import { AgentPanel } from '@/components/agent/AgentPanel';
import { HrBarChartPanel, HrLineChartPanel } from '@/components/hr/HrCharts';
import { HrInsightList } from '@/components/hr/HrInsightCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/auth/session-context';
import { dataProvider } from '@/services/data-provider';

export default async function SkillsReadinessPage() {
  const session = await getSessionContext();
  if (!session) {
    redirect('/login');
  }

  const report = dataProvider.getSkillsReadinessReport(session.organizationId);
  const { dimensions } = report;

  return (
    <>
      <PageHeader
        title="Skills Data Readiness"
        description="Data completeness, freshness, confidence, and confirmed vs inferred ratios across the organization."
        breadcrumbs={['HR', 'Skills Data Readiness']}
      />

      <div className="space-y-8">
        <DataReadinessScorecard score={report.overall} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Completeness" value={`${dimensions.completeness}%`} hint="Profile and preference coverage" />
          <KpiCard label="Freshness" value={`${dimensions.freshness}%`} hint="Recency of skills data signals" />
          <KpiCard label="Confidence" value={`${dimensions.confidence}%`} hint="Confirmed skill attestations" />
          <KpiCard
            label="Confirmed / inferred"
            value={`${dimensions.confirmedVsInferred.confirmedPct}% / ${dimensions.confirmedVsInferred.inferredPct}%`}
            hint="Org-wide skill source ratio"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <HrLineChartPanel
            title="Readiness trend"
            description="Org readiness score over recent months"
            data={report.trends}
          />

          <HrBarChartPanel
            title="Confirmed vs inferred skills"
            description="Aggregate source distribution (no individual data)"
            data={[
              { name: 'Confirmed', value: dimensions.confirmedVsInferred.confirmedPct },
              { name: 'Inferred', value: dimensions.confirmedVsInferred.inferredPct },
            ]}
            valueSuffix="%"
          />
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Department breakdown</CardTitle>
            <CardDescription>Readiness scores by organizational unit</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Department</th>
                  <th className="pb-3 pr-4 font-medium">Overall</th>
                  <th className="pb-3 pr-4 font-medium">Confirmed skills</th>
                  <th className="pb-3 pr-4 font-medium">Profiles</th>
                  <th className="pb-3 pr-4 font-medium">Role mapping</th>
                  <th className="pb-3 font-medium">Active plans</th>
                </tr>
              </thead>
              <tbody>
                {report.byDepartment.map((dept) => (
                  <tr key={dept.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{dept.departmentName}</td>
                    <td className="py-3 pr-4">{dept.overallScore}</td>
                    <td className="py-3 pr-4">{dept.confirmedSkillsPct ?? '—'}%</td>
                    <td className="py-3 pr-4">{dept.profileCompletenessPct ?? '—'}%</td>
                    <td className="py-3 pr-4">{dept.roleMappingPct ?? '—'}%</td>
                    <td className="py-3">{dept.activePlansPct ?? '—'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {report.missingDataAreas.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Missing data areas</CardTitle>
              <CardDescription>Priority improvements for readiness quality</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                {report.missingDataAreas.map((area) => (
                  <li key={area}>{area}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <HrInsightList recommendations={report.recommendations} />

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Taxonomy suggestions</h2>
            <p className="text-sm text-muted-foreground">
              Human-in-the-loop taxonomy proposals from the Skills Intelligence agent — suggestions
              are not applied automatically.
            </p>
          </div>
          <AgentPanel
            agentId="skills-intelligence"
            title="Taxonomy assistant"
            description="Propose skill taxonomy improvements for HR review."
            context={{ contextType: 'hr-skills-readiness-taxonomy' }}
          />
        </section>
      </div>
    </>
  );
}
