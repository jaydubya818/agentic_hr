import { randomUUID } from 'crypto';

import type { z } from 'zod';

import {
  createWorkforceDecisionInputSchema,
  updateWorkforceDecisionInputSchema,
  type DecisionEvidence,
  type DecisionOutcome,
  type DecisionParticipant,
  type WorkforceDecision,
} from '@/schemas/workforce-intelligence';
import { getMockStore } from '@/services/data-provider/mock-provider';
import { isDirectReport } from '@/services/data-provider/mock-provider';
import type { SessionContext } from '@/types/session';
import { canReadOrganizationWorkforceData, isManagerRole } from '@/lib/auth/rbac';

type CreateInput = z.infer<typeof createWorkforceDecisionInputSchema>;
type UpdateInput = z.infer<typeof updateWorkforceDecisionInputSchema>;

export interface WorkforceDecisionDetail extends WorkforceDecision {
  evidence: DecisionEvidence[];
  outcomes: DecisionOutcome[];
  participants: DecisionParticipant[];
}

function nowIso(): string {
  return new Date().toISOString();
}

function filterDecisionsForSession(
  session: SessionContext,
  decisions: WorkforceDecision[],
): WorkforceDecision[] {
  if (canReadOrganizationWorkforceData(session.roles)) {
    return decisions.filter((d) => d.organizationId === session.organizationId);
  }

  if (isManagerRole(session.roles) && session.employeeId) {
    const store = getMockStore();
    const managedTeamIds = store.teams
      .filter((t) => t.managerEmployeeId === session.employeeId)
      .map((t) => t.id);

    return decisions.filter(
      (d) =>
        d.organizationId === session.organizationId &&
        (d.ownerEmployeeId === session.employeeId ||
          (d.teamId != null && managedTeamIds.includes(d.teamId)) ||
          store.decisionParticipants.some(
            (p) => p.decisionId === d.id && p.employeeId === session.employeeId,
          )),
    );
  }

  return [];
}

function assertDecisionWriteScope(
  session: SessionContext,
  input: { teamId?: string | null; ownerEmployeeId?: string | null },
): void {
  const store = getMockStore();

  if (input.teamId != null) {
    const team = store.teams.find((t) => t.id === input.teamId);
    if (!team || team.organizationId !== session.organizationId) {
      throw new Error('Unknown team for this organization');
    }
    if (
      !canReadOrganizationWorkforceData(session.roles) &&
      team.managerEmployeeId !== session.employeeId
    ) {
      throw new Error('Forbidden');
    }
  }

  if (input.ownerEmployeeId != null) {
    const owner = store.employees.find((e) => e.id === input.ownerEmployeeId);
    if (!owner || owner.organizationId !== session.organizationId) {
      throw new Error('Unknown owner for this organization');
    }
  }
}

export function listWorkforceDecisions(session: SessionContext): WorkforceDecision[] {
  const store = getMockStore();
  return filterDecisionsForSession(session, store.workforceDecisions);
}

export function getWorkforceDecision(
  session: SessionContext,
  decisionId: string,
): WorkforceDecisionDetail | null {
  const allowed = listWorkforceDecisions(session);
  const decision = allowed.find((d) => d.id === decisionId);
  if (!decision) return null;

  const store = getMockStore();
  return {
    ...decision,
    evidence: store.decisionEvidence.filter((e) => e.decisionId === decisionId),
    outcomes: store.decisionOutcomes.filter((o) => o.decisionId === decisionId),
    participants: store.decisionParticipants.filter((p) => p.decisionId === decisionId),
  };
}

export function createWorkforceDecision(
  session: SessionContext,
  input: CreateInput,
): WorkforceDecision {
  if (!canReadOrganizationWorkforceData(session.roles) && !isManagerRole(session.roles)) {
    throw new Error('Forbidden');
  }

  assertDecisionWriteScope(session, input);

  const store = getMockStore();
  const timestamp = nowIso();
  const decision: WorkforceDecision = {
    id: randomUUID(),
    organizationId: session.organizationId,
    title: input.title,
    description: input.description ?? null,
    decisionType: input.decisionType,
    status: input.status ?? 'draft',
    teamId: input.teamId ?? null,
    businessPriorityId: input.businessPriorityId ?? null,
    ownerEmployeeId: input.ownerEmployeeId ?? session.employeeId ?? null,
    rationale: input.rationale ?? null,
    confidence: input.confidence ?? null,
    metadata: input.metadata ?? {},
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.workforceDecisions.push(decision);
  return decision;
}

/**
 * Write access to an existing decision: org-wide roles, the decision owner,
 * or the manager of the decision's team. Participation alone grants read
 * access but not write access.
 */
export function canWriteWorkforceDecision(
  session: SessionContext,
  decision: WorkforceDecision,
): boolean {
  if (decision.organizationId !== session.organizationId) return false;
  if (canReadOrganizationWorkforceData(session.roles)) return true;
  if (!isManagerRole(session.roles) || !session.employeeId) return false;
  if (decision.ownerEmployeeId === session.employeeId) return true;
  if (decision.teamId) {
    const team = getMockStore().teams.find((t) => t.id === decision.teamId);
    if (team?.managerEmployeeId === session.employeeId) return true;
  }
  return false;
}

export function updateWorkforceDecision(
  session: SessionContext,
  decisionId: string,
  input: UpdateInput,
): WorkforceDecision | null {
  const existing = getWorkforceDecision(session, decisionId);
  if (!existing) return null;

  if (!canWriteWorkforceDecision(session, existing)) {
    throw new Error('Forbidden');
  }

  assertDecisionWriteScope(session, input);

  const store = getMockStore();
  const index = store.workforceDecisions.findIndex((d) => d.id === decisionId);
  if (index < 0) return null;

  const updated: WorkforceDecision = {
    ...store.workforceDecisions[index]!,
    ...input,
    updatedAt: nowIso(),
  };
  store.workforceDecisions[index] = updated;
  return updated;
}

export function canManagerAccessDecision(
  managerEmployeeId: string,
  decision: WorkforceDecision,
): boolean {
  const store = getMockStore();
  if (decision.ownerEmployeeId === managerEmployeeId) return true;
  if (decision.teamId) {
    const team = store.teams.find((t) => t.id === decision.teamId);
    if (team?.managerEmployeeId === managerEmployeeId) return true;
  }
  return store.decisionParticipants.some(
    (p) => p.decisionId === decision.id && isDirectReport(managerEmployeeId, p.employeeId),
  );
}
