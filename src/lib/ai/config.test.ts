import { afterEach, describe, expect, it } from 'vitest';

import {
  getOpenAiModel,
  hasOpenAiApiKey,
  isLiveAgentEnabled,
  LIVE_AGENT_IDS,
  shouldUseMockAgents,
} from './config';

describe('ai config', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('defaults to mock agents when USE_MOCK_AGENTS unset', () => {
    delete process.env.USE_MOCK_AGENTS;
    expect(shouldUseMockAgents()).toBe(true);
  });

  it('respects USE_MOCK_AGENTS=false', () => {
    process.env.USE_MOCK_AGENTS = 'false';
    expect(shouldUseMockAgents()).toBe(false);
  });

  it('detects OpenAI key presence', () => {
    delete process.env.OPENAI_API_KEY;
    expect(hasOpenAiApiKey()).toBe(false);
    process.env.OPENAI_API_KEY = 'sk-test';
    expect(hasOpenAiApiKey()).toBe(true);
  });

  it('uses default OpenAI model', () => {
    delete process.env.OPENAI_MODEL;
    expect(getOpenAiModel()).toBe('gpt-4o-mini');
  });

  it('lists approved live agents', () => {
    expect(LIVE_AGENT_IDS).toContain('employee-growth');
    expect(isLiveAgentEnabled('employee-growth')).toBe(true);
    expect(isLiveAgentEnabled('skills-intelligence')).toBe(false);
  });
});
