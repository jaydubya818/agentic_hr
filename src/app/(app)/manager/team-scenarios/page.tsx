import Link from 'next/link';

import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getSessionContext } from '@/lib/auth/session-context';
import { listTeamScenarios } from '@/services/team-scenario-service';

export default async function ManagerTeamScenariosPage() {
  const session = await getSessionContext();
  const scenarios = session ? listTeamScenarios(session) : [];

  return (
    <>
      <PageHeader
        title="Team Scenarios"
        description="Compare current and future team designs with skill supply and demand — for planning, not automated staffing decisions."
        breadcrumbs={['Manager', 'Team Scenarios']}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {scenarios.map((scenario) => (
          <Card key={scenario.id} className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{scenario.title}</CardTitle>
              <CardDescription>{scenario.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <Badge variant="outline">{scenario.scenarioType.replace(/_/g, ' ')}</Badge>
                <Badge variant="secondary">{scenario.status}</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/manager/team-scenarios/${scenario.id}`} />}
              >
                View
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
