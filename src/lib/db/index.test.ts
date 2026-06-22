import { describe, expect, it } from 'vitest';

import { getDb, isDatabaseConfigured } from './index';

describe('db client', () => {
  it('reports unconfigured when DATABASE_URL is unset', () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    expect(isDatabaseConfigured()).toBe(false);
    expect(getDb()).toBeNull();

    process.env.DATABASE_URL = original;
  });
});
