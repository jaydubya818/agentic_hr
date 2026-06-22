import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema/index.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Migration execution requires DATABASE_URL or DIRECT_URL (Supabase pooler vs direct).
    url:
      process.env.DATABASE_URL ??
      process.env.DIRECT_URL ??
      'postgresql://localhost:5432/growthos',
  },
});
