import { eq } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import { employeeSkills } from '@/lib/db/schema';
import { logAuditEvent } from '@/services/audit-service';
import type { SessionContext } from '@/types/session';
import { clearSupabaseStoreCache } from './data-provider/store-runtime';
import { shouldPersistWrites } from './data-provider/persistence-config';
import { dataProvider } from './data-provider';

export type InferredSkillReviewAction = 'confirm' | 'reject';

export async function reviewInferredSkill(params: {
  session: SessionContext;
  employeeSkillId: string;
  action: InferredSkillReviewAction;
}): Promise<{ ok: boolean; reason?: string }> {
  const store = dataProvider.getMockStore();
  const skillRow = store.employeeSkills.find((es) => es.id === params.employeeSkillId);
  if (!skillRow) {
    return { ok: false, reason: 'Skill not found' };
  }

  if (skillRow.source !== 'inferred') {
    return { ok: false, reason: 'Only inferred skills can be reviewed' };
  }

  if (shouldPersistWrites()) {
    const db = getDb();
    if (db) {
      if (params.action === 'confirm') {
        await db
          .update(employeeSkills)
          .set({ source: 'confirmed', updatedAt: new Date() })
          .where(eq(employeeSkills.id, params.employeeSkillId));
      } else {
        await db.delete(employeeSkills).where(eq(employeeSkills.id, params.employeeSkillId));
      }
      clearSupabaseStoreCache();
    }
  }

  logAuditEvent({
    session: params.session,
    action: `skill.inferred.${params.action}`,
    entityType: 'employee_skill',
    entityId: params.employeeSkillId,
    details: { employeeId: skillRow.employeeId, skillId: skillRow.skillId },
  });

  return { ok: true };
}
