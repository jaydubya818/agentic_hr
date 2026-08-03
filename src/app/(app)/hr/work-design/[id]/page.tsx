import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/PageHeader';
import { RoleEvolutionCard } from '@/components/workforce-intelligence/RoleEvolutionCard';
import { Button } from '@/components/ui/button';
import { getSessionContext } from '@/lib/auth/session-context';
import { getMockStore } from '@/services/data-provider/mock-provider';
import { getRoleEvolutionScenario } from '@/services/team-scenario-service';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function HrWorkDesignDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSessionContext();
  const scenario = session ? getRoleEvolutionScenario(session.organizationId, id) : null;

  if (!scenario) {
    notFound();
  }

  const store = getMockStore();
  const currentRole = store.roles.find((r) => r.id === scenario.currentRoleId);

  return (
    <>
      <PageHeader
        title={scenario.title}
        description="Role evolution with task-level change analysis"
        breadcrumbs={['HR', 'Work Design', scenario.title]}
      />
      <RoleEvolutionCard
        scenario={scenario}
        currentRoleTitle={
          (scenario.metadata?.currentRoleLabel as string | undefined) ??
          currentRole?.title ??
          'Current role'
        }
      />
      <div className="mt-6">
        <Button variant="outline" render={<Link href="/hr/work-design" />}>
          Back to work design
        </Button>
      </div>
    </>
  );
}
