'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { AgentPanel } from '@/components/agent/AgentPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const STEPS = ['Welcome', 'Profile', 'Growth goal'] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [careerGoal, setCareerGoal] = useState('');

  function completeOnboarding() {
    router.push('/employee/home');
  }

  return (
    <>
      <PageHeader
        title="Welcome to GrowthOS"
        description="Set up your growth profile in a few steps — development guidance only, never employment decisions."
        breadcrumbs={['Onboarding']}
      />

      <div className="mb-6 flex gap-2">
        {STEPS.map((label, index) => (
          <BadgeStep key={label} active={step === index} done={step > index} label={label} />
        ))}
      </div>

      {step === 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Growth-first enablement</CardTitle>
            <CardDescription>
              GrowthOS helps you explore career paths, close skill gaps, and prepare for manager
              conversations — with human review on sensitive guidance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setStep(1)}>
              Get started
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Confirm your profile</CardTitle>
            <CardDescription>
              We use your role and team context to ground agent recommendations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Demo profile: Alex Chen, Senior Software Engineer. In pilot mode, edits sync when
              persistence is enabled.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
              <Button onClick={() => setStep(2)}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Set an initial career goal (optional)</CardTitle>
              <CardDescription>
                Optional target role or growth theme — you can change this anytime on Career Paths.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                placeholder="e.g. Staff Engineer or broaden leadership skills"
                value={careerGoal}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCareerGoal(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button variant="outline" onClick={completeOnboarding}>Skip</Button>
                <Button onClick={completeOnboarding}>Finish</Button>
              </div>
            </CardContent>
          </Card>

          <AgentPanel
            agentId="employee-growth"
            title="Onboarding assistant"
            description="Ask about your first growth steps — governed Q&A on development only."
            context={{ contextType: 'onboarding' }}
          />
        </div>
      )}
    </>
  );
}

function BadgeStep({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
        active ? 'border-primary bg-primary/5 font-medium' : 'text-muted-foreground'
      }`}
    >
      {done ? <CheckCircle2 className="size-4 text-emerald-600" /> : null}
      {label}
    </div>
  );
}
