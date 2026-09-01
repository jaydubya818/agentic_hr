import { describe, expect, it } from 'vitest';

import {
  mapBusinessPriority,
  mapDecisionEvidence,
  mapDecisionOutcome,
  mapDecisionParticipant,
  mapProject,
  mapRoleTaskChange,
} from '@/services/data-provider/workforce-intelligence-mappers';

/**
 * The Postgres read path for workforce intelligence does no enum narrowing,
 * and six of the columns it reads are unconstrained `text`.
 *
 * `db-mappers.ts` -- the sibling module for the core tables -- narrows every
 * Postgres enum onto the application union through an explicit lookup map,
 * which is what `db-mappers-enum-narrowing.test.ts` pins. This module does
 * not. Where the column is a real `pgEnum` the row type carries the union and
 * the mapper is type-safe; where the column is `text` the row type is
 * `string` and the mapper reaches for a bare `as` cast:
 *
 *   business_priorities.status      text -> BusinessPriority['status']
 *   projects.status                 text -> Project['status']
 *   decision_evidence.evidence_type text -> DecisionEvidence['evidenceType']
 *   decision_outcomes.outcome_type  text -> DecisionOutcome['outcomeType']
 *   decision_participants.role      text -> DecisionParticipant['role']
 *   role_task_changes.impact_level  text -> RoleTaskChange['impactLevel']
 *
 * (column declarations: src/lib/db/schema/workforce-intelligence.ts lines 32,
 * 58, 168, 191, 223, 347)
 *
 * So the union is enforced in neither place: Postgres does not constrain a
 * `text` column, and the cast is erased at runtime. Nothing on the read path
 * calls the zod schemas in `src/schemas/workforce-intelligence.ts`, so a
 * value outside the union reaches the UI carrying a type that says it cannot
 * exist. It does not throw, because both consumers render the field as free
 * text -- `DecisionEvidenceList.tsx:37` and `RoleEvolutionCard.tsx:38`
 * interpolate it directly -- which is why this has stayed invisible.
 *
 * Characterization tests. They pin that the cast passes anything through;
 * they do not assert that this is correct. Deciding what an unrecognised
 * value should become -- drop the row, fall back to a default, refuse the
 * load -- is the same product question as the enum-collapse item already open
 * against `db-mappers.ts`, so it is recorded in docs/NIGHTLY-BACKLOG.md
 * rather than fixed here.
 */

const AT = new Date('2026-01-01T00:00:00.000Z');

describe('decision_evidence.evidence_type is unconstrained in Postgres and unchecked here', () => {
  const evidenceRow = {
    id: 'de-1',
    organizationId: 'org-1',
    decisionId: 'wd-1',
    evidenceType: 'skill',
    referenceId: null,
    label: 'TypeScript proficiency',
    detail: null,
    confidence: 0.8,
    createdAt: AT,
  };

  it('passes a value from the application union through unchanged', () => {
    expect(mapDecisionEvidence({ ...evidenceRow, evidenceType: 'context_edge' }).evidenceType).toBe(
      'context_edge',
    );
  });

  // `evidenceTypeEnum` (src/lib/db/schema/enums.ts) and the union on
  // `decisionEvidenceSchema` are two different vocabularies for the same
  // concept. The pgEnum has `learning_resource` and `opportunity`, which the
  // union does not; the union has `context_edge`, `project` and `priority`,
  // which the pgEnum does not. `agent-service.ts` emits both
  // `learning_resource` and `opportunity` as evidence types today, so a row
  // carrying one is not hypothetical.
  it('passes a pgEnum value absent from the application union straight through', () => {
    expect(
      mapDecisionEvidence({ ...evidenceRow, evidenceType: 'learning_resource' }).evidenceType,
    ).toBe('learning_resource');
    expect(mapDecisionEvidence({ ...evidenceRow, evidenceType: 'opportunity' }).evidenceType).toBe(
      'opportunity',
    );
  });

  it('passes an arbitrary string through, because the column is text', () => {
    expect(
      mapDecisionEvidence({ ...evidenceRow, evidenceType: 'not-an-evidence-type' }).evidenceType,
    ).toBe('not-an-evidence-type');
    expect(mapDecisionEvidence({ ...evidenceRow, evidenceType: '' }).evidenceType).toBe('');
  });
});

describe('the other five text columns behave the same way', () => {
  it('does not constrain decision_outcomes.outcome_type to expected/actual', () => {
    const outcomeRow = {
      id: 'do-1',
      organizationId: 'org-1',
      decisionId: 'wd-1',
      outcomeType: 'projected',
      description: 'Attrition in the platform team',
      status: 'pending' as const,
      metricLabel: null,
      metricValue: null,
      targetValue: null,
      recordedAt: null,
      recordedByEmployeeId: null,
      createdAt: AT,
      updatedAt: AT,
    };
    // Outcomes are paired by this field, so a third value is silently on
    // neither side of the expected-versus-actual comparison.
    expect(mapDecisionOutcome(outcomeRow).outcomeType).toBe('projected');
  });

  it('does not constrain decision_participants.role to the four participant roles', () => {
    const participantRow = {
      id: 'dp-1',
      organizationId: 'org-1',
      decisionId: 'wd-1',
      employeeId: 'emp-1',
      role: 'approver',
      createdAt: AT,
    };
    expect(mapDecisionParticipant(participantRow).role).toBe('approver');
  });

  it('does not constrain role_task_changes.impact_level to low/medium/high', () => {
    const taskChangeRow = {
      id: 'rtc-1',
      organizationId: 'org-1',
      roleEvolutionScenarioId: 'res-1',
      taskDescription: 'Manual release sign-off',
      changeType: 'automate' as const,
      impactLevel: 'critical',
      notes: null,
      createdAt: AT,
    };
    // Rendered verbatim by RoleEvolutionCard.tsx as "critical impact".
    expect(mapRoleTaskChange(taskChangeRow).impactLevel).toBe('critical');
  });

  it('does not constrain business_priorities.status or projects.status', () => {
    const priorityRow = {
      id: 'bp-1',
      organizationId: 'org-1',
      title: 'Reduce onboarding time',
      description: null,
      quarter: 'Q1 2026',
      status: 'abandoned',
      ownerEmployeeId: null,
      metadata: null,
      createdAt: AT,
      updatedAt: AT,
    };
    expect(mapBusinessPriority(priorityRow).status).toBe('abandoned');

    const projectRow = {
      id: 'proj-1',
      organizationId: 'org-1',
      name: 'Ingest rewrite',
      description: null,
      businessPriorityId: null,
      status: 'blocked',
      startDate: null,
      endDate: null,
      metadata: null,
      createdAt: AT,
      updatedAt: AT,
    };
    expect(mapProject(projectRow).status).toBe('blocked');
  });
});
