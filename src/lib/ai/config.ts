export function shouldUseMockAgents(): boolean {
  if (process.env.USE_MOCK_AGENTS === 'true') return true;
  if (process.env.USE_MOCK_AGENTS === 'false') return false;
  return true;
}

export function hasOpenAiApiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
}

/** Low-risk agents approved for controlled live calls (Phase 9C). */
export const LIVE_AGENT_IDS = [
  'employee-growth',
  'supermanager',
  'dynamic-learning',
] as const;

export type LiveAgentId = (typeof LIVE_AGENT_IDS)[number];

export function isLiveAgentEnabled(agentId: string): agentId is LiveAgentId {
  return (LIVE_AGENT_IDS as readonly string[]).includes(agentId);
}
