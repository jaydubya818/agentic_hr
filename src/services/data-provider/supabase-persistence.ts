import { randomUUID } from 'crypto';

import { desc, eq } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import {
  auditLogs,
  recommendationEvidence,
  recommendations,
} from '@/lib/db/schema';
import type { AgentRecommendationResult } from '@/types/agent';
import type { AuditLogEntry } from '@/services/audit-service';
import { clearSupabaseStoreCache } from './store-runtime';
import { shouldPersistWrites } from './persistence-config';

function confidenceEnumFromScore(score: number): 'high' | 'medium' | 'low' {
  if (score >= 0.75) return 'high';
  if (score >= 0.5) return 'medium';
  return 'low';
}

export async function persistAgentRecommendations(
  results: AgentRecommendationResult[],
): Promise<void> {
  if (!shouldPersistWrites() || results.length === 0) return;

  const db = getDb();
  if (!db) return;

  for (const rec of results) {
    await db.insert(recommendations).values({
      id: rec.id,
      organizationId: rec.organizationId,
      employeeId: rec.employeeId,
      agentId: rec.agentId,
      type: rec.type,
      title: rec.title,
      explanation: rec.explanation,
      confidence: confidenceEnumFromScore(rec.confidence),
      confidenceScore: rec.confidence,
      status: rec.status,
      governanceStatus: rec.governanceStatus,
      metadata: (rec as { metadata?: Record<string, unknown> }).metadata ?? {},
    });

    if (rec.evidence?.length) {
      await db.insert(recommendationEvidence).values(
        rec.evidence.map((ev, index) => ({
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
    }
  }

  clearSupabaseStoreCache();
}

export async function updateRecommendationStatusInDb(
  recommendationId: string,
  status: 'accepted' | 'dismissed',
): Promise<boolean> {
  if (!shouldPersistWrites()) return false;

  const db = getDb();
  if (!db) return false;

  const result = await db
    .update(recommendations)
    .set({ status, updatedAt: new Date() })
    .where(eq(recommendations.id, recommendationId))
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

export async function fetchAuditLogsFromDb(organizationId: string): Promise<AuditLogEntry[]> {
  if (!shouldPersistWrites()) return [];

  const db = getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.organizationId, organizationId))
    .orderBy(desc(auditLogs.createdAt));

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
