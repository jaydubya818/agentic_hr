import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { AgentPanel } from '@/components/agent/AgentPanel';
import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveActingManagerEmployeeId } from '@/lib/auth/acting-ids';
import { getSessionContext } from '@/lib/auth/session-context';
import { dataProvider } from '@/services/data-provider';
import type { CoachingPromptCategory } from '@/services/data-provider/types';

const CATEGORY_LABELS: Record<CoachingPromptCategory, string> = {
  growth: 'Growth',
  skills: 'Skills',
  motivation: 'Motivation',
  project_fit: 'Project fit',
};

export default async function ManagerCoachingPage() {
  const session = await getSessionContext();
  const managerEmployeeId = resolveActingManagerEmployeeId(session);
  const prompts = managerEmployeeId ? dataProvider.getCoachingPrompts(managerEmployeeId) : [];

  const byEmployee = prompts.reduce<
    Record<string, { name: string; prompts: typeof prompts }>
  >((acc, prompt) => {
    const existing = acc[prompt.employeeId] ?? { name: prompt.employeeName, prompts: [] };
    existing.prompts.push(prompt);
    acc[prompt.employeeId] = existing;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title="Coaching Center"
        description="Conversation guides and coaching prompts for your direct reports — empowering, not punitive."
        breadcrumbs={['Manager', 'Coaching']}
      />

      {prompts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No coaching prompts yet"
          description="Coaching prompts will appear as your team builds growth profiles and plans."
          action={
            <Button variant="outline" render={<Link href="/manager/home" />}>
              Back to manager home
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          <div className="flex flex-wrap gap-2">
            {(['growth', 'skills', 'motivation', 'project_fit'] as const).map((cat) => (
              <Badge key={cat} variant="outline">
                {CATEGORY_LABELS[cat]}
              </Badge>
            ))}
          </div>

          {Object.entries(byEmployee).map(([employeeId, group]) => (
            <Card key={employeeId} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription>{group.prompts.length} coaching prompts</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link href={`/manager/employee/${employeeId}`} />}
                >
                  View employee
                </Button>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {group.prompts.map((prompt) => (
                  <div key={prompt.id} className="rounded-lg border p-4">
                    <Badge variant="secondary" className="mb-2">
                      {CATEGORY_LABELS[prompt.category]}
                    </Badge>
                    <p className="font-medium leading-snug text-foreground">{prompt.prompt}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{prompt.context}</p>
                    <p className="mt-3 text-sm text-muted-foreground">{prompt.explanation}</p>
                    <div className="mt-4">
                      <ConfidenceIndicator value={prompt.confidence} size="sm" className="w-36" />
                    </div>
                    {prompt.evidence.length > 0 && (
                      <ul className="mt-3 space-y-1 border-t pt-3 text-xs text-muted-foreground">
                        {prompt.evidence.map((e) => (
                          <li key={e.id}>
                            <span className="font-medium text-foreground">{e.label}</span>
                            {e.detail ? ` — ${e.detail}` : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AgentPanel
        agentId="supermanager"
        title="Supermanager assistant"
        description="Generate coaching prompts and team development actions grounded in direct-report data."
        context={{ contextType: 'manager-coaching' }}
        className="mt-8"
      />
    </>
  );
}
