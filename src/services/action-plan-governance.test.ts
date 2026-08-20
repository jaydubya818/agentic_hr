import { describe, expect, it } from 'vitest';

import {
  ALLOWED_ACTION_TYPES,
  DISALLOWED_ACTION_TYPES,
  filterDisallowedActions,
  validateActionPlan,
} from '@/services/action-plan-governance';

describe('action-plan-governance', () => {
  it('allows development-focused action types', () => {
    const result = validateActionPlan([
      {
        actionType: 'skill_development',
        title: 'Develop system design skills',
        description: 'Optional development focus',
        explanation: 'Career path alignment',
      },
    ]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('blocks prohibited action types', () => {
    const result = validateActionPlan([
      {
        actionType: 'termination' as 'skill_development',
        title: 'Terminate employee',
        description: 'Remove from team',
        explanation: 'Performance issue',
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Prohibited'))).toBe(true);
  });

  it('blocks prohibited language in action text', () => {
    const result = validateActionPlan([
      {
        actionType: 'coaching_prompt',
        title: 'Discuss compensation increase',
        description: 'Talk about pay',
        explanation: 'Retention',
      },
    ]);
    expect(result.valid).toBe(false);
  });

  it('allows development text that merely contains prohibited substrings', () => {
    const result = validateActionPlan([
      {
        actionType: 'learning_assignment',
        title: 'Complete firewall security training',
        description: 'Network security fundamentals course',
        explanation: 'Closes the security skill gap',
      },
      {
        actionType: 'conversation_prep',
        title: 'Host a fireside chat with senior engineers',
        description: 'Informal knowledge sharing session',
        explanation: 'Builds cross-team promotional materials awareness',
      },
    ]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('blocks inflected employment-decision language in action text', () => {
    const fired = validateActionPlan([
      {
        actionType: 'coaching_prompt',
        title: 'Discuss why the contractor was fired',
        description: null,
        explanation: null,
      },
    ]);
    expect(fired.valid).toBe(false);

    const layoffs = validateActionPlan([
      {
        actionType: 'coaching_prompt',
        title: 'Prepare the team for layoffs',
        description: null,
        explanation: null,
      },
    ]);
    expect(layoffs.valid).toBe(false);
  });

  it('filters disallowed actions from plan', () => {
    const filtered = filterDisallowedActions([
      {
        actionType: 'skill_development',
        title: 'Valid action',
        description: null,
        explanation: null,
      },
      {
        actionType: 'layoff' as 'skill_development',
        title: 'Layoff plan',
        description: null,
        explanation: null,
      },
    ]);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]!.title).toBe('Valid action');
  });

  it.each([
    ['We should let her go at the end of the quarter.', 'let <someone> go'],
    ['Prepare a severance package for this role.', 'severance'],
    ['Put her on a performance improvement plan.', 'PIP'],
    ['This employee has been managed out.', 'managed out'],
    ['Alex is an underperformer on this team.', 'punitive label'],
    ['Recommend a raise at the next cycle.', 'compensation'],
  ])('blocks shared-governance vocabulary in action text (%s)', (explanation) => {
    // This module used to carry its own copy of the prohibited vocabulary,
    // and the copy had drifted below the shared list -- so text blocked in an
    // agent response was written straight into a growth plan.
    const action = {
      actionType: 'skill_development' as const,
      title: 'Next step for Alex',
      description: null,
      explanation,
    };
    expect(validateActionPlan([action]).valid).toBe(false);
    expect(filterDisallowedActions([action])).toHaveLength(0);
  });

  it('scans the plan title and summary, not only the actions', () => {
    // The plan's own free text is stored, rendered in the action-plan panel
    // and echoed into the action_plan.created audit entry exactly like an
    // action's, but only the actions were ever scanned.
    const cleanAction = {
      actionType: 'skill_development' as const,
      title: 'Deepen system design skills',
      description: null,
      explanation: 'Career path analysis shows system design as the primary gap.',
    };

    expect(validateActionPlan([cleanAction]).valid).toBe(true);

    const blockedTitle = validateActionPlan([cleanAction], {
      title: 'Termination plan for Alex',
      summary: null,
    });
    expect(blockedTitle.valid).toBe(false);
    expect(blockedTitle.errors.join(' ')).toContain('action plan');

    const blockedSummary = validateActionPlan([cleanAction], {
      title: 'Q3 plan',
      summary: 'Prepare a severance package before the review.',
    });
    expect(blockedSummary.valid).toBe(false);

    expect(
      validateActionPlan([cleanAction], {
        title: 'Growth actions from career path analysis',
        summary: 'Development-focused actions grounded in confirmed skills.',
      }).valid,
    ).toBe(true);
  });

  it('exports allowed and disallowed constants', () => {
    expect(ALLOWED_ACTION_TYPES).toContain('skill_development');
    expect(DISALLOWED_ACTION_TYPES).toContain('termination');
    expect(DISALLOWED_ACTION_TYPES).toContain('promotion_decision');
  });
});
