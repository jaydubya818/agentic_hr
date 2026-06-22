import type { LlmCompletionParams, LlmCompletionResult, LlmProvider } from '../types';

export class MockLlmProvider implements LlmProvider {
  readonly name = 'mock';

  async complete(params: LlmCompletionParams): Promise<LlmCompletionResult> {
    const lastUser = [...params.messages].reverse().find((m) => m.role === 'user');
    return {
      content: `Mock LLM response for: ${lastUser?.content ?? 'request'}`,
      provider: 'mock',
      model: 'mock-llm',
    };
  }
}
