import { DEMO_EMPLOYEE_ID, DEMO_MANAGER_EMPLOYEE_ID, MOCK_IDS } from '@/lib/mock/ids';
import { canReadIndividualEmployeeData, isManagerRole } from '@/lib/auth/rbac';
import { DEMO_GOVERNANCE_BLOCK_TRIGGER } from '@/lib/governance/demo-triggers';
import { GOVERNANCE_BLOCK_MESSAGE } from '@/lib/governance/prohibited-patterns';
import { dataProvider } from '@/services/data-provider';
import { shouldUseMockData } from '@/services/data-provider/provider-config';
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
import { shouldUseMockAgents } from '@/lib/ai/config';
import type { AgentActionPlan, AgentProposedAction } from '@/schemas/workforce-intelligence';

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
  const resolved = context?.employeeId ?? sessionEmployeeId;
  if (resolved) return resolved;
  // The demo-employee fallback is a mock-data convenience; a live session
  // without an employee record must not be grounded on demo fixtures.
  if (!shouldUseMockData()) {
    throw new AgentAccessError('Session has no employee record');
  }
  return DEMO_EMPLOYEE_ID;
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

function buildMockActionPlan(
  agentId: AgentId,
  employeeId: string,
  managerEmployeeId?: string,
): (AgentActionPlan & { actions: AgentProposedAction[] }) | undefined {
  if (!shouldUseMockAgents()) return undefined;

  const timestamp = new Date().toISOString();
  const orgId = MOCK_IDS.organization;

  switch (agentId) {
    case 'employee-growth': {
      const planId = MOCK_IDS.actionPlans.employeeGrowth;
      return {
        id: planId,
        organizationId: orgId,
        agentId,
        employeeId,
        teamId: null,
        title: 'Growth actions from career path analysis',
        summary: 'Development-focused actions grounded in confirmed skills and career goals.',
        sourceDecisionId: null,
        governanceStatus: 'passed',
        metadata: { mock: true },
        createdAt: timestamp,
        updatedAt: timestamp,
        actions: [
          {
            id: '16161616-1616-4161-8161-161616161601',
            organizationId: orgId,
            actionPlanId: planId,
            actionType: 'skill_development',
            title: 'Deepen System Design skills',
            description: 'Focus development on system design for Staff Engineer readiness.',
            status: 'pending_review',
            targetEmployeeId: employeeId,
            referenceId: '40000000-0000-4000-8000-000000000003',
            confidence: 0.82,
            explanation: 'Career path analysis shows system design as primary gap.',
            metadata: {},
            createdAt: timestamp,
            updatedAt: timestamp,
          },
          {
            id: '16161616-1616-4161-8161-161616161602',
            organizationId: orgId,
            actionPlanId: planId,
            actionType: 'learning_assignment',
            title: 'Enroll in architecture workshop',
            description: 'Optional workshop aligned to system design skill gap.',
            status: 'draft',
            targetEmployeeId: employeeId,
            referenceId: null,
            confidence: 0.75,
            explanation: 'Learning resource match from dynamic learning catalog.',
            metadata: {},
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
      };
    }
    case 'supermanager': {
      const planId = MOCK_IDS.actionPlans.supermanager;
      const team = dataProvider.getTeamByManager(managerEmployeeId ?? DEMO_MANAGER_EMPLOYEE_ID);
      return {
        id: planId,
        organizationId: orgId,
        agentId,
        employeeId: null,
        teamId: team?.id ?? MOCK_IDS.teams.platform,
        title: 'Team coaching and capability actions',
        summary: 'Manager enablement actions for direct report development.',
        sourceDecisionId: null,
        governanceStatus: 'passed',
        metadata: { mock: true },
        createdAt: timestamp,
        updatedAt: timestamp,
        actions: [
          {
            id: '16161616-1616-4161-8161-161616161603',
            organizationId: orgId,
            actionPlanId: planId,
            actionType: 'coaching_prompt',
            title: 'Discuss quality automation progress',
            description: 'Coaching conversation about quality automation contribution.',
            status: 'pending_review',
            targetEmployeeId: employeeId,
            referenceId: null,
            confidence: 0.79,
            explanation: 'Direct report contributing to quality automation project.',
            metadata: {},
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
      };
    }
    case 'dynamic-learning':
      return {
        id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
        organizationId: orgId,
        agentId,
        employeeId,
        teamId: null,
        title: 'Learning plan actions',
        summary: 'Optional learning assignments for identified skill gaps.',
        sourceDecisionId: null,
        governanceStatus: 'passed',
        metadata: { mock: true },
        createdAt: timestamp,
        updatedAt: timestamp,
        actions: [
          {
            id: '16161616-1616-4161-8161-161616161605',
            organizationId: orgId,
            actionPlanId: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
            actionType: 'learning_assignment',
            title: 'Complete targeted learning module',
            description: 'Learning assignment for top skill gap from profile analysis.',
            status: 'draft',
            targetEmployeeId: employeeId,
            referenceId: null,
            confidence: 0.7,
            explanation: 'Aligned to dynamic learning recommendations.',
            metadata: {},
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
      };
    case 'internal-mobility':
      return {
        id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc4',
        organizationId: orgId,
        agentId,
        employeeId,
        teamId: null,
        title: 'Mobility exploration actions',
        summary: 'Exploratory internal mobility guidance — not hiring decisions.',
        sourceDecisionId: null,
        governanceStatus: 'passed',
        metadata: { mock: true },
        createdAt: timestamp,
        updatedAt: timestamp,
        actions: [
          {
            id: '16161616-1616-4161-8161-161616161606',
            organizationId: orgId,
            actionPlanId: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc4',
            actionType: 'mobility_exploration',
            title: 'Explore internal opportunity match',
            description: 'Review open internal role alignment and discuss with manager.',
            status: 'pending_review',
            targetEmployeeId: employeeId,
            referenceId: null,
            confidence: 0.65,
            explanation: 'Mobility match based on skill overlap — exploratory only.',
            metadata: {},
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ],
      };
    default:
      return undefined;
  }
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

  if (context?.employeeId) {
    // Role checks below never span organizations: a known employee context in
    // another organization is concealed as inaccessible.
    const target = dataProvider.getEmployee(context.employeeId);
    if (target && target.organizationId !== session.organizationId) {
      throw new AgentAccessError('Cannot access data for another employee');
    }
  }

  if (agentId === 'supermanager' && session.activeRole !== 'manager' && session.activeRole !== 'hr') {
    throw new AgentAccessError('Supermanager agent requires manager role');
  }

  if (agentId === 'supermanager' && context?.employeeId) {
    // The demo-manager fallback is a mock-data convenience; in live mode a
    // session without an employee record gets no direct reports.
    const managerId =
      session.employeeId ?? (shouldUseMockData() ? DEMO_MANAGER_EMPLOYEE_ID : undefined);
    if (!managerId || !dataProvider.isDirectReport(managerId, context.employeeId)) {
      throw new AgentAccessError('Cannot access data for non-direct report');
    }
    return;
  }

  if (context?.employeeId && context.employeeId !== session.employeeId) {
    // Pulling an agent answer about a named colleague is an individual-PII
    // read, so the org-wide bypass is the individual-read role set:
    // BACKEND_STRUCTURE 6.1 grants executive_readonly no invoke_agents
    // permission at all, and SECURITY_AND_PRIVACY 6.1 limits it to
    // aggregates with no individual PII.
    const canAccessOtherEmployee =
      canReadIndividualEmployeeData(session.roles) ||
      (isManagerRole(session.roles) &&
        session.employeeId != null &&
        dataProvider.isDirectReport(session.employeeId, context.employeeId));
    if (!canAccessOtherEmployee) {
      throw new AgentAccessError('Cannot access data for another employee');
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
    const result = await invokeAgentWithRawOutput(
      agentId,
      params,
      'You should terminate this employee immediately.',
    );
    // The demo trigger must leave the same audit trail as a live block:
    // /hr/audit lists agent.invocation.blocked and recommendation.blocked
    // events (APP_FLOW), and the raw-output helper itself does not log.
    logAgentInvocation({
      session: params.session,
      agentId,
      message: params.message,
      governanceStatus: result.governanceStatus,
      blocked: result.governanceBlocked,
      matchedPatterns: result.matchedPatterns,
    });
    if (result.governanceBlocked) {
      logRecommendationBlocked({
        session: params.session,
        agentId,
        matchedPatterns: result.matchedPatterns ?? [],
      });
    }
    return result;
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
    actionPlan: buildMockActionPlan(
      agentId,
      agentId === 'supermanager'
        ? (params.context?.employeeId ?? employeeId)
        : employeeId,
      params.session.employeeId,
    ),
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
