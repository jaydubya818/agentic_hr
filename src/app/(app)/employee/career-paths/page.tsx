import Link from 'next/link';
import { BookOpen, Briefcase, Compass } from 'lucide-react';
import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkillChip } from '@/components/shared/SkillChip';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DEMO_EMPLOYEE_ID } from '@/lib/mock/ids';
import { dataProvider } from '@/services/data-provider';

export default function CareerPathsPage() {
  const careerPaths = dataProvider.getCareerPaths(DEMO_EMPLOYEE_ID);
  const activeGoal = dataProvider.getCareerGoals(DEMO_EMPLOYEE_ID).find((g) => g.status === 'active');

  return (
    <>
      <PageHeader
        title="Career Paths"
        description="Explore growth directions matched to your skills — each path includes evidence-backed match details."
        breadcrumbs={['Employee', 'Career Paths']}
      />

      {careerPaths.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No career paths yet"
          description="Add skills and a career goal to generate personalized path recommendations."
          action={
            <Button variant="outline" render={<Link href="/employee/growth-profile" />}>
              Update growth profile
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6">
          {activeGoal && (
            <p className="text-sm text-muted-foreground">
              Paths are ranked against your active goal: <strong>{activeGoal.title}</strong>
            </p>
          )}

          {careerPaths.map((path, index) => (
            <Card key={path.role.id} className="shadow-sm">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{path.role.title}</CardTitle>
                      {index === 0 && <Badge variant="secondary">Top match</Badge>}
                    </div>
                    {path.role.level && (
                      <CardDescription>
                        {path.role.level}
                        {path.role.department ? ` · ${path.role.department}` : ''}
                      </CardDescription>
                    )}
                  </div>
                  <div className="w-36">
                    <ConfidenceIndicator value={path.confidence} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm leading-relaxed text-muted-foreground">{path.explanation}</p>

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">Skill gaps</h3>
                  {path.skillGaps.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No significant gaps — strong alignment with role requirements.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {path.skillGaps.map((gap) => (
                        <SkillChip
                          key={gap.skill.id}
                          name={`${gap.skill.name} (L${gap.currentLevel ?? 0} → L${gap.requiredLevel})`}
                          source="inferred"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {path.suggestedLearning.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <BookOpen className="size-4 text-accent" />
                      Suggested learning
                    </h3>
                    <ul className="space-y-2">
                      {path.suggestedLearning.map((resource) => (
                        <li key={resource.id} className="rounded-lg border bg-muted/20 px-4 py-3">
                          <p className="font-medium text-foreground">{resource.title}</p>
                          {resource.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{resource.description}</p>
                          )}
                          {resource.provider && (
                            <p className="mt-1 text-xs text-muted-foreground">{resource.provider}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {path.suggestedOpportunities.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Briefcase className="size-4 text-accent" />
                      Internal opportunities
                    </h3>
                    <ul className="space-y-2">
                      {path.suggestedOpportunities.map((opp) => (
                        <li key={opp.id} className="rounded-lg border bg-muted/20 px-4 py-3">
                          <p className="font-medium text-foreground">{opp.title}</p>
                          {opp.description && (
                            <p className="mt-1 text-sm text-muted-foreground">{opp.description}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" render={<Link href="/employee/growth-plan" />}>
                  Build growth plan for this path
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
