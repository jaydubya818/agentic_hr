import { describe, expect, it } from 'vitest';

import { calculateProfileCompletion } from '@/lib/employee/profile-completion';
import type { CareerGoal, EmployeeProfile, GrowthPlan } from '@/services/data-provider/types';

const TIMESTAMP = '2026-01-01T00:00:00.000Z';

function makeProfile(overrides: Partial<EmployeeProfile> = {}): EmployeeProfile {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    employeeId: '22222222-2222-4222-8222-222222222222',
    bio: null,
    careerSummary: 'Senior engineer aiming for staff scope.',
    onboardingCompletedAt: TIMESTAMP,
    inferredSkillsVisible: true,
    preferences: { learningStyle: 'self_paced' },
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

const CAREER_GOAL = { id: '33333333-3333-4333-8333-333333333333' } as CareerGoal;
const GROWTH_PLAN = { id: '44444444-4444-4444-8444-444444444444' } as GrowthPlan;

describe('calculateProfileCompletion', () => {
  it('returns 100 when every completion check passes', () => {
    const result = calculateProfileCompletion({
      profile: makeProfile(),
      skillsCount: 3,
      careerGoal: CAREER_GOAL,
      growthPlan: GROWTH_PLAN,
    });
    expect(result).toBe(100);
  });

  it('returns 0 when nothing is set', () => {
    const result = calculateProfileCompletion({
      profile: undefined,
      skillsCount: 0,
      careerGoal: undefined,
      growthPlan: undefined,
    });
    expect(result).toBe(0);
  });

  it('does not count fewer than three skills', () => {
    const complete = {
      profile: makeProfile(),
      careerGoal: CAREER_GOAL,
      growthPlan: GROWTH_PLAN,
    };
    expect(calculateProfileCompletion({ ...complete, skillsCount: 2 })).toBe(83);
    expect(calculateProfileCompletion({ ...complete, skillsCount: 3 })).toBe(100);
  });

  it('treats empty preferences and missing onboarding as incomplete', () => {
    const result = calculateProfileCompletion({
      profile: makeProfile({ preferences: {}, onboardingCompletedAt: null }),
      skillsCount: 3,
      careerGoal: CAREER_GOAL,
      growthPlan: GROWTH_PLAN,
    });
    expect(result).toBe(67);
  });
});
