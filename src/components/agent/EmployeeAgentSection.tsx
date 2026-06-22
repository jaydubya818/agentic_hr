'use client';

import { useState } from 'react';
import { AgentPanel } from '@/components/agent/AgentPanel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AgentId } from '@/types/agent';

const EMPLOYEE_AGENTS: Array<{ id: AgentId; label: string; description: string }> = [
  {
    id: 'employee-growth',
    label: 'Employee Growth',
    description: 'Career paths, growth plans, and manager conversation prep.',
  },
  {
    id: 'skills-intelligence',
    label: 'Skills Intelligence',
    description: 'Skill gaps with confirmed vs inferred distinctions.',
  },
  {
    id: 'dynamic-learning',
    label: 'Dynamic Learning',
    description: 'Catalog learning suggestions tied to your gaps.',
  },
  {
    id: 'internal-mobility',
    label: 'Internal Mobility',
    description: 'Internal opportunity matches with fit explanations.',
  },
];

interface EmployeeAgentSectionProps {
  employeeId: string;
}

export function EmployeeAgentSection({ employeeId }: EmployeeAgentSectionProps) {
  const [agentId, setAgentId] = useState<AgentId>('employee-growth');
  const selected = EMPLOYEE_AGENTS.find((a) => a.id === agentId) ?? EMPLOYEE_AGENTS[0]!;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Growth assistant</h2>
          <p className="text-sm text-muted-foreground">
            Ask MVP agents for development-focused guidance. Default demo uses mock responses; live
            mode activates when USE_MOCK_AGENTS=false and OPENAI_API_KEY is set.
          </p>
        </div>
        <Select value={agentId} onValueChange={(v) => setAgentId(v as AgentId)}>
          <SelectTrigger className="w-full sm:w-56" aria-label="Select agent">
            <SelectValue placeholder="Select agent" />
          </SelectTrigger>
          <SelectContent>
            {EMPLOYEE_AGENTS.map((agent) => (
              <SelectItem key={agent.id} value={agent.id}>
                {agent.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <AgentPanel
        key={agentId}
        agentId={agentId}
        title={selected.label}
        description={selected.description}
        context={{ employeeId, contextType: 'growth-profile' }}
      />
    </section>
  );
}
