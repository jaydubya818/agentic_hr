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
    employees: [...workdayEmployees, ...sfEmployees],
    jobProfiles: [...workdayProfiles, ...sfProfiles],
    skipped: false,
  };
}
