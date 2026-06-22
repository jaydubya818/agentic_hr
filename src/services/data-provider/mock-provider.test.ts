import { describe, expect, it } from 'vitest';
import {
  getCareerPaths,
  getCoachingPrompts,
  getCurrentUser,
  getDataReadinessScores,
  getEmployeeProfile,
  getEmployeeSummaryForManager,
  getGrowthPlan,
  getManagerDashboard,
  getMockStore,
  getRecommendations,
  getTeamCapabilityPlan,
  getTeamMembers,
  getTeamSkillsMatrix,
  isDirectReport,
} from './mock-provider';
import {
  DEMO_EMPLOYEE_ID,
  DEMO_MANAGER_EMPLOYEE_ID,
  DEMO_USER_ID,
} from '@/lib/mock/ids';

describe('mock-provider', () => {
  it('loads and validates mock store', () => {
    const store = getMockStore();
    expect(store.organizations).toHaveLength(1);
    expect(store.employees.length).toBeGreaterThanOrEqual(12);
    expect(store.skills.length).toBeGreaterThanOrEqual(20);
  });

  it('returns Alex Chen as demo current user', () => {
    const user = getCurrentUser(DEMO_USER_ID);
    expect(user?.fullName).toBe('Alex Chen');
    expect(user?.email).toBe('alex.chen@techforward.io');
  });

  it('returns employee profile for Alex', () => {
    const profile = getEmployeeProfile(DEMO_EMPLOYEE_ID);
    expect(profile?.careerSummary).toContain('Full-stack');
  });

  it('returns recommendations with evidence and confidence', () => {
    const recs = getRecommendations(DEMO_EMPLOYEE_ID);
    expect(recs.length).toBeGreaterThan(0);
    for (const rec of recs) {
      expect(rec.explanation.length).toBeGreaterThanOrEqual(20);
      expect(rec.confidence).toBeGreaterThan(0);
      expect(rec.evidence.length).toBeGreaterThan(0);
    }
  });

  it('returns career paths with explanations', () => {
    const paths = getCareerPaths(DEMO_EMPLOYEE_ID);
    expect(paths.length).toBeGreaterThan(0);
    expect(paths[0]?.explanation).toBeTruthy();
    expect(paths[0]?.confidence).toBeGreaterThan(0);
  });

  it('returns active growth plan with items', () => {
    const { plan, items } = getGrowthPlan(DEMO_EMPLOYEE_ID);
    expect(plan?.status).toBe('active');
    expect(items.length).toBeGreaterThan(0);
  });

  it('returns Jordan team members for manager view', () => {
    const team = getTeamMembers(DEMO_MANAGER_EMPLOYEE_ID);
    expect(team.some((e) => e.id === DEMO_EMPLOYEE_ID)).toBe(true);
  });

  it('enforces direct report RBAC for manager employee summary', () => {
    expect(isDirectReport(DEMO_MANAGER_EMPLOYEE_ID, DEMO_EMPLOYEE_ID)).toBe(true);
    expect(isDirectReport(DEMO_MANAGER_EMPLOYEE_ID, DEMO_MANAGER_EMPLOYEE_ID)).toBe(false);
    expect(
      getEmployeeSummaryForManager(DEMO_MANAGER_EMPLOYEE_ID, '33333333-3333-4333-8333-333333333334'),
    ).toBeNull();
  });

  it('returns manager dashboard with recommendations and evidence', () => {
    const dashboard = getManagerDashboard(DEMO_MANAGER_EMPLOYEE_ID);
    expect(dashboard?.managerUser.fullName).toBe('Jordan Lee');
    expect(dashboard?.directReports.length).toBeGreaterThan(0);
    for (const rec of dashboard?.teamActionRecommendations ?? []) {
      expect(rec.explanation.length).toBeGreaterThanOrEqual(20);
      expect(rec.evidence.length).toBeGreaterThan(0);
    }
  });

  it('returns team skills matrix with readiness snapshot', () => {
    const matrix = getTeamSkillsMatrix(DEMO_MANAGER_EMPLOYEE_ID);
    expect(matrix?.members.length).toBeGreaterThan(0);
    expect(matrix?.readinessSnapshot.totalMembers).toBe(matrix?.members.length);
  });

  it('returns coaching prompts with confidence and evidence', () => {
    const prompts = getCoachingPrompts(DEMO_MANAGER_EMPLOYEE_ID);
    expect(prompts.length).toBeGreaterThan(0);
    for (const prompt of prompts) {
      expect(prompt.explanation.length).toBeGreaterThan(10);
      expect(prompt.evidence.length).toBeGreaterThan(0);
    }
  });

  it('returns team capability plan with talent density', () => {
    const plan = getTeamCapabilityPlan(DEMO_MANAGER_EMPLOYEE_ID);
    expect(plan?.teamGoals.length).toBeGreaterThan(0);
    expect(plan?.talentDensity.score).toBeGreaterThan(0);
  });

  it('returns org data readiness scores', () => {
    const scores = getDataReadinessScores();
    expect(scores.some((s) => s.scopeType === 'organization')).toBe(true);
  });
});
