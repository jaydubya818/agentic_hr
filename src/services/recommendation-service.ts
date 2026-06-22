import { randomUUID } from 'crypto';
import { getConfidenceLevel } from '@/lib/format/confidence';
import { createRecommendationInputSchema } from '@/schemas/entities';
import type {
  AgentId,
  AgentRecommendationResult,
  CreateRecommendationInput,
  GovernanceStatus,
} from '@/types/agent';
import type { SessionContext } from '@/types/session';
import { logRecommendationCreated } from './audit-service';

export function validateRecommendationInput(input: CreateRecommendationInput): CreateRecommendationInput {
  return createRecommendationInputSchema.parse(input);
}

export function createAgentRecommendations(params: {
  session: SessionContext;
  agentId: AgentId;
  employeeId: string;
  inputs: CreateRecommendationInput[];
  governanceStatus: GovernanceStatus;
}): AgentRecommendationResult[] {
  const now = new Date().toISOString();
  const results: AgentRecommendationResult[] = [];

  for (const raw of params.inputs) {
    const validated = validateRecommendationInput(raw);
    const id = randomUUID();
    const confidenceLevel = getConfidenceLevel(validated.confidence);

    const rec: AgentRecommendationResult = {
      ...validated,
      id,
      agentId: params.agentId,
      employeeId: params.employeeId,
      organizationId: params.session.organizationId,
      confidenceLevel,
      status: 'pending',
      governanceStatus: params.governanceStatus,
      createdAt: now,
    };

    results.push(rec);

    logRecommendationCreated({
      session: params.session,
      recommendationId: id,
      agentId: params.agentId,
      type: validated.type,
    });
  }

  return results;
}
