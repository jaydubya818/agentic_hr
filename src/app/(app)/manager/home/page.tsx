import Link from 'next/link';
import { ArrowRight, MessageSquare, Target, Users } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { RecommendationCard } from '@/components/shared/RecommendationCard';
import { SkillChip } from '@/components/shared/SkillChip';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveActingManagerEmployeeId } from '@/lib/auth/acting-ids';
import { getSessionContext } from '@/lib/auth/session-context';
import { dataProvider } from '@/services/data-provider';

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-6">
        <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        <p className="mt-1 text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default async function ManagerHomePage() {
  const session = await getSessionContext();
  const managerEmployeeId = resolveActingManagerEmployeeId(session);
  const dashboard = managerEmployeeId
    ? dataProvider.getManagerDashboard(managerEmployeeId)
    : undefined;
  if (!dashboard) {
    return (
      <>
        <PageHeader title="Manager Home" breadcrumbs={['Manager', 'Manager Home']} />
        <EmptyState
          title="Manager profile not found"
          description="Unable to load team dashboard for the demo manager."
        />
      </>
    );
  }

  const { managerUser, team, directReports, growthPlanAdoptionPercent, skillsOverview } =
    dashboard;
  const firstName = managerUser.fullName.split(' ')[0] ?? 'there';

  return (
    <>
      <PageHeader
        title={`Good morning, ${firstName}`}
        description="Your team growth command center — track adoption, skill coverage, and development actions."
        breadcrumbs={['Manager', 'Manager Home']}
        actions={
          <Button variant="outline" size="sm" render={<Link href="/manager/team-skills" />}>
            Team skills
            <ArrowRight className="size-4" />
          </Button>
        }
      />

      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Direct reports"
            value={String(directReports.length)}
            hint={team?.name ?? 'Platform Engineering'}
          />
          <KpiCard
            label="Growth plan adoption"
            value={`${growthPlanAdoptionPercent}%`}
            hint="Active plans across your team"
          />
          <KpiCard
            label="Team skills tracked"
            value={String(skillsOverview.total)}
            hint={`${skillsOverview.confirmed} confirmed · ${skillsOverview.inferred} inferred`}
          />
          <KpiCard
            label="Conversations due"
            value={String(dashboard.conversationsDue.length)}
            hint="1:1 topics flagged this week"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="shadow-sm xl:col-span-2">
            <CardHeader>
              <CardTitle>Team growth summary</CardTitle>
              <CardDescription>
                Quick status for each direct report — development-focused, not performance ratings.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {directReports.map((member) => (
                <Link
                  key={member.employee.id}
                  href={`/manager/employee/${member.employee.id}`}
                  className="rounded-lg border p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{member.user.fullName}</p>
                      <p className="text-sm text-muted-foreground">{member.employee.jobTitle}</p>
                    </div>
                    <Badge variant={member.growthPlanStatus === 'active' ? 'default' : 'secondary'}>
                      {member.growthPlanStatus ?? 'No plan'}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {member.skillsCount} skills · {member.pendingRecommendations} pending actions
                  </p>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Skills overview</CardTitle>
              <CardDescription>Confirmed vs inferred across your team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Confirmed</span>
                <span className="font-medium">{skillsOverview.confirmed}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Inferred (needs validation)</span>
                <span className="font-medium">{skillsOverview.inferred}</span>
              </div>
              {dashboard.skillGapAlerts[0] && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                  <p className="text-sm font-medium text-amber-900">Skill gap alert</p>
                  <p className="mt-1 text-xs text-amber-800">
                    {dashboard.skillGapAlerts[0].skill.name} —{' '}
                    {dashboard.skillGapAlerts[0].affectedEmployeeIds.length} team member(s) below
                    target
                  </p>
                </div>
              )}
              <Button variant="outline" size="sm" render={<Link href="/manager/team-skills" />}>
                View team skills matrix
              </Button>
            </CardContent>
          </Card>
        </div>

        {dashboard.conversationsDue.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="size-5 text-primary" />
                Conversations due
              </CardTitle>
              <CardDescription>Development topics to cover in upcoming 1:1s</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              {dashboard.conversationsDue.map((item) => (
                <div
                  key={item.employeeId}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.employeeName}</p>
                    <p className="text-sm text-muted-foreground">{item.reason}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.dueLabel}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/manager/employee/${item.employeeId}`} />}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Suggested manager actions</h2>
          <div className="grid max-w-3xl gap-4">
            {dashboard.teamActionRecommendations.map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </section>

        {dashboard.stretchOpportunities.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Stretch opportunities</CardTitle>
              <CardDescription>
                Internal development assignments for your team — not hiring decisions
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {dashboard.stretchOpportunities.map((opp) => (
                <div key={opp.id} className="rounded-lg border p-4">
                  <p className="font-semibold text-foreground">{opp.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{opp.description}</p>
                  <Badge variant="secondary" className="mt-3">
                    {opp.department}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {dashboard.skillGapAlerts.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Team skill gaps</CardTitle>
              <CardDescription>Collective development opportunities</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {dashboard.skillGapAlerts.map((gap) => (
                <SkillChip
                  key={gap.skill.id}
                  name={`${gap.skill.name} (L${gap.requiredLevel} target)`}
                  source="inferred"
                />
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-3">
          <Button render={<Link href="/manager/coaching" />}>
            <Users className="size-4" />
            Coaching center
          </Button>
          <Button variant="outline" render={<Link href="/manager/team-capability-plan" />}>
            <Target className="size-4" />
            Team capability plan
          </Button>
        </div>
      </div>
    </>
  );
}
