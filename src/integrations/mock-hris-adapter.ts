import type { HrisEmployeeRecord, HrisJobProfile, HrisReadAdapter } from './types';

const MOCK_EMPLOYEES: HrisEmployeeRecord[] = [
  {
    externalId: 'wd-emp-001',
    email: 'alex.chen@techforward.io',
    jobTitle: 'Senior Software Engineer',
    department: 'Engineering',
    organizationId: '11111111-1111-4111-8111-111111111111',
  },
];

const MOCK_PROFILES: HrisJobProfile[] = [
  {
    externalId: 'wd-role-staff',
    title: 'Staff Engineer',
    family: 'Engineering',
    organizationId: '11111111-1111-4111-8111-111111111111',
  },
];

export const mockHrisAdapter: HrisReadAdapter = {
  vendor: 'mock',
  async fetchEmployees(organizationId: string) {
    return MOCK_EMPLOYEES.filter((e) => e.organizationId === organizationId);
  },
  async fetchJobProfiles(organizationId: string) {
    return MOCK_PROFILES.filter((p) => p.organizationId === organizationId);
  },
};
