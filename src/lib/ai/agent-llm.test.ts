import { afterEach, describe, expect, it, vi } from 'vitest';

import { generateLiveAgentResponse } from './agent-llm';

describe('live agent generation', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns null in mock mode so the caller uses its curated response', async () => {
    vi.stubEnv('USE_MOCK_AGENTS', 'true');
    await expect(
      generateLiveAgentResponse({
        agentId: 'employee-growth',
        userMessage: 'What career paths fit my goal?',
        employeeId: '33333333-3333-4333-8333-333333333331',
      }),
    ).resolves.toBeNull();
  });

  it('returns null in fallback mode instead of echoing the mock provider output', async () => {
    // USE_MOCK_AGENTS=false without a key resolves to the mock provider, whose
    // completion is "Mock LLM response for: <user message>". Surfacing that as
    // the agent's answer echoed the user's own words back at them instead of
    // showing the curated fallback response.
    vi.stubEnv('USE_MOCK_AGENTS', 'false');
    vi.stubEnv('OPENAI_API_KEY', '');

    const result = await generateLiveAgentResponse({
      agentId: 'employee-growth',
      userMessage: 'What career paths fit my goal?',
      employeeId: '33333333-3333-4333-8333-333333333331',
    });

    expect(result).toBeNull();
  });
});
