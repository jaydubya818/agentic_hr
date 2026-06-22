import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getDataProviderMode,
  shouldUseMockData,
  shouldUseSupabaseProvider,
} from './provider-config';
import { clearSupabaseStoreCache } from './store-runtime';

describe('data provider fallback', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    clearSupabaseStoreCache();
    vi.resetModules();
  });

  it('defaults to mock mode when USE_MOCK_DATA is unset', () => {
    delete process.env.USE_MOCK_DATA;
    delete process.env.DATABASE_URL;
    expect(shouldUseMockData()).toBe(true);
    expect(shouldUseSupabaseProvider()).toBe(false);
    expect(getDataProviderMode()).toBe('mock');
  });

  it('requests supabase provider only when USE_MOCK_DATA=false and DATABASE_URL exists', () => {
    process.env.USE_MOCK_DATA = 'false';
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/growthos';
    expect(shouldUseSupabaseProvider()).toBe(true);
    expect(getDataProviderMode()).toBe('supabase');
  });

  it('falls back to mock when USE_MOCK_DATA=false but DATABASE_URL is missing', () => {
    process.env.USE_MOCK_DATA = 'false';
    delete process.env.DATABASE_URL;
    expect(shouldUseSupabaseProvider()).toBe(false);
    expect(getDataProviderMode()).toBe('mock');
  });
});
