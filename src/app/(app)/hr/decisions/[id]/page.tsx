import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/layout/PageHeader';
import { DecisionEvidenceList } from '@/components/workforce-intelligence/DecisionEvidenceList';
import { DecisionOutcomeComparison } from '@/components/workforce-intelligence/DecisionOutcomeComparison';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSessionContext } from '@/lib/auth/session-context';
import { compareExpectedToActual } from '@/services/decision-outcome-service';
import { getWorkforceDecision } from '@/services/workforce-decision-service';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function HrDecisionDetailPage({ params }: PageProps) {
  const session = await getSessionContext();
  const { id } = await params;
  const decision = session ? getWorkforceDecision(session, id) : null;

  if (!decision) {
    notFound();
  }

  const comparisons = compareExpectedToActual(decision.organizationId, decision.id);

  return (
    <>
      <PageHeader
        title={decision.title}
        description={decision.description ?? undefined}
        breadcrumbs={['HR', 'Decisions', decision.title]}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge variant="secondary">{decision.status}</Badge>
        <Badge variant="outline">{decision.decisionType.replace(/_/g, ' ')}</Badge>
      </div>
      {decision.rationale && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Rationale</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{decision.rationale}</p>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <DecisionEvidenceList evidence={decision.evidence} />
        <DecisionOutcomeComparison comparisons={comparisons} />
      </div>
      <div className="mt-6">
        <Button variant="outline" render={<Link href="/hr/decisions" />}>
          Back to decisions
        </Button>
      </div>
    </>
  );
}
