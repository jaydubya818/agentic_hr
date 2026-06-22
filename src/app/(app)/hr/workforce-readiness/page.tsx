import { HrBarChartPanel } from '@/components/hr/HrCharts';
import { HrInsightList } from '@/components/hr/HrInsightCard';
import { HrWorkforceAgentSection } from '@/components/hr/HrWorkforceAgentSection';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dataProvider } from '@/services/data-provider';

const demandVariant = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
} as const;

const strategyLabels = {
  build: 'Build',
  buy: 'Buy',
  borrow: 'Borrow',
  redeploy: 'Redeploy',
} as const;

export default function WorkforceReadinessPage() {
  const report = dataProvider.getWorkforceReadinessReport();

  return (
    <>
      <PageHeader
        title="Workforce Readiness"
        description="Capability gaps, readiness indicators, and build/buy/borrow/redeploy planning placeholders."
        breadcrumbs={['HR', 'Workforce Readiness']}
      />

      <div className="space-y-8">
        <KpiCard
          label="Overall readiness score"
          value={String(report.overallReadinessScore)}
          hint="Average readiness across active role families"
          className="max-w-sm"
        />

        <HrBarChartPanel
          title="Capability gaps"
          description="Skills where role demand exceeds aggregate supply"
          data={report.capabilityGaps.map((g) => ({
            name: g.skillName.length > 12 ? `${g.skillName.slice(0, 10)}…` : g.skillName,
            value: g.gap,
          }))}
        />

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Role readiness</CardTitle>
            <CardDescription>Demand level and readiness by role family</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Role</th>
                  <th className="pb-3 pr-4 font-medium">Department</th>
                  <th className="pb-3 pr-4 font-medium">Demand</th>
                  <th className="pb-3 pr-4 font-medium">Readiness</th>
                  <th className="pb-3 font-medium">Critical gaps</th>
                </tr>
              </thead>
              <tbody>
                {report.roleReadiness.map((role) => (
                  <tr key={role.roleTitle} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{role.roleTitle}</td>
                    <td className="py-3 pr-4">{role.department}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={demandVariant[role.demandLevel]}>{role.demandLevel}</Badge>
                    </td>
                    <td className="py-3 pr-4">{role.readinessScore}</td>
                    <td className="py-3 text-muted-foreground">
                      {role.criticalGaps.length > 0 ? role.criticalGaps.join(', ') : 'None identified'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(report.strategies) as Array<keyof typeof report.strategies>).map((key) => (
            <Card key={key} className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">{strategyLabels[key]}</CardTitle>
                <CardDescription>Planning placeholder</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
                  {report.strategies[key].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <HrInsightList recommendations={report.recommendations} />

        <HrWorkforceAgentSection />
      </div>
    </>
  );
}
