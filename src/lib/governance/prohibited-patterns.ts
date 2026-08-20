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
    // The euphemisms HR actually writes. A model asked to be tactful reaches
    // for these long before it says "terminate", and every one of them was
    // walking through the filter: "exit this employee", "part ways with
    // Jordan", "begin the involuntary separation process", "start offboarding
    // him".
    //
    // "exit" and "separation" are context-guarded rather than matched bare --
    // this product discusses engineering skills, where "exit criteria" and
    // "separation of concerns" are ordinary vocabulary. "transition" and
    // "renew" are guarded the same way: transitioning into a new role and
    // renewing a certification are exactly what this product is for, so only
    // transitioning a named person *out of the company* and declining to
    // renew a *contract* are treated as exits.
    id: 'termination_euphemism',
    pattern:
      /\bpart(ing|ed|s)?\s+ways\b|\boff-?board(ing|ed|s)?\b|\b(involuntary|voluntary|mutual|negotiated)\s+separation\b|\bseparation\s+(agreement|package|date|process)\b|\bexit\s+(interview|package)\b|\bmanaged\s+exit\b|\bexit(ing)?\s+(him|her|them|someone|(this|that|the)\s+(person|employee|individual|report|hire))\b|\bcounsell?(ed|ing)?\s+out\b|\btransition(ed|ing)?\s+(him|her|them|someone|(this|that|the)\s+(person|employee|individual|report|hire))\s+out\b|\btransition(ed|ing)?\s+out\s+of\s+the\s+(company|organi[sz]ation|business)\b|\bnon-?renewal\s+of\s+(his|her|their|the)?\s*(contract|agreement|employment)\b|\b(do|does|did|will|would)\s+not\s+renew\s+(his|her|their|the)?\s*(contract|agreement)\b|\bnot\s+renewing\s+(his|her|their|the)?\s*(contract|agreement)\b/i,
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
  {
    // A collective reduction is announced with the vocabulary HR and legal
    // actually use, and none of it contains the word "layoff": UK/EU
    // consultations say "redundancy", cost actions say "furlough" or "garden
    // leave", and a reorg deck says "role elimination". All of them passed a
    // filter whose stated bias is safety over recall.
    //
    // "redundancy" is context-guarded rather than matched bare: this product
    // discusses engineering skills, where building redundancy into a system
    // is ordinary vocabulary.
    id: 'layoff_euphemism',
    pattern:
      /\bfurlough(s|ed|ing)?\b|\bgarden(ing)?\s+leave\b|\bmade\s+redundant\b|\bat\s+risk\s+of\s+redundancy\b|\bredundanc(y|ies)\s+(process|consultation|pool|list|package|programme|program|selection|notice)\b|\bredundant\s+(role|position|job|headcount)s?\b|\b(role|position|job|headcount)s?\s+elimination\b|\beliminat(e|ed|es|ing|ion\s+of)\s+(this|that|the|his|her|their|a)?\s*(role|position|job|headcount)s?\b|\b(role|position|job|headcount)s?\s+((is|are|was|were|will)\s+)?(being\s+|be\s+)?eliminated\b/i,
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
    // Every label here was matched in the singular only, so the plural -- how
    // a team-level answer actually phrases it ("your low performers are Alex
    // and Jordan") -- walked straight through. The superlative was missing
    // too: EVALS_AND_GOVERNANCE 8 lists "Lowest performer" under the
    // supermanager agent's "must not use", and \blow performer\b cannot
    // match "lowest performer".
    id: 'punitive_labels',
    pattern:
      /\b(low(est)?\s+performers?|poor\s+performers?|bottom\s+performers?|not\s+promotable|low\s+potential|under-?performers?|dead\s+weight|weakest\s+(link|performer|member|employee|contributor)s?)\b/i,
    category: 'punitive_label',
  },
  {
    id: 'hiring_decision',
    pattern: /\b(you are hired|do not hire|reject this candidate|hire this candidate)\b/i,
    category: 'hiring',
  },
  {
    // Rating *labels*, not just the word "rating". The seed list covered
    // "meets expectations" and "below expectations", which left the rest of
    // every standard scale open: "exceeds expectations", "does not meet
    // expectations" (note the uninflected verb, so the "meets" branch misses
    // it), "partially meets expectations", and numeric forms like "rated 2 out
    // of 5".
    id: 'performance_rating',
    pattern:
      /\brating:\s*\d|\b(performance\s+ratings?)\b|\b(exceed(s|ed)?|below|partially\s+meets?|(does|did|do)\s+not\s+meet|doesn't\s+meet)\s+expectations\b|\bmeets expectations\b|\brated\s+\d+(\.\d+)?\s*(out of|\/)\s*\d/i,
    category: 'performance_rating',
  },
  {
    // Formal performance management is an employment action, not development
    // guidance, so it belongs behind the same block as termination. "PIP" is
    // context-guarded rather than matched bare: this product discusses
    // technical skills, and a bare \bpip\b would block "pip install".
    id: 'performance_management',
    pattern:
      /\bperformance improvement plan\b|\b(on|onto|start(ing)?|begin|open|initiat(e|ing))\s+an?\s+pip\b|\bpip\s+(process|plan|conversation)\b|\bmanaged out\b|\bmanag(e|ing)\s+(him|her|them|someone|(this|that|the)\s+(person|employee))\s+out\b|\b(final\s+)?(written|verbal)\s+warning\b|\bcorrective\s+action\s+plan\b|\bdisciplinary\s+(action|process|meeting)\b|\blast\s+chance\s+agreement\b/i,
    category: 'performance_management',
  },
  {
    // Succession planning is an explicit MVP non-goal, but only two exact
    // phrasings were matched. Naming a successor is the whole prohibited act,
    // however it is worded: "designate a successor for the VP role", "add her
    // to the succession plan", "she is his successor".
    id: 'succession',
    pattern:
      /\bnext ceo should be\b|\bsuccessor\s+(designation|for|to)\b|\b(designate|name|identify|pick|choose)\s+(a|the|her|his|their)?\s*successor\b|\b(her|his|their|my|the)\s+successor\b|\bsuccession\s+(plan(ning|s)?|candidate|slate|pool|list)\b/i,
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
