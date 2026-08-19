import { randomUUID } from 'crypto';

import { and, desc, eq } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import { getConfidenceLevel } from '@/lib/format/confidence';
import {
  auditLogs,
  recommendationEvidence,
  recommendations,
} from '@/lib/db/schema';
import type { AgentRecommendationResult } from '@/types/agent';
import type { AuditLogEntry } from '@/services/audit-service';
import { clearSupabaseStoreCache } from './store-runtime';
import { shouldPersistWrites } from './persistence-config';

export async function persistAgentRecommendations(
  results: AgentRecommendationResult[],
): Promise<void> {
  if (!shouldPersistWrites() || results.length === 0) return;

  const db = getDb();
  if (!db) return;

  // Batch the writes: one round trip for recommendations and one for their
  // evidence rows instead of up to two per recommendation.
  await db.insert(recommendations).values(
    results.map((rec) => ({
      id: rec.id,
      organizationId: rec.organizationId,
      employeeId: rec.employeeId,
      agentId: rec.agentId,
      type: rec.type,
      title: rec.title,
      explanation: rec.explanation,
      confidence: getConfidenceLevel(rec.confidence),
      confidenceScore: rec.confidence,
      status: rec.status,
      governanceStatus: rec.governanceStatus,
      metadata: (rec as { metadata?: Record<string, unknown> }).metadata ?? {},
    })),
  );

  const evidenceRows = results.flatMap((rec) =>
    (rec.evidence ?? []).map((ev, index) => ({
      id: randomUUID(),
      organizationId: rec.organizationId,
      recommendationId: rec.id,
      evidenceType: ev.evidenceType,
      referenceId: ev.referenceId ?? null,
      label: ev.label,
      detail: ev.detail ?? null,
      sortOrder: index,
    })),
  );
  if (evidenceRows.length > 0) {
    await db.insert(recommendationEvidence).values(evidenceRows);
  }

  clearSupabaseStoreCache();
}

export async function updateRecommendationStatusInDb(
  recommendationId: string,
  status: 'accepted' | 'dismissed',
  organizationId: string,
): Promise<boolean> {
  if (!shouldPersistWrites()) return false;

  const db = getDb();
  if (!db) return false;

  const result = await db
    .update(recommendations)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(recommendations.id, recommendationId),
        eq(recommendations.organizationId, organizationId),
      ),
    )
    .returning({ id: recommendations.id });

  if (result.length === 0) return false;
  clearSupabaseStoreCache();
  return true;
}

export async function persistAuditLogEntry(entry: AuditLogEntry): Promise<void> {
  if (!shouldPersistWrites()) return;

  const db = getDb();
  if (!db) return;

  await db.insert(auditLogs).values({
    id: entry.id,
    organizationId: entry.organizationId,
    userId: entry.userId,
    action: entry.action,
    resourceType: entry.entityType,
    resourceId: entry.entityId,
    details: entry.details,
    createdAt: new Date(entry.createdAt),
  });
}

// Mirrors MAX_IN_MEMORY_AUDIT_ENTRIES in audit-service: the HR audit page and
// CSV export read this list whole, so an unbounded select would load every row
// ever written once a live audit table grows.
const MAX_AUDIT_LOG_ROWS = 5000;

export async function fetchAuditLogsFromDb(organizationId: string): Promise<AuditLogEntry[]> {
  if (!shouldPersistWrites()) return [];

  const db = getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.organizationId, organizationId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(MAX_AUDIT_LOG_ROWS);

  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organizationId,
    userId: row.userId,
    action: row.action,
    entityType: row.resourceType,
    entityId: row.resourceId,
    details: (row.details as Record<string, unknown>) ?? {},
    createdAt: row.createdAt.toISOString(),
  }));
}
