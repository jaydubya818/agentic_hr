import { afterEach, describe, expect, it, vi } from 'vitest';

import { OpenAiLlmProvider } from './openai';

function okResponse(): Response {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content: '{"ok":true}' } }],
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

describe('OpenAiLlmProvider request shape', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('sends max_completion_tokens (not the deprecated max_tokens)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    vi.stubGlobal('fetch', fetchMock);

    const provider = new OpenAiLlmProvider('test-key');
    const result = await provider.complete({
      systemPrompt: 'system',
      messages: [{ role: 'user', content: 'hello' }],
      maxTokens: 123,
      responseFormat: 'json',
    });

    expect(result.content).toBe('{"ok":true}');
    const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string) as Record<string, unknown>;
    expect(body.max_completion_tokens).toBe(123);
    expect(body).not.toHaveProperty('max_tokens');
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  it('throws a bounded error on non-OK responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('x'.repeat(500), { status: 500 }));
    vi.stubGlobal('fetch', fetchMock);

    const provider = new OpenAiLlmProvider('test-key');
    await expect(
      provider.complete({ systemPrompt: 's', messages: [{ role: 'user', content: 'hi' }] }),
    ).rejects.toThrow(/OpenAI request failed \(500\)/);
  });
});
