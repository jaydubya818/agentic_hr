import { PageHeader } from '@/components/layout/PageHeader';
import { DecisionCard } from '@/components/workforce-intelligence/DecisionCard';
import { DecisionTimeline } from '@/components/workforce-intelligence/DecisionTimeline';
import { getSessionContext } from '@/lib/auth/session-context';
import { listWorkforceDecisions } from '@/services/workforce-decision-service';

export default async function HrDecisionsPage() {
  const session = await getSessionContext();
  const decisions = session ? listWorkforceDecisions(session) : [];

  return (
    <>
      <PageHeader
        title="Organization Decisions"
        description="Org-wide workforce enablement decisions with explainable context — supporting human decision-makers, not replacing them."
        breadcrumbs={['HR', 'Decisions']}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {decisions.map((decision) => (
            <DecisionCard
              key={decision.id}
              decision={decision}
              detailHref={`/hr/decisions/${decision.id}`}
            />
          ))}
        </div>
        <DecisionTimeline decisions={decisions} />
      </div>
    </>
  );
}
