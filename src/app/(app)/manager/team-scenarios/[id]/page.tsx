import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/PageHeader';
import { ScenarioComparison } from '@/components/workforce-intelligence/ScenarioComparison';
import { SkillSupplyDemandCard } from '@/components/workforce-intelligence/SkillSupplyDemandCard';
import { Button } from '@/components/ui/button';
import { getSessionContext } from '@/lib/auth/session-context';
import { MOCK_IDS } from '@/lib/mock/ids';
import { getMockStore } from '@/services/data-provider/mock-provider';
import { compareTeamScenarios, getTeamScenario } from '@/services/team-scenario-service';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ManagerTeamScenarioDetailPage({ params }: PageProps) {
  const session = await getSessionContext();
  const { id } = await params;
  const scenario = session ? getTeamScenario(session, id) : null;

  if (!session || !scenario) {
    notFound();
  }

  const store = getMockStore();
  const comparison = compareTeamScenarios(
    session.organizationId,
    MOCK_IDS.teamScenarios.productQualityCurrent,
    MOCK_IDS.teamScenarios.productQualityFuture,
  );

  return (
    <>
      <PageHeader
        title={scenario.title}
        description={scenario.description ?? undefined}
        breadcrumbs={['Manager', 'Team Scenarios', scenario.title]}
      />
      {scenario.id === MOCK_IDS.teamScenarios.productQualityCurrent ||
      scenario.id === MOCK_IDS.teamScenarios.productQualityFuture ? (
        <ScenarioComparison
          current={comparison.current}
          future={comparison.future}
          skillDeltas={comparison.skillDeltas}
        />
      ) : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {scenario.skills.map((skillRow) => {
          const skill = store.skills.find((s) => s.id === skillRow.skillId);
          return (
            <SkillSupplyDemandCard
              key={skillRow.id}
              skillName={skill?.name ?? skillRow.skillId}
              demandLevel={skillRow.demandLevel}
              supplyLevel={skillRow.supplyLevel}
              gap={skillRow.gap}
              notes={skillRow.notes}
            />
          );
        })}
      </div>
      <div className="mt-6">
        <Button variant="outline" render={<Link href="/manager/team-scenarios" />}>
          Back to scenarios
        </Button>
      </div>
    </>
  );
}
