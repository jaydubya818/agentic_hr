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

  it('blocks "let <someone> go" with the object spelled out', () => {
    // The docs' seed pattern needs "let" and "go" adjacent, so these -- the
    // most natural way to say it -- were passing the filter entirely.
    expect(matchedIds('We should let her go at the end of the quarter.')).toContain('termination');
    expect(matchedIds('We should let him go.')).toContain('termination');
    expect(matchedIds('It may be time to let them go.')).toContain('termination');
    expect(matchedIds('Consider letting this person go.')).toContain('termination');
    expect(matchedIds('HR wants to let the employee go.')).toContain('termination');
  });

  it('does not block coaching copy that merely contains let/go', () => {
    expect(matchedIds('Let me walk through your growth plan.')).toHaveLength(0);
    expect(matchedIds('Let this goal guide your next quarter.')).toHaveLength(0);
  });

  it('blocks inflected layoff language', () => {
    expect(matchedIds('Plan for layoffs in Q3.')).toContain('layoff');
    expect(matchedIds('They laid off the platform team.')).toContain('layoff');
    expect(matchedIds('The company is laying off staff.')).toContain('layoff');
    expect(matchedIds('Management lays off underutilized roles.')).toContain('layoff');
  });

  it('blocks workforce-reduction language that never says "layoff"', () => {
    expect(matchedIds('The team is downsizing next quarter.')).toContain('layoff');
    expect(matchedIds('Offer a severance package to close this out.')).toContain('layoff');
    expect(matchedIds('Consider a headcount reduction on this team.')).toContain('layoff');
    expect(matchedIds('We are reducing headcount in support.')).toContain('layoff');
  });

  it('blocks formal performance management', () => {
    expect(matchedIds('Put her on a performance improvement plan.')).toContain(
      'performance_management',
    );
    expect(matchedIds('Start a PIP for this employee.')).toContain('performance_management');
    expect(matchedIds('This employee should be managed out.')).toContain('performance_management');
    expect(matchedIds('We are managing this person out.')).toContain('performance_management');
  });

  it('does not read a bare "pip" as performance management', () => {
    // The product discusses technical skills; "pip" is a Python tool.
    expect(matchedIds('Run pip install to set up the toolchain.')).toHaveLength(0);
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
