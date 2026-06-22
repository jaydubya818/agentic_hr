/** Deterministic UUIDs for TechForward Inc. demo fixtures */
export const MOCK_IDS = {
  organization: '11111111-1111-4111-8111-111111111111',
  teams: {
    platform: '21111111-1111-4111-8111-111111111111',
    product: '21111111-1111-4111-8111-111111111112',
  },
  users: {
    alex: '22222222-2222-4222-8222-222222222221',
    jordan: '22222222-2222-4222-8222-222222222222',
    sam: '22222222-2222-4222-8222-222222222223',
    morgan: '22222222-2222-4222-8222-222222222224',
    riley: '22222222-2222-4222-8222-222222222225',
  },
  employees: {
    alex: '33333333-3333-4333-8333-333333333331',
    jordan: '33333333-3333-4333-8333-333333333332',
    sam: '33333333-3333-4333-8333-333333333333',
    morgan: '33333333-3333-4333-8333-333333333334',
  },
  roles: {
    seniorEngineer: '44444444-4444-4444-8444-444444444441',
    staffEngineer: '44444444-4444-4444-8444-444444444442',
    engineeringManager: '44444444-4444-4444-8444-444444444443',
    productEngineer: '44444444-4444-4444-8444-444444444444',
    techLead: '44444444-4444-4444-8444-444444444445',
    hrPartner: '44444444-4444-4444-8444-444444444446',
  },
  growthPlans: {
    alex: '55555555-5555-4555-8555-555555555551',
  },
  careerGoals: {
    alex: '66666666-6666-4666-8666-666666666661',
  },
} as const;

export const DEMO_USER_ID = MOCK_IDS.users.alex;
export const DEMO_EMPLOYEE_ID = MOCK_IDS.employees.alex;
export const DEMO_MANAGER_USER_ID = MOCK_IDS.users.jordan;
export const DEMO_MANAGER_EMPLOYEE_ID = MOCK_IDS.employees.jordan;
