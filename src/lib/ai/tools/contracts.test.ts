import { describe, expect, it } from 'vitest';
import { AGENT_IDS } from '@/types/agent';

import { AGENT_DATA_CONTRACTS, agentMayAccessSurface } from './contracts';

describe('agent data contracts', () => {
  it('defines contracts for all MVP agents', () => {
    for (const agentId of AGENT_IDS) {
      const contract = AGENT_DATA_CONTRACTS[agentId];
      expect(contract.allowedSurfaces.length).toBeGreaterThan(0);
      expect(contract.forbiddenSurfaces).toContain('audit_logs');
    }
  });

  it('denies forbidden surfaces', () => {
    expect(agentMayAccessSurface('employee-growth', 'audit_logs')).toBe(false);
    expect(agentMayAccessSurface('employee-growth', 'employee_profile')).toBe(true);
  });
});
