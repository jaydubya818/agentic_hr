import { randomUUID } from 'crypto';

import type { z } from 'zod';

import {
  createTeamScenarioInputSchema,
  updateTeamScenarioInputSchema,
  type RoleEvolutionScenario,
  type RoleTaskChange,
  type TeamScenario,
  type TeamScenarioRole,
  type TeamScenarioSkill,
} from '@/schemas/workforce-intelligence';
import { getMockStore } from '@/services/data-provider/mock-provider';
import type { SessionContext } from '@/types/session';
import {
  canReadOrganizationWorkforceData,
  canWriteOrganizationWorkforceData,
  isManagerRole,
} from '@/lib/auth/rbac';

type CreateInput = z.infer<typeof createTeamScenarioInputSchema>;
type UpdateInput = z.infer<typeof updateTeamScenarioInputSchema>;

export interface TeamScenarioDetail extends TeamScenario {
  roles: TeamScenarioRole[];
  skills: TeamScenarioSkill[];
}

export interface RoleEvolutionDetail extends RoleEvolutionScenario {
  taskChanges: RoleTaskChange[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function filterScenariosForSession(session: SessionContext): TeamScenario[] {
  const store = getMockStore();
  const orgScenarios = store.teamScenarios.filter(
    (s) => s.organizationId === session.organizationId,
  );

  if (canReadOrganizationWorkforceData(session.roles)) {
    return orgScenarios;
  }

  if (isManagerRole(session.roles) && session.employeeId) {
    const managedTeamIds = store.teams
      .filter((t) => t.managerEmployeeId === session.employeeId)
      .map((t) => t.id);
    return orgScenarios.filter((s) => managedTeamIds.includes(s.teamId));
  }

  return [];
}

function assertTeamWriteScope(session: SessionContext, teamId: string): void {
  const store = getMockStore();
  const team = store.teams.find((t) => t.id === teamId);
  if (!team || team.organizationId !== session.organizationId) {
    throw new Error('Unknown team for this organization');
  }
  if (
    !canWriteOrganizationWorkforceData(session.roles) &&
    team.managerEmployeeId !== session.employeeId
  ) {
    throw new Error('Forbidden');
  }
}

export function listTeamScenarios(session: SessionContext): TeamScenario[] {
  return filterScenariosForSession(session);
}

export function getTeamScenario(
  session: SessionContext,
  scenarioId: string,
): TeamScenarioDetail | null {
  const scenario = filterScenariosForSession(session).find((s) => s.id === scenarioId);
  if (!scenario) return null;

  const store = getMockStore();
  // Join detail rows on organization as well as scenario id (matching the
  // decision-detail scoping) so another organization's rows recorded against
  // the same identifier can never surface in a scenario detail.
  return {
    ...scenario,
    roles: store.teamScenarioRoles.filter(
      (r) => r.scenarioId === scenarioId && r.organizationId === scenario.organizationId,
    ),
    skills: store.teamScenarioSkills.filter(
      (s) => s.scenarioId === scenarioId && s.organizationId === scenario.organizationId,
    ),
  };
}

export function createTeamScenario(session: SessionContext, input: CreateInput): TeamScenario {
  if (!canWriteOrganizationWorkforceData(session.roles) && !isManagerRole(session.roles)) {
    throw new Error('Forbidden');
  }

  assertTeamWriteScope(session, input.teamId);

  const store = getMockStore();
  const timestamp = nowIso();
  const scenario: TeamScenario = {
    id: randomUUID(),
    organizationId: session.organizationId,
    title: input.title,
    description: input.description ?? null,
    teamId: input.teamId,
    scenarioType: input.scenarioType,
    status: input.status ?? 'draft',
    businessPriorityId: input.businessPriorityId ?? null,
    rationale: input.rationale ?? null,
    confidence: input.confidence ?? null,
    metadata: input.metadata ?? {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.teamScenarios.push(scenario);
  return scenario;
}

export function updateTeamScenario(
  session: SessionContext,
  scenarioId: string,
  input: UpdateInput,
): TeamScenario | null {
  const existing = getTeamScenario(session, scenarioId);
  if (!existing) return null;

  if (input.teamId != null) {
    assertTeamWriteScope(session, input.teamId);
  }

  const store = getMockStore();
  const index = store.teamScenarios.findIndex((s) => s.id === scenarioId);
  if (index < 0) return null;

  const updated: TeamScenario = {
    ...store.teamScenarios[index]!,
    ...input,
    updatedAt: nowIso(),
  };
  store.teamScenarios[index] = updated;
  return updated;
}

export function listRoleEvolutionScenarios(organizationId: string): RoleEvolutionScenario[] {
  return getMockStore().roleEvolutionScenarios.filter((s) => s.organizationId === organizationId);
}

export function getRoleEvolutionScenario(
  organizationId: string,
  scenarioId: string,
): RoleEvolutionDetail | null {
  const store = getMockStore();
  const scenario = store.roleEvolutionScenarios.find(
    (s) => s.id === scenarioId && s.organizationId === organizationId,
  );
  if (!scenario) return null;

  return {
    ...scenario,
    taskChanges: store.roleTaskChanges.filter(
      (t) => t.roleEvolutionScenarioId === scenarioId && t.organizationId === organizationId,
    ),
  };
}

export function compareTeamScenarios(
  organizationId: string,
  currentScenarioId: string,
  futureScenarioId: string,
): {
  current: TeamScenarioDetail | null;
  future: TeamScenarioDetail | null;
  skillDeltas: Array<{
    skillId: string;
    currentGap: number | null;
    futureGap: number | null;
    delta: number | null;
  }>;
  roleDeltas: Array<{
    roleId: string;
    currentHeadcount: number;
    futureHeadcount: number;
    delta: number;
  }>;
} {
  const store = getMockStore();
  const current = store.teamScenarios.find(
    (s) => s.id === currentScenarioId && s.organizationId === organizationId,
  );
  const future = store.teamScenarios.find(
    (s) => s.id === futureScenarioId && s.organizationId === organizationId,
  );

  const currentSkills = current
    ? store.teamScenarioSkills.filter(
        (s) => s.scenarioId === currentScenarioId && s.organizationId === organizationId,
      )
    : [];
  const futureSkills = future
    ? store.teamScenarioSkills.filter(
        (s) => s.scenarioId === futureScenarioId && s.organizationId === organizationId,
      )
    : [];
  const skillIds = new Set([
    ...currentSkills.map((s) => s.skillId),
    ...futureSkills.map((s) => s.skillId),
  ]);

  const skillDeltas = [...skillIds].map((skillId) => {
    const c = currentSkills.find((s) => s.skillId === skillId);
    const f = futureSkills.find((s) => s.skillId === skillId);
    const currentGap = c?.gap ?? null;
    const futureGap = f?.gap ?? null;
    return {
      skillId,
      currentGap,
      futureGap,
      delta: currentGap != null && futureGap != null ? futureGap - currentGap : null,
    };
  });

  const currentRoles = current
    ? store.teamScenarioRoles.filter(
        (r) => r.scenarioId === currentScenarioId && r.organizationId === organizationId,
      )
    : [];
  const futureRoles = future
    ? store.teamScenarioRoles.filter(
        (r) => r.scenarioId === futureScenarioId && r.organizationId === organizationId,
      )
    : [];
  const roleIds = new Set([
    ...currentRoles.map((r) => r.roleId),
    ...futureRoles.map((r) => r.roleId),
  ]);

  const roleDeltas = [...roleIds].map((roleId) => {
    const c = currentRoles.find((r) => r.roleId === roleId);
    const f = futureRoles.find((r) => r.roleId === roleId);
    const currentHeadcount = c?.headcount ?? 0;
    const futureHeadcount = f?.headcount ?? 0;
    return { roleId, currentHeadcount, futureHeadcount, delta: futureHeadcount - currentHeadcount };
  });

  return {
    current: current
      ? {
          ...current,
          roles: currentRoles,
          skills: currentSkills,
        }
      : null,
    future: future
      ? {
          ...future,
          roles: futureRoles,
          skills: futureSkills,
        }
      : null,
    skillDeltas,
    roleDeltas,
  };
}
