import type { z } from 'zod';
import type { createRecommendationInputSchema } from '@/schemas/entities';
import type { AgentActionPlan, AgentProposedAction } from '@/schemas/workforce-intelligence';
import type { SessionContext } from './session';

export const AGENT_IDS = [
  'employee-growth',
  'supermanager',
  'skills-intelligence',
  'dynamic-learning',
  'internal-mobility',
  'governance',
] as const;

export type AgentId = (typeof AGENT_IDS)[number];

export function isAgentId(value: string): value is AgentId {
  return (AGENT_IDS as readonly string[]).includes(value);
}

export type CreateRecommendationInput = z.infer<typeof createRecommendationInputSchema>;

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentContext {
  employeeId?: string;
  teamId?: string;
  contextType?: string;
}

export interface AgentInvokeParams {
  session: SessionContext;
  message: string;
  context?: AgentContext;
  conversationHistory?: AgentMessage[];
}

export type GovernanceStatus = 'passed' | 'blocked' | 'flagged';

export interface AgentRecommendationResult extends CreateRecommendationInput {
  id: string;
  agentId: AgentId;
  employeeId: string;
  organizationId: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  status: 'pending';
  governanceStatus: GovernanceStatus;
  createdAt: string;
}

export interface AgentResult {
  agentId: AgentId;
  response: string;
  recommendations: AgentRecommendationResult[];
  governanceStatus: GovernanceStatus;
  governanceBlocked: boolean;
  matchedPatterns?: string[];
  metadata: Record<string, unknown>;
  actionPlan?: AgentActionPlan & { actions: AgentProposedAction[] };
}

export type { AgentActionPlan, AgentProposedAction };
