import { afterEach, describe, expect, it } from 'vitest';

import { getLlmMode, resolveLlmProvider } from './index';

describe('llm provider resolution', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('returns mock mode by default', () => {
    delete process.env.USE_MOCK_AGENTS;
    delete process.env.OPENAI_API_KEY;
    expect(getLlmMode()).toBe('mock');
    expect(resolveLlmProvider().name).toBe('mock');
  });

  it('returns live mode when mock disabled and key present', () => {
    process.env.USE_MOCK_AGENTS = 'false';
    process.env.OPENAI_API_KEY = 'sk-test';
    expect(getLlmMode()).toBe('live');
    expect(resolveLlmProvider().name).toBe('openai');
  });

  it('returns fallback mode when mock disabled without key', () => {
    process.env.USE_MOCK_AGENTS = 'false';
    delete process.env.OPENAI_API_KEY;
    expect(getLlmMode()).toBe('fallback');
    expect(resolveLlmProvider().name).toBe('mock');
  });
});
