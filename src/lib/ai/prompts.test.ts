import { describe, expect, it } from 'vitest';
import { AGENT_IDS } from '@/types/agent';

import { getAgentSystemPrompt } from './prompts';
import { PRODUCT_BOUNDARIES } from './prompts/base';

describe('agent prompts', () => {
  it('defines a system prompt for every MVP agent', () => {
    for (const agentId of AGENT_IDS) {
      const prompt = getAgentSystemPrompt(agentId);
      expect(prompt.length).toBeGreaterThan(100);
      expect(prompt).toContain('GrowthOS');
    }
  });

  it('includes product boundaries in base prompt content', () => {
    expect(PRODUCT_BOUNDARIES).toContain('termination');
    expect(PRODUCT_BOUNDARIES).toContain('confirmed skills');
  });
});
