import { describe, expect, it } from 'vitest';

import * as schema from './index';

const EXPECTED_TABLES = [
  'organizations',
  'users',
  'employees',
  'employeeProfiles',
  'managers',
  'teams',
  'skills',
  'employeeSkills',
  'roles',
  'roleSkills',
  'careerGoals',
  'learningResources',
  'opportunities',
  'growthPlans',
  'growthPlanItems',
  'recommendations',
  'recommendationEvidence',
  'agentConversations',
  'agentMessages',
  'dataReadinessScores',
  'auditLogs',
  'permissions',
  'userRoles',
] as const;

describe('db schema', () => {
  it('exports all tenant-scoped tables from BACKEND_STRUCTURE', () => {
    for (const tableName of EXPECTED_TABLES) {
      expect(schema[tableName], `missing table export: ${tableName}`).toBeDefined();
    }
  });

  it('exports governance and skill source enums', () => {
    expect(schema.governanceStatusEnum).toBeDefined();
    expect(schema.skillSourceEnum).toBeDefined();
    expect(schema.userRoleEnum).toBeDefined();
  });
});
