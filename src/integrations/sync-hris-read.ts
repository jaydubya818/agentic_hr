import { shouldUseHrisRead } from '@/services/data-provider/provider-config';
import { workdayReadAdapter } from './workday';
import { successFactorsReadAdapter } from './successfactors';
import type { HrisEmployeeRecord, HrisJobProfile } from './types';

export interface HrisSyncResult {
  vendor: string;
  employees: HrisEmployeeRecord[];
  jobProfiles: HrisJobProfile[];
  skipped: boolean;
}

/**
 * Merge vendor payloads on the identity key, first vendor wins.
 *
 * `externalId` is the identity of a record, so the same id arriving from two
 * vendors is one person, not two. Concatenating the arrays produced a payload
 * that double-counted every overlapping record -- which is every record while
 * both adapters are stubs delegating to the same mock source.
 */
function mergeByExternalId<T extends { externalId: string }>(...batches: T[][]): T[] {
  const byId = new Map<string, T>();
  for (const batch of batches) {
    for (const record of batch) {
      if (!byId.has(record.externalId)) byId.set(record.externalId, record);
    }
  }
  return [...byId.values()];
}

/**
 * Manual-trigger HRIS read sync stub. When USE_HRIS_READ=false, returns empty payload.
 */
export async function syncHrisReadFabric(organizationId: string): Promise<HrisSyncResult> {
  if (!shouldUseHrisRead()) {
    return { vendor: 'none', employees: [], jobProfiles: [], skipped: true };
  }

  const [workdayEmployees, workdayProfiles, sfEmployees, sfProfiles] = await Promise.all([
    workdayReadAdapter.fetchEmployees(organizationId),
    workdayReadAdapter.fetchJobProfiles(organizationId),
    successFactorsReadAdapter.fetchEmployees(organizationId),
    successFactorsReadAdapter.fetchJobProfiles(organizationId),
  ]);

  return {
    vendor: 'workday+successfactors',
    employees: mergeByExternalId(workdayEmployees, sfEmployees),
    jobProfiles: mergeByExternalId(workdayProfiles, sfProfiles),
    skipped: false,
  };
}
