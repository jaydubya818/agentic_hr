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
 * Employment-decision language that must never appear in a proposed action.
 * Shared by validation and filtering so both paths block the same terms
 * (EVALS_AND_GOVERNANCE.md prohibited outputs).
 */
const PROHIBITED_ACTION_TERMS = [
  'terminate',
  'layoff',
  'fire',
  'promote',
  'promotion',
  'compensation',
  'performance rating',
  'not promotable',
  'low performer',
] as const;

function containsProhibitedTerm(action: ActionInput): boolean {
  const combined =
    `${action.title} ${action.description ?? ''} ${action.explanation ?? ''}`.toLowerCase();
  return PROHIBITED_ACTION_TERMS.some((term) => combined.includes(term));
}

function isDisallowedActionType(value: string): boolean {
  return (DISALLOWED_ACTION_TYPES as readonly string[]).includes(value);
}

function isAllowedActionType(value: string): value is ProposedActionType {
  return (ALLOWED_ACTION_TYPES as readonly string[]).includes(value);
}

export function validateActionPlan(actions: ActionInput[]): ActionPlanValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const blockedActionTypes: string[] = [];

  if (actions.length === 0) {
    warnings.push('Action plan contains no proposed actions.');
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
