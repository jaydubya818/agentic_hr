import type { z } from 'zod';
import { confidenceLevelSchema } from '@/schemas/enums';

type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>;

export function getConfidenceLevel(value: number): ConfidenceLevel {
  if (value >= 0.75) return 'high';
  if (value >= 0.5) return 'medium';
  return 'low';
}

export function formatConfidencePercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function confidenceLabel(level: ConfidenceLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function confidenceBarColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'bg-emerald-600';
    case 'medium':
      return 'bg-amber-500';
    case 'low':
      return 'bg-red-600';
  }
}

export function confidenceTextColor(level: ConfidenceLevel): string {
  switch (level) {
    case 'high':
      return 'text-emerald-700';
    case 'medium':
      return 'text-amber-700';
    case 'low':
      return 'text-red-700';
  }
}
