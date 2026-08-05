import Link from 'next/link';
import { Target, TrendingUp } from 'lucide-react';
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

export default async function TeamCapabilityPlanPage() {
  const session = await getSessionContext();
  const managerEmployeeId = resolveActingManagerEmployeeId(session);
  const plan = managerEmployeeId
    ? dataProvider.getTeamCapabilityPlan(managerEmployeeId)
    : undefined;
  if (!plan) {
    return (
      <>
        <PageHeader
          title="Team Capability Plan"
          breadcrumbs={['Manager', 'Team Capability Plan']}
        />
        <EmptyState
          icon={Target}
          title="Plan unavailable"
          description="Unable to generate a capability plan for your team."
        />
      </>
    );
  }

  const milestoneDays = [30, 60, 90] as const;
  const timelineItems = plan.timelineItems.map((item, index) => ({
    id: `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0${index}`,
    growthPlanId: '55555555-5555-4555-8555-555555555551',
    title: `${item.quarter}: ${item.title}`,
    description: item.description,
    itemType: 'learning' as const,
    milestoneDay: milestoneDays[index] ?? 90,
    status: index === 0 ? ('in_progress' as const) : ('pending' as const),
    sortOrder: index,
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z',
  }));

  return (
    <>
      <PageHeader
        title="Team Capability Plan"
        description="Collective skill development goals, gaps, and recommended actions for your team."
        breadcrumbs={['Manager', 'Team Capability Plan']}
        actions={
          <Button variant="outline" size="sm" render={<Link href="/manager/team-skills" />}>
            Team skills
          </Button>
        }
      />

      <div className="space-y-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-accent" />
              Talent density (simplified)
            </CardTitle>
            <CardDescription>{plan.talentDensity.explanation}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-4">
              <p className="text-4xl font-semibold text-primary">{plan.talentDensity.score}</p>
              <span className="pb-1 text-sm text-muted-foreground">/ 100 indicative score</span>
            </div>
            <ConfidenceIndicator
              value={plan.talentDensity.confidence}
              size="sm"
              className="max-w-xs"
            />
            {plan.talentDensity.topSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {plan.talentDensity.topSkills.map((entry) => (
                  <SkillChip
                    key={entry.skill.id}
                    name={`${entry.skill.name} (${entry.depthScore})`}
                    source="confirmed"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Team goals</CardTitle>
            <CardDescription>Quarterly development priorities</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {plan.teamGoals.map((goal) => (
                <li key={goal} className="flex items-start gap-2 text-sm text-foreground">
                  <Badge variant="outline" className="mt-0.5 shrink-0">
                    Goal
                  </Badge>
                  {goal}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Collective gaps</CardTitle>
              <CardDescription>Skills the team should develop together</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.collectiveGaps.length === 0 ? (
                <p className="text-sm text-muted-foreground">No collective gaps identified.</p>
              ) : (
                plan.collectiveGaps.map((gap) => (
                  <div key={gap.skill.id} className="rounded-lg border p-4">
                    <p className="font-semibold">{gap.skill.name}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{gap.explanation}</p>
                    <ConfidenceIndicator
                      value={gap.confidence}
                      size="sm"
                      className="mt-3 w-32"
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Reskilling suggestions</CardTitle>
              <CardDescription>Team-wide learning actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {plan.reskillingSuggestions.map((item) => (
                <div key={item.skill.id} className="rounded-lg border p-4">
                  <p className="font-semibold">{item.suggestion}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.explanation}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Affects {item.affectedCount} team member(s)
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {plan.recommendedActions.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Recommended actions</h2>
            <div className="grid max-w-3xl gap-4">
              {plan.recommendedActions.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </section>
        )}

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Development timeline</CardTitle>
            <CardDescription>Quarterly capability milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <GrowthPlanTimeline items={timelineItems} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
