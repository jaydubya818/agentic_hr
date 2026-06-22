import type { DemoRole, UserRole } from '@/lib/auth/types';

export interface SessionContext {
  userId: string;
  organizationId: string;
  employeeId?: string;
  roles: UserRole[];
  activeRole: DemoRole;
}
