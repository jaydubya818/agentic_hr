import Link from 'next/link';
import { ArrowRight, ClipboardList, HelpCircle, ListChecks, MessageSquare } from 'lucide-react';
import { SkillChip } from '@/components/shared/SkillChip';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DEMO_EMPLOYEE_ID } from '@/lib/mock/ids';
import { dataProvider } from '@/services/data-provider';

function PrepList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3 text-sm leading-relaxed text-foreground">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {index + 1}
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function ManagerConversationPage() {
  const prep = dataProvider.getManagerConversationPrep(DEMO_EMPLOYEE_ID);
  const { plan } = dataProvider.getGrowthPlan(DEMO_EMPLOYEE_ID);
  const manager = dataProvider.getEmployee(
    dataProvider.getEmployee(DEMO_EMPLOYEE_ID)?.managerId ?? '',
  );
  const managerUser = manager?.userId
    ? dataProvider.getCurrentUser(manager.userId)
    : undefined;

  return (
    <>
      <PageHeader
        title="1:1 Prep"
        description="Growth-focused talking points for your next manager conversation — grounded in your plan and skills."
        breadcrumbs={['Employee', '1:1 Prep']}
        actions={
          managerUser && (
            <p className="text-sm text-muted-foreground">
              Manager: <span className="font-medium text-foreground">{managerUser.fullName}</span>
            </p>
          )
        }
      />

      <div className="space-y-6">
        {plan && (
          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
              <div>
                <p className="text-sm font-medium text-foreground">Active plan context</p>
                <p className="text-sm text-muted-foreground">{plan.title}</p>
              </div>
              <Button variant="outline" size="sm" render={<Link href="/employee/growth-plan" />}>
                View plan
                <ArrowRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="size-5 text-primary" />
                Suggested agenda
              </CardTitle>
              <CardDescription>Structure your conversation around growth outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <PrepList items={prep.agenda} />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="size-5 text-primary" />
                Talking points
              </CardTitle>
              <CardDescription>Evidence-backed topics from your growth data</CardDescription>
            </CardHeader>
            <CardContent>
              <PrepList items={prep.talkingPoints} />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <HelpCircle className="size-5 text-primary" />
                Questions to ask
              </CardTitle>
              <CardDescription>Open-ended prompts to drive the conversation</CardDescription>
            </CardHeader>
            <CardContent>
              <PrepList items={prep.questionsToAsk} />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ListChecks className="size-5 text-primary" />
                Next steps
              </CardTitle>
              <CardDescription>Actions to agree on before you wrap up</CardDescription>
            </CardHeader>
            <CardContent>
              <PrepList items={prep.nextSteps} />
            </CardContent>
          </Card>
        </div>

        {prep.skillsToDiscuss.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Skills to discuss</CardTitle>
              <CardDescription>
                Confirm inferred skills or align on development priorities
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {prep.skillsToDiscuss.map((skill) => (
                <SkillChip key={skill.id} name={skill.name} source="inferred" />
              ))}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground">
          Prep content is generated from your growth plan and skills profile. It supports development
          conversations — not performance ratings or employment decisions.
        </p>
      </div>
    </>
  );
}
