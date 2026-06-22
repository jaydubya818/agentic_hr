import type { AgentId } from '@/types/agent';

/** Approved read-only data surfaces per agent (tool contract). */
export const AGENT_DATA_CONTRACTS: Record<
  AgentId,
  {
    allowedSurfaces: string[];
    forbiddenSurfaces: string[];
  }
> = {
  'employee-growth': {
    allowedSurfaces: [
      'employee_profile',
      'employee_skills',
      'career_goals',
      'growth_plans',
      'roles',
      'learning_resources',
    ],
    forbiddenSurfaces: ['audit_logs', 'user_roles', 'other_employees_private'],
  },
  supermanager: {
    allowedSurfaces: [
      'team_members',
      'direct_report_profiles',
      'direct_report_skills',
      'team_skills_matrix',
      'coaching_prompts',
    ],
    forbiddenSurfaces: ['audit_logs', 'compensation', 'performance_ratings'],
  },
  'skills-intelligence': {
    allowedSurfaces: ['employee_skills', 'roles', 'role_skills'],
    forbiddenSurfaces: ['audit_logs', 'other_employees_private'],
  },
  'dynamic-learning': {
    allowedSurfaces: ['employee_skills', 'learning_resources', 'skill_gaps'],
    forbiddenSurfaces: ['audit_logs', 'compensation'],
  },
  'internal-mobility': {
    allowedSurfaces: ['employee_skills', 'opportunities', 'roles'],
    forbiddenSurfaces: ['audit_logs', 'hiring_decisions', 'compensation'],
  },
  governance: {
    allowedSurfaces: ['agent_output_text', 'recommendation_payload'],
    forbiddenSurfaces: ['audit_logs', 'raw_pii_exports', 'unscoped_employee_records'],
  },
};

export function agentMayAccessSurface(agentId: AgentId, surface: string): boolean {
  const contract = AGENT_DATA_CONTRACTS[agentId];
  if (contract.forbiddenSurfaces.includes(surface)) return false;
  return contract.allowedSurfaces.includes(surface);
}
