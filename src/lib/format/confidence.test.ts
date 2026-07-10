import { describe, expect, it } from 'vitest';

import {
  confidenceBarColor,
  confidenceLabel,
  confidenceTextColor,
  formatConfidencePercent,
  getConfidenceLevel,
} from './confidence';

describe('confidence formatting', () => {
  it('maps values to documented thresholds (FRONTEND_GUIDELINES.md §3.3)', () => {
    expect(getConfidenceLevel(1)).toBe('high');
    expect(getConfidenceLevel(0.75)).toBe('high');
    expect(getConfidenceLevel(0.74)).toBe('medium');
    expect(getConfidenceLevel(0.5)).toBe('medium');
    expect(getConfidenceLevel(0.49)).toBe('low');
    expect(getConfidenceLevel(0)).toBe('low');
  });

  it('formats confidence as a rounded percent', () => {
    expect(formatConfidencePercent(0.82)).toBe('82%');
    expect(formatConfidencePercent(0.005)).toBe('1%');
    expect(formatConfidencePercent(1)).toBe('100%');
  });

  it('capitalizes level labels', () => {
    expect(confidenceLabel('high')).toBe('High');
    expect(confidenceLabel('medium')).toBe('Medium');
    expect(confidenceLabel('low')).toBe('Low');
  });

  it('returns a distinct color class per level', () => {
    const levels = ['high', 'medium', 'low'] as const;
    const barColors = levels.map((level) => confidenceBarColor(level));
    const textColors = levels.map((level) => confidenceTextColor(level));
    expect(new Set(barColors).size).toBe(3);
    expect(new Set(textColors).size).toBe(3);
  });
});
