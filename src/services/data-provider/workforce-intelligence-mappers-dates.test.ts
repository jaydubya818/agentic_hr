import { describe, expect, it } from 'vitest';

import {
  mapAgentActionPlan,
  mapDecisionOutcome,
  mapProject,
  mapProjectMembership,
  mapWorkforceContextEdge,
} from '@/services/data-provider/workforce-intelligence-mappers';

/**
 * Timestamp and metadata handling in the workforce-intelligence mappers.
 *
 * Two private helpers sit under every mapper in this file:
 *
 *   toIso(v)         -- `v` as an ISO string, or the Unix epoch when nullish
 *   jsonMetadata(v)  -- `v` when it is a non-array object, otherwise `{}`
 *
 * `toIso` is a second, independent copy of the helper of the same name in
 * `db-mappers.ts`, with the same 1970 sentinel. The duplication matters: the
 * open backlog item about the epoch sentinel was written against
 * `db-mappers.ts` only, so anyone who fixes it there will leave this copy
 * behind and the two read paths will start disagreeing about what an unknown
 * date is.
 *
 * The file also carries two different conventions for a missing date, chosen
 * per column rather than per meaning: a nullable column is guarded
 * (`row.startDate ? toIso(row.startDate) : null`) and reports null, while
 * `createdAt`/`updatedAt` go through `toIso` unguarded and report 1970.
 *
 * Characterization tests. They pin current behaviour; the comments mark
 * where that behaviour is a latent problem rather than a deliberate choice.
 */

const AT = new Date('2026-01-01T00:00:00.000Z');
const EPOCH = new Date(0).toISOString();

const projectRow = {
  id: 'proj-1',
  organizationId: 'org-1',
  name: 'Ingest rewrite',
  description: null,
  businessPriorityId: null,
  status: 'active',
  startDate: null as Date | null,
  endDate: null as Date | null,
  metadata: null as unknown,
  createdAt: AT,
  updatedAt: AT,
};

describe('a missing timestamp is reported two different ways in the same row', () => {
  it('reports a missing nullable date as null', () => {
    const project = mapProject(projectRow);
    expect(project.startDate).toBeNull();
    expect(project.endDate).toBeNull();
  });

  // Latent bug, pinned deliberately. `createdAt`/`updatedAt` are not guarded,
  // so a row missing them is dated 1970 rather than reported as unknown --
  // and 1970 sorts first in every "most recent" ordering.
  it('reports a missing createdAt as the Unix epoch', () => {
    const undated = mapProject({
      ...projectRow,
      createdAt: null as unknown as Date,
      updatedAt: null as unknown as Date,
    });
    expect(undated.createdAt).toBe(EPOCH);
    expect(undated.updatedAt).toBe(EPOCH);
  });

  it('applies the same split to a project membership and a decision outcome', () => {
    const membership = mapProjectMembership({
      id: 'pm-1',
      organizationId: 'org-1',
      projectId: 'proj-1',
      employeeId: 'emp-1',
      role: null,
      allocationPct: null,
      joinedAt: null,
      createdAt: null as unknown as Date,
      updatedAt: AT,
    });
    expect(membership.joinedAt).toBeNull();
    expect(membership.createdAt).toBe(EPOCH);

    const outcome = mapDecisionOutcome({
      id: 'do-1',
      organizationId: 'org-1',
      decisionId: 'wd-1',
      outcomeType: 'actual',
      description: 'Attrition held flat',
      status: 'achieved' as const,
      metricLabel: null,
      metricValue: null,
      targetValue: null,
      recordedAt: null,
      recordedByEmployeeId: null,
      createdAt: null as unknown as Date,
      updatedAt: AT,
    });
    // An outcome with no recorded time is null here but epoch one field over.
    expect(outcome.recordedAt).toBeNull();
    expect(outcome.createdAt).toBe(EPOCH);
  });
});

describe('toIso does not validate a value that is already a string', () => {
  // The helper is `value instanceof Date ? value.toISOString() : value`, so
  // anything the driver hands back as a string is returned verbatim. The
  // field is typed as an ISO timestamp; nothing checks that it is one.
  it('returns a non-Date value unchanged rather than normalising it', () => {
    const mapped = mapProject({
      ...projectRow,
      createdAt: '2026-01-01' as unknown as Date,
    });
    expect(mapped.createdAt).toBe('2026-01-01');
  });

  it('treats the empty string as missing and substitutes the epoch', () => {
    // `!value` is the nullish test, so '' takes the sentinel branch too.
    const mapped = mapProject({ ...projectRow, createdAt: '' as unknown as Date });
    expect(mapped.createdAt).toBe(EPOCH);
  });
});

describe('jsonMetadata coerces anything that is not a plain object to {}', () => {
  it('replaces null, an array and a scalar with an empty object', () => {
    expect(mapProject({ ...projectRow, metadata: null }).metadata).toEqual({});
    expect(mapProject({ ...projectRow, metadata: [1, 2, 3] }).metadata).toEqual({});
    expect(mapProject({ ...projectRow, metadata: 'not-json' }).metadata).toEqual({});
    expect(mapProject({ ...projectRow, metadata: 42 }).metadata).toEqual({});
  });

  it('keeps a plain object as-is', () => {
    expect(mapProject({ ...projectRow, metadata: { source: 'hris' } }).metadata).toEqual({
      source: 'hris',
    });
  });

  // The object is returned by reference, not copied, so the mapped entity and
  // the driver row share one object. A caller that mutates `entity.metadata`
  // mutates the row it was mapped from.
  it('shares the metadata object with the row rather than cloning it', () => {
    const metadata = { source: 'hris' };
    expect(mapProject({ ...projectRow, metadata }).metadata).toBe(metadata);
  });

  it('applies the same coercion in the edge and action-plan mappers', () => {
    const edge = mapWorkforceContextEdge({
      id: 'edge-1',
      organizationId: 'org-1',
      sourceEntityType: 'employee' as const,
      sourceEntityId: 'emp-1',
      targetEntityType: 'project' as const,
      targetEntityId: 'proj-1',
      relationshipType: 'works_on' as const,
      strength: null,
      label: null,
      explanation: null,
      metadata: ['not', 'an', 'object'],
      createdAt: AT,
      updatedAt: AT,
    });
    expect(edge.metadata).toEqual({});

    const plan = mapAgentActionPlan({
      id: 'ap-1',
      organizationId: 'org-1',
      agentId: 'supermanager',
      employeeId: null,
      teamId: null,
      title: 'Close the platform skill gap',
      summary: null,
      sourceDecisionId: null,
      governanceStatus: 'passed' as const,
      metadata: undefined,
      createdAt: AT,
      updatedAt: AT,
    });
    expect(plan.metadata).toEqual({});
  });
});
