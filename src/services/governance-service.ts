import {
  findProhibitedMatches,
  GOVERNANCE_BLOCK_MESSAGE,
  type ProhibitedPattern,
} from '@/lib/governance/prohibited-patterns';
import type { CreateRecommendationInput } from '@/types/agent';
import type { GovernanceStatus } from '@/types/agent';

/**
 * Below this, an output carries the human-in-the-loop reminder.
 *
 * EVALS_AND_GOVERNANCE 7.2 puts the "Low / Exploratory" confidence band at
 * 0.00-0.49 and 8.1 requires human review for anything under 0.5, and
 * `getConfidenceLevel` already renders < 0.5 as the red "low" band. The
 * threshold here was 0.4, so a 0.45-confidence recommendation was drawn as
 * low-confidence in the UI and still shipped without the review reminder --
 * and the live system prompt (`HUMAN_IN_THE_LOOP`) told the model 0.5.
 */
export const LOW_CONFIDENCE_THRESHOLD = 0.5;

export const HUMAN_IN_THE_LOOP_MESSAGE =
  'This suggestion has lower confidence or may need review. Discuss with your manager or HR before taking action.';

export interface GovernanceValidationInput {
  responseText: string;
  recommendations?: CreateRecommendationInput[];
  responseConfidence?: number;
}

export interface GovernanceValidationResult {
  status: GovernanceStatus;
  passed: boolean;
  blocked: boolean;
  flagged: boolean;
  matchedPatterns: string[];
  safeResponse?: string;
  humanReviewRequired: boolean;
  warnings: string[];
}

function collectTextToScan(input: GovernanceValidationInput): string {
  const parts = [input.responseText];
  for (const rec of input.recommendations ?? []) {
    parts.push(rec.title, rec.explanation);
    for (const ev of rec.evidence) {
      parts.push(ev.label, ev.detail ?? '');
    }
  }
  return parts.join('\n');
}

function hasLowConfidence(input: GovernanceValidationInput): boolean {
  if (input.responseConfidence !== undefined && input.responseConfidence < LOW_CONFIDENCE_THRESHOLD) {
    return true;
  }
  return (input.recommendations ?? []).some((rec) => rec.confidence < LOW_CONFIDENCE_THRESHOLD);
}

export function validateAgentOutput(input: GovernanceValidationInput): GovernanceValidationResult {
  const text = collectTextToScan(input);
  const matches: ProhibitedPattern[] = findProhibitedMatches(text);
  const warnings: string[] = [];

  if (matches.length > 0) {
    return {
      status: 'blocked',
      passed: false,
      blocked: true,
      flagged: false,
      matchedPatterns: matches.map((m) => m.id),
      safeResponse: GOVERNANCE_BLOCK_MESSAGE,
      humanReviewRequired: false,
      warnings,
    };
  }

  const lowConfidence = hasLowConfidence(input);
  if (lowConfidence) {
    warnings.push(HUMAN_IN_THE_LOOP_MESSAGE);
    return {
      status: 'flagged',
      passed: true,
      blocked: false,
      flagged: true,
      matchedPatterns: [],
      humanReviewRequired: true,
      warnings,
    };
  }

  return {
    status: 'passed',
    passed: true,
    blocked: false,
    flagged: false,
    matchedPatterns: [],
    humanReviewRequired: false,
    warnings,
  };
}

export { GOVERNANCE_BLOCK_MESSAGE };
