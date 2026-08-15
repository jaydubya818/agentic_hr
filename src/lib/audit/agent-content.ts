import { createHash } from 'crypto';

/**
 * Agent chat text in audit details.
 *
 * `docs/SECURITY_AND_PRIVACY.md` §8.2 ("What Does NOT Get Logged") and §5.3
 * both require that full LLM prompt/response text is not retained in the
 * production audit trail — hashes only, configurable. The employee-facing
 * growth agents carry the employee's own words, and every `hr_admin` can read
 * and CSV-export the audit trail, so storing previews in production would put
 * private chat content in front of the whole HR role.
 *
 * Demo and development keep the readable preview documented in
 * `docs/EVALS_AND_GOVERNANCE.md` §14.1, because the audit walkthrough relies
 * on it.
 */
const PREVIEW_LENGTH = 200;

/** Whether readable agent text may be stored in `audit_logs.details`. */
export function shouldStoreAgentContent(): boolean {
  const flag = process.env.AUDIT_LOG_AGENT_CONTENT;
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

/**
 * Reduce agent text to what may be persisted: a 200-character preview when
 * content logging is enabled, otherwise a stable `sha256:` digest that still
 * lets an auditor correlate repeated prompts without revealing them.
 */
export function agentContentForAudit(text: string): string;
export function agentContentForAudit(text: string | undefined): string | undefined;
export function agentContentForAudit(text: string | undefined): string | undefined {
  if (text === undefined) return undefined;
  if (shouldStoreAgentContent()) return text.slice(0, PREVIEW_LENGTH);
  return `sha256:${createHash('sha256').update(text).digest('hex')}`;
}
