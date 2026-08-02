import { z } from 'zod';

export const agentLlmResponseSchema = z.object({
  response: z.string().min(20).max(4000),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string().min(3)).min(1),
});

export type AgentLlmResponse = z.infer<typeof agentLlmResponseSchema>;

const MAX_RESPONSE_LENGTH = 4000;

export function parseAgentLlmResponse(raw: string): AgentLlmResponse | null {
  try {
    const json = JSON.parse(raw) as unknown;
    return agentLlmResponseSchema.parse(json);
  } catch {
    const trimmed = raw.trim();
    if (trimmed.length >= 20) {
      return {
        // Enforce the same cap as the structured schema so the fallback
        // path cannot smuggle an over-length response downstream.
        response: trimmed.slice(0, MAX_RESPONSE_LENGTH),
        confidence: 0.55,
        evidence: ['Model response without structured evidence — review recommended.'],
      };
    }
    return null;
  }
}
