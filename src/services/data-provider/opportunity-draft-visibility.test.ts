import { describe, expect, it } from 'vitest';

import { opportunityStatusSchema } from '@/schemas/enums';
import { mapOpportunity } from '@/services/data-provider/db-mappers';

const AT = new Date('2026-01-01T00:00:00.000Z');

const draftRow = {
  id: 'opp-draft',
  organizationId: 'org-1',
  title: 'Unpublished platform opening',
  description: null,
  roleId: null,
  department: 'Engineering',
  status: 'draft' as const,
  postedAt: null,
  createdAt: AT,
};

/**
 * A draft opportunity is a requisition nobody has published yet. The
 * application enum has no `draft` member, so the Postgres mapper has to pick a
 * survivor -- and picking `open` made every unpublished requisition visible to
 * employees on the database path, while the JSON fixture path could not
 * produce one at all.
 */
describe('a draft opportunity is never published to employees', () => {
  it('does not map a draft row onto the open status readers select on', () => {
    expect(mapOpportunity(draftRow, []).status).not.toBe('open');
  });

  it('maps a draft row onto closed', () => {
    expect(mapOpportunity(draftRow, []).status).toBe('closed');
  });

  it('leaves the three published statuses exactly as recorded', () => {
    for (const status of ['open', 'filled', 'closed'] as const) {
      expect(mapOpportunity({ ...draftRow, status }, []).status).toBe(status);
    }
  });

  it('only ever emits a member of the application enum', () => {
    for (const status of ['open', 'filled', 'closed', 'draft'] as const) {
      const mapped = mapOpportunity({ ...draftRow, status }, []).status;
      expect(opportunityStatusSchema.safeParse(mapped).success).toBe(true);
    }
  });

  it('is filtered out by the status predicate every consumer uses', () => {
    // This is the predicate in getCareerPaths, getMobilityInsights,
    // getTalentDensityReport and the agent's opportunity grounding.
    const mapped = [
      mapOpportunity(draftRow, []),
      mapOpportunity({ ...draftRow, id: 'opp-open', status: 'open' }, []),
    ];
    const visible = mapped.filter((o) => o.status === 'open');
    expect(visible.map((o) => o.id)).toEqual(['opp-open']);
  });

  it('still carries the required skill ids through for a published row', () => {
    const mapped = mapOpportunity({ ...draftRow, status: 'open' }, ['skill-1', 'skill-2']);
    expect(mapped.requiredSkillIds).toEqual(['skill-1', 'skill-2']);
  });
});
