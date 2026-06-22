import { describe, expect, it } from 'vitest';

import { canReadAuditLogs } from '@/lib/auth/rbac';
import { getNavForRole } from '@/lib/auth/navigation';

describe('HR audit surface (Phase 13)', () => {
  it('HR nav includes audit log route', () => {
    const nav = getNavForRole('hr');
    expect(nav.some((item) => item.href === '/hr/audit')).toBe(true);
  });

  it('only hr_admin and org_admin may read audit logs via RBAC', () => {
    expect(canReadAuditLogs(['hr_admin'])).toBe(true);
    expect(canReadAuditLogs(['org_admin'])).toBe(true);
    expect(canReadAuditLogs(['employee'])).toBe(false);
    expect(canReadAuditLogs(['manager'])).toBe(false);
  });
});
