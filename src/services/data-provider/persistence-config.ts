import { getDb, isDatabaseConfigured } from '@/lib/db';
import { shouldUseSupabaseProvider } from './provider-config';

/** True when server-side Drizzle writes should persist to Postgres. */
export function shouldPersistWrites(): boolean {
  return shouldUseSupabaseProvider() && isDatabaseConfigured() && getDb() !== null;
}
