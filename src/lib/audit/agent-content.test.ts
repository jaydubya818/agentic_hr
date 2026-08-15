import { afterEach, describe, expect, it, vi } from 'vitest';

import { agentContentForAudit, shouldStoreAgentContent } from './agent-content';

describe('agent content in audit details', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('stores a readable preview outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('AUDIT_LOG_AGENT_CONTENT', '');
    expect(shouldStoreAgentContent()).toBe(true);
    expect(agentContentForAudit('What career paths fit my goal?')).toBe(
      'What career paths fit my goal?',
    );
  });

  it('truncates the preview at 200 characters', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const preview = agentContentForAudit('a'.repeat(500));
    expect(preview).toHaveLength(200);
  });

  it('hashes agent text in production so private chat content is not retained', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUDIT_LOG_AGENT_CONTENT', '');
    expect(shouldStoreAgentContent()).toBe(false);

    const message = 'I am struggling with my manager and want to move teams';
    const stored = agentContentForAudit(message);
    expect(stored).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(stored).not.toContain('manager');
  });

  it('hashes the same text to the same digest so prompts stay correlatable', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(agentContentForAudit('same text')).toBe(agentContentForAudit('same text'));
    expect(agentContentForAudit('same text')).not.toBe(agentContentForAudit('other text'));
  });

  it('honours an explicit opt-in and opt-out of content logging', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('AUDIT_LOG_AGENT_CONTENT', 'true');
    expect(agentContentForAudit('visible')).toBe('visible');

    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('AUDIT_LOG_AGENT_CONTENT', 'false');
    expect(agentContentForAudit('visible')).toMatch(/^sha256:/);
  });

  it('passes undefined through so optional previews stay absent', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(agentContentForAudit(undefined)).toBeUndefined();
  });
});
