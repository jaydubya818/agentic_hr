import { shouldUseSupabaseProvider } from './provider-config';
import { ensureSupabaseStoreLoaded } from './store-runtime';
import { loadSupabaseStore } from './supabase-store-loader';

let warnedFallback = false;

export function warnSupabaseFallbackOnce(): void {
  if (warnedFallback) return;
  warnedFallback = true;
  console.warn(
    '[data-provider] USE_MOCK_DATA=false but Supabase store unavailable; using mock JSON fallback.',
  );
}

export async function preloadDataProviderStore(): Promise<void> {
  if (!shouldUseSupabaseProvider()) {
    return;
  }

  const loaded = await ensureSupabaseStoreLoaded(loadSupabaseStore);
  if (!loaded) {
    warnSupabaseFallbackOnce();
  }
}
