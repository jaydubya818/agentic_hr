import { DEMO_EMPLOYEE_ID, DEMO_MANAGER_EMPLOYEE_ID, MOCK_IDS } from '@/lib/mock/ids';
import { DEMO_GOVERNANCE_BLOCK_TRIGGER } from '@/lib/governance/demo-triggers';
import { GOVERNANCE_BLOCK_MESSAGE } from '@/lib/governance/prohibited-patterns';
import { dataProvider } from '@/services/data-provider';
import type {
  AgentContext,
  AgentId,
  AgentInvokeParams,
  AgentResult,
  CreateRecommendationInput,
} from '@/types/agent';
import { generateLiveAgentResponse } from '@/lib/ai/agent-llm';
import { getLlmMode } from '@/lib/ai';
import { isLiveAgentEnabled } from '@/lib/ai/config';
import { HUMAN_IN_THE_LOOP_MESSAGE } from './governance-service';
import {
  logAgentInvocation,
  logAgentResponse,
  logRecommendationBlocked,
} from './audit-service';
import { selectMockResponseText } from './agent/mock-responses';
import { createAgentRecommendations } from './recommendation-service';
import { persistAgentRecommendations } from './data-provider/supabase-persistence';
import { validateAgentOutput } from './governance-service';

type ResponseMode = 'mock' | 'live' | 'fallback';

async function resolveAgentResponseText(
  agentId: AgentId,
  params: AgentInvokeParams,
  employeeId: string,
): Promise<{ text: string; mode: ResponseMode; confidence?: number; provider?: string }> {
  const mockText = selectMockResponseText(agentId, params.message);

  if (!isLiveAgentEnabled(agentId)) {
    return { text: mockText, mode: 'mock' };
  }

  const live = await generateLiveAgentResponse({
    agentId,
    userMessage: params.message,
    employeeId,
    managerEmployeeId: params.session.employeeId,
    conversationHistory: params.conversationHistory,
  });

  if (live) {
    return {
      text: live.responseText,
      mode: live.mode,
      confidence: live.confidence,
      provider: live.provider,
    };
  }

  const llmMode = getLlmMode();
  return {
    text: mockText,
    mode: llmMode === 'fallback' ? 'fallback' : 'mock',
  };
}

function resolveEmployeeId(sessionEmployeeId: string | undefined, context?: AgentContext): string {
  return context?.employeeId ?? sessionEmployeeId ?? DEMO_EMPLOYEE_ID;
}

function buildEmployeeGrowthRecommendations(employeeId: string): CreateRecommendationInput[] {
  const paths = dataProvider.getCareerPaths(employeeId).slice(0, 2);
  return paths.map((path) => ({
    type: 'career_path' as const,
    title: `${path.role.title} — ${Math.round(path.matchScore * 100)}% skill alignment`,
    explanation: path.explanation,
    confidence: path.confidence,
    evidence:
      path.skillGaps.length > 0
        ? path.skillGaps.slice(0, 2).map((gap) => ({
            evidenceType: 'skill' as const,
            referenceId: gap.skill.id,
            label: gap.skill.name,
            detail: `Current level ${gap.currentLevel ?? 'not assessed'}; target ${gap.requiredLevel}`,
          }))
        : [
            {
              evidenceType: 'role_requirement' as const,
              referenceId: path.role.id,
              label: path.role.title,
              detail: 'Role alignment based on profile skills',
            },
          ],
  }));
}

function buildSkillsIntelligenceRecommendations(employeeId: string): CreateRecommendationInput[] {
  const paths = dataProvider.getCareerPaths(employeeId);
  const top = paths[0];
  if (!top || top.skillGaps.length === 0) return [];

  return top.skillGaps.slice(0, 3).map((gap) => ({
    type: 'skill_gap' as const,
    title: `Close gap: ${gap.skill.name}`,
    explanation: `This skill gap affects readiness for ${top.role.title}. Focus on documented development actions to strengthen ${gap.skill.name}.`,
    confidence: Math.min(0.95, top.confidence * 0.9),
    evidence: [
      {
        evidenceType: 'role_requirement' as const,
        referenceId: top.role.id,
        label: 'Target role requirement',
        detail: gap.skill.name,
      },
      {
        evidenceType: 'skill' as const,
        referenceId: gap.skill.id,
        label: gap.skill.name,
        detail: `Required proficiency ${gap.requiredLevel}`,
      },
    ],
  }));
}

