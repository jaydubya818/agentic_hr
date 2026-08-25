import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
  // `tsconfig.json` sets `jsx: "preserve"` because Next compiles JSX itself,
  // and Vite honours that setting when it transforms `.tsx`. The JSX therefore
  // survives into the module handed to import analysis, which rejects it with
  // "content contains invalid JS syntax" -- so before this override no test
  // could import any `.tsx` module at all, which is why the server-side role
  // gates in `(app)/hr/layout.tsx` and `(app)/manager/layout.tsx` had no
  // tests. This overrides only Vitest's own transform; `next build` and
  // `tsc --noEmit` still read `tsconfig.json` unchanged.
  //
  // No React plugin is needed. Nothing here renders: the tests call the async
  // server components directly and assert on the redirect they perform.
  oxc: {
    jsx: { runtime: 'automatic' },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
