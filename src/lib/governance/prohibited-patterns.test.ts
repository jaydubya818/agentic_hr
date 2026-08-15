import { describe, expect, it } from 'vitest';

import { findProhibitedMatches } from './prohibited-patterns';

function matchedIds(text: string): string[] {
  return findProhibitedMatches(text).map((m) => m.id);
}

describe('prohibited-patterns inflections', () => {
  it('blocks inflected termination language', () => {
    expect(matchedIds('That employee should be terminated.')).toContain('termination');
    expect(matchedIds('We are terminating the role next month.')).toContain('termination');
    expect(matchedIds('He was fired last quarter.')).toContain('termination');
    expect(matchedIds('Consider firing the contractor.')).toContain('termination');
    expect(matchedIds('She was dismissed for cause.')).toContain('termination');
    expect(matchedIds('Recommend dismissal from the team.')).toContain('termination');
    expect(matchedIds('We are letting go two engineers.')).toContain('termination');
  });

  it('blocks inflected layoff language', () => {
    expect(matchedIds('Plan for layoffs in Q3.')).toContain('layoff');
    expect(matchedIds('They laid off the platform team.')).toContain('layoff');
    expect(matchedIds('The company is laying off staff.')).toContain('layoff');
    expect(matchedIds('Management lays off underutilized roles.')).toContain('layoff');
  });

  it('still allows development-framed text', () => {
    expect(matchedIds('Focus on a growth path to promotion-ready skills.')).toHaveLength(0);
    expect(matchedIds('Strengthen system design through mentoring.')).toHaveLength(0);
  });
});

describe('compensation patterns', () => {
  it.each([
    'I recommend a raise for this employee',
    'Suggest a bonus at the next cycle',
    'A compensation increase is warranted here',
    'Propose a salary adjustment',
    'Their pay should be reviewed upward',
  ])('blocks compensation recommendations: %s', (text) => {
    expect(findProhibitedMatches(text).map((m) => m.category)).toContain('compensation');
  });

  it.each([
    'Contact your HR team for compensation questions',
    'Promotion and compensation review is owned by HR',
    'Raise a question with your manager in your next 1:1',
    'I recommend you pay attention to system design fundamentals',
    'Discuss promotion, compensation, and career goals with HR',
  ])('does not block a bare mention: %s', (text) => {
    expect(findProhibitedMatches(text).map((m) => m.category)).not.toContain('compensation');
  });
});
