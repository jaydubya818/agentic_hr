import { mockHrisAdapter } from '../mock-hris-adapter';
import type { HrisReadAdapter } from '../types';

/** Read-only SuccessFactors adapter stub — returns mock records until live credentials are configured. */
export const successFactorsReadAdapter: HrisReadAdapter = {
  vendor: 'successfactors',
  fetchEmployees: (organizationId) => mockHrisAdapter.fetchEmployees(organizationId),
  fetchJobProfiles: (organizationId) => mockHrisAdapter.fetchJobProfiles(organizationId),
};
