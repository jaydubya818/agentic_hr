import type { z } from 'zod';
import {
  careerGoalSchema,
  dataReadinessScoreSchema,
  employeeProfileSchema,
  employeeSchema,
  employeeSkillSchema,
  growthPlanItemSchema,
  growthPlanSchema,
  learningResourceSchema,
  opportunitySchema,
  organizationSchema,
  recommendationEvidenceSchema,
  recommendationSchema,
  roleSchema,
  roleSkillSchema,
  skillSchema,
  teamSchema,
  userSchema,
} from '@/schemas';
import type {
  AgentActionPlan,
  AgentProposedAction,
  BusinessPriority,
  DecisionEvidence,
  DecisionOutcome,
  DecisionParticipant,
  Project,
  ProjectMembership,
  RoleEvolutionScenario,
  RoleTaskChange,
  TeamScenario,
  TeamScenarioRole,
  TeamScenarioSkill,
  WorkforceContextEdge,
  WorkforceDecision,
} from '@/schemas/workforce-intelligence';

export type Organization = z.infer<typeof organizationSchema>;
export type User = z.infer<typeof userSchema>;
export type Employee = z.infer<typeof employeeSchema>;
export type EmployeeProfile = z.infer<typeof employeeProfileSchema>;
export type Team = z.infer<typeof teamSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type EmployeeSkill = z.infer<typeof employeeSkillSchema>;
export type Role = z.infer<typeof roleSchema>;
export type RoleSkill = z.infer<typeof roleSkillSchema>;
export type CareerGoal = z.infer<typeof careerGoalSchema>;
export type LearningResource = z.infer<typeof learningResourceSchema>;
export type Opportunity = z.infer<typeof opportunitySchema>;
export type GrowthPlan = z.infer<typeof growthPlanSchema>;
export type GrowthPlanItem = z.infer<typeof growthPlanItemSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type RecommendationEvidence = z.infer<typeof recommendationEvidenceSchema>;
export type DataReadinessScore = z.infer<typeof dataReadinessScoreSchema>;

export type {
  AgentActionPlan,
  AgentProposedAction,
  BusinessPriority,
  DecisionEvidence,
  DecisionOutcome,
  DecisionParticipant,
  Project,
  ProjectMembership,
  RoleEvolutionScenario,
  RoleTaskChange,
  TeamScenario,
  TeamScenarioRole,
  TeamScenarioSkill,
  WorkforceContextEdge,
  WorkforceDecision,
};

export interface CareerPathMatch {
  role: Role;
  matchScore: number;
  confidence: number;
  explanation: string;
  skillGaps: Array<{ skill: Skill; currentLevel: number | null; requiredLevel: number }>;
  suggestedLearning: LearningResource[];
  suggestedOpportunities: Opportunity[];
}

export interface ManagerConversationPrep {
  agenda: string[];
  talkingPoints: string[];
  questionsToAsk: string[];
  skillsToDiscuss: Skill[];
  nextSteps: string[];
}

export interface SkillGap {
  skill: Skill;
  requiredLevel: number;
  teamCoverage: number;
  affectedEmployeeIds: string[];
  explanation: string;
  confidence: number;
}

export interface ManagerTeamMemberSummary {
  employee: Employee;
  user: User;
  growthPlanStatus: string | null;
  hasActiveGoal: boolean;
  skillsCount: number;
  pendingRecommendations: number;
}

export interface ManagerDashboard {
  manager: Employee;
  managerUser: User;
  team: Team | undefined;
  directReports: ManagerTeamMemberSummary[];
  growthPlanAdoptionPercent: number;
  teamActionRecommendations: Array<Recommendation & { evidence: RecommendationEvidence[] }>;
  skillGapAlerts: SkillGap[];
  conversationsDue: Array<{
    employeeId: string;
    employeeName: string;
    reason: string;
    dueLabel: string;
  }>;
  stretchOpportunities: Opportunity[];
  skillsOverview: { confirmed: number; inferred: number; total: number };
}

export interface TeamSkillsMatrixMember {
  employeeId: string;
  fullName: string;
  jobTitle: string;
  skills: Array<EmployeeSkill & { skillName: string }>;
  growthPlanStatus: string | null;
  confirmedCount: number;
  inferredCount: number;
}

export interface TeamSkillsMatrix {
  team: Team | undefined;
  members: TeamSkillsMatrixMember[];
  teamGaps: SkillGap[];
  readinessSnapshot: {
    avgConfirmedSkills: number;
    avgInferredSkills: number;
    membersWithActivePlan: number;
    totalMembers: number;
  };
}

export type CoachingPromptCategory = 'growth' | 'skills' | 'motivation' | 'project_fit';

export interface CoachingPrompt {
  id: string;
  employeeId: string;
  employeeName: string;
  category: CoachingPromptCategory;
  prompt: string;
  context: string;
  explanation: string;
  confidence: number;
  confidenceLevel: 'low' | 'medium' | 'high';
  evidence: RecommendationEvidence[];
}

