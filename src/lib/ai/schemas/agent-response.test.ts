import { describe, expect, it } from 'vitest';

import { agentLlmResponseSchema, parseAgentLlmResponse } from './agent-response';

describe('agentLlmResponseSchema', () => {
  it('parses valid JSON payload', () => {
    const raw = JSON.stringify({
      response: 'Focus on system design practice for your growth path this quarter.',
      confidence: 0.72,
      evidence: ['Confirmed TypeScript skill', 'Staff Engineer role alignment'],
    });
    const parsed = parseAgentLlmResponse(raw);
    expect(parsed?.confidence).toBe(0.72);
    expect(agentLlmResponseSchema.safeParse(parsed).success).toBe(true);
  });

  it('falls back to plain text when JSON invalid', () => {
    const parsed = parseAgentLlmResponse('Plain text response with enough characters for fallback parsing.');
    expect(parsed?.response).toContain('Plain text');
    expect(parsed?.evidence.length).toBeGreaterThan(0);
  });

  it('returns null for too-short text', () => {
    expect(parseAgentLlmResponse('short')).toBeNull();
  });
});
