import {
  getCareerGoals,
  getCareerPaths,
  getCoachingPrompts,
  getCurrentUser,
  getDataReadinessScores,
  getEmployee,
  getEmployeeByUserId,
  getEmployeeProfile,
  getEmployeeSkills,
  getEmployeeSummaryForManager,
  getGrowthPlan,
  getHrDashboard,
  getManagerConversationPrep,
  getManagerDashboard,
  getMobilityInsights,
  getMockStore,
  getOrganization,
  getRecommendations,
  getRole,
  getSkill,
  getSkills,
  getSkillsReadinessReport,
  getTalentDensityReport,
  getTeamByManager,
  getTeamCapabilityPlan,
  getTeamMembers,
  getTeamSkillsMatrix,
  getWorkforceReadinessReport,
  isDirectReport,
} from './mock-provider';
import {
  getDataProviderMode,
  isSupabasePersistenceConfigured,
  shouldUseMockData,
  shouldUseSupabaseProvider,
} from './provider-config';
import { preloadDataProviderStore, warnSupabaseFallbackOnce } from './preload';
import { getCachedSupabaseStore } from './store-runtime';
import {
  touchGrowthPlanUpdatedAt,
  updateGrowthPlanItemProgress,
  updateGrowthProfile,
} from './supabase-writes';

export type {
  CareerPathMatch,
  CoachingPrompt,
  EmployeeSummaryForManager,
  ManagerConversationPrep,
  ManagerDashboard,
  MockDataStore,
  SkillGap,
  TeamCapabilityPlan,
  TeamSkillsMatrix,
} from './types';
export * from './types';

function resolveUseMockData(): boolean {
  if (shouldUseSupabaseProvider()) {
    const cached = getCachedSupabaseStore();
    if (cached) {
      return false;
    }
    warnSupabaseFallbackOnce();
  }
  return shouldUseMockData() || !shouldUseSupabaseProvider();
}

export const dataProvider = {
  get mode() {
    return resolveUseMockData() ? 'mock' : getDataProviderMode();
  },
  get useMockData() {
    return resolveUseMockData();
  },
  isSupabaseConfigured: isSupabasePersistenceConfigured,
  preload: preloadDataProviderStore,
  getMockStore,
  getCurrentUser,
  getEmployeeByUserId,
  getEmployee,
  getEmployeeProfile,
  getOrganization,
  getTeamMembers,
  getTeamByManager,
  getSkills,
  getSkill,
  getRole,
  getEmployeeSkills,
  getCareerGoals,
  getCareerPaths,
  getGrowthPlan,
  getManagerConversationPrep,
  getManagerDashboard,
  getTeamSkillsMatrix,
  getEmployeeSummaryForManager,
  getCoachingPrompts,
  getTeamCapabilityPlan,
  isDirectReport,
  getRecommendations,
  getDataReadinessScores,
  getHrDashboard,
  getSkillsReadinessReport,
  getMobilityInsights,
  getTalentDensityReport,
  getWorkforceReadinessReport,
  updateGrowthProfile,
  updateGrowthPlanItemProgress,
  touchGrowthPlanUpdatedAt,
};

export default dataProvider;
