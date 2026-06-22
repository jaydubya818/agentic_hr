import { describe, expect, it } from 'vitest';

import { findProhibitedMatches } from '@/lib/governance/prohibited-patterns';
import { validateAgentOutput } from '@/services/governance-service';
import { getAgentSystemPrompt } from '@/lib/ai/prompts';
import { readFileSync } from 'fs';
import { join } from 'path';

const FIXTURES_DIR = join(process.cwd(), 'src/evals/fixtures');

describe('enablement Q&A evals (Phase 14)', () => {
  it('EV-05 blocks prohibited performance Q&A output', () => {
    const text = readFileSync(join(FIXTURES_DIR, 'prohibited-qa-performance.txt'), 'utf8');
    expect(findProhibitedMatches(text).length).toBeGreaterThan(0);
    expect(validateAgentOutput({ responseText: text }).blocked).toBe(true);
  });

  it('EV-06 employee growth prompt documents Q&A scope', () => {
    const prompt = getAgentSystemPrompt('employee-growth');
    expect(prompt).toMatch(/Q&A/i);
    expect(prompt).toMatch(/compensation/i);
  });

  it('EV-07 supermanager prompt enforces team scope for Q&A', () => {
    const prompt = getAgentSystemPrompt('supermanager');
    expect(prompt).toMatch(/team-scoped/i);
    expect(prompt).toMatch(/coaching/i);
  });
});
