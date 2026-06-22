import { randomUUID } from 'crypto';
import type { SessionContext } from '@/types/session';
import type { AgentId } from '@/types/agent';
import { fetchAuditLogsFromDb, persistAuditLogEntry } from './data-provider/supabase-persistence';
import { shouldPersistWrites } from './data-provider/persistence-config';

export interface AuditLogEntry {
  id: string;
  organizationId: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

const auditStore: AuditLogEntry[] = [];

export function logAuditEvent(params: {
  session: SessionContext;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
}): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: randomUUID(),
    organizationId: params.session.organizationId,
    userId: params.session.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    details: params.details ?? {},
    createdAt: new Date().toISOString(),
  };
  auditStore.push(entry);
  void persistAuditLogEntry(entry);
  return entry;
}

export function logAgentInvocation(params: {
  session: SessionContext;
  agentId: AgentId;
  message: string;
  governanceStatus: string;
  blocked: boolean;
  matchedPatterns?: string[];
}): AuditLogEntry {
  return logAuditEvent({
    session: params.session,
    action: params.blocked ? 'agent.invocation.blocked' : 'agent.invocation',
    entityType: 'agent',
    entityId: params.agentId,
    details: {
      messagePreview: params.message.slice(0, 200),
      governanceStatus: params.governanceStatus,
      matchedPatterns: params.matchedPatterns ?? [],
    },
  });
}

export function logRecommendationCreated(params: {
  session: SessionContext;
  recommendationId: string;
  agentId: AgentId;
  type: string;
}): AuditLogEntry {
  return logAuditEvent({
    session: params.session,
    action: 'recommendation.created',
    entityType: 'recommendation',
    entityId: params.recommendationId,
    details: { agentId: params.agentId, type: params.type },
  });
}

export function logAgentResponse(params: {
  session: SessionContext;
  agentId: AgentId;
  responseMode: string;
  governanceStatus: string;
  provider?: string;
  responsePreview?: string;
}): AuditLogEntry {
  return logAuditEvent({
    session: params.session,
    action: 'agent.response',
    entityType: 'agent',
    entityId: params.agentId,
    details: {
      responseMode: params.responseMode,
      governanceStatus: params.governanceStatus,
      provider: params.provider,
      responsePreview: params.responsePreview?.slice(0, 200),
      activeRole: params.session.activeRole,
    },
  });
}

export function logRecommendationBlocked(params: {
  session: SessionContext;
  agentId: AgentId;
  matchedPatterns: string[];
}): AuditLogEntry {
  return logAuditEvent({
    session: params.session,
    action: 'recommendation.blocked',
    entityType: 'agent',
    entityId: params.agentId,
    details: {
      matchedPatterns: params.matchedPatterns,
      activeRole: params.session.activeRole,
    },
  });
}

/** Test and debug helper — not exposed to end users in MVP. */
export function getAuditLogs(): readonly AuditLogEntry[] {
  return auditStore;
}

/** Org-scoped audit logs for HR surfaces — prefers Postgres when persistence is enabled. */
export async function listAuditLogsForOrganization(
  organizationId: string,
): Promise<AuditLogEntry[]> {
  if (shouldPersistWrites()) {
    const persisted = await fetchAuditLogsFromDb(organizationId);
    if (persisted.length > 0) return persisted;
  }
  return auditStore.filter((entry) => entry.organizationId === organizationId);
}

export function clearAuditLogs(): void {
  auditStore.length = 0;
}
