import { z } from 'zod';

/**
 * Hard cap on agent reply text. The invoke route applies the same limit to
 * every `conversationHistory` entry, so a reply that exceeds it is one the
 * client cannot echo back on the next turn.
 */
export const MAX_AGENT_RESPONSE_LENGTH = 4000;

export const agentLlmResponseSchema = z.object({
  response: z.string().min(20).max(MAX_AGENT_RESPONSE_LENGTH),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string().min(3)).min(1),
});

export type AgentLlmResponse = z.infer<typeof agentLlmResponseSchema>;

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
        response: trimmed.slice(0, MAX_AGENT_RESPONSE_LENGTH),
        confidence: 0.55,
        evidence: ['Model response without structured evidence — review recommended.'],
      };
    }
    return null;
  }
}
