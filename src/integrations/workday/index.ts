import { mockHrisAdapter } from '../mock-hris-adapter';
import type { HrisReadAdapter } from '../types';

/** Read-only Workday adapter stub — returns mock records until live credentials are configured. */
export const workdayReadAdapter: HrisReadAdapter = {
  vendor: 'workday',
  fetchEmployees: (organizationId) => mockHrisAdapter.fetchEmployees(organizationId),
  fetchJobProfiles: (organizationId) => mockHrisAdapter.fetchJobProfiles(organizationId),
};
