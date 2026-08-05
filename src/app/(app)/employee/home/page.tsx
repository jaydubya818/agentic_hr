import Link from 'next/link';
import { ArrowRight, Compass, MessageSquare, Target, TrendingUp } from 'lucide-react';
import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { EmptyState } from '@/components/shared/EmptyState';
import { GrowthPlanTimeline } from '@/components/shared/GrowthPlanTimeline';
import { RecommendationCard } from '@/components/shared/RecommendationCard';
import { SkillChip } from '@/components/shared/SkillChip';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateProfileCompletion } from '@/lib/employee/profile-completion';
import { resolveActingEmployeeId, resolveActingUserId } from '@/lib/auth/acting-ids';
import { getSessionContext } from '@/lib/auth/session-context';
import { dataProvider } from '@/services/data-provider';

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
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

export default async function EmployeeHomePage() {
  const session = await getSessionContext();
  const employeeId = resolveActingEmployeeId(session);
  const userId = resolveActingUserId(session);

  if (!employeeId || !userId) {
    return (
      <>
        <PageHeader title="My Growth Home" breadcrumbs={['Employee', 'My Growth Home']} />
        <EmptyState
          title="No employee record"
          description="Your account is not linked to an employee record yet, so growth data cannot be shown."
        />
      </>
    );
  }

  const user = dataProvider.getCurrentUser(userId);
  const employee = dataProvider.getEmployee(employeeId);
  const profile = dataProvider.getEmployeeProfile(employeeId);
  const employeeSkills = dataProvider.getEmployeeSkills(employeeId);
  const skills = dataProvider.getSkills();
  const skillById = new Map(skills.map((s) => [s.id, s]));
  const careerGoals = dataProvider.getCareerGoals(employeeId);
  const activeGoal = careerGoals.find((g) => g.status === 'active');
  const { plan, items } = dataProvider.getGrowthPlan(employeeId);
  const recommendations = dataProvider.getRecommendations(employeeId).filter(
    (r) => r.status === 'pending',
  );
  const careerPaths = dataProvider.getCareerPaths(employeeId);
  const currentRole = employee?.currentRoleId
    ? dataProvider.getRole(employee.currentRoleId)
    : undefined;

  const profileCompletion = calculateProfileCompletion({
    profile,
    skillsCount: employeeSkills.length,
    careerGoal: activeGoal,
    growthPlan: plan,
  });

  const confirmedCount = employeeSkills.filter((es) => es.source === 'confirmed').length;
  const inferredCount = employeeSkills.filter((es) => es.source === 'inferred').length;
  const completedMilestones = items.filter((i) => i.status === 'completed').length;
  const topGaps = careerPaths[0]?.skillGaps.slice(0, 3) ?? [];

  const firstName = user?.fullName.split(' ')[0] ?? 'there';

  return (
    <>
      <PageHeader
        title={`Good morning, ${firstName}`}
        description="Your growth dashboard — track skills, explore paths, and take your next development step."
        breadcrumbs={['Employee', 'My Growth Home']}
      />

      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Growth plan"
            value={plan ? plan.status.replace('_', ' ') : 'None'}
            hint={plan ? `${completedMilestones}/${items.length} milestones done` : 'Create a plan'}
          />
          <KpiCard
            label="Skills tracked"
            value={String(employeeSkills.length)}
            hint={`${confirmedCount} confirmed · ${inferredCount} inferred`}
          />
          <KpiCard
            label="Profile complete"
            value={`${profileCompletion}%`}
            hint="Onboarding, goals, and preferences"
          />
          <KpiCard
            label="Pending actions"
            value={String(recommendations.length)}
            hint="Recommendations awaiting review"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Card className="shadow-sm xl:col-span-2">
            <CardHeader>
              <CardTitle>Profile completion</CardTitle>
              <CardDescription>
                {currentRole?.title ?? employee?.jobTitle} · {employee?.department ?? 'Engineering'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall completion</span>
                  <span className="font-medium">{profileCompletion}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>
              {profile?.careerSummary && (
                <p className="text-sm text-muted-foreground">{profile.careerSummary}</p>
              )}
              <Button variant="outline" size="sm" render={<Link href="/employee/growth-profile" />}>
                View growth profile
                <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Skills snapshot</CardTitle>
              <CardDescription>Confirmed and inferred capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {employeeSkills.map((es) => {
                  const skill = skillById.get(es.skillId);
                  if (!skill) return null;
                  if (es.source === 'inferred' && profile && !profile.inferredSkillsVisible) {
                    return null;
                  }
                  return (
                    <SkillChip
                      key={es.id}
                      name={skill.name}
                      source={es.source}
                      proficiencyLevel={es.proficiencyLevel}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {plan && (
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Active growth plan</CardTitle>
                <CardDescription>{plan.title}</CardDescription>
              </div>
              <Button variant="outline" size="sm" render={<Link href="/employee/growth-plan" />}>
                View plan
              </Button>
            </CardHeader>
            <CardContent>
              <GrowthPlanTimeline items={items} compact />
            </CardContent>
          </Card>
        )}

        {topGaps.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Top skill gaps</CardTitle>
              <CardDescription>
                Development opportunities toward {careerPaths[0]?.role.title ?? 'your target path'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {topGaps.map((gap) => (
                <SkillChip
                  key={gap.skill.id}
                  name={`${gap.skill.name} (L${gap.currentLevel ?? 0} → L${gap.requiredLevel})`}
                  source="inferred"
                />
              ))}
            </CardContent>
          </Card>
        )}

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recommended actions</h2>
            <Button variant="ghost" size="sm" render={<Link href="/employee/career-paths" />}>
              Explore paths
            </Button>
          </div>
          <div className="grid max-w-3xl gap-4">
            {recommendations.slice(0, 3).map((rec) => (
              <RecommendationCard key={rec.id} recommendation={rec} />
            ))}
          </div>
        </section>

        {careerPaths.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Career paths preview</CardTitle>
              <CardDescription>Paths matched to your skills and goals</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {careerPaths.map((path) => (
                <div key={path.role.id} className="rounded-lg border p-4">
                  <p className="font-semibold text-foreground">{path.role.title}</p>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{path.explanation}</p>
                  <div className="mt-3">
                    <ConfidenceIndicator value={path.confidence} size="sm" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-3">
          <Button render={<Link href="/employee/career-paths" />}>
            <Compass className="size-4" />
            View career paths
          </Button>
          <Button variant="outline" render={<Link href="/employee/growth-plan" />}>
            <TrendingUp className="size-4" />
            My growth plan
          </Button>
          <Button variant="outline" render={<Link href="/employee/manager-conversation" />}>
            <MessageSquare className="size-4" />
            Prep for 1:1
          </Button>
          <Button variant="outline" render={<Link href="/employee/growth-profile" />}>
            <Target className="size-4" />
            Set career goal
          </Button>
        </div>
      </div>
    </>
  );
}
