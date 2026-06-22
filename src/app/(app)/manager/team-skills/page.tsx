import Link from 'next/link';
import { Users } from 'lucide-react';
import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkillChip } from '@/components/shared/SkillChip';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DEMO_MANAGER_EMPLOYEE_ID } from '@/lib/mock/ids';
import { dataProvider } from '@/services/data-provider';

export default function TeamSkillsPage() {
  const matrix = dataProvider.getTeamSkillsMatrix(DEMO_MANAGER_EMPLOYEE_ID);
  if (!matrix) {
    return (
      <>
        <PageHeader title="Team Skills" breadcrumbs={['Manager', 'Team Skills']} />
        <EmptyState
          icon={Users}
          title="No team data"
          description="Unable to load the skills matrix for your direct reports."
        />
      </>
    );
  }

  const keySkills = [...new Set(matrix.members.flatMap((m) => m.skills.map((s) => s.skillName)))].slice(
    0,
    6,
  );

  return (
    <>
      <PageHeader
        title="Team Skills"
        description="Skill coverage, gaps, and readiness across your direct reports."
        breadcrumbs={['Manager', 'Team Skills']}
      />

      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <p className="text-3xl font-semibold">{matrix.readinessSnapshot.totalMembers}</p>
              <p className="mt-1 text-sm font-medium">Team members</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <p className="text-3xl font-semibold">
                {matrix.readinessSnapshot.avgConfirmedSkills}
              </p>
              <p className="mt-1 text-sm font-medium">Avg confirmed skills</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <p className="text-3xl font-semibold">
                {matrix.readinessSnapshot.avgInferredSkills}
              </p>
              <p className="mt-1 text-sm font-medium">Avg inferred skills</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <p className="text-3xl font-semibold">
                {matrix.readinessSnapshot.membersWithActivePlan}/
                {matrix.readinessSnapshot.totalMembers}
              </p>
              <p className="mt-1 text-sm font-medium">Active growth plans</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Skills matrix</CardTitle>
            <CardDescription>
              {matrix.team?.name ?? 'Your team'} — confirmed vs inferred proficiency by member
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {matrix.members.length === 0 ? (
              <EmptyState
                title="No direct reports"
                description="When team members are assigned, their skills will appear here."
              />
            ) : (
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Employee</th>
                    <th className="pb-3 pr-4 font-medium">Plan</th>
                    <th className="pb-3 pr-4 font-medium">Confirmed</th>
                    <th className="pb-3 pr-4 font-medium">Inferred</th>
                    <th className="pb-3 font-medium">Skills</th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.members.map((member) => (
                    <tr key={member.employeeId} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/manager/employee/${member.employeeId}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {member.fullName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{member.jobTitle}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={member.growthPlanStatus === 'active' ? 'default' : 'outline'}>
                          {member.growthPlanStatus ?? 'None'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">{member.confirmedCount}</td>
                      <td className="py-3 pr-4">{member.inferredCount}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {member.skills.length > 0 ? (
                            member.skills.map((es) => (
                              <SkillChip
                                key={es.id}
                                name={es.skillName}
                                source={es.source}
                                proficiencyLevel={es.proficiencyLevel}
                              />
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No skills recorded</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Team gap summary</CardTitle>
              <CardDescription>Skills below role targets — development focus areas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {matrix.teamGaps.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No critical collective gaps detected from current role requirements.
                </p>
              ) : (
                matrix.teamGaps.map((gap) => (
                  <div key={gap.skill.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="font-semibold text-foreground">{gap.skill.name}</p>
                      <ConfidenceIndicator value={gap.confidence} size="sm" className="w-28" />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{gap.explanation}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {gap.affectedEmployeeIds.length} member(s) below level {gap.requiredLevel}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Readiness snapshot</CardTitle>
              <CardDescription>Confirmed vs inferred balance across the team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Higher confirmed skill counts indicate validated capabilities. Inferred skills
                should be discussed in 1:1s — they are signals, not judgments.
              </p>
              {keySkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {keySkills.map((name) => (
                    <SkillChip key={name} name={name} source="confirmed" />
                  ))}
                </div>
              )}
              <Button variant="outline" size="sm" render={<Link href="/manager/team-capability-plan" />}>
                View capability plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
