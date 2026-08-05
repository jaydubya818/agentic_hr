import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MessageSquare, Target } from 'lucide-react';
import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { EmptyState } from '@/components/shared/EmptyState';
import { GrowthPlanTimeline } from '@/components/shared/GrowthPlanTimeline';
import { RecommendationCard } from '@/components/shared/RecommendationCard';
import { SkillChip } from '@/components/shared/SkillChip';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveActingManagerEmployeeId } from '@/lib/auth/acting-ids';
import { getSessionContext } from '@/lib/auth/session-context';
import { dataProvider } from '@/services/data-provider';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ManagerEmployeeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSessionContext();
  // Direct-report access is checked against the session's own employee; the
  // demo-manager identity applies only in mock mode.
  const managerEmployeeId = resolveActingManagerEmployeeId(session);
  const summary = managerEmployeeId
    ? dataProvider.getEmployeeSummaryForManager(managerEmployeeId, id)
    : undefined;

  if (!summary) {
    redirect('/forbidden');
  }

  const {
    user,
    employee,
    profile,
    skills,
    careerGoals,
    growthPlan,
    growthPlanItems,
    coachingActions,
    stretchOpportunities,
    coachingPrompts,
  } = summary;

  const activeGoal = careerGoals.find((g) => g.status === 'active');
  const targetRole = activeGoal?.targetRoleId
    ? dataProvider.getRole(activeGoal.targetRoleId)
    : undefined;

  return (
    <>
      <PageHeader
        title={user.fullName}
        description={`${employee.jobTitle} · Growth summary for managers`}
        breadcrumbs={['Manager', 'Employee', user.fullName]}
        actions={
          <Button variant="outline" size="sm" render={<Link href="/manager/coaching" />}>
            Coaching prompts
          </Button>
        }
      />

      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <p className="text-3xl font-semibold capitalize">
                {growthPlan?.status ?? 'none'}
              </p>
              <p className="mt-1 text-sm font-medium">Growth plan status</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <p className="text-3xl font-semibold">{skills.length}</p>
              <p className="mt-1 text-sm font-medium">Skills tracked</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <p className="text-3xl font-semibold">{targetRole?.title ?? 'Not set'}</p>
              <p className="mt-1 text-sm font-medium">Career goal</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Profile summary</CardTitle>
              <CardDescription>Manager-visible growth context</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile?.careerSummary ? (
                <p className="text-sm text-muted-foreground">{profile.careerSummary}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No career summary on file — encourage your report to complete their growth profile.
                </p>
              )}
              {activeGoal && targetRole && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-sm font-medium text-foreground">Active goal</p>
                  <p className="text-sm text-muted-foreground">
                    {targetRole.title} · {activeGoal.timelineMonths} month horizon
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>Confirmed and inferred — manager view</CardDescription>
            </CardHeader>
            <CardContent>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((es) => (
                    <SkillChip
                      key={es.id}
                      name={es.skill.name}
                      source={es.source}
                      proficiencyLevel={es.proficiencyLevel}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No skills recorded"
                  description="Skills will appear as your report builds their profile."
                />
              )}
            </CardContent>
          </Card>
        </div>

        {growthPlan && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Growth plan</CardTitle>
              <CardDescription>{growthPlan.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <GrowthPlanTimeline items={growthPlanItems} compact />
            </CardContent>
          </Card>
        )}

        {coachingActions.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Coaching actions</h2>
            <div className="grid max-w-3xl gap-4">
              {coachingActions.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </section>
        )}

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-5 text-primary" />
              Coaching prompts
            </CardTitle>
            <CardDescription>Conversation starters grounded in their growth data</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {coachingPrompts.map((prompt) => (
              <div key={prompt.id} className="rounded-lg border p-4">
                <Badge variant="secondary" className="mb-2 capitalize">
                  {prompt.category.replace('_', ' ')}
                </Badge>
                <p className="font-medium text-foreground">{prompt.prompt}</p>
                <p className="mt-2 text-sm text-muted-foreground">{prompt.explanation}</p>
                <div className="mt-3">
                  <ConfidenceIndicator value={prompt.confidence} size="sm" className="w-32" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {stretchOpportunities.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="size-5 text-accent" />
                Stretch opportunities
              </CardTitle>
              <CardDescription>Development assignments — not promotion or hiring decisions</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {stretchOpportunities.map((opp) => (
                <div key={opp.id} className="rounded-lg border p-4">
                  <p className="font-semibold text-foreground">{opp.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{opp.explanation}</p>
                  <div className="mt-3">
                    <ConfidenceIndicator value={opp.confidence} size="sm" className="w-32" />
                  </div>
                  {opp.evidence.length > 0 && (
                    <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                      {opp.evidence.map((e) => (
                        <li key={e.id}>
                          {e.label}: {e.detail}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
