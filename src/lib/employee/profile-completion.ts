import type { CareerGoal, EmployeeProfile, GrowthPlan } from '@/services/data-provider/types';

export function calculateProfileCompletion(input: {
  profile: EmployeeProfile | undefined;
  skillsCount: number;
  careerGoal: CareerGoal | undefined;
  growthPlan: GrowthPlan | undefined;
}): number {
  const checks = [
    Boolean(input.profile?.onboardingCompletedAt),
    Boolean(input.profile?.careerSummary),
    input.skillsCount >= 3,
    Boolean(input.careerGoal),
    Boolean(input.growthPlan),
    Object.keys(input.profile?.preferences ?? {}).length > 0,
  ];

  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}
