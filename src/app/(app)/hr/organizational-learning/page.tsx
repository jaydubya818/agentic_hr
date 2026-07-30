'use client';

import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { LearningSignalCard } from '@/components/workforce-intelligence/LearningSignalCard';
import { OutcomePatternCard } from '@/components/workforce-intelligence/OutcomePatternCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  DecisionPattern,
  LearningSignal,
  OutcomePatternByAction,
  RecommendationEffectiveness,
} from '@/services/organizational-learning-service';

export default function HrOrganizationalLearningPage() {
  const [decisionPatterns, setDecisionPatterns] = useState<DecisionPattern[]>([]);
  const [outcomePatterns, setOutcomePatterns] = useState<OutcomePatternByAction[]>([]);
  const [effectiveness, setEffectiveness] = useState<RecommendationEffectiveness[]>([]);
  const [signals, setSignals] = useState<LearningSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(false);
      try {
        const response = await fetch('/api/organizational-learning');
        if (response.ok) {
          const data = (await response.json()) as {
            decisionPatterns: DecisionPattern[];
            outcomePatternsByActionType: OutcomePatternByAction[];
            recommendationEffectiveness: RecommendationEffectiveness[];
            learningSignals: LearningSignal[];
          };
          if (!cancelled) {
            setDecisionPatterns(data.decisionPatterns);
            setOutcomePatterns(data.outcomePatternsByActionType);
            setEffectiveness(data.recommendationEffectiveness);
            setSignals(data.learningSignals);
          }
        } else if (!cancelled) {
          setLoadError(true);
        }
      } catch {
        // A network failure would otherwise escape the effect as an unhandled
        // rejection and render an empty dashboard with no explanation.
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader
        title="Organizational Learning"
        description="Patterns from workforce decisions, outcomes, and agent actions — insights for enablement, not automated HR decisions."
        breadcrumbs={['HR', 'Organizational Learning']}
      />
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading learning signals…</p>
      ) : loadError ? (
        <p role="alert" className="text-sm text-destructive">
          Could not load learning signals. Refresh the page to try again.
        </p>
      ) : (
        <div className="space-y-8">
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {signals.map((signal) => (
              <LearningSignalCard key={signal.id} signal={signal} />
            ))}
          </section>
          <section>
            <h2 className="mb-4 text-lg font-semibold">Outcome patterns by action type</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {outcomePatterns.map((pattern) => (
                <OutcomePatternCard key={pattern.actionType} pattern={pattern} />
              ))}
            </div>
          </section>
          <section className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Decision patterns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {decisionPatterns.map((pattern) => (
                  <div key={pattern.decisionType} className="flex justify-between">
                    <span>{pattern.decisionType.replace(/_/g, ' ')}</span>
                    <span>
                      {pattern.count} · {Math.round(pattern.avgConfidence * 100)}% conf
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recommendation effectiveness</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {effectiveness.map((item) => (
                  <div key={item.recommendationType} className="flex justify-between">
                    <span>{item.recommendationType}</span>
                    <span>{Math.round(item.acceptanceRate * 100)}% accepted</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </>
  );
}
