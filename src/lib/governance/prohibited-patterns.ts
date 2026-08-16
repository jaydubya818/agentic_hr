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
  // Inflected forms are matched explicitly: \b(terminate)\b alone would let
  // "terminated", "firing", or "laid off" through the filter.
  //
  // "let ... go" needs the object spelled out. The docs' seed pattern is
  // literally `let(ting)? go`, which requires the two words to be adjacent --
  // so it caught the harmless metaphor ("let go of the assumption that senior
  // means manager") while every natural termination phrasing walked through:
  // "we should let her go", "it may be time to let them go", "consider letting
  // this person go". Named objects ("let Alex go") are still a known miss; a
  // bare \w+ there would block ordinary coaching copy like "let me go through
  // your growth plan".
  {
    id: 'termination',
    pattern:
      /\b(terminat(e|ed|es|ing|ion)|fir(e|ed|ing)|let(ting)? go|lett?(ing)?\s+(him|her|them|someone|anyone|people|staff|(this|that|the)\s+(person|employee|individual|report|hire))\s+go|dismiss(ed|es|ing|al)?)\b/i,
    category: 'termination',
  },
  {
    // Beyond the docs' seed list: a workforce reduction is rarely announced
    // with the word "layoff". "Downsizing", "severance" and "headcount
    // reduction" are the terms that actually appear, and all three were
    // passing the filter.
    id: 'layoff',
    pattern:
      /\b(layoffs?|lay(s|ing)? off|laid off|rif|reduction in force|downsiz(e|ed|es|ing)|severance|(headcount|workforce|staff)\s+reduction|reduc(e|ing)\s+(headcount|the\s+workforce))\b/i,
    category: 'layoff',
  },
  { id: 'demotion', pattern: /\b(demot(e|ed|ion)|downgrade role|reduce level)\b/i, category: 'demotion' },
  {
    id: 'promotion_decision',
    pattern: /\b(should be promoted|not ready to promote|promotion decision)\b/i,
    category: 'promotion',
  },
  {
    // The docs' seed pattern only caught "<term> should/recommend", so the
    // far more natural "recommend a raise" and "compensation increase"
    // phrasings walked straight through a filter whose stated bias is safety
    // over recall. A bare mention still passes: the block copy itself tells
    // employees to contact HR about employment questions.
    id: 'compensation',
    pattern:
      /\b(salary|compensation|raise|bonus|pay)\s+(should|recommend|increase|adjustment|bump)|\b(recommend|suggest|propose)\w*\s+(a|an|the)?\s*(salary|compensation|raise|bonus|pay)\b/i,
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
    // Formal performance management is an employment action, not development
    // guidance, so it belongs behind the same block as termination. "PIP" is
    // context-guarded rather than matched bare: this product discusses
    // technical skills, and a bare \bpip\b would block "pip install".
    id: 'performance_management',
    pattern:
      /\bperformance improvement plan\b|\b(on|onto|start(ing)?|begin|open|initiat(e|ing))\s+an?\s+pip\b|\bpip\s+(process|plan|conversation)\b|\bmanaged out\b|\bmanag(e|ing)\s+(him|her|them|someone|(this|that|the)\s+(person|employee))\s+out\b/i,
    category: 'performance_management',
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
