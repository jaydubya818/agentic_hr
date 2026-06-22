import { describe, expect, it } from 'vitest';

import { mockHrisAdapter } from '@/integrations/mock-hris-adapter';
import { syncHrisReadFabric } from '@/integrations/sync-hris-read';
import { workdayReadAdapter } from '@/integrations/workday';
import { successFactorsReadAdapter } from '@/integrations/successfactors';

const ORG = '11111111-1111-4111-8111-111111111111';

describe('HRIS read fabric (Phase 16)', () => {
  it('mock adapter scopes employees to organization', async () => {
    const employees = await mockHrisAdapter.fetchEmployees(ORG);
    expect(employees.every((e: { organizationId: string }) => e.organizationId === ORG)).toBe(true);
  });

  it('workday and successfactors stubs return org-scoped data', async () => {
    const wd = await workdayReadAdapter.fetchEmployees(ORG);
    const sf = await successFactorsReadAdapter.fetchEmployees('other-org');
    expect(wd.length).toBeGreaterThan(0);
    expect(sf.length).toBe(0);
  });

  it('sync skips when USE_HRIS_READ is not true', async () => {
    const result = await syncHrisReadFabric(ORG);
    expect(result.skipped).toBe(true);
    expect(result.employees).toEqual([]);
  });
});
