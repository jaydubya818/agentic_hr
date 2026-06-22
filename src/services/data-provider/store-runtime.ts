import type { MockDataStore } from './types';

let cachedSupabaseStore: MockDataStore | null = null;
let loadPromise: Promise<MockDataStore | null> | null = null;
let lastLoadFailed = false;

export function getCachedSupabaseStore(): MockDataStore | null {
  return cachedSupabaseStore;
}

export function clearSupabaseStoreCache(): void {
  cachedSupabaseStore = null;
  loadPromise = null;
  lastLoadFailed = false;
}

export function didSupabaseStoreLoadFail(): boolean {
  return lastLoadFailed;
}

export async function ensureSupabaseStoreLoaded(
  loader: () => Promise<MockDataStore | null>,
): Promise<MockDataStore | null> {
  if (cachedSupabaseStore) {
    return cachedSupabaseStore;
  }

  if (lastLoadFailed) {
    return null;
  }

  if (!loadPromise) {
    loadPromise = loader()
      .then((store) => {
        cachedSupabaseStore = store;
        if (!store) {
          lastLoadFailed = true;
        }
        return store;
      })
      .catch(() => {
        lastLoadFailed = true;
        return null;
      })
      .finally(() => {
        loadPromise = null;
      });
  }

  return loadPromise;
}