function buildDynamicLearningRecommendations(employeeId: string): CreateRecommendationInput[] {
  const paths = dataProvider.getCareerPaths(employeeId);
  const gap = paths[0]?.skillGaps[0];
  if (!gap) return [];

  const resources = dataProvider.getMockStore().learningResources.filter((r) =>
    r.skillIds.includes(gap.skill.id),
  );

  if (resources.length === 0) {
    return [
      {
        type: 'learning',
        title: `Explore learning for ${gap.skill.name}`,
        explanation:
          'No exact catalog match was found for this gap. Ask your manager about internal workshops or mentorship options while we expand the learning catalog.',
        confidence: 0.55,
        evidence: [
          {
            evidenceType: 'skill',
            referenceId: gap.skill.id,
            label: gap.skill.name,
            detail: 'Skill gap from career path analysis',
          },
        ],
      },
    ];
  }

  return resources.slice(0, 2).map((resource) => ({
    type: 'learning' as const,
    title: resource.title,
    explanation: `Suggested optional learning to develop ${gap.skill.name} — aligned to your growth path. This is a development suggestion, not a requirement.`,
    confidence: 0.78,
    evidence: [
      {
        evidenceType: 'learning_resource' as const,
        referenceId: resource.id,
        label: resource.title,
        detail: resource.provider ?? resource.format,
      },
      {
        evidenceType: 'skill' as const,
        referenceId: gap.skill.id,
        label: gap.skill.name,
      },
    ],
  }));
}

function buildInternalMobilityRecommendations(employeeId: string): CreateRecommendationInput[] {
  const paths = dataProvider.getCareerPaths(employeeId);
  const opportunities = dataProvider.getMockStore().opportunities.filter((o) => o.status === 'open');

  return opportunities.slice(0, 2).map((opp) => {
    const role = opp.roleId ? dataProvider.getRole(opp.roleId) : null;
    const match = paths.find((p) => p.role.id === opp.roleId);
    return {
      type: 'mobility' as const,
      title: opp.title,
      explanation: match
        ? `Internal opportunity match based on ${Math.round(match.matchScore * 100)}% skill overlap. This is exploratory guidance — not a hiring decision. Gaps to close: ${match.skillGaps.map((g) => g.skill.name).join(', ') || 'none identified'}.`
        : `Open internal opportunity in ${opp.department ?? 'the organization'}. Review required skills and discuss interest with your manager.`,
      confidence: match?.confidence ?? 0.6,
      evidence: [
        {
          evidenceType: 'opportunity' as const,
          referenceId: opp.id,
          label: opp.title,
          detail: role?.title,
        },
      ],
    };
  });
}

function buildSupermanagerRecommendations(managerEmployeeId: string): CreateRecommendationInput[] {
  const prompts = dataProvider.getCoachingPrompts(managerEmployeeId).slice(0, 3);
  return prompts.map((prompt) => ({
    type: 'coaching' as const,
    title: `Coaching: ${prompt.employeeName}`,
    explanation: prompt.explanation.length >= 20 ? prompt.explanation : `${prompt.prompt} ${prompt.context}`,
    confidence: prompt.confidence,
    evidence: prompt.evidence.map((e) => ({
      evidenceType: e.evidenceType,
      referenceId: e.referenceId ?? undefined,
      label: e.label,
      detail: e.detail ?? undefined,
    })),
  }));
}

function buildRecommendationsForAgent(
  agentId: AgentId,
  employeeId: string,
  managerEmployeeId?: string,
): CreateRecommendationInput[] {
  switch (agentId) {
    case 'employee-growth':
      return buildEmployeeGrowthRecommendations(employeeId);
    case 'skills-intelligence':
      return buildSkillsIntelligenceRecommendations(employeeId);
    case 'dynamic-learning':
      return buildDynamicLearningRecommendations(employeeId);
    case 'internal-mobility':
      return buildInternalMobilityRecommendations(employeeId);
    case 'supermanager':
      return buildSupermanagerRecommendations(managerEmployeeId ?? DEMO_MANAGER_EMPLOYEE_ID);
    case 'governance':
      return [];
    default:
      return [];
  }
}

