import { isSupabaseConfigured } from '@/lib/supabase/env';

function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** True when mock JSON provider should be used (default). */
export function shouldUseMockData(): boolean {
  if (process.env.USE_MOCK_DATA === 'true') {
    return true;
  }
  if (process.env.USE_MOCK_DATA === 'false') {
    return false;
  }
  return true;
}

/** True when Supabase/Drizzle persistence is requested and minimally configured. */
export function isSupabasePersistenceRequested(): boolean {
  return process.env.USE_MOCK_DATA === 'false';
}

export function isSupabasePersistenceConfigured(): boolean {
  return hasDatabaseUrl() && isSupabaseConfigured();
}

/**
 * Use Supabase-backed store when explicitly disabled mock mode AND DATABASE_URL is set.
 * Public Supabase URL/key are not required for server-side Drizzle reads.
 */
export function shouldUseSupabaseProvider(): boolean {
  return isSupabasePersistenceRequested() && hasDatabaseUrl();
}

export function getDataProviderMode(): 'mock' | 'supabase' {
  return shouldUseSupabaseProvider() ? 'supabase' : 'mock';
}

/** True when read-only HRIS adapter sync should run (default false). */
export function shouldUseHrisRead(): boolean {
  return process.env.USE_HRIS_READ === 'true';
}
