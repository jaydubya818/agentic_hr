import { hasOpenAiApiKey, shouldUseMockAgents } from './config';
import { MockLlmProvider } from './providers/mock-llm';
import { OpenAiLlmProvider } from './providers/openai';
import type { LlmProvider } from './types';

let warnedMissingKey = false;

export function warnMissingLlmKeyOnce(): void {
  if (warnedMissingKey) return;
  warnedMissingKey = true;
  console.warn(
    '[ai] USE_MOCK_AGENTS=false but OPENAI_API_KEY is missing; falling back to mock agent responses.',
  );
}

export function resolveLlmProvider(): LlmProvider {
  if (shouldUseMockAgents()) {
    return new MockLlmProvider();
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (apiKey) {
    return new OpenAiLlmProvider(apiKey);
  }

  warnMissingLlmKeyOnce();
  return new MockLlmProvider();
}

export function getLlmMode(): 'mock' | 'live' | 'fallback' {
  if (shouldUseMockAgents()) return 'mock';
  if (hasOpenAiApiKey()) return 'live';
  return 'fallback';
}

export * from './config';
export * from './types';
