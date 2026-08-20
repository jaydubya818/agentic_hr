import { findProhibitedMatches } from '@/lib/governance/prohibited-patterns';
import {
  ALLOWED_ACTION_TYPES,
  DISALLOWED_ACTION_TYPES,
  proposedActionTypeSchema,
  type AgentProposedAction,
  type ProposedActionType,
} from '@/schemas/workforce-intelligence';

export interface ActionPlanValidationResult {
  valid: boolean;
  flagged: boolean;
  errors: string[];
  warnings: string[];
  blockedActionTypes: string[];
}

type ActionInput = Pick<
  AgentProposedAction,
  'actionType' | 'title' | 'description' | 'explanation'
>;

/**
 * Action-plan-specific employment-decision language.
 *
 * These are *stricter* than the shared governance list on purpose: any
 * mention of promotion or compensation disqualifies a proposed action, where
 * an agent's prose is allowed to say "contact HR about compensation". Word
 * boundaries cover inflections (fired, layoffs) without substring false
 * positives ('fire' in 'firewall', 'promotion' in 'promotional').
 *
 * They are not a replacement for the shared list -- see
 * `containsProhibitedTerm`.
 */
const PROHIBITED_ACTION_PATTERNS: RegExp[] = [
  /\bterminat(e|ed|es|ing|ion)\b/i,
  /\b(layoffs?|lay(s|ing)? off|laid off)\b/i,
  /\bfir(e|ed|ing)\b/i,
  /\bpromot(e|ed|es|ing|ions?)\b/i,
  /\bcompensation\b/i,
  /\bperformance ratings?\b/i,
  /\bnot promotable\b/i,
  /\blow performers?\b/i,
];

/** Plan-level free text, which is stored and rendered exactly like an action's. */
export interface ActionPlanTextInput {
  title?: string | null;
  summary?: string | null;
}

function containsProhibitedText(combined: string): boolean {
  // Also run the shared governance list. This module carried its own copy of
  // the prohibited vocabulary, and the copy had drifted: "let her go",
  // "dismissal", "severance", "downsizing", "put her on a PIP", "managed out",
  // "underperformer" and "recommend a raise" were all blocked in an agent
  // response and allowed in a proposed action written to an employee's growth
  // plan. Two governance filters must not disagree about what is prohibited.
  return (
    PROHIBITED_ACTION_PATTERNS.some((pattern) => pattern.test(combined)) ||
    findProhibitedMatches(combined).length > 0
  );
}

function containsProhibitedTerm(action: ActionInput): boolean {
  return containsProhibitedText(
    `${action.title} ${action.description ?? ''} ${action.explanation ?? ''}`,
  );
}

function isDisallowedActionType(value: string): boolean {
  return (DISALLOWED_ACTION_TYPES as readonly string[]).includes(value);
}

function isAllowedActionType(value: string): value is ProposedActionType {
  return (ALLOWED_ACTION_TYPES as readonly string[]).includes(value);
}

export function validateActionPlan(
  actions: ActionInput[],
  plan?: ActionPlanTextInput,
): ActionPlanValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const blockedActionTypes: string[] = [];

  if (actions.length === 0) {
    warnings.push('Action plan contains no proposed actions.');
  }

  // The plan's own title and summary are stored, rendered in the action-plan
  // panel and echoed into the action_plan.created audit entry exactly like an
  // action's text, but only the actions were ever scanned. A plan titled
  // "Termination plan for Alex" with innocuous actions passed as `passed`.
  if (plan && containsProhibitedText(`${plan.title ?? ''} ${plan.summary ?? ''}`)) {
    errors.push(`Prohibited language detected in action plan: ${plan.title ?? '(untitled)'}`);
  }

  for (const action of actions) {
    const rawType = action.actionType as string;

    if (isDisallowedActionType(rawType)) {
      errors.push(`Prohibited action type: ${rawType}`);
      blockedActionTypes.push(rawType);
      continue;
    }

    const parsed = proposedActionTypeSchema.safeParse(action.actionType);
    if (!parsed.success) {
      errors.push(`Invalid action type: ${rawType}`);
      continue;
    }

    if (!isAllowedActionType(rawType)) {
      warnings.push(`Action type not in allowed list: ${rawType}`);
    }

    if (containsProhibitedTerm(action)) {
      errors.push(`Prohibited language detected in action: ${action.title}`);
      blockedActionTypes.push(rawType);
    }
  }

  return {
    valid: errors.length === 0,
    flagged: warnings.length > 0,
    errors,
    warnings,
    blockedActionTypes,
  };
}

export function filterDisallowedActions<T extends ActionInput>(actions: T[]): T[] {
  return actions.filter((action) => {
    const rawType = action.actionType as string;
    if (isDisallowedActionType(rawType)) return false;

    const parsed = proposedActionTypeSchema.safeParse(action.actionType);
    if (!parsed.success) return false;

    return !containsProhibitedTerm(action);
  });
}

export { ALLOWED_ACTION_TYPES, DISALLOWED_ACTION_TYPES };
