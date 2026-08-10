import type { DecisionType, ProposedActionType } from '@/schemas/workforce-intelligence';
import { getMockStore } from '@/services/data-provider/mock-provider';
import { compareExpectedToActual } from '@/services/decision-outcome-service';

export interface DecisionPattern {
  decisionType: DecisionType;
  count: number;
  /** Mean over decisions that carry a confidence score; 0 when none do. */
  avgConfidence: number;
  commonStatuses: string[];
}

export interface OutcomePatternByAction {
  actionType: ProposedActionType;
  appliedCount: number;
  successRate: number;
  avgConfidence: number;
}

export interface RecommendationEffectiveness {
  recommendationType: string;
  acceptanceRate: number;
  linkedDecisionCount: number;
  avgOutcomeAchievement: number;
}

export interface LearningSignal {
  id: string;
  category: 'decision' | 'outcome' | 'action' | 'scenario';
  title: string;
  insight: string;
  confidence: number;
  evidenceCount: number;
}

export function getDecisionPatterns(organizationId: string): DecisionPattern[] {
  const store = getMockStore();
  const decisions = store.workforceDecisions.filter((d) => d.organizationId === organizationId);
  const byType = new Map<DecisionType, DecisionPattern>();
  // Average only over decisions that record a confidence; counting missing
  // scores as zero would deflate the reported average.
  const confidenceCounts = new Map<DecisionType, number>();

  for (const decision of decisions) {
    const existing = byType.get(decision.decisionType) ?? {
      decisionType: decision.decisionType,
      count: 0,
      avgConfidence: 0,
      commonStatuses: [],
    };
    existing.count += 1;
    if (decision.confidence != null) {
      existing.avgConfidence += decision.confidence;
      confidenceCounts.set(
        decision.decisionType,
        (confidenceCounts.get(decision.decisionType) ?? 0) + 1,
      );
    }
    if (!existing.commonStatuses.includes(decision.status)) {
      existing.commonStatuses.push(decision.status);
    }
    byType.set(decision.decisionType, existing);
  }

  return [...byType.values()].map((pattern) => {
    const scored = confidenceCounts.get(pattern.decisionType) ?? 0;
    return {
      ...pattern,
      avgConfidence: scored > 0 ? pattern.avgConfidence / scored : 0,
    };
  });
}

export function getOutcomePatternsByActionType(organizationId: string): OutcomePatternByAction[] {
  const store = getMockStore();
  const actions = store.agentProposedActions.filter((a) => a.organizationId === organizationId);
  const byType = new Map<ProposedActionType, OutcomePatternByAction>();

  for (const action of actions) {
    const existing = byType.get(action.actionType) ?? {
      actionType: action.actionType,
      appliedCount: 0,
      successRate: 0,
      avgConfidence: 0,
    };
    if (action.status === 'applied') {
      existing.appliedCount += 1;
    }
    if (action.confidence != null) {
      existing.avgConfidence += action.confidence;
    }
    byType.set(action.actionType, existing);
  }

  return [...byType.values()].map((pattern) => {
    const typed = actions.filter((a) => a.actionType === pattern.actionType);
    const total = typed.length;
    const scored = typed.filter((a) => a.confidence != null).length;
    return {
      ...pattern,
      avgConfidence: scored > 0 ? pattern.avgConfidence / scored : 0,
      successRate: total > 0 ? pattern.appliedCount / total : 0,
    };
  });
}

export function getRecommendationEffectiveness(organizationId: string): RecommendationEffectiveness[] {
  const store = getMockStore();
  const recommendations = store.recommendations.filter((r) => r.organizationId === organizationId);
  const byType = new Map<string, RecommendationEffectiveness>();

  for (const rec of recommendations) {
    const existing = byType.get(rec.type) ?? {
      recommendationType: rec.type,
      acceptanceRate: 0,
      linkedDecisionCount: 0,
      avgOutcomeAchievement: 0,
    };
    if (rec.status === 'accepted') {
      existing.acceptanceRate += 1;
    }
    byType.set(rec.type, existing);
  }

  const decisionCount = store.workforceDecisions.filter((d) => d.organizationId === organizationId).length;
  const achievedOutcomes = store.decisionOutcomes.filter(
    (o) => o.organizationId === organizationId && o.outcomeType === 'actual' && o.status === 'achieved',
  ).length;
  const totalActual = store.decisionOutcomes.filter(
    (o) => o.organizationId === organizationId && o.outcomeType === 'actual',
  ).length;

  return [...byType.values()].map((item) => {
    const total = recommendations.filter((r) => r.type === item.recommendationType).length;
    return {
      ...item,
      acceptanceRate: total > 0 ? item.acceptanceRate / total : 0,
      linkedDecisionCount: decisionCount,
      avgOutcomeAchievement: totalActual > 0 ? achievedOutcomes / totalActual : 0,
    };
  });
}

export function getLearningSignalsForAgent(organizationId: string): LearningSignal[] {
  const store = getMockStore();
  const signals: LearningSignal[] = [];

  const skillDevDecisions = store.workforceDecisions.filter(
    (d) => d.organizationId === organizationId && d.decisionType === 'skill_development',
  );
  if (skillDevDecisions.length > 0) {
    signals.push({
      id: 'signal-skill-dev',
      category: 'decision',
      title: 'Skill development decisions show strong alignment',
      insight:
        'Reskilling decisions linked to business priorities tend to have higher confidence scores than ad-hoc training requests.',
      confidence: 0.78,
      evidenceCount: skillDevDecisions.length,
    });
  }

  for (const decision of store.workforceDecisions.filter((d) => d.organizationId === organizationId)) {
    const comparisons = compareExpectedToActual(decision.id);
    const partial = comparisons.filter((c) => c.actual?.status === 'partially_achieved');
    if (partial.length > 0) {
      signals.push({
        id: `signal-outcome-${decision.id}`,
        category: 'outcome',
        title: `Partial outcomes on: ${decision.title}`,
        insight: partial[0]!.summary,
        confidence: decision.confidence ?? 0.65,
        evidenceCount: partial.length,
      });
    }
  }

  const teamScenario = store.teamScenarios.find(
    (s) => s.organizationId === organizationId && s.metadata?.label === 'Product Quality',
  );
  if (teamScenario) {
    signals.push({
      id: 'signal-scenario-quality',
      category: 'scenario',
      title: 'Product Quality scenario informs work redesign',
      insight:
        'Future-state team scenarios with closed skill gaps correlate with approved work redesign decisions.',
      confidence: teamScenario.confidence ?? 0.7,
      evidenceCount: store.teamScenarioSkills.filter((s) => s.scenarioId === teamScenario.id).length,
    });
  }

  const appliedActions = store.agentProposedActions.filter(
    (a) => a.organizationId === organizationId && a.status === 'applied',
  );
  if (appliedActions.length > 0) {
    signals.push({
      id: 'signal-actions-applied',
      category: 'action',
      title: 'Applied agent actions show human review value',
      insight:
        'Actions moved from pending_review to applied after manager confirmation show higher follow-through on outcomes.',
      confidence: 0.72,
      evidenceCount: appliedActions.length,
    });
  }

  return signals;
}
