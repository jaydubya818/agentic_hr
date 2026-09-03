import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Characterization of `preload.ts`, the module `(app)/layout.tsx` awaits on
 * every authenticated render to warm the Supabase-backed store. Had no test
 * of its own. Two behaviours worth pinning: it is a no-op in mock mode (the
 * common case, and the one every other test in this suite runs under), and
 * the "falling back to mock JSON" warning fires at most once per process,
 * not once per request -- so an operator's terminal is not spammed by
 * concurrent renders during a live-mode outage.
 */

vi.mock('./provider-config', () => ({ shouldUseSupabaseProvider: vi.fn() }));
vi.mock('./store-runtime', () => ({ ensureSupabaseStoreLoaded: vi.fn() }));
vi.mock('./supabase-store-loader', () => ({ loadSupabaseStore: vi.fn() }));

import { shouldUseSupabaseProvider } from './provider-config';
import { ensureSupabaseStoreLoaded } from './store-runtime';

beforeEach(() => {
  vi.resetModules();
  vi.mocked(shouldUseSupabaseProvider).mockReset();
  vi.mocked(ensureSupabaseStoreLoaded).mockReset();
});

describe('preloadDataProviderStore', () => {
  it('does nothing in mock mode: the loader is never invoked', async () => {
    vi.mocked(shouldUseSupabaseProvider).mockReturnValue(false);
    const { preloadDataProviderStore } = await import('./preload');
    await preloadDataProviderStore();
    expect(ensureSupabaseStoreLoaded).not.toHaveBeenCalled();
  });

  it('loads the store and warns nothing when the Supabase load succeeds', async () => {
    vi.mocked(shouldUseSupabaseProvider).mockReturnValue(true);
    vi.mocked(ensureSupabaseStoreLoaded).mockResolvedValue({} as never);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { preloadDataProviderStore } = await import('./preload');
    await preloadDataProviderStore();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('warns exactly once across repeated failed preloads in the same process', async () => {
    vi.mocked(shouldUseSupabaseProvider).mockReturnValue(true);
    vi.mocked(ensureSupabaseStoreLoaded).mockResolvedValue(null);
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { preloadDataProviderStore } = await import('./preload');
    await preloadDataProviderStore();
    await preloadDataProviderStore();
    await preloadDataProviderStore();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/mock JSON fallback/);
    warn.mockRestore();
  });
});