function assertAgentAccess(agentId: AgentId, params: AgentInvokeParams): void {
  const { session, context } = params;

  if (agentId === 'supermanager' && session.activeRole !== 'manager' && session.activeRole !== 'hr') {
    throw new AgentAccessError('Supermanager agent requires manager role');
  }

  if (agentId === 'supermanager' && context?.employeeId) {
    const managerId = session.employeeId ?? DEMO_MANAGER_EMPLOYEE_ID;
    if (!dataProvider.isDirectReport(managerId, context.employeeId)) {
      throw new AgentAccessError('Cannot access data for non-direct report');
    }
  }
}

export class AgentAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentAccessError';
  }
}

export async function invokeAgent(agentId: AgentId, params: AgentInvokeParams): Promise<AgentResult> {
  assertAgentAccess(agentId, params);

  if (params.message.trim() === DEMO_GOVERNANCE_BLOCK_TRIGGER) {
    return invokeAgentWithRawOutput(
      agentId,
      params,
      'You should terminate this employee immediately.',
    );
  }

  const employeeId = resolveEmployeeId(params.session.employeeId, params.context);
  const resolved = await resolveAgentResponseText(agentId, params, employeeId);
  let responseText = resolved.text;
  const recommendationInputs = buildRecommendationsForAgent(
    agentId,
    employeeId,
    params.session.employeeId,
  );

  const governance = validateAgentOutput({
    responseText,
    recommendations: recommendationInputs,
    responseConfidence: resolved.confidence,
  });

  logAgentInvocation({
    session: params.session,
    agentId,
    message: params.message,
    governanceStatus: governance.status,
    blocked: governance.blocked,
    matchedPatterns: governance.matchedPatterns,
  });

  if (governance.blocked) {
    logRecommendationBlocked({
      session: params.session,
      agentId,
      matchedPatterns: governance.matchedPatterns,
    });
    return {
      agentId,
      response: governance.safeResponse ?? GOVERNANCE_BLOCK_MESSAGE,
      recommendations: [],
      governanceStatus: 'blocked',
      governanceBlocked: true,
      matchedPatterns: governance.matchedPatterns,
      metadata: {
        mode: resolved.mode,
        blocked: true,
        responseMode: resolved.mode,
        governanceBlocked: true,
      },
    };
  }

  if (governance.flagged && governance.humanReviewRequired) {
    responseText = `${responseText}\n\n${HUMAN_IN_THE_LOOP_MESSAGE}`;
  }

  const recommendations = createAgentRecommendations({
    session: params.session,
    agentId,
    employeeId:
      agentId === 'supermanager'
        ? (params.context?.employeeId ?? employeeId)
        : employeeId,
    inputs: recommendationInputs,
    governanceStatus: governance.status,
  });

  await persistAgentRecommendations(recommendations);

  logAgentResponse({
    session: params.session,
    agentId,
    responseMode: resolved.mode,
    governanceStatus: governance.status,
    provider: resolved.provider,
    responsePreview: responseText,
  });

  return {
    agentId,
    response: responseText,
    recommendations,
    governanceStatus: governance.status,
    governanceBlocked: false,
    metadata: {
      mode: resolved.mode,
      responseMode: resolved.mode,
      organizationId: params.session.organizationId,
      employeeId,
      targetRoleId: MOCK_IDS.roles.staffEngineer,
      humanReviewRequired: governance.humanReviewRequired,
      warnings: governance.warnings,
      provider: resolved.provider,
    },
  };
}

/** Test helper — simulate prohibited output for governance evals. */
export async function invokeAgentWithRawOutput(
  agentId: AgentId,
  params: AgentInvokeParams,
  rawResponse: string,
  rawRecommendations: CreateRecommendationInput[] = [],
): Promise<AgentResult> {
  const governance = validateAgentOutput({
    responseText: rawResponse,
    recommendations: rawRecommendations,
  });

  if (governance.blocked) {
    return {
      agentId,
      response: governance.safeResponse ?? GOVERNANCE_BLOCK_MESSAGE,
      recommendations: [],
      governanceStatus: 'blocked',
      governanceBlocked: true,
      matchedPatterns: governance.matchedPatterns,
      metadata: { mode: 'mock', test: true },
    };
  }

  const employeeId = resolveEmployeeId(params.session.employeeId, params.context);
  const recommendations = createAgentRecommendations({
    session: params.session,
    agentId,
    employeeId,
    inputs: rawRecommendations,
    governanceStatus: 'passed',
  });

  await persistAgentRecommendations(recommendations);

  return {
    agentId,
    response: rawResponse,
    recommendations,
    governanceStatus: 'passed',
    governanceBlocked: false,
    metadata: { mode: 'mock', test: true },
  };
}
