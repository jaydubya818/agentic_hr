import { randomUUID } from 'crypto';
import type { SessionContext } from '@/types/session';
import type { AgentId } from '@/types/agent';
import { agentContentForAudit } from '@/lib/audit/agent-content';
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

/** Bound the in-memory fallback store so long-running demo servers do not leak. */
const MAX_IN_MEMORY_AUDIT_ENTRIES = 5000;

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
  if (auditStore.length > MAX_IN_MEMORY_AUDIT_ENTRIES) {
    auditStore.splice(0, auditStore.length - MAX_IN_MEMORY_AUDIT_ENTRIES);
  }
  void persistAuditLogEntry(entry).catch((error) => {
    console.error('Failed to persist audit log entry', error);
  });
  return entry;
}

/**
 * `scannedContent` is the text the governance filter actually matched against,
 * which is the agent's own output -- not `message`, which is the employee's
 * prompt. Recording only the verdict left the trail unable to answer the two
 * questions an auditor asks of it:
 *
 * - On a block, *what* was blocked. The blocked path returns before
 *   `logAgentResponse`, so without this the offending output was never written
 *   down anywhere and a block could not be reviewed as a true or false
 *   positive.
 * - On a pass, what the filter saw. A clean output and an output that slipped
 *   a known term past the patterns by encoding both logged
 *   `matchedPatterns: []` and were byte-identical in the trail.
 *
 * Both values go through `agentContentForAudit`, so this stays inside the
 * SECURITY_AND_PRIVACY 8.2 rule -- readable preview outside production, stable
 * `sha256:` digest inside it. The digest is the point: it makes repeated
 * blocked outputs correlatable without exposing the text.
 */
export function logAgentInvocation(params: {
  session: SessionContext;
  agentId: AgentId;
  message: string;
  governanceStatus: string;
  blocked: boolean;
  matchedPatterns?: string[];
  scannedContent?: string;
}): AuditLogEntry {
  return logAuditEvent({
    session: params.session,
    action: params.blocked ? 'agent.invocation.blocked' : 'agent.invocation',
    entityType: 'agent',
    entityId: params.agentId,
    details: {
      messagePreview: agentContentForAudit(params.message),
      governanceStatus: params.governanceStatus,
      matchedPatterns: params.matchedPatterns ?? [],
      scannedContentPreview: agentContentForAudit(params.scannedContent),
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
      responsePreview: agentContentForAudit(params.responsePreview),
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
  // Match the database read, which orders newest-first: the HR audit page and
  // CSV export render this list as returned, so the two persistence modes must
  // not disagree on direction. The store appends chronologically, so a reverse
  // of the filtered copy is newest-first.
  return auditStore.filter((entry) => entry.organizationId === organizationId).reverse();
}

export function clearAuditLogs(): void {
  auditStore.length = 0;
}
