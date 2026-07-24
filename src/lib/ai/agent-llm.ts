import { dataProvider } from '@/services/data-provider';
import type { AgentId } from '@/types/agent';

import { getLlmMode, resolveLlmProvider } from './index';
import { getAgentSystemPrompt } from './prompts';
import { parseAgentLlmResponse } from './schemas/agent-response';
import type { AgentMessage } from '@/types/agent';

export interface LiveAgentRequest {
  agentId: AgentId;
  userMessage: string;
  employeeId: string;
  managerEmployeeId?: string;
  conversationHistory?: AgentMessage[];
}

function buildGroundingSummary(agentId: AgentId, employeeId: string, managerEmployeeId?: string): string {
  const employee = dataProvider.getEmployee(employeeId);
  const profile = dataProvider.getEmployeeProfile(employeeId);
  const skills = dataProvider.getEmployeeSkills(employeeId);
  const confirmed = skills
    .filter((s) => s.source === 'confirmed')
    .map((s) => dataProvider.getSkill(s.skillId)?.name);
  const inferred = skills
    .filter((s) => s.source === 'inferred')
    .map((s) => dataProvider.getSkill(s.skillId)?.name);

  const parts = [
    `Employee: ${employee?.jobTitle ?? 'unknown'}`,
    `Career summary: ${profile?.careerSummary ?? 'n/a'}`,
    `Confirmed skills: ${confirmed.filter(Boolean).join(', ') || 'none'}`,
    `Inferred skills: ${inferred.filter(Boolean).join(', ') || 'none'}`,
  ];

  if (agentId === 'supermanager' && managerEmployeeId) {
    const team = dataProvider.getTeamMembers(managerEmployeeId);
    parts.push(`Direct reports: ${team.map((m) => m.jobTitle).join(', ') || 'none'}`);
  }

  if (agentId === 'dynamic-learning') {
    const paths = dataProvider.getCareerPaths(employeeId);
    const gap = paths[0]?.skillGaps[0];
    if (gap) {
      parts.push(`Top skill gap: ${gap.skill.name} (target level ${gap.requiredLevel})`);
    }
  }

  return parts.join('\n');
}

export interface LiveAgentGenerationResult {
  responseText: string;
  confidence: number;
  evidence: string[];
  mode: 'live' | 'fallback' | 'mock';
  provider: string;
}

export async function generateLiveAgentResponse(
  request: LiveAgentRequest,
): Promise<LiveAgentGenerationResult | null> {
  const mode = getLlmMode();
  if (mode === 'mock') {
    return null;
  }

  const grounding = buildGroundingSummary(
    request.agentId,
    request.employeeId,
    request.managerEmployeeId,
  );

  const provider = resolveLlmProvider();
  const systemPrompt = getAgentSystemPrompt(request.agentId);

  try {
    const result = await provider.complete({
      systemPrompt,
      messages: [
        { role: 'user', content: `Grounding data:\n${grounding}` },
        ...(request.conversationHistory ?? [])
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        { role: 'user', content: request.userMessage },
      ],
      responseFormat: 'json',
      temperature: 0.3,
      maxTokens: 800,
    });

    const parsed = parseAgentLlmResponse(result.content);
    if (!parsed) {
      return null;
    }

    return {
      responseText: parsed.response,
      confidence: parsed.confidence,
      evidence: parsed.evidence,
      mode: provider.name === 'mock' ? 'fallback' : 'live',
      provider: result.provider,
    };
  } catch (error) {
    console.warn('[ai] Live agent generation failed; caller should fall back to mock.', error);
    return null;
  }
}
