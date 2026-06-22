/**
 * Governance keyword patterns per EVALS_AND_GOVERNANCE.md §10.2
 * Safety over recall — prefer blocking borderline content.
 */

export interface ProhibitedPattern {
  id: string;
  pattern: RegExp;
  category: string;
}

export const PROHIBITED_PATTERNS: ProhibitedPattern[] = [
  { id: 'termination', pattern: /\b(terminat(e|ion)|fire|let go|dismiss)\b/i, category: 'termination' },
  { id: 'layoff', pattern: /\b(layoff|rif|reduction in force)\b/i, category: 'layoff' },
  { id: 'demotion', pattern: /\b(demot(e|ed|ion)|downgrade role|reduce level)\b/i, category: 'demotion' },
  {
    id: 'promotion_decision',
    pattern: /\b(should be promoted|not ready to promote|promotion decision)\b/i,
    category: 'promotion',
  },
  {
    id: 'compensation',
    pattern: /\b(salary|compensation|raise|bonus)\s+(should|recommend)/i,
    category: 'compensation',
  },
  {
    id: 'punitive_labels',
    pattern: /\b(low performer|not promotable|low potential|underperformer|dead weight|weakest link)\b/i,
    category: 'punitive_label',
  },
  {
    id: 'hiring_decision',
    pattern: /\b(you are hired|do not hire|reject this candidate|hire this candidate)\b/i,
    category: 'hiring',
  },
  {
    id: 'performance_rating',
    pattern: /\b(rating:\s*\d|meets expectations|below expectations|performance rating)\b/i,
    category: 'performance_rating',
  },
  {
    id: 'succession',
    pattern: /\b(next ceo should be|successor designation)\b/i,
    category: 'succession',
  },
];

/** Development-framed phrases that must not trigger false positives (GV-04). */
const ALLOWED_EXCEPTIONS: RegExp[] = [
  /\bgrowth path to promotion-ready skills\b/i,
  /\bpromotion-ready skills\b/i,
  /\bbuild promotion-ready\b/i,
];

export function findProhibitedMatches(text: string): ProhibitedPattern[] {
  const normalized = text.trim();
  if (!normalized) return [];

  const matches = PROHIBITED_PATTERNS.filter(({ pattern }) => pattern.test(normalized));

  if (matches.length === 0) return [];

  const hasAllowedException = ALLOWED_EXCEPTIONS.some((ex) => ex.test(normalized));
  if (hasAllowedException && matches.every((m) => m.category === 'promotion')) {
    return [];
  }

  return matches;
}

export const GOVERNANCE_BLOCK_MESSAGE =
  "We couldn't generate this suggestion right now. GrowthOS focuses on development and growth opportunities. Try rephrasing your request or contact your HR team for employment-related questions.";
