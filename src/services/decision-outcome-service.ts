import { randomUUID } from 'crypto';

import type { z } from 'zod';

import {
  createDecisionOutcomeInputSchema,
  type DecisionOutcome,
  type OutcomeStatus,
} from '@/schemas/workforce-intelligence';
import { getMockStore } from '@/services/data-provider/mock-provider';
import {
  canWriteWorkforceDecision,
  getWorkforceDecision,
} from '@/services/workforce-decision-service';
import type { SessionContext } from '@/types/session';

type CreateInput = z.infer<typeof createDecisionOutcomeInputSchema>;

function nowIso(): string {
  return new Date().toISOString();
}

export function createExpectedOutcome(
  session: SessionContext,
  decisionId: string,
  input: Omit<CreateInput, 'outcomeType' | 'decisionId' | 'organizationId' | 'status'> & {
    status?: CreateInput['status'];
  },
): DecisionOutcome | null {
  const decision = getWorkforceDecision(session, decisionId);
  if (!decision) return null;

  if (!canWriteWorkforceDecision(session, decision)) {
    throw new Error('Forbidden');
  }

  const store = getMockStore();
  const timestamp = nowIso();
  const outcome: DecisionOutcome = {
    id: randomUUID(),
    organizationId: session.organizationId,
    decisionId,
    outcomeType: 'expected',
    description: input.description,
    status: input.status ?? 'pending',
    metricLabel: input.metricLabel ?? null,
    metricValue: input.metricValue ?? null,
    targetValue: input.targetValue ?? null,
    recordedAt: null,
    recordedByEmployeeId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.decisionOutcomes.push(outcome);
  return outcome;
}

export function recordActualOutcome(
  session: SessionContext,
  decisionId: string,
  input: Omit<CreateInput, 'outcomeType' | 'decisionId' | 'organizationId' | 'status'> & {
    status?: CreateInput['status'];
  },
): DecisionOutcome | null {
  const decision = getWorkforceDecision(session, decisionId);
  if (!decision) return null;

  if (!canWriteWorkforceDecision(session, decision)) {
    throw new Error('Forbidden');
  }

  const store = getMockStore();
  const timestamp = nowIso();
  const outcome: DecisionOutcome = {
    id: randomUUID(),
    organizationId: session.organizationId,
    decisionId,
    outcomeType: 'actual',
    description: input.description,
    status: input.status ?? 'achieved',
    metricLabel: input.metricLabel ?? null,
    metricValue: input.metricValue ?? null,
    targetValue: input.targetValue ?? null,
    recordedAt: timestamp,
    recordedByEmployeeId: session.employeeId ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.decisionOutcomes.push(outcome);
  return outcome;
}

export interface OutcomeComparison {
  expected: DecisionOutcome | null;
  actual: DecisionOutcome | null;
  metricDelta: number | null;
  statusMatch: boolean;
  summary: string;
}

export function compareExpectedToActual(
  organizationId: string,
  decisionId: string,
): OutcomeComparison[] {
  const store = getMockStore();
  // Filter on organization as well as decision id so a comparison can never
  // surface another organization's outcome rows for the same identifier.
  const outcomes = store.decisionOutcomes.filter(
    (o) => o.decisionId === decisionId && o.organizationId === organizationId,
  );
  const expectedList = outcomes.filter((o) => o.outcomeType === 'expected');
  const actualList = outcomes.filter((o) => o.outcomeType === 'actual');

  const comparisons: OutcomeComparison[] = [];

  for (const expected of expectedList) {
    const actual = actualList.find(
      (a) => a.metricLabel === expected.metricLabel || a.description === expected.description,
    ) ?? actualList[0] ?? null;

    const metricDelta =
      expected.targetValue != null && actual?.metricValue != null
        ? actual.metricValue - expected.targetValue
        : null;

    const statusMatch = actual ? expected.status === actual.status : false;
    let summary = 'No actual outcome recorded yet.';
    if (actual) {
      if (actual.status === 'achieved') {
        summary = 'Actual outcome met or exceeded the expected target.';
      } else if (actual.status === 'partially_achieved') {
        summary = 'Actual outcome partially met the expected target.';
      } else if (actual.status === 'missed') {
        summary = 'Actual outcome did not meet the expected target.';
      } else {
        summary = `Actual outcome status: ${actual.status}.`;
      }
    }

    comparisons.push({ expected, actual, metricDelta, statusMatch, summary });
  }

  return comparisons;
}

export function summarizeOutcomeStatus(status: OutcomeStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'on_track':
      return 'On track';
    case 'achieved':
      return 'Achieved';
    case 'partially_achieved':
      return 'Partially achieved';
    case 'missed':
      return 'Missed';
    case 'cancelled':
      return 'Cancelled';
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
