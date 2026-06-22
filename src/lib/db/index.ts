/**
 * Database client — lazy initialization.
 * Returns null when DATABASE_URL is unset so mock mode builds without Supabase.
 * Live connections are used in Phase 8C+.
 */

import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema';

export type GrowthOsDatabase = PostgresJsDatabase<typeof schema>;

let cachedDb: GrowthOsDatabase | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDb(): GrowthOsDatabase | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    return null;
  }

  if (!cachedDb) {
    const client = postgres(url, { max: 1 });
    cachedDb = drizzle(client, { schema });
  }

  return cachedDb;
}

export { schema };
