export interface HrisEmployeeRecord {
  externalId: string;
  email: string;
  jobTitle: string;
  department: string;
  organizationId: string;
}

export interface HrisJobProfile {
  externalId: string;
  title: string;
  family: string;
  organizationId: string;
}

export interface HrisReadAdapter {
  readonly vendor: 'workday' | 'successfactors' | 'mock';
  fetchEmployees(organizationId: string): Promise<HrisEmployeeRecord[]>;
  fetchJobProfiles(organizationId: string): Promise<HrisJobProfile[]>;
}
