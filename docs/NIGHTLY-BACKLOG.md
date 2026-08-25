# Nightly backlog

Initiatives found by the scheduled maintenance runs that are too large, too
risky, or too product-dependent to land inside a single nightly window. Runs
read this file first to avoid re-proposing work that is already tracked here.

## Open

- [ ] 2026-08-21 — Replace regex-only governance filtering with a normalize-then-match pipeline — the filter is bypassed by Unicode tricks that no additional keyword pattern can catch; see "Design note" below. **(2026-08-22: still open. This run deliberately did not touch `prohibited-patterns.ts` and added no pattern #6 — the design note's argument stands and the next same-class regex is the wrong move. Anyone picking this up should implement the normalize-then-match pipeline, not another keyword.)**
- [ ] 2026-08-21 — ESLint 9 → 10 is blocked by `eslint-config-next@15.5.23` — the 9.x line is EOL (2026-08-06) but the upgrade is coupled to the Next 16 migration; see "Design note" below.
- [ ] 2026-08-22 — Ground the app shell's displayed identity in the real session — in live mode `getMockSession()` returns the hard-coded demo persona to every signed-in user; see "Design note" below.
- [ ] 2026-08-22 — Next.js pre-announced a security release for **2026-08-26** (15.5.24 / 16.3.3, one CRITICAL). Not published as of this run, so it could not be applied. The next run after 2026-08-26 should bump `next` off 15.5.23 and re-check.
- [ ] 2026-08-22 — Decide whether the org-wide _list_ endpoints should narrow for `executive_readonly` — `GET /api/decisions` and `GET /api/agent-actions` return `ownerEmployeeId` / `targetEmployeeId`, which are employee UUIDs rather than names. Unlike the detail reads already fixed, these are the role's documented aggregate surface, so narrowing them is a product call, not a bug.
- [ ] 2026-08-22 — `getBusinessPriorityContext`, `findPeopleForBusinessPriority`, `findSkillsAtRiskForTeam` and `explainRelationship` take no `organizationId` and apply no tenant filter, unlike their `getEmployeeContextGraph` / `getTeamContextGraph` siblings. Currently reachable only from tests, so this is a latent trap for the first route that calls them, not a live leak. **(2026-08-23: add `getActionPlan(planId)` in `src/services/agent-action-service.ts` to this list. It is the same shape — every sibling in that file (`listActionPlansForSession`, `listActionPlansForOrganization`, `updateProposedActionStatus`, `applyActionToGrowthPlan`) takes or derives an organization and filters on it; `getActionPlan` takes only a plan id and returns the plan row from any organization. Its child-action join _is_ scoped, and `agent-action-scoping.test.ts` pins that, which is what makes the unscoped parent row easy to miss. Also reachable only from tests today.)**
- [ ] 2026-08-24 — The demo manager persona manages no team, so every manager-scoped _detail_ page is a 404 in mock mode. `getMockSession()` returns `DEFAULT_SESSION` (Alex Chen, employee `…331`) whatever userId the session cookie carries, and no row in `data/mock/teams.json` names `…331` as `managerEmployeeId` — Platform Engineering is managed by `…332`, Product Engineering by `…334`. `filterScenariosForSession` and its decision-side equivalent therefore return an empty set for the demo manager, so `/manager/decisions/[id]` and `/manager/team-scenarios/[id]` cannot render a record for any id (confirmed against `next dev`: both 404 under the `manager` role cookie, both 200 under `hr`). The scoping code is correct; the demo _data_ does not exercise it. Fixing it is a fixture decision — either make `…331` a manager of a team, or point the demo manager session at `…334` — and it overlaps the `getMockSession()` item above, so it should be settled alongside it rather than separately.
- [ ] 2026-08-24 — This repository has no CI. There is no `.github/` directory at all, so nothing runs `typecheck`, `lint`, `test` or `build` on push or pull request; every guarantee in this file rests on a nightly run happening to look. A ready-to-apply workflow was generated and verified with `git apply --check` on 2026-08-24 but could not be pushed: the nightly token is a fine-grained PAT without the `workflow` scope, so any push touching `.github/workflows/` is rejected by GitHub. Someone with workflow permission needs to land it. The patch adds a single `verify` job on Node 22.12.0 running `npm ci --include=dev` (the `--include=dev` is load-bearing; see the environment note below) then typecheck, lint, test and build with `USE_MOCK_DATA=true`.
- [ ] 2026-08-23 — Postgres row-level security is not on the application's data path at all. Every read and write goes through Drizzle over `DATABASE_URL`, while the RLS policies are keyed on `auth.uid()`; see "Design note" below. Tenant isolation is therefore entirely application-level, and the docs currently describe RLS as a live control.

## Closed

- [x] 2026-08-23 → 2026-08-24 — Page and layout route guards could not be tested in this harness — fixed on `main` by `test(rbac): make .tsx route gates testable and pin the two subtree gates`. `vitest.config.ts` now collects `src/**/*.test.{ts,tsx}` and overrides the JSX transform for Vitest only via Vite 8's `oxc.jsx` (`{ runtime: 'automatic' }`). The `esbuild.jsx` / `esbuild.tsconfigRaw` route suggested in the original note does **not** work here: Vitest 4.1.11 bundles Vite 8.2.1, which transforms with Oxc rather than esbuild, so the `esbuild` key is ignored and the JSX still reaches import analysis. No React plugin and no new dependency were needed — the tests call the async server components directly and assert on the redirect. `(app)/hr/layout.tsx` and `(app)/manager/layout.tsx` now have nine cases between them; swapping the manager gate to the HR predicate turns two of them red. `tsconfig.json` was left alone, so `next build` and `tsc --noEmit` are unaffected.
- [x] 2026-08-24 → 2026-08-24 — `npm run smoke` exited 1 on a pristine checkout — fixed on `main` by `test(smoke): stop the smoke script failing on its own fixtures`. Three routes failed for reasons in the script: `/hr/work-design/[id]` was passed a _team scenario_ id (`aaaa…aaa1`) although the page reads `getRoleEvolutionScenario`, whose only fixture is `bbbb…bbb1`; and the two manager detail routes were asserted as successes when their 404 is correct team scoping (see the new Open item above). Route entries may now be `[path, expectedStatus]`, so the denials are asserted rather than deleted. The script now exits 0 against `next dev`.

- [x] 2026-08-23 — `/hr/audit` had no route guard of its own — fixed on branch `nightly/2026-08-23-improvements` by `fix(rbac): gate the HR audit page on the audit-read permission`, which adds `(app)/hr/audit/layout.tsx` gating on `canReadAuditLogs` instead of inheriting the HR subtree's `canReadOrganizationWorkforceData`. `executive_readonly` could previously open the page (the API still answered 403, so no data leaked) and see only a failed fetch. Five tests in `layout.test.ts` pin it; the `executive_readonly` case goes red if the predicate is swapped back.
- [x] 2026-08-22 — Raise the `engines.node` floor off Node 20 — done in `chore(engines): raise the Node floor off end-of-life Node 20`, **merged to `main` on 2026-08-22**. Floor is now `>=22.12.0` (Node 22 Maintenance LTS) with `@types/node@22.20.1`. Verified at V3; the `@types/node` major bump produced no new type errors.
- [x] 2026-08-21 — Decide whether `executive_readonly` may read an individual workforce decision — resolved as "no" on branch `nightly/2026-08-21-improvements` (`fix(rbac): deny executive_readonly an individual workforce decision`). The same rule was applied to the team context graph on 2026-08-22; see below. **Both fixes are now merged to `main` (2026-08-22 backlog drain); the nightly branches have been deleted.**

## Checked, not applicable

- 2026-08-24 — `next@15.5.23` is still the newest release on the 15.5 line. `npm view next dist-tags` gives `backport: 15.5.23` and `npm view next versions` ends at 15.5.23, so the pre-announced 2026-08-26 security release (15.5.24 / 16.3.3, one CRITICAL) was **not yet published** as of this run and could not be applied. It remains an Open item, not a closed one.
- 2026-08-24 — ESLint 10 re-confirmed blocked, with the exact ranges: `npm view eslint-config-next@15.5.23 peerDependencies` returns `{ eslint: '^7.23.0 || ^8.0.0 || ^9.0.0' }`, which excludes 10.x. `eslint@latest` is 10.9.1 and `eslint-config-next@latest` (16.3.2) peers `eslint: '>=9.0.0'`, so the upgrade stays coupled to the Next 16 migration exactly as the design note says. `eslint` still publishes a `maintenance` tag at 9.39.5; the repo's 9.39.4 is one patch behind it.
- 2026-08-24 — Node 20 EOL is not applicable: `engines.node` is `>=22.12.0`. Verified further that the repo is clean on **Node v24.18.1** — `npm ci --include=dev` in 9s, typecheck clean, lint clean, 395 tests, `next build --turbopack` succeeds. Nothing in the toolchain objects to Node 24.
- 2026-08-24 — Hardcoded Claude model IDs, fourth pass. `git grep -nE 'claude-[0-9a-z-]+'` over `src/` and `scripts/` returns nothing. The only model string is `OPENAI_MODEL`, read from the environment in `src/lib/ai/config.ts` with a `'gpt-4o-mini'` default. Claude Opus 5 (shipped 2026-07-24) is irrelevant here: there is no Anthropic client in this repo.
- 2026-08-24 — `npm audit` unchanged for the third consecutive run: 4 moderate, all `esbuild <=0.24.2` (GHSA-67mh-4wv8-2f99) reached only through `@esbuild-kit/*` under the `drizzle-kit` devDependency. Dev-server-only advisory, not reachable from the built app, and the only offered remedy is a major downgrade to `drizzle-kit@0.18.1`. Still not worth it.
- 2026-08-24 — Committed secrets, fourth independent pass. `git ls-files | xargs grep -nE` for `sk-ant-`, `sk-…`, `ghp_`, `github_pat_`, `AKIA…`, `xoxb-`, `-----BEGIN`, `eyJ…` JWTs and credentialed `postgres://` returns only the two known localhost test fixtures. `.env.example` still ships empty values for every secret.
- 2026-08-24 — Real PII, fourth independent pass, scanned separately from secrets. Every email address in `data/`, `drizzle/` and `src/` is on `techforward.io` or `example.com` (17 distinct, all synthetic personas plus `a@b.com`-style placeholders). No SSN-shaped value anywhere. No fixture carries a `salary`, `compensation`, `dateOfBirth`, `ssn`, `nationalId`, `phone` or `address` field at all — a JSON key search for those returns nothing in `data/` or `drizzle/`.
- 2026-08-24 — Authorization spot-check of the write paths that take an id from the request: `/api/decisions/[id]/outcomes` (resolves the decision through `getWorkforceDecision(session, id)` before writing), `/api/agent-actions/[id]` (org-filters the row, then requires self/direct-manager/plan-scope/org-wide, and refuses a body `employeeId` that disagrees with the action's own target), `/api/recommendations/[id]/status` (org check then self/manager/HR), `/api/employee-skills/[id]/review` and `/api/hr/audit-logs/export` (gated on `canReadAuditLogs`, `Cache-Control: no-store`). No IDOR found; every one of them resolves the record against the session's organization before acting. The four unscoped helpers already tracked above are still reachable only from tests — re-verified with `git grep` that no route imports them.

- 2026-08-21 — Next.js May and July 2026 security releases — the 15.x fixed versions are 15.5.18 and 15.5.21; this repo pins **15.5.23**, which is ahead of both. Per-advisory reachability is already recorded in `SECURITY_AND_PRIVACY.md` §14.9, and the version reasoning in §14.8. Do not re-check unless the pin moves backwards.
- 2026-08-21 — Committed secrets — no Supabase `service_role` key, JWT, or Postgres connection string is committed. `.env*` is gitignored (`!.env.example`), and `.env.example` ships empty values only. The two `postgres://` strings in the tree are `drizzle.config.ts`'s localhost default and a test fixture.
- 2026-08-21 — Real PII in seed data — `drizzle/seed/seed-mock-data.ts` and `data/mock/` use synthetic personas at the fictional `techforward.io` domain (Alex Chen, Jordan Lee, Morgan Kim, Riley Nguyen, Sam Patel, `engineer1..7`). No SSNs, phone numbers, or real addresses.
- 2026-08-22 — Re-confirmed both scans above independently. Secrets: no `service_role`, JWT (`eyJhbGciOi…`), `sk-…` or credentialed `postgres://` string outside the two known localhost test fixtures. PII: the only email addresses anywhere in `data/`, `drizzle/` and `src/lib/mock/` are the twelve synthetic `@techforward.io` ones; no SSN, phone, salary, compensation or date-of-birth field exists in any fixture.
- 2026-08-22 — `next@15.5.23` — still ahead of the last published 15.5 security fix (15.5.21, July 2026). The 2026-08-26 release is tracked as an Open item above rather than here, because it _will_ apply once published.
- 2026-08-22 — `npm audit`: 4 moderate, all one chain — `esbuild <=0.24.2` (GHSA-67mh-4wv8-2f99) via `@esbuild-kit/*` under `drizzle-kit@0.31.10`. `drizzle-kit` is a devDependency and the advisory is a dev-server-only SSRF, so it is not reachable from the built app. The only offered remedy is `drizzle-kit@0.18.1`, a major downgrade of the migration tool. Not worth it; revisit when drizzle-kit drops `@esbuild-kit`.
- 2026-08-22 — `eslint 9.39.4`, `react 19.1.0`, `drizzle-orm 0.45.2`, `@supabase/supabase-js 2.112.3`, `zod 4.3.6`, `typescript 5.9.3` — no advisories against these exact pins.
- 2026-08-22 — `/api/team-scenarios/[id]` was checked against the same individual-PII rule applied to the decision and team-context detail reads, and is **correctly** left on `canReadOrganizationWorkforceData`. `TeamScenarioDetail` carries only `teamId`, `roleId` and `skillId`; it names no employee, so it is a genuine aggregate.
- 2026-08-22 — `/manager` and `/hr` page subtrees both already carry server-side `getSessionContext()` role gates in `layout.tsx`, so the unsigned active-role cookie read by `middleware.ts` is defence-in-depth only, as its comments claim. Verified, no gap. **(2026-08-23: still true for the subtree gates. The gap found this run was one level down — `/hr/audit` needed a _narrower_ gate than the subtree's, not a missing one. Fixed; see Closed.)**
- 2026-08-23 — Hardcoded Claude model IDs. `claude-opus-4-1-20250805` was retired from the Claude API on 2026-08-05, so a hardcoded reference would be broken today. There is none: `grep -rn "claude-\(opus\|sonnet\|haiku\)"` over the tree returns nothing. The only model string in the repo is `'mock-llm'` in `src/lib/ai/providers/mock-llm.ts`; the live provider is OpenAI and reads `OPENAI_MODEL` from the environment (`.env.example` defaults it to `gpt-4o-mini`). Nothing to pin or bump.
- 2026-08-23 — Committed secrets, third independent pass. `git ls-files | xargs grep -EI` for JWT (`eyJ…`), `sk-ant-…`, `sbp_…`, `AKIA…`, `ghp_…` and credentialed `postgres://` returns only the two known localhost test fixtures (`src/lib/auth/acting-ids.test.ts:32`, `src/services/data-provider/provider-fallback.test.ts:29`, both `postgres://user:pass@localhost:5432/growthos`). `.env.example` still ships empty values for all six secrets.
- 2026-08-23 — Real PII, third independent pass, scanned separately from secrets. Across `src/`, `data/` and `drizzle/` there are 17 distinct email addresses on exactly two fictional domains (`techforward.io`, `example.com`, plus one `a@b.com` placeholder). No SSN-shaped value (`\d{3}-\d{2}-\d{4}`) anywhere in the tree. The `salary` / `compensation` tokens that match a naive grep are all in prose — docs, prompt text, and the governance prohibited-pattern list that exists to _block_ those topics — not in any fixture field.
- 2026-08-23 — `npm audit` unchanged from 2026-08-22: the same 4 moderate findings, all `esbuild <=0.24.2` via `@esbuild-kit/*` under the `drizzle-kit` devDependency. Reasoning above still holds.
- 2026-08-23 — `npm outdated` triage against the exact-pin policy. `next`/`eslint-config-next` 16.3.2 and `eslint` 10.9.0 are the tracked Next 16 migration, not nightly work. `typescript` 7.0.2 and `@types/node` 26 are majors. `react`/`react-dom` 19.2.8, `zod` 4.4.3, `@supabase/ssr` 0.12.4, `@base-ui/react` 1.7.0, `shadcn` 4.19.0 and `lucide-react` 1.33.0 are all clean minors with no advisory against the pinned version, so bumping them buys nothing this run and would churn the lockfile ahead of the 2026-08-26 `next` bump that has to touch it anyway. Deferred to that run deliberately.

---

## Note for future runs — this repo builds and tests fine (2026-08-22)

A previous run concluded the repo was too large to build and degraded itself
to syntax-only checks. That conclusion was wrong, and the likely cause is an
environment quirk worth writing down.

**`NODE_ENV=production` in the shell makes `npm ci` skip `devDependencies`.**
Every verification tool in this repo — `vitest`, `typescript`, `eslint`,
`@eslint/eslintrc` — is a devDependency, so with that variable set the install
succeeds and then `npm run typecheck` reports dozens of bogus
`TS2307: Cannot find module 'vitest'` errors, `npm run lint` dies with
`Cannot find package '@eslint/eslintrc'`, and `npm test` fails with
`vitest: command not found`. None of those are repo problems.

Run installs with `NODE_ENV` unset (or `npm ci --include=dev`).

Measured on 2026-08-22, macOS, Node 22.14.0, with `npm_config_cache` on local
disk:

| Step                | Result                      |
| ------------------- | --------------------------- |
| `npm ci`            | 9s prod-only / 14s with dev |
| `npm run typecheck` | clean                       |
| `npm run lint`      | clean                       |
| `npm test`          | 377 tests, 60 files, ~1s    |
| `npm run build`     | succeeds                    |

Full V3 verification costs well under two minutes. There is no reason for a
nightly run to skip it.

Re-measured 2026-08-23 on the same machine, with `npm_config_cache=/tmp/npmcache`
and `NODE_ENV` unset: `npm ci` 5s, `npm run typecheck` clean, `npm run lint`
clean, `npm test` 386 tests / 62 files in 2.4s, `npm run build` 12.7s. The
table above still holds; only the test count has moved.

---

## Design note — RLS is not on the data path (2026-08-23)

Every RLS policy in `drizzle/migrations/0001_rls_rbac.sql` and
`0003_workforce_intelligence_rls.sql` is real, well-written, and currently
enforcing nothing, because no application query ever reaches Postgres over a
connection where those policies apply.

### The evidence, in four steps

1. **The policies key on `auth.uid()`.** `0001_rls_rbac.sql` defines
   `current_app_user_id()`, `current_user_organization_id()`,
   `current_user_employee_id()` and `current_user_has_role()` as
   `SECURITY DEFINER` functions that all resolve `auth.uid()`, and every policy
   is written in terms of them. `auth.uid()` reads the `request.jwt.claims`
   GUC, which only Supabase's PostgREST/`supabase-js` path sets.

2. **`supabase-js` is never used for data.** `grep -rn "supabase.from("` over
   `src/` returns nothing. `createSupabaseServerClient()` has exactly three
   callers — `api/auth/login`, `api/auth/logout` and
   `lib/auth/session-context.ts` — and all three use it only for
   `auth.signInWithPassword`, `auth.signOut` and `auth.getUser`.

3. **All data goes through Drizzle over `DATABASE_URL`.** `src/lib/db/index.ts`
   is `postgres(url, { max: 1 })` wrapped in `drizzle()`. That is a plain
   Postgres connection: no JWT, `auth.uid()` is `NULL`, and the connecting role
   for a Supabase `DATABASE_URL` is the table owner, which policies do not
   constrain in the first place.

4. **The store is loaded whole, for every tenant at once.**
   `loadSupabaseStore()` issues 32 unfiltered `db.select().from(table)` calls
   and caches the result in a module-level singleton (`store-runtime.ts`). One
   process therefore holds every organization's employees, skills, decisions,
   scenarios and action plans in memory simultaneously.

### What that means

Tenant isolation in this product is **entirely** the application-level
`organizationId === session.organizationId` comparisons in `src/services/*`.
There is no database backstop. Those comparisons are, as far as this run could
tell, correct and well tested — `workforce-decision-scoping`,
`team-scenario-read-scoping`, `agent-action-scoping`, `inferred-skill-scoping`
and `agent-access-scoping` all specifically pin cross-organization cases. The
problem is not that a check is missing today; it is that a single missed
comparison in one future service function is a cross-tenant data leak with
nothing underneath it to catch the mistake. The two already-tracked unscoped
helpers (`getBusinessPriorityContext` and friends, `getActionPlan`) are exactly
that shape, which is why they are worth more than their current
reachable-only-from-tests status suggests.

### The documentation is what makes this dangerous

`SECURITY_AND_PRIVACY.md` currently presents RLS as a live control:

- §Overview — "Defense in depth | Middleware + service layer + RLS (Phase 8)"
- Risk register — "IDOR on employee endpoints … Session scope checks; RLS"
- Risk register — "Cross-org data leak … organization_id on all queries; RLS"

Two of the three named mitigations for the highest-impact risk in an HR
product are not in effect. `src/lib/db/rls-migration.test.ts` and
`workforce-intelligence-rls-migration.test.ts` reinforce the belief by
asserting the policy SQL exists — which it does; it is simply never consulted.

### Proposed shape

There are two honest options and they are very different in cost.

1. **Make RLS real.** Connect Drizzle as a non-owner role and open every
   request in a transaction that sets the JWT claims
   (`SET LOCAL request.jwt.claims = …`) from the verified Supabase session, so
   `auth.uid()` resolves. This is the option that actually delivers the
   defence-in-depth the docs claim, and it is incompatible with the current
   load-everything-once store: the cache would have to become per-request or
   go away.

2. **Drop the claim and invest in the application layer.** Keep Drizzle as an
   owner connection, rewrite the three documentation lines above to say that
   tenant isolation is enforced in the service layer, and add a lint rule or a
   structural test asserting that every exported service function that reads
   `getMockStore()` takes an organization and filters on it. Cheaper, honest,
   and it makes the real invariant checkable.

Either way the documentation must stop describing RLS as an active control
while it is not one. Doing that correction alone, without a decision on 1 or 2,
would remove the false assurance but leave the gap — which is why this is one
backlog item and not a doc-only patch.

### Why this was not fixed in the 2026-08-23 run

Both options are architectural. Option 1 changes the database connection
model, the request lifecycle and the caching strategy at once. Option 2 is a
product/security decision about what guarantee GrowthOS is willing to make to
a pilot customer, which is not a nightly maintenance call. Nothing here is
reproducible as a failing test without a live Postgres, so this is recorded as
a finding with its evidence rather than patched.

---

## Design note — the app shell shows the demo persona in live mode (2026-08-22)

`getMockSession()` in `src/lib/auth/mock-session.ts` never consults
`shouldUseMockData()`. It checks the session cookie for `authenticated: true`
and then returns the module-level `DEFAULT_SESSION` constant, taking only
`activeRole` from the cookie.

### Reproduction

Mock `next/headers` so the `growthos-session` cookie holds a _live_ user
(`{"authenticated":true,"userId":"real-live-user-id"}`), set
`USE_MOCK_DATA=false` and a `DATABASE_URL`, then call `getMockSession()`:

```
LIVE-MODE getMockSession() => {
  "userId": "22222222-2222-4222-8222-222222222221",
  "email": "alex.chen@techforward.io",
  "fullName": "Alex Chen",
  "organizationId": "org-techforward",
  "organizationName": "TechForward Inc.",
  "roles": ["employee", "manager"],
  "activeRole": "employee",
  "onboardingCompleted": true
}
```

The caller's own `userId` is discarded and replaced by the demo employee's.

### What consumes it

Three server components: `src/app/(app)/layout.tsx` (feeds `AppShell` →
`TopBar`, rendering `fullName` and `organizationName`),
`src/app/(app)/settings/page.tsx` (renders "Signed in as: {fullName}
({email})" and "Organization: {organizationName}") and
`src/app/(app)/forbidden/page.tsx`. So in live mode every signed-in user is
told they are Alex Chen at TechForward Inc.

### Severity, stated honestly

This is **not** an authorization bypass and **not** a real-PII leak. The
identity disclosed is synthetic, and no authorization decision reads it:
`session-context.ts` takes only `activeRole` from this function on the live
path, and every data read goes through `getSessionContext()`, which is
Supabase-backed and returns `null` for a forged cookie. `/hr` and `/manager`
layouts gate on that real session, and employee pages fall through to an
empty state.

What it _is_: a correctness and trust defect in an HR product, where the user
cannot tell which account is active, and the same demo-fixture-leak class that
`test(auth): pin the acting-id resolvers against a demo-fixture leak` pinned
one layer down in `acting-ids.ts`. That commit's own docstring names the risk
— "if it ever leaked into live mode, a signed-in user would be grounded on the
demo organization's employee" — and `acting-ids.ts` was hardened while
`mock-session.ts`, its neighbour, was not.

### Why this was not fixed in the 2026-08-22 run

The fix is not a gate swap; it is new data plumbing. `SessionContext` carries
`userId`, `organizationId`, `employeeId` and `roles` but no `fullName`,
`email` or `organizationName`, so grounding the shell in the real session
means either widening `SessionContext` with a `users`/`organizations` join or
having each of the three pages fetch display identity itself. That touches the
shared session type, adds a query to every authenticated page render, and
changes what the settings page shows — a product-visible change that wants a
decision about what to display when a live user has no linked employee row.

### Proposed shape

1. Widen `getSupabaseBackedSessionContext()` to select `fullName`, `email` and
   the organization name it already joins for `organizationId`, and add them
   to `SessionContext` as optional fields.
2. Have `(app)/layout.tsx`, `settings/page.tsx` and `forbidden/page.tsx` read
   identity from `getSessionContext()`, falling back to the demo persona only
   when `shouldUseMockData()` is true.
3. Keep `getMockSession()` for the `activeRole` cookie read, and rename it to
   say so (`getActiveRoleCookie`) so no future caller mistakes it for an
   authenticated session.
4. Decide the empty-identity copy for a live user with no linked `users` row,
   rather than defaulting to a fixture.

---

## Design note — the governance filter has a normalization floor (2026-08-21)

`src/lib/governance/prohibited-patterns.ts` has now absorbed **five** rounds of
same-class fixes: inflected forms, termination euphemisms, layoff euphemisms,
plural/superlative punitive labels, ranking, and protected characteristics.
Each round added vocabulary. This note argues the next round must not.

### Reproduction

`findProhibitedMatches` matches raw regexes against `text.trim()` — the only
normalization applied. Feeding it the same prohibited sentences with the
letters left intact but the _bytes_ changed:

| Input                                                     | Blocked? |
| --------------------------------------------------------- | -------- |
| `We should terminate Alex.`                               | yes      |
| `We should ter<U+200B>minate Alex.` (zero-width space)    | **no**   |
| `We should ter<U+00AD>minate Alex.` (soft hyphen)         | **no**   |
| `We should ter-minate Alex.` (hyphen)                     | **no**   |
| `We should ｔｅｒｍｉｎａｔｅ Alex.` (fullwidth forms)    | **no**   |
| `We should t<U+0435>rminate Alex.` (Cyrillic е homoglyph) | **no**   |
| `Plan a lay<U+200D>off for the team.` (zero-width joiner) | **no**   |
| `Please stack rank the team.`                             | yes      |

Seven of twelve probes walked through. None of them is a vocabulary gap: every
one contains a term the filter already knows.

### Why another pattern cannot fix it

The bypasses are generated by transformations over the _encoding_, not the
wording, and the transformation space is unbounded — any of the ~10 zero-width
and formatting codepoints may be inserted at any of N positions, each of ~30
Latin letters has at least one confusable in Cyrillic/Greek/fullwidth/
mathematical-alphanumeric, and any letter pair admits a separator. A keyword
list is finite; the evasion space is not. Adding pattern #6 moves the boundary
by one input and leaves the class intact.

### Proposed shape

Normalize before matching, and keep the existing patterns as the vocabulary
layer over a canonical string:

1. `String.normalize('NFKC')` — folds fullwidth, ligature and
   mathematical-alphanumeric forms onto ASCII.
2. Strip the default-ignorable codepoints (`\p{Cf}`, plus U+00AD soft hyphen)
   that carry no glyph and exist only to be invisible.
3. Fold confusable scripts to Latin for the Latin-lookalike ranges (Cyrillic
   а-е-о-р-с-х, Greek ο-ν-ρ, etc.) — a small static table, not full UTS #39.
4. Collapse runs of separators and intra-word punctuation before matching, so
   `ter-minate` and `ter minate` canonicalize alongside `terminate`.

Match the existing `PROHIBITED_PATTERNS` against the canonical form, but keep
reporting offsets and matched text from the original so audit entries stay
faithful to what the user actually typed.

### Residual risk this does _not_ close

Normalization raises the floor; it does not make the filter sound. Semantic
paraphrase ("help me plan Alex's last day", "draft the transition note for
someone who won't be here in Q3") contains no listed term in any encoding and
will still pass. If the product needs a real guarantee rather than a speed
bump, the block decision belongs with a classifier over the model's own
output, with the regex list demoted to a fast pre-filter. That is a product
decision about latency and cost, which is why this is a backlog item and not a
patch.

**Why this was not fixed in the 2026-08-21 run:** the change alters what the
filter blocks for every input, so it is a behavioral change to a safety
control that needs an eval pass against `src/evals` for false positives — the
product's own vocabulary ("exit criteria", "separation of concerns", "race
condition", "redundancy") is exactly the kind of text aggressive
canonicalization starts catching.

---

## Design note — ESLint 9 is EOL but 10 is blocked (2026-08-21)

ESLint 9.x reached end of life on **2026-08-06**; only the 10.x line is
supported. This repo pins `eslint@9.39.4`.

**The bump is not available in isolation.** `eslint-config-next@15.5.23`
declares `peerDependencies.eslint: "^7.23.0 || ^8.0.0 || ^9.0.0"`, and
`eslint-plugin-import@2.32.0` (a transitive dependency of that config) caps at
`^9` as well. Verified empirically:

```
$ npm install --dry-run --strict-peer-deps eslint@10.9.0
npm error Conflicting peer dependency: eslint@9.39.5
npm error   peer eslint@"^2 || ... || ^9" from eslint-plugin-import@2.32.0
npm error     eslint-plugin-import@"^2.31.0" from eslint-config-next@15.5.23
```

Without `--strict-peer-deps` npm resolves it, but only by printing
`ERESOLVE overriding peer dependency` — an unsupported configuration.

`eslint-config-next@16.3.2` peers `eslint: ">=9.0.0"` and would accept 10.x, so
**the ESLint 10 upgrade is a sub-task of the Next 16 migration** already
tracked in `SECURITY_AND_PRIVACY.md` §16.7, not an independent dependency bump.

**Interim note:** npm still publishes a `maintenance` dist-tag for the 9 line
(`9.39.5` as of 2026-08-21), so the pinned 9.39.4 is one patch behind the last
maintained release. That patch is available today if a stopgap is wanted; it
does not change the EOL position.
