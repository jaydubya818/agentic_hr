import type { AgentId } from '@/types/agent';

import { DYNAMIC_LEARNING_SYSTEM_PROMPT } from './dynamic-learning';
import { EMPLOYEE_GROWTH_SYSTEM_PROMPT } from './employee-growth';
import { GOVERNANCE_SYSTEM_PROMPT } from './governance';
import { INTERNAL_MOBILITY_SYSTEM_PROMPT } from './internal-mobility';
import { SKILLS_INTELLIGENCE_SYSTEM_PROMPT } from './skills-intelligence';
import { SUPERMANAGER_SYSTEM_PROMPT } from './supermanager';

const PROMPTS: Record<AgentId, string> = {
  'employee-growth': EMPLOYEE_GROWTH_SYSTEM_PROMPT,
  supermanager: SUPERMANAGER_SYSTEM_PROMPT,
  'skills-intelligence': SKILLS_INTELLIGENCE_SYSTEM_PROMPT,
  'dynamic-learning': DYNAMIC_LEARNING_SYSTEM_PROMPT,
  'internal-mobility': INTERNAL_MOBILITY_SYSTEM_PROMPT,
  governance: GOVERNANCE_SYSTEM_PROMPT,
};

export function getAgentSystemPrompt(agentId: AgentId): string {
  return PROMPTS[agentId];
}

export {
  DYNAMIC_LEARNING_SYSTEM_PROMPT,
  EMPLOYEE_GROWTH_SYSTEM_PROMPT,
  GOVERNANCE_SYSTEM_PROMPT,
  INTERNAL_MOBILITY_SYSTEM_PROMPT,
  SKILLS_INTELLIGENCE_SYSTEM_PROMPT,
  SUPERMANAGER_SYSTEM_PROMPT,
};
