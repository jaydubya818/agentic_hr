import Link from 'next/link';

import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MOCK_IDS } from '@/lib/mock/ids';
import { listRoleEvolutionScenarios } from '@/services/team-scenario-service';

export default function HrWorkDesignPage() {
  const scenarios = listRoleEvolutionScenarios(MOCK_IDS.organization);

  return (
    <>
      <PageHeader
        title="Work Design"
        description="Role evolution scenarios and task redesign — human-validated work changes, not automated employment decisions."
        breadcrumbs={['HR', 'Work Design']}
      />
      <div className="grid gap-4 md:grid-cols-2">
        {scenarios.map((scenario) => (
          <Card key={scenario.id} className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">{scenario.title}</CardTitle>
                <CardDescription>{scenario.status}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/hr/work-design/${scenario.id}`} />}
                >
                  View scenario
                </Button>
              </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
