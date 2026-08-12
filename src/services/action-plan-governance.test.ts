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

  it('exports allowed and disallowed constants', () => {
    expect(ALLOWED_ACTION_TYPES).toContain('skill_development');
    expect(DISALLOWED_ACTION_TYPES).toContain('termination');
    expect(DISALLOWED_ACTION_TYPES).toContain('promotion_decision');
  });
});
