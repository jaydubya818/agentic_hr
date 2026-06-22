import { createBrowserClient } from '@supabase/ssr';

import { getSupabasePublicEnv } from './env';

/**
 * Browser Supabase client. Returns null when env vars are unset (mock mode).
 */
export function createSupabaseBrowserClient() {
  const env = getSupabasePublicEnv();
  if (!env) {
    return null;
  }

  return createBrowserClient(env.url, env.anonKey);
}
