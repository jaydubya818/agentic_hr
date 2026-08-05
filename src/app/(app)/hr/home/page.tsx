import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  ClipboardCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { DataReadinessScorecard } from '@/components/hr/DataReadinessScorecard';
import { HrBarChartPanel } from '@/components/hr/HrCharts';
import { HrInsightList } from '@/components/hr/HrInsightCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { redirect } from 'next/navigation';
import { getSessionContext } from '@/lib/auth/session-context';
import { dataProvider } from '@/services/data-provider';

const severityVariant = {
  high: 'destructive',
  medium: 'secondary',
  low: 'outline',
} as const;

export default async function HrHomePage() {
  const session = await getSessionContext();
  if (!session) {
    redirect('/login');
  }

  const dashboard = dataProvider.getHrDashboard(session.organizationId);
  const readiness = dataProvider.getSkillsReadinessReport(session.organizationId);

  return (
    <>
      <PageHeader
        title="Workforce Enablement"
        description={`Organization growth summary for ${dashboard.organizationName} — aggregate insights without individual PII.`}
        breadcrumbs={['HR', 'HR Dashboard']}
      />

      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            label="Data readiness"
            value={`${dashboard.kpis.dataReadinessScore}`}
            hint="Org skills data quality score"
            icon={ClipboardCheck}
          />
          <KpiCard
            label="Plan adoption"
            value={`${dashboard.kpis.planAdoptionPct}%`}
            hint="Employees with active growth plans"
            icon={TrendingUp}
          />
          <KpiCard
            label="Mobility match rate"
            value={`${dashboard.kpis.mobilityMatchRatePct}%`}
            hint={`${dashboard.mobilitySummary.openOpportunities} open opportunities`}
            icon={Briefcase}
          />
          <KpiCard
            label="Workforce readiness"
            value={`${dashboard.kpis.workforceReadinessScore}`}
            hint="Role supply vs demand index"
            icon={BarChart3}
          />
          <KpiCard
            label="Manager enablement"
            value={`${dashboard.kpis.managerEnablementScore}`}
            hint="Coaching and plan support index"
            icon={Users}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <DataReadinessScorecard score={readiness.overall} />

          <HrBarChartPanel
            title="Growth plan adoption by department"
            description="Share of employees with active growth plans (FR-HR-003)"
            data={dashboard.adoptionByDepartment.map((d) => ({
              name: d.department,
              value: d.adoptionPct,
            }))}
            valueSuffix="%"
          />
        </div>

        {dashboard.lowReadinessAlerts.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle>Readiness alerts</CardTitle>
              <CardDescription>Departments below the readiness threshold</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              {dashboard.lowReadinessAlerts.map((alert) => (
                <Badge key={alert.department} variant="secondary">
                  {alert.department}: {alert.score}/100
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Top org skill gaps</CardTitle>
                <CardDescription>
                  Aggregate development gaps — not performance labels (FR-HR-005)
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" render={<Link href="/hr/workforce-readiness" />}>
                View readiness
                <ArrowRight className="size-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {dashboard.topSkillGaps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No significant org-wide skill gaps detected.</p>
              ) : (
                <ul className="space-y-3">
                  {dashboard.topSkillGaps.map((gap) => (
                    <li
                      key={gap.skillName}
                      className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-foreground">{gap.skillName}</p>
                        <p className="text-xs text-muted-foreground">
                          {gap.affectedDepartments} department
                          {gap.affectedDepartments === 1 ? '' : 's'} affected
                        </p>
                      </div>
                      <Badge variant={severityVariant[gap.severity]}>{gap.severity}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Internal mobility snapshot</CardTitle>
              <CardDescription>Pipeline indicators without individual tracking</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-semibold">{dashboard.mobilitySummary.openOpportunities}</p>
                <p className="text-xs text-muted-foreground">Open opportunities</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-semibold">{dashboard.mobilitySummary.matchRatePct}%</p>
                <p className="text-xs text-muted-foreground">Match rate</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-2xl font-semibold">{dashboard.mobilitySummary.employeesWithMatches}</p>
                <p className="text-xs text-muted-foreground">Employees with matches</p>
              </div>
              <div className="sm:col-span-3">
                <Button variant="outline" size="sm" render={<Link href="/hr/mobility-insights" />}>
                  Explore mobility insights
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Quick links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" render={<Link href="/hr/skills-readiness" />}>
              Skills readiness
            </Button>
            <Button variant="outline" size="sm" render={<Link href="/hr/talent-density" />}>
              Talent density
            </Button>
            <Button variant="outline" size="sm" render={<Link href="/hr/workforce-readiness" />}>
              Workforce readiness
            </Button>
          </CardContent>
        </Card>

        <HrInsightList recommendations={dashboard.recommendations} />
      </div>
    </>
  );
}
