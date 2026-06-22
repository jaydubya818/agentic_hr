#!/usr/bin/env node
/**
 * Verify persistence-related environment variables (Phase 12.0).
 */
const requiredForPersistence = ['DATABASE_URL'];
const recommendedForAuth = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
];

let ok = true;

for (const key of requiredForPersistence) {
  if (!process.env[key]?.trim()) {
    console.error(`Missing required env: ${key}`);
    ok = false;
  }
}

for (const key of recommendedForAuth) {
  if (!process.env[key]?.trim()) {
    console.warn(`Warning: ${key} is not set — Supabase Auth client unavailable`);
  }
}

if (process.env.USE_MOCK_DATA === 'false') {
  console.log('USE_MOCK_DATA=false — persistence mode enabled');
} else {
  console.log('USE_MOCK_DATA is not false — demo mock mode (default)');
}

if (!ok) {
  process.exit(1);
}

console.log('Persistence environment check passed.');
process.exit(0);
