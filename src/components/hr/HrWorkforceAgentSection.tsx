'use client';

import { AgentPanel } from '@/components/agent/AgentPanel';
import { DEMO_EMPLOYEE_ID } from '@/lib/mock/ids';

export function HrWorkforceAgentSection() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Workforce enablement assistant</h2>
        <p className="text-sm text-muted-foreground">
          Org-scoped skills intelligence for capability gaps and talent density — aggregate
          development guidance only.
        </p>
      </div>
      <AgentPanel
        agentId="skills-intelligence"
        title="Skills intelligence (HR)"
        description="Ask about org skill gaps, inferred skill ratios, and taxonomy suggestions."
        context={{ employeeId: DEMO_EMPLOYEE_ID, contextType: 'hr-workforce-readiness' }}
      />
    </section>
  );
}
