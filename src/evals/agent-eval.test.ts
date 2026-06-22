import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

import { findProhibitedMatches } from '@/lib/governance/prohibited-patterns';
import { validateAgentOutput } from '@/services/governance-service';
import { getAgentSystemPrompt } from '@/lib/ai/prompts';
import { agentLlmResponseSchema } from '@/lib/ai/schemas/agent-response';

const FIXTURES_DIR = join(process.cwd(), 'src/evals/fixtures');

function loadFixture(name: string): string {
  return readFileSync(join(FIXTURES_DIR, name), 'utf8');
}

describe('agent eval fixtures', () => {
  it('EV-01 career path recommendation includes grounding fields', () => {
    const fixture = JSON.parse(loadFixture('career-path-good.json')) as {
      response: string;
      confidence: number;
      evidence: string[];
    };
    expect(agentLlmResponseSchema.safeParse(fixture).success).toBe(true);
    const governance = validateAgentOutput({
      responseText: fixture.response,
      responseConfidence: fixture.confidence,
    });
    expect(governance.blocked).toBe(false);
  });

  it('EV-02 blocks prohibited termination output', () => {
    const text = loadFixture('prohibited-termination.txt');
    expect(findProhibitedMatches(text).length).toBeGreaterThan(0);
    expect(validateAgentOutput({ responseText: text }).blocked).toBe(true);
  });

  it('EV-03 prompts require confidence and evidence language', () => {
    const prompt = getAgentSystemPrompt('employee-growth');
    expect(prompt).toMatch(/confidence/i);
    expect(prompt).toMatch(/evidence/i);
    expect(prompt).toMatch(/confirmed/i);
  });

  it('EV-04 distinguishes inferred vs confirmed in skills prompt', () => {
    const prompt = getAgentSystemPrompt('skills-intelligence');
    expect(prompt).toMatch(/inferred/i);
    expect(prompt).toMatch(/confirmed/i);
    expect(prompt).toMatch(/taxonomy/i);
  });
});
