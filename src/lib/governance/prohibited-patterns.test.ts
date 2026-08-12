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
