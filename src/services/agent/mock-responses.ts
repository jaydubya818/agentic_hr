import employeeGrowthResponses from '../../../data/mock/agent-responses/employee-growth.json';
import supermanagerResponses from '../../../data/mock/agent-responses/supermanager.json';
import skillsIntelligenceResponses from '../../../data/mock/agent-responses/skills-intelligence.json';
import dynamicLearningResponses from '../../../data/mock/agent-responses/dynamic-learning.json';
import internalMobilityResponses from '../../../data/mock/agent-responses/internal-mobility.json';
import type { AgentId } from '@/types/agent';

interface AgentResponseFixture {
  defaultResponse: string;
  scenarios: Array<{ keywords: string[]; response: string }>;
}

const FIXTURES: Record<Exclude<AgentId, 'governance'>, AgentResponseFixture> = {
  'employee-growth': employeeGrowthResponses,
  supermanager: supermanagerResponses,
  'skills-intelligence': skillsIntelligenceResponses,
  'dynamic-learning': dynamicLearningResponses,
  'internal-mobility': internalMobilityResponses,
};

export function selectMockResponseText(agentId: AgentId, message: string): string {
  if (agentId === 'governance') {
    return 'Governance validation runs on all agent outputs before delivery.';
  }

  const fixture = FIXTURES[agentId];
  const lower = message.toLowerCase();

  for (const scenario of fixture.scenarios) {
    if (scenario.keywords.some((kw) => lower.includes(kw))) {
      return scenario.response;
    }
  }

  return fixture.defaultResponse;
}
