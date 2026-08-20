import { describe, expect, it, vi } from 'vitest';

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

  it('merges vendor payloads on externalId instead of concatenating them', async () => {
    // Both adapters are stubs over the same mock source, so concatenating
    // returned every record twice. externalId is the identity of a record:
    // the same id from two vendors is one person, not two.
    vi.stubEnv('USE_HRIS_READ', 'true');
    try {
      const result = await syncHrisReadFabric(ORG);
      expect(result.skipped).toBe(false);
      expect(result.employees.length).toBeGreaterThan(0);
      expect(new Set(result.employees.map((e) => e.externalId)).size).toBe(
        result.employees.length,
      );
      expect(new Set(result.jobProfiles.map((p) => p.externalId)).size).toBe(
        result.jobProfiles.length,
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('sync skips when USE_HRIS_READ is not true', async () => {
    const result = await syncHrisReadFabric(ORG);
    expect(result.skipped).toBe(true);
    expect(result.employees).toEqual([]);
  });
});
