import Link from 'next/link';
import { Calendar, TrendingUp } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { GrowthPlanTimeline } from '@/components/shared/GrowthPlanTimeline';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveActingEmployeeId } from '@/lib/auth/acting-ids';
import { getSessionContext } from '@/lib/auth/session-context';
import { dataProvider } from '@/services/data-provider';

export default async function GrowthPlanPage() {
  const session = await getSessionContext();
  const employeeId = resolveActingEmployeeId(session);
  const { plan, items } = employeeId
    ? dataProvider.getGrowthPlan(employeeId)
    : { plan: undefined, items: [] };
  const targetRole = plan?.targetRoleId ? dataProvider.getRole(plan.targetRoleId) : undefined;
  const completedCount = items.filter((i) => i.status === 'completed').length;
  const inProgressCount = items.filter((i) => i.status === 'in_progress').length;

  return (
    <>
      <PageHeader
        title="My Growth Plan"
        description="Your 30/60/90 development timeline — focused milestones, not performance ratings."
        breadcrumbs={['Employee', 'Growth Plan']}
      />

      {!plan ? (
        <EmptyState
          icon={TrendingUp}
          title="No active growth plan"
          description="Select a career path and create a 30/60/90 plan to track your development milestones."
          action={
            <Button render={<Link href="/employee/career-paths" />}>
              Explore career paths
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle>{plan.title}</CardTitle>
                  {targetRole && (
                    <CardDescription>Target role: {targetRole.title}</CardDescription>
                  )}
                </div>
                <Badge
                  className={
                    plan.status === 'active'
                      ? 'bg-emerald-50 text-emerald-800'
                      : undefined
                  }
                >
                  {plan.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-4">
                  <Calendar className="size-5 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-xs text-muted-foreground">Start date</p>
                    <p className="font-medium">{plan.startDate}</p>
                  </div>
                </div>
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">Milestones completed</p>
                  <p className="text-2xl font-semibold">
                    {completedCount}/{items.length}
                  </p>
                </div>
                <div className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-xs text-muted-foreground">In progress</p>
                  <p className="text-2xl font-semibold">{inProgressCount}</p>
                </div>
              </div>
              {plan.endDate && (
                <p className="mt-4 text-sm text-muted-foreground">Target end date: {plan.endDate}</p>
              )}
            </CardContent>
          </Card>

          <section>
            <h2 className="mb-6 text-xl font-semibold">30 / 60 / 90 timeline</h2>
            <GrowthPlanTimeline items={items} />
          </section>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" render={<Link href="/employee/manager-conversation" />}>
              Prep for 1:1 discussion
            </Button>
            <Button variant="outline" render={<Link href="/employee/career-paths" />}>
              View career paths
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
