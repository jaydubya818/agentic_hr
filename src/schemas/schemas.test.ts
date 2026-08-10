import { describe, expect, it } from 'vitest';
import {
  createRecommendationInputSchema,
  employeeSchema,
  employeeSkillSchema,
  organizationSchema,
  recommendationSchema,
} from './entities';
import { createWorkforceDecisionInputSchema } from './workforce-intelligence';

const TS = '2026-01-15T10:00:00.000Z';

describe('organizationSchema', () => {
  it('accepts valid organization', () => {
    const result = organizationSchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      name: 'TechForward Inc.',
      slug: 'techforward',
      settings: {},
      createdAt: TS,
      updatedAt: TS,
    });
    expect(result.name).toBe('TechForward Inc.');
  });

  it('rejects missing name', () => {
    expect(() =>
      organizationSchema.parse({
        id: '11111111-1111-4111-8111-111111111111',
        slug: 'techforward',
        createdAt: TS,
        updatedAt: TS,
      }),
    ).toThrow();
  });
});

describe('employeeSkillSchema', () => {
  it('requires confidence for inferred skills in business rules layer', () => {
    const inferred = employeeSkillSchema.parse({
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
      employeeId: '33333333-3333-4333-8333-333333333331',
      skillId: '40000000-0000-4000-8000-000000000003',
      source: 'inferred',
      proficiencyLevel: 3,
      confidence: 0.72,
      evidenceSummary: 'Inferred from project work',
      confirmedAt: null,
      confirmedBy: null,
      createdAt: TS,
      updatedAt: TS,
    });
    expect(inferred.source).toBe('inferred');
    expect(inferred.confidence).toBe(0.72);
  });

  it('rejects invalid source', () => {
    expect(() =>
      employeeSkillSchema.parse({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
        employeeId: '33333333-3333-4333-8333-333333333331',
        skillId: '40000000-0000-4000-8000-000000000003',
        source: 'guessed',
        createdAt: TS,
        updatedAt: TS,
      }),
    ).toThrow();
  });
});

describe('recommendationSchema', () => {
  it('accepts valid recommendation with governance fields', () => {
    const result = recommendationSchema.parse({
      id: 'ffffffff-ffff-4fff-8fff-fffffffffff1',
      organizationId: '11111111-1111-4111-8111-111111111111',
      employeeId: '33333333-3333-4333-8333-333333333331',
      agentId: 'employee-growth',
      type: 'career_path',
      title: 'Staff Engineer is a strong near-term path',
      explanation:
        'Your confirmed TypeScript and API design skills align with Staff Engineer requirements.',
      confidence: 0.82,
      confidenceLevel: 'high',
      status: 'pending',
      metadata: {},
      createdAt: TS,
      updatedAt: TS,
    });
    expect(result.confidence).toBe(0.82);
    expect(result.explanation.length).toBeGreaterThanOrEqual(20);
  });

  it('rejects short explanation', () => {
    expect(() =>
      recommendationSchema.parse({
        id: 'ffffffff-ffff-4fff-8fff-fffffffffff1',
        organizationId: '11111111-1111-4111-8111-111111111111',
        employeeId: '33333333-3333-4333-8333-333333333331',
        agentId: 'employee-growth',
        type: 'career_path',
        title: 'Staff Engineer path',
        explanation: 'Too short',
        confidence: 0.82,
        confidenceLevel: 'high',
        status: 'pending',
        createdAt: TS,
        updatedAt: TS,
      }),
    ).toThrow();
  });
});

describe('createRecommendationInputSchema', () => {
  it('requires at least one evidence item', () => {
    expect(() =>
      createRecommendationInputSchema.parse({
        type: 'learning',
        title: 'Take a system design course',
        explanation: 'This learning path closes a documented skill gap for your target role.',
        confidence: 0.7,
        evidence: [],
      }),
    ).toThrow();
  });
});

describe('employeeSchema', () => {
  it('accepts valid employee record', () => {
    const result = employeeSchema.parse({
      id: '33333333-3333-4333-8333-333333333331',
      organizationId: '11111111-1111-4111-8111-111111111111',
      userId: '22222222-2222-4222-8222-222222222221',
      teamId: '21111111-1111-4111-8111-111111111111',
      managerId: '33333333-3333-4333-8333-333333333332',
      jobTitle: 'Senior Software Engineer',
      department: 'Engineering',
      hireDate: '2022-06-01',
      currentRoleId: '44444444-4444-4444-8444-444444444441',
      isActive: true,
      createdAt: TS,
      updatedAt: TS,
    });
    expect(result.jobTitle).toContain('Engineer');
  });
});

describe('createWorkforceDecisionInputSchema payload bounds', () => {
  const base = {
    title: 'Expand data engineering capability',
    decisionType: 'skill_development' as const,
  };

  it('accepts a decision within the text and metadata bounds', () => {
    const result = createWorkforceDecisionInputSchema.safeParse({
      ...base,
      description: 'Grow the team toward streaming skills.',
      metadata: { source: 'unit-test' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects an oversized title', () => {
    const result = createWorkforceDecisionInputSchema.safeParse({
      ...base,
      title: 'x'.repeat(301),
    });
    expect(result.success).toBe(false);
  });

  it('rejects an oversized description', () => {
    const result = createWorkforceDecisionInputSchema.safeParse({
      ...base,
      description: 'x'.repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it('rejects metadata that serializes past the size cap', () => {
    const result = createWorkforceDecisionInputSchema.safeParse({
      ...base,
      metadata: { blob: 'x'.repeat(17_000) },
    });
    expect(result.success).toBe(false);
  });
});
