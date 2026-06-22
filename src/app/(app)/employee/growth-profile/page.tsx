import Link from 'next/link';
import { ArrowRight, Briefcase, Target } from 'lucide-react';
import { EmployeeAgentSection } from '@/components/agent/EmployeeAgentSection';
import { EmptyState } from '@/components/shared/EmptyState';
import { RecommendationCard } from '@/components/shared/RecommendationCard';
import { SkillChip } from '@/components/shared/SkillChip';
import { InferredSkillReviewRow } from '@/components/skills/InferredSkillReviewRow';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { calculateProfileCompletion } from '@/lib/employee/profile-completion';
import { DEMO_EMPLOYEE_ID, DEMO_USER_ID } from '@/lib/mock/ids';
import { dataProvider } from '@/services/data-provider';

const PREFERENCE_LABELS: Record<string, string> = {
  growthFocus: 'Growth focus',
  mobilityInterest: 'Mobility interest',
};

function formatPreferenceKey(key: string): string {
  return (
    PREFERENCE_LABELS[key] ??
    key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function formatPreferenceValue(value: unknown): string {
  if (typeof value !== 'string') return String(value);
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function GrowthProfilePage() {
  const user = dataProvider.getCurrentUser(DEMO_USER_ID);
  const employee = dataProvider.getEmployee(DEMO_EMPLOYEE_ID);
  const profile = dataProvider.getEmployeeProfile(DEMO_EMPLOYEE_ID);
  const employeeSkills = dataProvider.getEmployeeSkills(DEMO_EMPLOYEE_ID);
  const skills = dataProvider.getSkills();
  const skillById = new Map(skills.map((s) => [s.id, s]));
  const careerGoals = dataProvider.getCareerGoals(DEMO_EMPLOYEE_ID);
  const activeGoal = careerGoals.find((g) => g.status === 'active');
  const targetRole = activeGoal?.targetRoleId
    ? dataProvider.getRole(activeGoal.targetRoleId)
    : undefined;
  const currentRole = employee?.currentRoleId
    ? dataProvider.getRole(employee.currentRoleId)
    : undefined;
  const { plan } = dataProvider.getGrowthPlan(DEMO_EMPLOYEE_ID);
  const recommendations = dataProvider.getRecommendations(DEMO_EMPLOYEE_ID).slice(0, 2);

  const profileCompletion = calculateProfileCompletion({
    profile,
    skillsCount: employeeSkills.length,
    careerGoal: activeGoal,
    growthPlan: plan,
  });

  const confirmedSkills = employeeSkills.filter((es) => es.source === 'confirmed');
  const inferredSkills = employeeSkills.filter((es) => es.source === 'inferred');
  const showInferred = profile?.inferredSkillsVisible ?? true;
  const preferences = profile?.preferences ?? {};

  return (
    <>
      <PageHeader
        title="Growth Profile"
        description="Your skills, career interests, goals, and growth preferences in one place."
        breadcrumbs={['Employee', 'Growth Profile']}
        actions={
          <Badge variant="outline" className="text-sm">
            {profileCompletion}% complete
          </Badge>
        }
      />

      <div className="space-y-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>{user?.fullName}</CardTitle>
            <CardDescription>
              {currentRole?.title ?? employee?.jobTitle}
              {employee?.department ? ` · ${employee.department}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile?.careerSummary && (
              <p className="text-sm leading-relaxed text-muted-foreground">{profile.careerSummary}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                <Briefcase className="mr-1 size-3" />
                {currentRole?.title ?? 'Current role'}
              </Badge>
              {employee?.hireDate && (
                <Badge variant="outline">Joined {employee.hireDate}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Skills</h2>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Confirmed skills</CardTitle>
                <CardDescription>Self-assessed and validated capabilities</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {confirmedSkills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No confirmed skills yet.</p>
                ) : (
                  confirmedSkills.map((es) => {
                    const skill = skillById.get(es.skillId);
                    if (!skill) return null;
                    return (
                      <SkillChip
                        key={es.id}
                        name={skill.name}
                        source="confirmed"
                        proficiencyLevel={es.proficiencyLevel}
                      />
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Inferred skills</CardTitle>
                <CardDescription>Suggested from projects and feedback — review with your manager</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!showInferred ? (
                  <p className="text-sm text-muted-foreground">Inferred skills are hidden in your preferences.</p>
                ) : inferredSkills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No inferred skills yet.</p>
                ) : (
                  inferredSkills.map((es) => {
                    const skill = skillById.get(es.skillId);
                    if (!skill) return null;
                    return (
                      <InferredSkillReviewRow
                        key={es.id}
                        employeeSkillId={es.id}
                        skillName={skill.name}
                        proficiencyLevel={es.proficiencyLevel}
                      />
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Career interests & goals</h2>
          {activeGoal ? (
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{activeGoal.title}</CardTitle>
                    {targetRole && (
                      <CardDescription>Target role: {targetRole.title}</CardDescription>
                    )}
                  </div>
                  <Badge>{activeGoal.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeGoal.description && (
                  <p className="text-sm text-muted-foreground">{activeGoal.description}</p>
                )}
                {activeGoal.timelineMonths && (
                  <p className="text-sm text-muted-foreground">
                    Timeline: {activeGoal.timelineMonths} months
                  </p>
                )}
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={Target}
              title="No active career goal"
              description="Set a career goal to unlock personalized paths and growth plans."
              action={
                <Button variant="outline" render={<Link href="/employee/career-paths" />}>
                  Explore career paths
                </Button>
              }
            />
          )}
        </section>

        {Object.keys(preferences).length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Preferences</h2>
            <Card className="shadow-sm">
              <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
                {Object.entries(preferences).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {formatPreferenceKey(key)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {formatPreferenceValue(value)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        <EmployeeAgentSection employeeId={DEMO_EMPLOYEE_ID} />

        {recommendations.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Recent recommendations</h2>
            <div className="grid max-w-3xl gap-4">
              {recommendations.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          <Button render={<Link href="/employee/career-paths" />}>
            Career paths
            <ArrowRight className="size-4" />
          </Button>
          <Button variant="outline" render={<Link href="/employee/growth-plan" />}>
            Growth plan
          </Button>
        </div>
      </div>
    </>
  );
}
