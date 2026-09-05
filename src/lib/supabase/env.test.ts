import { afterEach, describe, expect, it } from 'vitest';

import { getSupabasePublicEnv, isSupabaseConfigured } from './env';

// getSupabasePublicEnv reads process.env fresh on every call (no module-level
// caching), so tests can mutate the two vars directly without a module reset.
// This is the gate that decides whether the whole app runs against live
// Supabase or falls back to mock mode (server.ts / client.ts both return
// null when this returns null) — zero coverage previously.
const URL_KEY = 'NEXT_PUBLIC_SUPABASE_URL';
const ANON_KEY = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';

function clear() {
  delete process.env[URL_KEY];
  delete process.env[ANON_KEY];
}

afterEach(clear);

describe('getSupabasePublicEnv', () => {
  it('returns null when both vars are unset', () => {
    clear();
    expect(getSupabasePublicEnv()).toBeNull();
  });

  it('returns the trimmed url and anon key when both are set', () => {
    process.env[URL_KEY] = '  https://example.supabase.co  ';
    process.env[ANON_KEY] = '  anon-key-value  ';
    expect(getSupabasePublicEnv()).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key-value',
    });
  });

  it('GAP: no partial-config fallback — url alone is treated as unconfigured', () => {
    process.env[URL_KEY] = 'https://example.supabase.co';
    expect(getSupabasePublicEnv()).toBeNull();
  });

  it('GAP: no partial-config fallback — anon key alone is treated as unconfigured', () => {
    process.env[ANON_KEY] = 'anon-key-value';
    expect(getSupabasePublicEnv()).toBeNull();
  });

  it('a whitespace-only value trims to empty and is treated as unset', () => {
    process.env[URL_KEY] = '   ';
    process.env[ANON_KEY] = 'anon-key-value';
    expect(getSupabasePublicEnv()).toBeNull();
  });

  it('an empty string value is treated the same as unset, not a configured empty value', () => {
    process.env[URL_KEY] = '';
    process.env[ANON_KEY] = 'anon-key-value';
    expect(getSupabasePublicEnv()).toBeNull();
  });
});

describe('isSupabaseConfigured', () => {
  it('mirrors getSupabasePublicEnv: false when unset, true when both are set', () => {
    clear();
    expect(isSupabaseConfigured()).toBe(false);
    process.env[URL_KEY] = 'https://example.supabase.co';
    process.env[ANON_KEY] = 'anon-key-value';
    expect(isSupabaseConfigured()).toBe(true);
  });
});
