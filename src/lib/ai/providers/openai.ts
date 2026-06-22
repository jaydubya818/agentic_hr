import type { LlmCompletionParams, LlmCompletionResult, LlmProvider } from '../types';
import { getOpenAiModel } from '../config';

interface OpenAiChatResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export class OpenAiLlmProvider implements LlmProvider {
  readonly name = 'openai';

  constructor(private readonly apiKey: string) {}

  async complete(params: LlmCompletionParams): Promise<LlmCompletionResult> {
    const model = getOpenAiModel();
    const body = {
      model,
      temperature: params.temperature ?? 0.4,
      max_tokens: params.maxTokens ?? 900,
      messages: [
        { role: 'system', content: params.systemPrompt },
        ...params.messages,
      ],
      ...(params.responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {}),
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`OpenAI request failed (${response.status}): ${detail.slice(0, 200)}`);
    }

    const payload = (await response.json()) as OpenAiChatResponse;
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('OpenAI returned empty content');
    }

    return {
      content,
      provider: 'openai',
      model,
      usage: {
        promptTokens: payload.usage?.prompt_tokens,
        completionTokens: payload.usage?.completion_tokens,
      },
    };
  }
}
