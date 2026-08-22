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
- [ ] 2026-08-22 — `getBusinessPriorityContext`, `findPeopleForBusinessPriority`, `findSkillsAtRiskForTeam` and `explainRelationship` take no `organizationId` and apply no tenant filter, unlike their `getEmployeeContextGraph` / `getTeamContextGraph` siblings. Currently reachable only from tests, so this is a latent trap for the first route that calls them, not a live leak.

## Closed

- [x] 2026-08-22 — Raise the `engines.node` floor off Node 20 — done in `chore(engines): raise the Node floor off end-of-life Node 20`, **on the unmerged branch `nightly/2026-08-22-improvements`**. Floor is now `>=22.12.0` (Node 22 Maintenance LTS) with `@types/node@22.20.1`. Verified at V3; the `@types/node` major bump produced no new type errors.
- [x] 2026-08-21 — Decide whether `executive_readonly` may read an individual workforce decision — resolved as "no" on branch `nightly/2026-08-21-improvements` (`fix(rbac): deny executive_readonly an individual workforce decision`). The same rule was applied to the team context graph on 2026-08-22; see below. **Both fixes are still unmerged on their nightly branches.**

## Checked, not applicable

- 2026-08-21 — Next.js May and July 2026 security releases — the 15.x fixed versions are 15.5.18 and 15.5.21; this repo pins **15.5.23**, which is ahead of both. Per-advisory reachability is already recorded in `SECURITY_AND_PRIVACY.md` §14.9, and the version reasoning in §14.8. Do not re-check unless the pin moves backwards.
- 2026-08-21 — Committed secrets — no Supabase `service_role` key, JWT, or Postgres connection string is committed. `.env*` is gitignored (`!.env.example`), and `.env.example` ships empty values only. The two `postgres://` strings in the tree are `drizzle.config.ts`'s localhost default and a test fixture.
- 2026-08-21 — Real PII in seed data — `drizzle/seed/seed-mock-data.ts` and `data/mock/` use synthetic personas at the fictional `techforward.io` domain (Alex Chen, Jordan Lee, Morgan Kim, Riley Nguyen, Sam Patel, `engineer1..7`). No SSNs, phone numbers, or real addresses.
- 2026-08-22 — Re-confirmed both scans above independently. Secrets: no `service_role`, JWT (`eyJhbGciOi…`), `sk-…` or credentialed `postgres://` string outside the two known localhost test fixtures. PII: the only email addresses anywhere in `data/`, `drizzle/` and `src/lib/mock/` are the twelve synthetic `@techforward.io` ones; no SSN, phone, salary, compensation or date-of-birth field exists in any fixture.
- 2026-08-22 — `next@15.5.23` — still ahead of the last published 15.5 security fix (15.5.21, July 2026). The 2026-08-26 release is tracked as an Open item above rather than here, because it _will_ apply once published.
- 2026-08-22 — `npm audit`: 4 moderate, all one chain — `esbuild <=0.24.2` (GHSA-67mh-4wv8-2f99) via `@esbuild-kit/*` under `drizzle-kit@0.31.10`. `drizzle-kit` is a devDependency and the advisory is a dev-server-only SSRF, so it is not reachable from the built app. The only offered remedy is `drizzle-kit@0.18.1`, a major downgrade of the migration tool. Not worth it; revisit when drizzle-kit drops `@esbuild-kit`.
- 2026-08-22 — `eslint 9.39.4`, `react 19.1.0`, `drizzle-orm 0.45.2`, `@supabase/supabase-js 2.112.3`, `zod 4.3.6`, `typescript 5.9.3` — no advisories against these exact pins.
- 2026-08-22 — `/api/team-scenarios/[id]` was checked against the same individual-PII rule applied to the decision and team-context detail reads, and is **correctly** left on `canReadOrganizationWorkforceData`. `TeamScenarioDetail` carries only `teamId`, `roleId` and `skillId`; it names no employee, so it is a genuine aggregate.
- 2026-08-22 — `/manager` and `/hr` page subtrees both already carry server-side `getSessionContext()` role gates in `layout.tsx`, so the unsigned active-role cookie read by `middleware.ts` is defence-in-depth only, as its comments claim. Verified, no gap.

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
