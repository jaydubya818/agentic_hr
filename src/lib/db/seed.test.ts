import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('drizzle seed', () => {
  it('includes a runnable seed script for demo org data', () => {
    const seedPath = resolve(process.cwd(), 'drizzle/seed/seed-mock-data.ts');
    const content = readFileSync(seedPath, 'utf8');
    expect(content).toContain('DATABASE_URL');
    expect(content).toContain('data/mock');
    expect(content).toContain('userRoles');
  });
});
