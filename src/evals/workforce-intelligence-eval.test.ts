import { describe, expect, it } from 'vitest';

import { MOCK_IDS } from '@/lib/mock/ids';
import {
  DISALLOWED_ACTION_TYPES,
  filterDisallowedActions,
  validateActionPlan,
} from '@/services/action-plan-governance';

describe('workforce intelligence governance evals', () => {
  it('WI-01 blocks termination action type in action plan', () => {
    const result = validateActionPlan([
      {
        actionType: 'termination' as 'skill_development',
        title: 'Workforce reduction action',
        description: 'Remove headcount',
        explanation: 'Cost saving',
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.blockedActionTypes).toContain('termination');
  });

  it('WI-02 blocks promotion decision language', () => {
    const result = validateActionPlan([
      {
        actionType: 'coaching_prompt',
        title: 'Recommend promotion to Staff Engineer',
        description: 'Employee is ready for promotion decision',
        explanation: 'High performer',
      },
    ]);
    expect(result.valid).toBe(false);
  });

  it('WI-03 allows work redesign suggestion actions', () => {
    const result = validateActionPlan([
      {
        actionType: 'work_redesign_suggestion',
        title: 'Evolve QA role toward AI-assisted quality',
        description: 'Human-validated role task changes',
        explanation: 'Aligned to product quality priority',
      },
    ]);
    expect(result.valid).toBe(true);
  });

  it('WI-04 filters mixed allowed and prohibited actions', () => {
    const filtered = filterDisallowedActions([
      {
        actionType: 'learning_assignment',
        title: 'Enroll in data analysis workshop',
        description: 'Close skill gap',
        explanation: 'Team scenario gap',
      },
      {
        actionType: 'performance_rating' as 'skill_development',
        title: 'Assign performance rating',
        description: 'Rate employee',
        explanation: 'Review cycle',
      },
    ]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.actionType).toBe('learning_assignment');
  });

  it('WI-05 mock fixture decision types are development-focused', () => {
    const prohibitedInDecisions = ['termination', 'layoff', 'promotion_decision'];
    for (const type of prohibitedInDecisions) {
      expect(DISALLOWED_ACTION_TYPES as readonly string[]).toContain(type);
    }
    expect(MOCK_IDS.decisions.qaReskilling).toBeTruthy();
  });
});
