import { PageHeader } from '@/components/layout/PageHeader';
import { DecisionCard } from '@/components/workforce-intelligence/DecisionCard';
import { DecisionTimeline } from '@/components/workforce-intelligence/DecisionTimeline';
import { getSessionContext } from '@/lib/auth/session-context';
import { listWorkforceDecisions } from '@/services/workforce-decision-service';

export default async function ManagerDecisionsPage() {
  const session = await getSessionContext();
  const decisions = session ? listWorkforceDecisions(session) : [];

  return (
    <>
      <PageHeader
        title="Workforce Decisions"
        description="Skills-informed team decisions with rationale, evidence, and outcome tracking — human-owned, not automated employment decisions."
        breadcrumbs={['Manager', 'Decisions']}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {decisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              detailHref={`/manager/decisions/${decision.id}`}
            />
          ))}
        </div>
        <DecisionTimeline decisions={decisions} />
      </div>
    </>
  );
}