export interface EmployeeSummaryForManager {
  employee: Employee;
  user: User;
  profile: EmployeeProfile | undefined;
  skills: Array<EmployeeSkill & { skill: Skill }>;
  careerGoals: CareerGoal[];
  growthPlan: GrowthPlan | undefined;
  growthPlanItems: GrowthPlanItem[];
  coachingActions: Array<Recommendation & { evidence: RecommendationEvidence[] }>;
  stretchOpportunities: Array<
    Opportunity & {
      explanation: string;
      confidence: number;
      evidence: RecommendationEvidence[];
    }
  >;
  coachingPrompts: CoachingPrompt[];
}

export interface TeamCapabilityPlan {
  teamGoals: string[];
  collectiveGaps: SkillGap[];
  recommendedActions: Array<Recommendation & { evidence: RecommendationEvidence[] }>;
  reskillingSuggestions: Array<{
    skill: Skill;
    affectedCount: number;
    suggestion: string;
    explanation: string;
    confidence: number;
  }>;
  talentDensity: {
    score: number;
    explanation: string;
    topSkills: Array<{ skill: Skill; depthScore: number }>;
    confidence: number;
  };
  timelineItems: Array<{ quarter: string; title: string; description: string }>;
}

export interface MockDataStore {
  organizations: Organization[];
  users: User[];
  employees: Employee[];
  employeeProfiles: EmployeeProfile[];
  teams: Team[];
  skills: Skill[];
  employeeSkills: EmployeeSkill[];
  roles: Role[];
  roleSkills: RoleSkill[];
  careerGoals: CareerGoal[];
  learningResources: LearningResource[];
  opportunities: Opportunity[];
  growthPlans: GrowthPlan[];
  growthPlanItems: GrowthPlanItem[];
  recommendations: Recommendation[];
  recommendationEvidence: RecommendationEvidence[];
  dataReadinessScores: DataReadinessScore[];
  businessPriorities: BusinessPriority[];
  projects: Project[];
  projectMemberships: ProjectMembership[];
  workforceContextEdges: WorkforceContextEdge[];
  workforceDecisions: WorkforceDecision[];
  decisionEvidence: DecisionEvidence[];
  decisionOutcomes: DecisionOutcome[];
  decisionParticipants: DecisionParticipant[];
  teamScenarios: TeamScenario[];
  teamScenarioRoles: TeamScenarioRole[];
  teamScenarioSkills: TeamScenarioSkill[];
  roleEvolutionScenarios: RoleEvolutionScenario[];
  roleTaskChanges: RoleTaskChange[];
  agentActionPlans: AgentActionPlan[];
  agentProposedActions: AgentProposedAction[];
}

export interface HrInsightRecommendation {
  title: string;
  explanation: string;
  confidence: number;
}

export interface HrDashboard {
  organizationName: string;
  kpis: {
    dataReadinessScore: number;
    planAdoptionPct: number;
    mobilityMatchRatePct: number;
    workforceReadinessScore: number;
    managerEnablementScore: number;
  };
  topSkillGaps: Array<{
    skillName: string;
    affectedDepartments: number;
    severity: 'high' | 'medium' | 'low';
  }>;
  lowReadinessAlerts: Array<{ department: string; score: number }>;
  adoptionByDepartment: Array<{ department: string; adoptionPct: number }>;
  mobilitySummary: {
    openOpportunities: number;
    employeesWithMatches: number;
    matchRatePct: number;
  };
  recommendations: HrInsightRecommendation[];
}

export interface SkillsReadinessReport {
  overall: DataReadinessScore;
  byDepartment: Array<DataReadinessScore & { departmentName: string }>;
  trends: Array<{ date: string; score: number }>;
  dimensions: {
    completeness: number;
    freshness: number;
    confidence: number;
    confirmedVsInferred: { confirmedPct: number; inferredPct: number };
  };
  missingDataAreas: string[];
  recommendations: HrInsightRecommendation[];
}

export interface MobilityInsights {
  openOpportunities: number;
  matchRatePct: number;
  employeesWithInterest: number;
  pipelineStages: Array<{ stage: string; count: number }>;
  topSkillsInDemand: Array<{ skillName: string; opportunityCount: number }>;
  blockers: Array<{ label: string; count: number; explanation: string }>;
  recommendations: HrInsightRecommendation[];
}

export interface TalentDensityReport {
  overallDensityScore: number;
  topSkillsByDepth: Array<{ skillName: string; avgProficiency: number; employeeCount: number }>;
  departmentDensity: Array<{ department: string; densityScore: number; trend: 'up' | 'stable' | 'down' }>;
  criticalSkillCoverage: Array<{ skillName: string; coveragePct: number; targetPct: number }>;
  pipelineStrength: number;
  explanation: string;
  confidence: number;
  recommendations: HrInsightRecommendation[];
}

export interface WorkforceReadinessReport {
  overallReadinessScore: number;
  roleReadiness: Array<{
    roleTitle: string;
    department: string;
    demandLevel: 'high' | 'medium' | 'low';
    readinessScore: number;
    criticalGaps: string[];
  }>;
  capabilityGaps: Array<{
    skillName: string;
    supplyCount: number;
    demandCount: number;
    gap: number;
  }>;
  strategies: {
    build: string[];
    buy: string[];
    borrow: string[];
    redeploy: string[];
  };
  recommendations: HrInsightRecommendation[];
}
