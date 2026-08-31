# Nightly backlog

Initiatives found by the scheduled maintenance runs that are too large, too
risky, or too product-dependent to land inside a single nightly window. Runs
read this file first to avoid re-proposing work that is already tracked here.

## Open

- [ ] 2026-08-31 — **Drain `nightly/2026-08-31-improvements`.** One commit, `fix(opportunities): stop a draft requisition publishing itself to employees` (`5a80172`), verified at V3 (471 tests / 72 files, build exit 0). Tier B because it changes what a live Postgres deployment shows employees. This is the fifth consecutive branch needing a following-run drain; `git ls-remote --heads origin 'nightly/*'` stays step one.
- [ ] 2026-08-31 — **`toDateOnly` truncates a `timestamptz` in UTC, so `hire_date` is off by a day for anyone hired east of UTC.** `db-mappers.ts:27` is `value.toISOString().slice(0, 10)`, and every column it reads — `employees.hire_date`, `growth_plans.start_date`/`target_date`, `growth_plan_items.due_date` — is declared `timestamp(..., { withTimezone: true })` in `src/lib/db/schema/tables.ts`. `hire_date` is semantically a calendar date, so local midnight at any offset east of UTC lands on the previous UTC day: `2024-03-15T00:00:00+10:00` reads back as `'2024-03-14'`, and any tenure or accrual computed from the field is a day long for that whole cohort. The same column written late in the day west of UTC rolls forward instead. Pinned as characterization in `db-mappers-dates.test.ts` (`test(db-mappers): pin UTC date truncation…`, `e535013`) rather than fixed, because the fix requires deciding *whose* calendar day is authoritative — the employer's, the employee's, or UTC — which is a product decision, and the durable repair is a real `date` column rather than a `timestamptz` used as one. **Do not "fix" this by picking a timezone in the mapper.**
- [ ] 2026-08-31 — **`toIso` and `mapGrowthPlan` disagree about what an unknown date looks like.** `toIso(null)` returns `new Date(0).toISOString()` — a row missing its timestamps is dated 1970 and sorts first in every "most recent" list — while `mapGrowthPlan`'s third-position fallback answers the same question with a hard-coded `'2026-01-01'` (`db-mappers.ts:381`). Both are pinned in `db-mappers-dates.test.ts`. Small, but they should agree, and neither should be a silent sentinel.
- [ ] 2026-08-31 — **`clampActiveRoleToHeldRoles` demotes an `executive_readonly` session to the employee view for every requested role**, so the aggregate dashboards that role exists for are not reachable from its own navigation. `session-context.ts:18` admits `hr` only for `hr_admin`/`org_admin` and `manager` only for `manager`/`hr_admin`/`org_admin`; `executive_readonly` matches neither and falls through to `employee`. Meanwhile `canReadOrganizationWorkforceData` *does* grant that role the org-wide aggregates, and `getNavForRole` has no executive case at all. The role can therefore only reach what it is entitled to by calling the API directly. Fail-secure, so not urgent, but it means the four per-route `executive_readonly` fixes below were all defending a surface the role cannot navigate to. Pinned in `src/lib/auth/demo-role-mapping.test.ts`. Decide whether the role gets a view or is API-only, and write that down.
- [ ] 2026-08-30 — **`mapGrowthPlanItem` invents `milestoneDay` from `sortOrder`, so the Supabase path renders a different 30/60/90 timeline than the JSON path for identical data.** `growth_plan_items` has **no `milestone_day` column** (`src/lib/db/schema/tables.ts`), so `db-mappers.ts:388` derives it: `sortOrder <= 0 -> 30`, `=== 1 -> 60`, else `90`. But `milestoneDay` and `sortOrder` are independent fields in `src/schemas/entities.ts`, and the seed generator (`scripts/generate-mock-json.mjs:233-248`) sets them independently — it assigns `sortOrder: i` while writing the true `milestoneDay`. For the one seeded plan (`5555…5551`) the derivation is wrong on **4 of 5 items**: Day-30 loses one item, Day-60 loses one, Day-90 gains two, as bucketed by `GrowthPlanTimeline.tsx:29`. **This is not fixable in the mapper**, which is why it is an Open item and not a commit: the information genuinely is not in the table. It wants either a `milestone_day` column (a migration) or a derivation from `dueDate` minus the parent plan's `startDate`, which means threading the plan into the item mapper. A derivation that can produce at most one 30-day and one 60-day item per plan cannot be right whatever is chosen.
- [ ] 2026-08-30 — **Applying an agent action to a growth plan is never written to Postgres, and the next cache clear destroys it.** `applyActionToGrowthPlan` (`agent-action-service.ts`) pushes the new item into `getMockStore()` only; there is **no `db.insert(growthPlanItems)` anywhere in `src`** (`supabase-writes.ts` exposes only `updateGrowthPlanItemProgress`, an UPDATE). In Supabase mode `getMockStore()` *is* the cached store, and the PATCH route calls `updateAgentProposedActionInDb` two statements later, whose success path calls `clearSupabaseStoreCache()` — discarding the item. `action.status = 'applied'` **is** persisted, so the route's 409 already-applied guard then makes the apply unrepeatable. Silent, unrecoverable loss on the live path. Contrast the sibling write, which is correct: `decisions/[id]/outcomes/route.ts` calls `persistDecisionOutcome` before returning. Not fixed here because adding the insert is a new persistence path, not a surgical edit. The draft-plan fix landed this run is a *different* defect in the same function and does not address this one.
- [ ] 2026-08-30 — **`pickDbOrFixture` falls back per table, so a live store can be half real and half mock.** `supabase-store-loader.ts:77` is `dbRows.length > 0 ? dbRows : fixtureRows`, applied independently to each of ~15 workforce-intelligence tables (lines 199-216). The parent/child pairs break: with `workforce_decisions` seeded but `decision_outcomes` still empty — the ordinary state before anyone records an outcome — the loader substitutes `data/mock/decision-outcomes.json`, whose rows carry the same org and decision ids. `compareExpectedToActual` then reports a fabricated comparison for a decision with no recorded outcome, and the first real POST makes those two rows vanish, so the history visibly rewrites itself. The catch block at the foot of the file comments "falling back to mock data", which suggests an **all-or-nothing** fallback was intended; per-table is a plausible but unsound implementation of that. Confirm the intent before changing it — if the demo fallback is deliberate it should at least be all-or-nothing, or gated off whenever `shouldPersistWrites()` is true.

- [ ] 2026-08-21 — Replace regex-only governance filtering with a normalize-then-match pipeline — the filter is bypassed by Unicode tricks that no additional keyword pattern can catch; see "Design note" below. **(2026-08-22: still open. This run deliberately did not touch `prohibited-patterns.ts` and added no pattern #6 — the design note's argument stands and the next same-class regex is the wrong move. Anyone picking this up should implement the normalize-then-match pipeline, not another keyword.)**
- [ ] 2026-08-21 — ESLint 9 → 10 is blocked by `eslint-config-next@15.5.23` — the 9.x line is EOL (2026-08-06) but the upgrade is coupled to the Next 16 migration; see "Design note" below.
- [ ] 2026-08-22 — Ground the app shell's displayed identity in the real session — in live mode `getMockSession()` returns the hard-coded demo persona to every signed-in user; see "Design note" below.
- [ ] 2026-08-26 — The `executive_readonly` aggregate-only rule is enforced route by route, and has now been got wrong on four routes. `/api/organizational-learning` is the fourth; see "Design note" below. **Do not fix it by narrowing that one route.** A fifth ad-hoc gate is evidence the per-route approach has a floor, not an invitation to add one.
- [ ] 2026-08-22 — Decide whether the org-wide _list_ endpoints should narrow for `executive_readonly` — `GET /api/decisions` and `GET /api/agent-actions` return `ownerEmployeeId` / `targetEmployeeId`, which are employee UUIDs rather than names. Unlike the detail reads already fixed, these are the role's documented aggregate surface, so narrowing them is a product call, not a bug.
- [ ] 2026-08-24 — The demo manager persona manages no team, so every manager-scoped _detail_ page is a 404 in mock mode. `getMockSession()` returns `DEFAULT_SESSION` (Alex Chen, employee `…331`) whatever userId the session cookie carries, and no row in `data/mock/teams.json` names `…331` as `managerEmployeeId` — Platform Engineering is managed by `…332`, Product Engineering by `…334`. `filterScenariosForSession` and its decision-side equivalent therefore return an empty set for the demo manager, so `/manager/decisions/[id]` and `/manager/team-scenarios/[id]` cannot render a record for any id (confirmed against `next dev`: both 404 under the `manager` role cookie, both 200 under `hr`). The scoping code is correct; the demo _data_ does not exercise it. Fixing it is a fixture decision — either make `…331` a manager of a team, or point the demo manager session at `…334` — and it overlaps the `getMockSession()` item above, so it should be settled alongside it rather than separately.
- [ ] 2026-08-24 — This repository has no CI. There is no `.github/` directory at all, so nothing runs `typecheck`, `lint`, `test` or `build` on push or pull request; every guarantee in this file rests on a nightly run happening to look. A ready-to-apply workflow was generated and verified with `git apply --check` on 2026-08-24 but could not be pushed: the nightly token is a fine-grained PAT without the `workflow` scope, so any push touching `.github/workflows/` is rejected by GitHub. Someone with workflow permission needs to land it. The patch adds a single `verify` job on Node 22.12.0 running `npm ci --include=dev` (the `--include=dev` is load-bearing; see the environment note below) then typecheck, lint, test and build with `USE_MOCK_DATA=true`.
- [ ] 2026-08-23 — Postgres row-level security is not on the application's data path at all. Every read and write goes through Drizzle over `DATABASE_URL`, while the RLS policies are keyed on `auth.uid()`; see "Design note" below. Tenant isolation is therefore entirely application-level, and the docs currently describe RLS as a live control.
- [ ] 2026-08-25 — `npm run format:check` fails on **138 files** on a pristine `main` — the repository is broadly out of sync with its own Prettier config. This is not a nightly-run fix: `prettier --write .` would rewrite most of the tree and drown every subsequent review diff in formatting churn. It wants one deliberate reformat commit landed on its own, ideally together with the CI workflow above so it stays true. Until then, runs that touch a file must avoid running Prettier across it, because doing so silently mixes unrelated reformatting into a behaviour change (this run hit that twice and reverted it both times).

## Closed

- [x] 2026-08-30 → 2026-08-31 — **The 2026-08-30 branch was drained into `main`.** `nightly/2026-08-30-improvements` carried one commit, `fix(agent-actions): stop applying actions into a draft growth plan` (`5b9450d`), merged as `51bd2dd` and re-verified at V3 on the merge result before pushing (417 tests / 68 files, `npm run build` exit 0). Fifth consecutive night on which the first useful act was draining the previous night's branch.

- [x] 2026-08-31 — **`db-mappers.ts` had no tests at all.** 519 lines translating the Postgres enums onto the narrower application enums in `src/schemas/enums.ts`, with zero coverage and no nightly commit ever touching the file. Added two characterization suites — `db-mappers-enum-narrowing.test.ts` (`6ed8e01`) and `db-mappers-dates.test.ts` (`e535013`), 33 tests — pinning the lossy collapses (`nice_to_have -> preferred`, `paused`/`cancelled -> archived`, `certification -> course`, `skipped -> pending`, `milestone -> conversation`) and the date handling. Two of the Open items above were found by writing them.

- [x] 2026-08-31 — **A draft opportunity published itself to employees on the Postgres path.** `normalizeOpportunityStatus` collapsed the Postgres-only `draft` status onto `open`, which is the only status any reader selects on, and `loadSupabaseStore` reads `opportunities` without a status predicate — so every unpublished requisition appeared as an open internal opening in `suggestedOpportunities`, the mobility-insights and talent-density rollups, and the agent's opportunity grounding. The JSON path could not produce it (`opportunityStatusSchema` has no `draft`), so the two providers disagreed for identical data. Fixed on `nightly/2026-08-31-improvements` by mapping `draft -> closed`, the one survivor no reader selects on; nothing in `src` reads `closed` or `filled`. Regression test confirmed failing against the pre-fix mapper.

- [x] 2026-08-28 → 2026-08-29 — **The 2026-08-28 multitenancy branch was drained into `main` and deleted.** `nightly/2026-08-28-improvements` carried both catalogue-scoping commits (`f746839`, `93df917`) and was still unmerged at the start of this run, so `main` was shipping the ten cross-tenant catalogue reads that branch fixed. Landed as `merge(nightly): land the 2026-08-28 multitenancy catalogue scoping` and the branch deleted; `git ls-remote --heads origin 'nightly/*'` is now empty. Re-verified on the merge result rather than trusting the branch's numbers: `npm ci --include=dev` 8.3s, typecheck clean, lint clean, **415 tests / 67 files** (up from 407/65 on pristine `main`), `next build --turbopack` exit 0. **This is the third consecutive night a branch has been found stranded**, which is now three for three — the "check `git ls-remote` first" rule is doing its job and should stay the first step.

- [x] 2026-08-29 — **The nightly org-scoping sweep is now automated instead of re-done by hand each night.** Added `src/services/aggregate-org-scoping.test.ts` in `test(multitenancy): sweep every org-scoped aggregate for foreign-tenant rows`. The existing suites are per-function — one seeded row, one named read — so they only cover reads someone wrote a case for, which is exactly why the ten reads fixed on 2026-08-28 survived seven nights of review. The new test is data-driven: it clones the first row of **every** store table carrying an `organizationId`, restamps it onto a foreign organization, marks its free text, unshifts it (front-seeded on purpose — `loadSupabaseStore()` has no `ORDER BY` and several reads end in `.slice(0, n)`), then serialises all eleven organization-scoped aggregates and asserts neither the marker nor any seeded id appears. Verified red under two independent mutations of shipped source and green on unmodified source. Child tables (`growthPlanItems`, `recommendationEvidence`, `roleSkills`) are deliberately not seeded — they carry no `organizationId` and join to their parent by uuid, so a foreign row there is not a boundary crossing. **A future run should extend this list rather than hand-probing the same ground again.**

- [x] 2026-08-28 — **Seven catalogue reads collected every tenant's rows, because their predicate was a *status* rather than an *id*.** Fixed on branch `nightly/2026-08-28-improvements` by `fix(multitenancy): bound the role, opportunity and learning catalogs by organization`. The store holds all tenants at once (`loadSupabaseStore()` issues one unfiltered `select` per table into a module-level singleton — see the RLS design note), so `data.roles.filter(r => r.isActive)`, `opportunities.filter(o => o.status === 'open')`, `opportunities.filter(o => o.department === 'Engineering')` and a `learningResources` skill-id set membership all cross the tenant boundary. The affected reads were `getCareerPaths` (candidate roles, `suggestedLearning`, `suggestedOpportunities`), `buildStretchOpportunitiesForEmployee`, `getManagerDashboard`'s `stretchOpportunities`, and `agent-service`'s `buildInternalMobilityRecommendations` / `buildDynamicLearningRecommendations`. Every *neighbouring* read in `mock-provider.ts` (lines 398, 637, 823) already carried the organization term; these did not. Reproduced by unshifting one foreign-organization role, opportunity and learning resource onto the store — a legitimate ordering, since the loader has no `ORDER BY` and each read ends in a `.slice(0, n)`: `getCareerPaths` returned `["FOREIGN Chief Restructuring Officer", …]`, `suggestedOpportunities` and `getManagerDashboard` both returned the foreign opening, and `invokeAgent('internal-mobility')` returned it as a recommendation — which `createAgentRecommendations` then **persists as a row against the caller's own employee record**. All empty of foreign rows after the fix. The organization is taken from data already in hand at each site (the employee row `getCareerPaths` fetches, the manager row `getManagerDashboard` fetches, the session on the agent path), so no exported signature changed. Six tests in `career-path-org-scoping.test.ts`; five are red against the pre-fix source.

- [x] 2026-08-28 — **`getSkills()` with no argument silently resolves to the first tenant in the store.** Fixed on the same branch by `fix(multitenancy): name the organization on the three skill-catalogue reads`. The fallback is `getOrganization()`, which is `organizations[0]`; in single-tenant mock mode that is always the demo organization, so it is invisible, but against the Supabase-backed store it is whichever tenant the unordered `select` returned first. Three call sites relied on it — `getTeamSkillsMatrix` and the two employee pages that build a `skillById` map. Reproduced by unshifting one foreign organization onto `store.organizations`: `getSkills()` then returns **0** rows for the demo caller and `/manager/team-skills` renders every direct report's skill as `"Unknown skill"` (five of five). This one is a correctness defect rather than a leak — the map is keyed by skill id, so a foreign catalogue produces blanks, not another tenant's data — but it is the same missing-organization-term class. Each site now passes the organization it already holds; the optional parameter and its fallback are kept (other callers pass it explicitly) with a docstring naming the trap. Two tests; the matrix case is red against the pre-fix source.

- [x] 2026-08-26 → 2026-08-27 — **The 2026-08-26 `next` 15.5.24 security bump was never drained; `main` was still shipping 15.5.23.** The branch `nightly/2026-08-26-improvements` carried exactly one commit (`07e62ee`) and was left unmerged, so the August 2026 maintenance release existed only on a branch. Landed on `main` as `merge(nightly): land the 2026-08-26 next 15.5.24 security bump` and the branch deleted. Re-verified independently on the merge result before pushing, not trusting the prior run's numbers: `npm ci --include=dev` 7.9s, `tsc --noEmit` clean, `eslint` clean, **407 tests / 65 files**, `next build --turbopack` exit 0 in 10.5s, and `npm ls next sharp` confirming `next@15.5.24 -> sharp@0.35.3`. The identical suite was run on pristine `main` first (`15.5.23`, 407 tests, build exit 0) so the two are comparable: the bump changes nothing observable. **This is the second time a nightly branch has been left stranded** (the 2026-08-25 entry below records the first). The lesson is not "remember to merge" — it is that a run which pushes a branch has no way to land it, so the *next* run must check `git ls-remote --heads origin 'nightly/*'` before doing anything else and drain what it finds. That check is now the first step in the workflow.

- [x] 2026-08-22 → 2026-08-26 — Apply the pre-announced Next.js security release. It published on **2026-08-25** (15.5.24 on the maintenance line, 16.3.3 on Active LTS) with two criticals. Done on branch `nightly/2026-08-26-improvements` by `chore(deps): bump next to 15.5.24 for the August 2026 security release`; `eslint-config-next` moved with it to keep the pair in lockstep. Confirmed before acting that `npm view next dist-tags` gives `backport: 15.5.24` / `latest: 16.3.3` and that the lockfile pinned 15.5.23. Verified at V3 on the bumped tree: typecheck clean, lint clean, 407 tests / 65 files, `next build --turbopack` exit 0. Exposure to both criticals is recorded under "Checked, not applicable" rather than here, because the answer to both was "not exposed" and that reasoning is what a future run needs.
- [x] 2026-08-25 → 2026-08-26 — Both unmerged nightly branches have been drained into `main` and deleted. `git ls-remote --heads origin` now returns `refs/heads/main` only, and the content is verifiably on `main`, not just the merge messages: `git show origin/main:src/app/(app)/hr/audit/layout.tsx` returns the `canReadAuditLogs` guard, and `origin/main:src/services/context-graph-service.ts` carries the `organizationId` parameter and the edge-level organization join. The two merge commits are `3cc390d` (2026-08-23 RBAC guard) and `7274b47` (2026-08-25 org-scoping fixes). The drain lag this item complained about was real but is now cleared.

- [x] 2026-08-22 → 2026-08-25 — The unscoped context-graph and action-plan reads — fixed on branch `nightly/2026-08-25-improvements` by three commits. `getBusinessPriorityContext`, `findPeopleForBusinessPriority`, `findSkillsAtRiskForTeam`, `explainRelationship` and `getActionPlan` now all take an optional `organizationId` and conceal cross-organization rows, matching the `getEmployeeContextGraph` / `getTeamContextGraph` convention. Probed before the fix: `getBusinessPriorityContext(foreign) => GRAPH RETURNED`, `findSkillsAtRiskForTeam(foreign) => length 1`, `explainRelationship(foreign) => EXPLANATION RETURNED`; all three return empty afterwards. Six new tests, all red against the pre-fix source. The parameter is optional, so the existing (test-only) call sites are unchanged. **Every exported read in both files now accepts and honours an organization**, which is what makes this a closed class rather than another instance.
- [x] 2026-08-25 → 2026-08-25 — A third, deeper instance found and fixed in the same run: `edgesForEntity` in `context-graph-service.ts` matched only on entity type and id, so a graph scoped to one organization still collected edges belonging to **any** organization that referenced the same identifier — carrying that edge's `label` and `explanation` free text and adding its target as a graph node. The center-row check added in `fix(security): scope context-graph reads to the caller's organization` guards who the graph is _about_, not what it _contains_. `agent-action-service.ts` already defends the identical shape one service over (`agent-action-scoping.test.ts` pins that a foreign action row recorded against the same plan id never reaches a plan detail); the graph reader had no equivalent join. Reproduced by pushing a foreign-organization edge whose `sourceEntityId` is the demo employee's id: `foreign edge visible in scoped graph => true` before, `false` after. Fixed by `fix(context-graph): join graph edges on organization, not just entity id`.

- [x] 2026-08-23 → 2026-08-24 — Page and layout route guards could not be tested in this harness — fixed on `main` by `test(rbac): make .tsx route gates testable and pin the two subtree gates`. `vitest.config.ts` now collects `src/**/*.test.{ts,tsx}` and overrides the JSX transform for Vitest only via Vite 8's `oxc.jsx` (`{ runtime: 'automatic' }`). The `esbuild.jsx` / `esbuild.tsconfigRaw` route suggested in the original note does **not** work here: Vitest 4.1.11 bundles Vite 8.2.1, which transforms with Oxc rather than esbuild, so the `esbuild` key is ignored and the JSX still reaches import analysis. No React plugin and no new dependency were needed — the tests call the async server components directly and assert on the redirect. `(app)/hr/layout.tsx` and `(app)/manager/layout.tsx` now have nine cases between them; swapping the manager gate to the HR predicate turns two of them red. `tsconfig.json` was left alone, so `next build` and `tsc --noEmit` are unaffected.
- [x] 2026-08-24 → 2026-08-24 — `npm run smoke` exited 1 on a pristine checkout — fixed on `main` by `test(smoke): stop the smoke script failing on its own fixtures`. Three routes failed for reasons in the script: `/hr/work-design/[id]` was passed a _team scenario_ id (`aaaa…aaa1`) although the page reads `getRoleEvolutionScenario`, whose only fixture is `bbbb…bbb1`; and the two manager detail routes were asserted as successes when their 404 is correct team scoping (see the new Open item above). Route entries may now be `[path, expectedStatus]`, so the denials are asserted rather than deleted. The script now exits 0 against `next dev`.

- [x] 2026-08-23 — `/hr/audit` had no route guard of its own — fixed on branch `nightly/2026-08-23-improvements` by `fix(rbac): gate the HR audit page on the audit-read permission`, which adds `(app)/hr/audit/layout.tsx` gating on `canReadAuditLogs` instead of inheriting the HR subtree's `canReadOrganizationWorkforceData`. `executive_readonly` could previously open the page (the API still answered 403, so no data leaked) and see only a failed fetch. Five tests in `layout.test.ts` pin it; the `executive_readonly` case goes red if the predicate is swapped back.
- [x] 2026-08-22 — Raise the `engines.node` floor off Node 20 — done in `chore(engines): raise the Node floor off end-of-life Node 20`, **merged to `main` on 2026-08-22**. Floor is now `>=22.12.0` (Node 22 Maintenance LTS) with `@types/node@22.20.1`. Verified at V3; the `@types/node` major bump produced no new type errors.
- [x] 2026-08-21 — Decide whether `executive_readonly` may read an individual workforce decision — resolved as "no" on branch `nightly/2026-08-21-improvements` (`fix(rbac): deny executive_readonly an individual workforce decision`). The same rule was applied to the team context graph on 2026-08-22; see below. **Both fixes are now merged to `main` (2026-08-22 backlog drain); the nightly branches have been deleted.**

## Checked, not applicable

- 2026-08-31 — **Committed secrets, tenth pass, and real PII, eighth pass — both clean.** Run before any other work, over `git ls-files` rather than the working tree so ignored artefacts could not mask a tracked one, with `package-lock.json` excluded (it is the only reason earlier passes needed `cut`). Regexes: valued `SUPABASE_SERVICE_ROLE_KEY`, `eyJ[A-Za-z0-9_-]{25,}` JWTs, `sk-`, `ghp_`, `github_pat_`, `AKIA[0-9A-Z]{16}`, `-----BEGIN`. Every hit was this file describing a previous pass; `.env.example` carries names with empty values and is the only tracked `.env*`. PII: no SSN-shaped string, `dateOfBirth`, `dob`, `salary`, `compensation` or `homeAddress` field anywhere in `data/`, and every fixture identity is a synthetic `@techforward.io` persona. `compensation` appears only in the governance *prohibition* vocabulary in `docs/` and the eval suite, which is the opposite of a leak. **Do not re-derive this from scratch next run** — re-run the same two greps and record the result.
- 2026-08-31 — **`NEXT_PUBLIC_` inlining re-checked against the whole client bundle surface, not just the two known reads.** The failure mode worth guarding is a build-time tool inlining a server secret into browser JavaScript. Here `process.env` appears in exactly two places under a `'use client'` module boundary: none. Across all of `src`, the only `NEXT_PUBLIC_` references are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `src/lib/supabase/env.ts`, both public by design (the anon key is a published Supabase credential; the service-role key is read nowhere in `src` at all). Next inlines only the `NEXT_PUBLIC_` prefix, so there is no `.env`-file inlining path equivalent to Vite's `VITE_*`. Nothing to fix.
- 2026-08-31 — **The governance filter was not touched and no pattern was added.** `prohibited-patterns.ts` now carries **twelve** pattern commits across its history (`git log --oneline -- src/lib/governance/prohibited-patterns.ts`), which is well past the point where another keyword is evidence of a structural problem rather than a fix for one. The normalize-then-match design note stands as the open item. This run read the file only to confirm it had not regressed and added nothing.

- 2026-08-30 — **No dependency work tonight, confirmed rather than assumed.** Per the standing instruction not to re-research these: `next` resolves to **15.5.24** in both `package.json` and the lockfile, i.e. the patched Maintenance LTS for GHSA-2xp9-vwfh-vxw4 and CVE-2026-75604 — already current, nothing to do, do not re-investigate. `engines.node` is `>=22.12.0`, so Node 20 EOL (2026-04-30) does not apply; the suite ran on **Node v24.18.1**. `eslint 9.39.4` is the current major on flat config. No pin-specific advisories against `drizzle-orm 0.45.2`, `@supabase/supabase-js 2.112.3`, `zod 4.3.6` or `vitest 4.1.11`. `npm audit` is unchanged for the sixth consecutive run: 0 on a production install, 4 moderate with devDependencies, all `esbuild <=0.24.2` via `@esbuild-kit/*` under `drizzle-kit` — dev-only, and npm's "fix" is a **downgrade to drizzle-kit@0.18.1**, which is why it stays un-overridden. The review time went to correctness instead.

- 2026-08-29 — **A whole-store cross-tenant probe over nineteen reads found no live leak.** Rather than read code on the "predicate is not an id" axis for a second night, this run built a throwaway probe that clones the first row of **every** table in the store, restamps it onto a foreign organization, marks its free text, and then serialises the output of nineteen reads looking for the marker: the eleven organization-scoped aggregates, plus `getOrganization`, `getCareerPaths`, `getGrowthPlan`, `getRecommendations`, `getEmployeeSkills`, `getTeamMembers`, `getTeamByManager` and `getManagerConversationPrep`. **Four hits, three of them probe artefacts and one latent.** The artefacts were `getGrowthPlan`, `getRecommendations` and `getManagerConversationPrep`: `growthPlanItems` and `recommendationEvidence` carry **no `organizationId`** in `src/schemas/entities.ts` and join to their parent by uuid, so the probe's clone — which kept the *demo* parent id — genuinely belongs to the demo parent and is not a boundary crossing. The durable half of the probe was kept as `aggregate-org-scoping.test.ts` (see Closed) with those child tables excluded for exactly that reason; the throwaway was deleted. **A future run should extend that test's read list rather than re-deriving this by hand.**
- 2026-08-29 — **`getOrganization()`'s no-argument fallback is latent, not live — verified by call site, so it does not need re-deriving.** The probe's fourth hit was `getOrganization()` returning `organizations[0]`, i.e. the foreign row when one sorts first. This is the trap the 2026-08-28 entry named while fixing `getSkills()`. It remains in three fallbacks — `getSkills` (167), `getDataReadinessScores` (267) and `getOrgId` (352) — but `grep -rn 'getOrganization()\|getSkills()\|getDataReadinessScores()\|getHrDashboard()\|getSkillsReadinessReport()\|getMobilityInsights()\|getTalentDensityReport()\|getWorkforceReadinessReport()'` over `src` outside tests returns **only those three fallback lines themselves**: every in-app call site passes an organization explicitly. The fallback is therefore unreachable today. It was left in place deliberately — removing the optional parameter is a public-interface change — and the docstring already warns about it. Re-open only if a call site appears that omits the argument.
- 2026-08-29 — **`assertAgentAccess`, the agent invoke path's client-supplied `context.employeeId`, re-audited and sound.** `resolveEmployeeId` prefers `context?.employeeId` over the session's own employee, which is the shape the review brief calls out as highest-risk, so it was traced end to end. `assertAgentAccess` rejects a context employee in another organization before any role check, requires `canInvokeAgents`, requires a direct-report relationship for `supermanager`, and otherwise requires `canReadIndividualEmployeeData` or manager-of-that-report for any context employee that is not the caller. `invokeAgentWithRawOutput` is the one exported function that skips `assertAgentAccess`; its only two callers are `governance-service.test.ts` and the demo-trigger branch of `invokeAgent`, which runs *after* the assertion. No gap. One cosmetic dead branch noted and not touched: `createAgentRecommendations`'s `agentId === 'supermanager' ? (params.context?.employeeId ?? employeeId) : employeeId` can only ever evaluate to `employeeId`, since `employeeId` is already `context?.employeeId ?? session.employeeId`.
- 2026-08-29 — **Write-path input schemas cannot relocate a row across tenants.** Checked because `updateTeamScenario` and `updateProposedActionStatus` both apply `{ ...existing, ...input }`. `createWorkforceDecisionInputSchema`, `createTeamScenarioInputSchema` and `createDecisionOutcomeInputSchema` are all built with `.omit({ id: true, organizationId: true, createdAt: true, updatedAt: true })`, and the update schemas are `.partial()` of those, so `organizationId` is not an accepted key on any of them. The spread cannot move a row. One integrity gap, **not** a leak, recorded rather than fixed: `assertDecisionWriteScope` validates `teamId` and `ownerEmployeeId` against the session's organization but not `businessPriorityId`, so a caller can attach a foreign priority id to their own decision. Nothing dereferences that column — `grep -rn businessPriorityId src` shows it is only ever stored and echoed as a bare uuid, never joined to a title — so no cross-tenant text reaches a response and there is nothing to reproduce. It is a dangling-FK question for whoever adds the first read of it.
- 2026-08-29 — **Audit-log reads are bounded and org-scoped**, checked because the HR page and the CSV export both read the list whole. `fetchAuditLogsFromDb` filters `eq(auditLogs.organizationId, …)`, orders `desc(createdAt)` and caps at `MAX_AUDIT_LOG_ROWS = 5000`, mirroring `MAX_IN_MEMORY_AUDIT_ENTRIES` in `audit-service.ts`, whose in-memory store is spliced to the same bound and filtered by organization on read. No unbounded select. Both rate limiters (`login-rate-limit.ts`, `agent/rate-limit.ts`) are likewise bounded at 1000 tracked keys and fail closed past the cap; `checkAgentRateLimit` is keyed on `session.userId`, which is server-derived, not client-supplied.
- 2026-08-29 — **`NEXT_PUBLIC_` variables carry no service-role key.** The only two are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, read in `src/lib/supabase/env.ts`; the anon key is public by design. `SUPABASE_SERVICE_ROLE_KEY` appears nowhere under `src/`. Live-mode session resolution does **not** trust the unsigned `growthos-session` cookie's `userId`: `getSupabaseBackedSessionContext` calls `supabase.auth.getUser()` and looks the user up by `authUserId`, using the cookie only for `activeRole`, which `clampActiveRoleToHeldRoles` then narrows to roles the database actually grants.
- 2026-08-29 — Committed secrets, **ninth** pass. Same regex set as the eighth (valued `SUPABASE_SERVICE_ROLE_KEY`, `eyJ….eyJ` JWTs, credentialed `postgres://user:pass@host`, `sk-…`, `ghp_…`, `github_pat_…`, `AKIA…`, `xox[baprs]-…`, `sbp_…`, `-----BEGIN … PRIVATE KEY`). **Two hits, both the known localhost fixtures** at `src/lib/auth/acting-ids.test.ts:32` and `src/services/data-provider/provider-fallback.test.ts:29`. Unchanged from eight prior passes.
- 2026-08-29 — Real PII, run in the **narrowed** form the 2026-08-27 entry asked for and the 2026-08-28 entry confirmed. `git log --since=2026-08-27 -- data/ drizzle/seed/` returns **nothing**: no fixture has changed, so the eighth pass's full-scan result still holds and the full scan was not repeated. This is the intended steady state — only re-run the full scan when `data/` or `drizzle/seed/` actually moves.
- 2026-08-29 — **Next.js August 2026 release and Node 20 EOL, both re-confirmed by lockfile rather than re-researched.** `npm ls next sharp` returns `next@15.5.24 └── sharp@0.35.3`, i.e. the patched Maintenance-LTS release with the override honoured, so GHSA-2xp9-vwfh-vxw4 and CVE-2026-75604 stay not-applicable for the reasons recorded on 2026-08-26/27. `engines.node` is `>=22.12.0`; the whole suite ran on **Node v24.18.1**. Per the 2026-08-27 instruction, neither was re-researched beyond this one-line confirmation.
- 2026-08-29 — **`npm audit` is 0 vulnerabilities on a production install and 4 moderate with devDependencies**, which resolves the puzzle the 2026-08-27 entry left open. `npm ci` (this host has `NODE_ENV=production`, so devDependencies are omitted unless `--include=dev` is passed) reports `found 0 vulnerabilities`; `npm ci --include=dev` reports the same 4 moderate `esbuild` findings via `@esbuild-kit/*` under `drizzle-kit`. The 2026-08-27 run's "the four moderates are gone" observation was almost certainly this environment difference, not an upstream advisory withdrawal. **The settled reasoning stands: dev-server-only advisory, devDependency-only path, deliberately not overridden.** No package resolution changed.
- 2026-08-29 — **The `executive_readonly` per-route floor and `prohibited-patterns.ts` were both left untouched**, deliberately and for the second night running. No new leaking route was found and no governance bypass was probed for. Recorded so the absence reads as a decision rather than an oversight.

- 2026-08-28 — **The August 2026 Next.js security release does not apply to this repository, and the lock version is written down here so no further run re-derives it.** Vercel disclosed two criticals on 2026-08-25 — **GHSA-2xp9-vwfh-vxw4**, the libheif/AVIF heap overflow reached through `sharp` (unauthenticated RCE, CVSS v4 9.5), and **CVE-2026-75604 / GHSA-p293-qw3h-jr36**, the Windows-only path traversal — patched in **15.5.24** and **16.3.3**. `package.json` declares `next 15.5.24` and `package-lock.json` **resolves `next` to 15.5.24**, i.e. the patched Maintenance-LTS release; `npm ls next sharp` returns `next@15.5.24 └── sharp@0.35.3`. **Nothing to do.** The reachability analyses for both advisories are recorded in the 2026-08-26 and 2026-08-27 entries below and are unchanged. This entry exists because a version match alone keeps getting re-checked by generic advisory feeds: the answer is "already on the patched release", and it does not change unless the `next` pin moves *backwards*.
- 2026-08-28 — **ESLint 9 EOL** — confirmed unchanged and deliberately not re-proposed. The 9.x line went end of life on **2026-08-06**; the repo pins `eslint@9.39.4`; the upgrade to 10.x is blocked by `eslint-config-next`'s `^9` peer range and is a sub-task of the Next 16 migration. That is already the Open item and its design note; this run added nothing to it beyond re-confirming the EOL date is recorded.
- 2026-08-28 — **Dependency sweep** — no action. `react 19.1.0`, `zod 4.3.6`, `drizzle-orm 0.45.2`, `@supabase/supabase-js 2.112.3`, `vitest 4.1.11`, `typescript 5.9.3`, `tailwindcss 4.3.3` are all exact pins with no advisory against them, and the lockfile resolves `esbuild 0.25.12`. Dependency work was not where this night's value was; see the run note.
- 2026-08-28 — Committed secrets, **eighth** pass. `git ls-files -z | xargs -0 grep -InE` for a *valued* `SUPABASE_SERVICE_ROLE_KEY`, `eyJ….eyJ` JWTs, credentialed `postgres://user:pass@host`, `sk-…`, `ghp_…`, `github_pat_…`, `AKIA…`, `xox[baprs]-…`, `sbp_…` and `-----BEGIN … PRIVATE KEY`, excluding this file. **Three hits, all known and all non-secrets**: `docs/TECH_STACK.md:385` (`SUPABASE_SERVICE_ROLE_KEY=...`, a literal ellipsis in a documentation table) and the two localhost fixtures at `src/lib/auth/acting-ids.test.ts:32` and `src/services/data-provider/provider-fallback.test.ts:29`. Unchanged from seven prior passes.
- 2026-08-28 — Real PII, **eighth** pass, run in the narrowed form the 2026-08-27 entry proposed. `git log --since=2026-08-26 -- data/ drizzle/seed/` returns **nothing**, so no fixture has changed since the last full pass. The full scan was run anyway and agrees: every email address in the tree resolves to `techforward.io` (31), `example.com`/`Example.com` (19), `techforward.com` (8, documentation examples) and `b.com` (7, the `a@b.com` placeholder) — no other domain appears, and all are synthetic. No SSN-shaped value (`\b\d{3}-\d{2}-\d{4}\b`) anywhere. **A future run should keep the narrowed form: check whether `data/` or `drizzle/seed/` has changed, and only do the full scan if it has.**
- 2026-08-28 — **The `executive_readonly` per-route floor was not touched, and no fifth ad-hoc gate was added.** This run found no new leaking route; the four instances and the open product question stand exactly as the design note records them. Recorded so the absence is legible rather than looking like an oversight.
- 2026-08-28 — **`prohibited-patterns.ts` was not touched, and no pattern #6 was added.** No new bypass was probed for and none is claimed. The normalize-then-match proposal is still the only correct move on that file.

- 2026-08-27 — **`npm audit` now reports `found 0 vulnerabilities`** — the four moderate `esbuild` findings that were reported unchanged on five consecutive runs are gone. This is *not* the result of anything this run did: the lockfile change that landed was the `next` bump alone, and `esbuild@0.18.20` is still physically present at `node_modules/@esbuild-kit/core-utils/node_modules/esbuild`. `npm ls esbuild --all` returns `(empty)`, so npm no longer resolves it as part of the logical dependency tree, and the audit came back clean twice, the second time with an explicit `--registry=https://registry.npmjs.org/` to rule out a stale local cache. The most likely explanation is an upstream revision or withdrawal of GHSA-67mh-4wv8-2f99's affected range. **Recorded as observed, not as fixed** — nothing was overridden or downgraded, and the settled "deliberately not overridden" reasoning below stands unchanged in case the advisory returns. A future run seeing 4 moderates again should not treat it as a regression.
- 2026-08-27 — **AVIF image-optimization RCE (GHSA-2xp9-vwfh-vxw4 / libheif GHSA-g89c-p67h-r497), re-derived independently rather than inherited from the 2026-08-26 entry.** Confirmed each precondition afresh against the merged tree: `next.config.ts` contains `outputFileTracingRoot`, `poweredByHeader`, `turbopack` and a `headers()` block and **no `images` key at all**, so neither `images.formats` nor `images.remotePatterns`/`domains` exists and `/_next/image` accepts no absolute URL and never emits AVIF; `git grep "next/image"` over `src/` returns exactly one line, the `_next/image` exclusion in the `middleware.ts` matcher, so nothing renders an optimized image; `git grep -rniE "formData|multipart|\.avif|createReadStream"` over `src/` returns **nothing**, so there is no image ingestion path; `public/` holds five SVGs. `sharp@0.35.3` is still resolved under `next@15.5.24`. **Vulnerable dependency present, zero reachable exposure** — the bump is defence in depth against someone later adding an `images` config. Re-check only if `next.config.ts` gains an `images` key or a route starts accepting uploads.
- 2026-08-27 — **CVE-2026-75604 / GHSA-p293-qw3h-jr36, the Pages-Router-plus-App-Router Windows RCE** — re-confirmed not applicable, with the same stronger reason as 2026-08-26: `ls pages src/pages` returns "No such file or directory" for both, so there is no Pages Router in the repository and the advisory's precondition fails on every operating system, not merely off Windows. Nothing to do; do not re-open on the strength of a version match alone.
- 2026-08-27 — **MCP specification 2026-07-28 (stateless core, OAuth/OIDC changes, versioned Apps/Tasks extensions)** — does not apply. `git grep -rniE "modelcontextprotocol|@modelcontextprotocol|mcp server"` over the whole tree, excluding the lockfile and this file, returns **nothing**. This repository does not speak MCP in any capacity — no server, no client, no SDK dependency. Recorded so generic advisory sweeps stop surfacing it.
- 2026-08-27 — **Node 20 EOL (2026-04-30)** — still not applicable and now checked for the third night running. `engines.node` is `>=22.12.0`. Verified again end-to-end on **Node v24.18.1 / npm 11.16.0**: `npm ci --include=dev` 7.9s, typecheck 2.7s clean, lint 1.8s clean, 407 tests in 2.4s, `next build --turbopack` 10.5s exit 0. **This has now been the answer on 2026-08-24, 2026-08-25 and 2026-08-27 — do not check it again unless `engines.node` moves.**
- 2026-08-27 — Committed secrets, **seventh** independent pass, run before any other work. `git ls-files -z | xargs -0 grep -InE` for `SUPABASE_SERVICE_ROLE`, `eyJ…` JWTs, credentialed `postgres://user:pass@host`, `sk-…`, `ghp_…`, `github_pat_…`, `AKIA…`, `xox[baprs]-…`, `sbp_…` and `-----BEGIN … PRIVATE KEY`. **Zero real hits**, unchanged from six prior passes. Every `SUPABASE_SERVICE_ROLE_KEY` match is a documentation table row or the empty `.env.example` placeholder with no value attached; the two `postgres://` hits remain the known localhost fixtures at `src/lib/auth/acting-ids.test.ts:32` and `src/services/data-provider/provider-fallback.test.ts:29`. One new-looking `eyJ…` match is worth naming so it is not re-investigated: `package-lock.json:8448` contains the integrity hash `sha512-V7Qr52IhZmdKPVr+Vtw8o+WLsQJYCTd8loIfpDaMRWGUZfBOYEJeyJIkqGIDMZPwPx24pUMfwSxxI8phr/MbOA==`, whose base64 happens to contain the substring `eyJIkqGIDMZPwPx24pUMfwSxxI8phr` — a coincidence in a SHA-512 digest, not a JWT. `.env.example` is the only tracked `.env*` file and ships empty values.
- 2026-08-27 — Real PII, **seventh** independent pass, scanned separately from secrets. Extracted every email address in the tree and grouped by domain: 12 on `techforward.io`, 4 on `techforward.com` (documentation examples only), 3 `example.com` placeholders, 1 `a@b.com` and 1 `User@Example.com` — no other domain appears anywhere, and every one of the 21 addresses is a synthetic persona. No SSN-shaped value (`\b\d{3}-\d{2}-\d{4}\b`) anywhere. A JSON-key search of `data/`, `drizzle/` and `src/evals/` for `ssn`, `socialSecurity`, `nationalId`, `dateOfBirth`, `dob`, `salary`, `compensation`, `payRate`, `bankAccount`, `homeAddress`, `phone`, `phoneNumber` returns nothing. **This has now returned the same answer seven times.** Unless `data/` or `drizzle/seed/` gains a new fixture file, the marginal value of an eighth full pass is close to zero; a future run can reasonably narrow it to "has anything under `data/` or `drizzle/seed/` changed since the last pass?".
- 2026-08-27 — **The `/employee` page subtree has no `layout.tsx` role gate**, unlike `/hr` and `/manager`. Investigated as a possible sixth instance of the per-route RBAC floor and it is **not a defect**. Every page under `src/app/(app)/employee/` — `home`, `growth-profile`, `growth-plan`, `career-paths`, `manager-conversation` — calls `getSessionContext()` and then `resolveActingEmployeeId(session)`, so each one renders **the caller's own** employee record and nothing else. There is no id in any of those routes and no way to name another employee, so a subtree gate would add nothing an attacker could otherwise get past. `middleware.ts` correspondingly gates only `/hr` and `/manager`. Recorded because the missing layout file is conspicuous and will otherwise be re-flagged by every structural sweep.
- 2026-08-27 — **Open redirect on the post-login `?next=` parameter** — checked and already defended. `middleware.ts` writes the requested pathname into `?next=` on the login redirect, and `getPostLoginDestination()` in `src/app/(auth)/login/page.tsx` rejects anything that is not a same-origin absolute path: it requires a leading `/` and excludes the protocol-relative `//host` and backslash `/\` forms, plus `/login`, `/api`, and the role-gated `/hr` and `/manager` subtrees a fresh employee-role cookie cannot open. No gap found. The one thing a future run could add here is coverage — the function is module-private and untested, so pinning it would mean exporting it, which is a public-interface change and was judged not worth it for a function this small and this obviously correct.
- 2026-08-27 — **Input-validation and error-shape sweep of the API surface**, 18 `route.ts` files. No route reads a query-string parameter at all (`git grep -nE "searchParams\.get|parseInt|Number\(|parseFloat"` over `src/app/api` and `src/lib/api` returns **nothing**), so the whole class of unbounded-`limit` and `NaN`-offset bugs is absent by construction. Bodies go through Zod (`invokeRequestSchema` on the agent-invoke route caps message length at 4000 and history at 20 entries). `writeErrorResponse` re-throws anything outside a small allow-list rather than echoing internal error text. `escapeCsvCell` is applied to every cell of the audit-log export, including the `JSON.stringify(details)` column, and the export sets `Cache-Control: no-store` with a literal `Content-Disposition` filename. Three `JSON.parse` call sites exist outside tests (`middleware.ts:22`, `mock-session.ts:30`, `agent-response.ts:20`) and all three are inside `try`/`catch`. `dangerouslySetInnerHTML`, `innerHTML` and `eval(` appear **nowhere** in `src/`. No finding; recorded so the next run can skip this ground.

- 2026-08-26 — **August 2026 Next.js critical #1, the AVIF image-optimization RCE** (flaw in `libheif`, reached through `sharp`; unauthenticated RCE when Next optimizes an attacker-controlled AVIF). The vulnerable code is genuinely in the tree — `npm ls sharp` returns `next@15.5.23 -> sharp@0.35.3 overridden`, held there by the `overrides` block in `package.json` — but **nothing attacker-controlled can reach the optimizer**, for four independent reasons: (1) `next.config.ts` declares no `images` key at all, so `images.remotePatterns` and `images.domains` are both empty and `/_next/image` rejects every absolute URL; (2) `images.formats` is likewise unset, so AVIF is not even an output format; (3) `next/image` is imported **nowhere** in `src/` — the single `_next/image` occurrence is the exclusion in the `middleware.ts` matcher — so no page renders an optimized image; (4) the app has no ingestion path for an image at all: `grep -rniE "formData|multipart|upload|writeFile|\.avif|blob"` over `src/` returns one unrelated test string, and `public/` holds five SVGs. **Vulnerable version, no exposure.** Bumped to 15.5.24 anyway so that adding an `images` config later cannot silently convert this into a live exposure. Re-check this only if `next.config.ts` gains `images.remotePatterns`, `images.domains`, or a user-upload route.
- 2026-08-26 — **August 2026 Next.js critical #2, the Windows-filesystem RCE.** Advisories describe it as affecting apps that use **both** Pages Router and App Router without Cache Components, on Windows. It does not apply here, and the reason is stronger than the operating-system carve-out usually quoted: there is **no Pages Router in this repository at all** — neither `pages/` nor `src/pages/` exists, every route lives under `src/app/`. So the precondition fails on any OS, not just on the Linux/macOS deployment target. No `cacheComponents` / `dynamicIO` flag is set either, but that is moot given the missing precondition.
- 2026-08-26 — **CVE-2026-45109, the May 2026 fix that was incomplete specifically under Turbopack.** Worth restating because this repo does build with `--turbopack` (`next build --turbopack`), so Turbopack-conditional patches are a live concern here in general. Not applicable to this pin: the complete fix shipped in 16.2.5 / **15.5.16**, and the repo was already on 15.5.23 before this run and is on 15.5.24 after. Kept on record so a future run recognises the Turbopack-conditional shape quickly rather than re-deriving it.
- 2026-08-26 — Committed secrets, sixth independent pass, run before any other work. `git ls-files -z | xargs -0 grep -InE` across the whole tree for `sk-ant-…`, `sk-…`, `ghp_…`, `github_pat_…`, `AKIA…`, `xox[baprs]-…`, `sbp_…`, `eyJ….eyJ` JWTs, `-----BEGIN … PRIVATE KEY` and credentialed `postgres://user:pass@host`. **Zero real hits**, unchanged from the five prior passes: the only matches are this file's own prose and the two known localhost test fixtures (`src/lib/auth/acting-ids.test.ts:32`, `src/services/data-provider/provider-fallback.test.ts:29`). Every `SUPABASE_SERVICE_ROLE_KEY` occurrence is a documentation table row or the empty `.env.example` placeholder — no value is attached to any of them, and the one `service_role` hit in SQL is still the policy *name* `recommendations_insert_service_roles`. The anon key is likewise only ever an empty `.env.example` placeholder, and would be public by design in any case. `.gitignore` still carries `.env*` with `!.env.example`.
- 2026-08-26 — Real PII, sixth independent pass, scanned separately from secrets. Every email address in the tree resolves to **21 distinct synthetic addresses** across three fictional domains — `techforward.io` (Alex Chen, Jordan Lee, Morgan Kim, Riley Nguyen, Sam Patel, `engineer1..7`), `techforward.com` (`alex@`, `jordan@`, `sam@`, `exec@`, which appear only in documentation examples) and `example.com` placeholders (`a@b.com`, `user@example.com`, `User@Example.com`, `a@`/`b@example.com`). No SSN-shaped value (`\b\d{3}-\d{2}-\d{4}\b`) anywhere. A JSON-key search of `data/`, `drizzle/` **and `src/evals/`** for `ssn`, `socialSecurity`, `nationalId`, `dateOfBirth`, `dob`, `salary`, `compensation`, `payRate`, `bankAccount`, `homeAddress`, `phone`, `phoneNumber` returns nothing. `src/evals/fixtures/` holds three files — `career-path-good.json` and two `prohibited-*.txt` governance probes — and none carries a real person's data.
- 2026-08-26 — `npm audit` unchanged for the fifth consecutive run **after** the `next` bump: 4 moderate, all `esbuild <=0.24.2` (GHSA-67mh-4wv8-2f99) via `@esbuild-kit/*` under the `drizzle-kit` devDependency. The settled reasoning above still holds; the 15.5.24 bump did not move it in either direction.
- 2026-08-26 — Division-by-zero sweep across the analytics helpers, prompted by the number of unguarded-looking `/ x.length` expressions in `mock-provider.ts`. **All fifteen are already guarded** — either by an early `if (x.length === 0) return 0`, a `total > 0 ? … : 0` ternary, or a `Math.max(1, …)` denominator. `computePlanAdoptionPct`, `computeManagerEnablementScore`, `computeConfirmedInferredRatio`, `getWorkforceReadinessReport`, `getTeamSkillsMatrix` and `getManagerDashboard` were each read line by line. No `NaN` can reach a response. Recorded so the next run does not re-open this on the strength of a grep.

- 2026-08-25 — **Next.js July 2026 security release (9 CVEs, 4 high / 5 medium)** — fixed in 16.2.11 and **15.5.21**. This repo pins **15.5.23**, which is ahead of the 15.5 fix, so every one of the nine is already patched. This keeps being re-surfaced by generic advisory feeds; it has now been checked four separate nights and the answer has not changed. Do not re-check unless the `next` pin moves *backwards*.
- 2026-08-25 — **Node 20 EOL (2026-04-30)** — not applicable. `engines.node` is `>=22.12.0` and has been since 2026-08-22. Verified again on **Node v24.18.1**: `npm ci --include=dev` 9.4s, typecheck clean, lint clean, 395 tests, `next build --turbopack` exit 0.
- 2026-08-25 — **esbuild GHSA-67mh-4wv8-2f99 reachability, settled with the dependency path written down so it stops being re-investigated.** `npm ls esbuild` at the top level returns `(empty)`: esbuild is not a direct dependency and not a dependency of anything the built app imports. The only copy in the tree is `node_modules/@esbuild-kit/core-utils/node_modules/esbuild@0.18.20`, pinned by `@esbuild-kit/core-utils@3.3.2`'s `"esbuild": "~0.18.20"`, reached as `drizzle-kit` → `@esbuild-kit/esm-loader` → `@esbuild-kit/core-utils`. `drizzle-kit` is a **devDependency** used for `db:generate` / `db:migrate`, and `@esbuild-kit/*` uses esbuild as a **transform/loader API**, never `esbuild.serve()` — the advisory is specifically about the `Access-Control-Allow-Origin: *` header on esbuild's *development server*, which nothing here starts. Not reachable, in dev or in production. The only remedy npm offers is `drizzle-kit@0.18.1`, a major downgrade of the migration tool, and overriding esbuild across 0.18 → 0.25 would very likely break `@esbuild-kit`'s API expectations. **Deliberately not overridden.** Revisit only when `drizzle-kit` drops `@esbuild-kit` (upstream has deprecated it in favour of `tsx`).
- 2026-08-25 — Committed secrets, fifth independent pass, run before any other work. `git ls-files -z | xargs -0 grep -InE` over the whole tree for `sk-ant-…`, `sk-…`, `ghp_…`, `github_pat_…`, `AKIA…`, `xox[baprs]-…`, `sbp_…` (Supabase personal token), `service_role`, `eyJ…` JWTs, `-----BEGIN … PRIVATE KEY` and credentialed `postgres://user:pass@host`. **Zero real hits.** The three `service_role` matches are this file's own prose (twice) and the SQL policy *name* `recommendations_insert_service_roles` in `drizzle/migrations/0001_rls_rbac.sql:825` — a policy identifier, not a key. `.gitignore` still has `.env*` with `!.env.example`, and `.env.example` ships empty values. No Supabase `service_role` key is committed anywhere.
- 2026-08-25 — Real PII, fifth independent pass, scanned separately from secrets. Every email address across `data/`, `drizzle/` and `src/` is one of **17 distinct synthetic addresses** on `techforward.io` (Alex Chen, Jordan Lee, Morgan Kim, Riley Nguyen, Sam Patel, `engineer1..7`) or `example.com` placeholders (`a@b.com`, `user@example.com`, `User@Example.com`, `a@`/`b@example.com`). No SSN-shaped value (`\b\d{3}-\d{2}-\d{4}\b`) anywhere in the tree. A JSON-key search of `data/` and `drizzle/` for `ssn`, `socialSecurity`, `nationalId`, `dateOfBirth`, `dob`, `salary`, `compensation`, `payRate`, `bankAccount`, `homeAddress`, `phone`, `phoneNumber` returns **nothing** — no fixture carries any of those fields. Unchanged from the four prior passes.
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

## Run note (2026-08-29) — automate the sweep the last run had to do by hand

The 2026-08-28 run found ten cross-tenant reads by switching the *search axis*
from "does this function accept an organization?" to "is this predicate an id?"
and then reading files. That worked, but it is a manual method with a manual
method's failure mode: it finds what the reader thinks to look at, and it has
to be repeated in full every night.

This run did two things. First, it drained the 2026-08-28 branch — which was
still unmerged, so `main` was shipping every one of those ten leaks. That is
now three consecutive nights on which a stranded branch was the single
highest-value thing available, and it keeps being true because a run that
pushes a branch has no way to land it. **Check `git ls-remote --heads origin
'nightly/*'` first. Every time.**

Second, instead of re-reading the same files on the same axis, it built the
sweep as a probe: clone the first row of every table in the store onto a
foreign organization, mark the free text, run nineteen reads, grep the
serialised output. That took one file and found no live leak — four hits, three
of which turned out to be artefacts of the probe seeding child tables
(`growthPlanItems`, `recommendationEvidence`) that carry no `organizationId` at
all, and one of which (`getOrganization()`'s no-argument fallback) has no live
call site. The durable half was kept as `aggregate-org-scoping.test.ts`.

The point of that test is not the eleven reads it covers today. It is that the
next read someone adds without an organization term fails CI without anyone
remembering this note existed. **Extend its list rather than re-deriving the
sweep by hand.**

A negative result is also worth writing down plainly: after the branch drain,
this run found no shippable defect. The areas it checked and cleared —
`assertAgentAccess` and the client-supplied `context.employeeId`, the write-path
input schemas, the audit-log bounds, the rate limiters, `NEXT_PUBLIC_` exposure
— are each recorded under "Checked, not applicable" with the reason, so the
next run can skip them rather than rediscover them. Nothing was padded into a
commit to make the night look productive.

---

## Run note (2026-08-28) — the defect supply was not exhausted; the search was looking at the wrong axis

The 2026-08-27 note concluded that "the supply of concrete nightly-sized
defects in this repository is close to exhausted". That was a reasonable read
of seven nights of evidence and it was wrong. This run found **ten** reachable
cross-tenant reads in two files both of which every previous run had already
opened, and fixed them in two commits on
`nightly/2026-08-28-improvements`.

What made them invisible for seven nights is worth recording, because it is a
lesson about the *search*, not about the code. Every prior org-scoping sweep
asked a signature question — "does this exported function accept an
organization?" — and `getCareerPaths(employeeId)` answers that question
acceptably: it fetches the employee row, and the employee row carries an
organization. The defect was one level down, in what it did with it: three of
its four reads filtered on `isActive` / `status === 'open'` / a skill-id set
membership and never mentioned the organization the function already had.
The sharper rule now lives in the RLS design note: **a predicate that is not an
id is not a tenant bound.** Searching on that axis instead of on signatures
turned up ten instances in one file-reading pass.

The severity is not uniform and the entries say so. The internal-mobility
recommendation is the sharp end — `createAgentRecommendations` *persists*
another organization's opening as a row against the caller's own employee
record — while `getSkills()`'s first-tenant default only produces blanks. Both
are worth fixing; only one is a leak.

Two standing rules held. `prohibited-patterns.ts` was not touched and no
pattern #6 was added. No fifth ad-hoc `executive_readonly` route gate was
added — no new leaking route was found, and the four known instances stand as
the design note records them.

Baseline before any change: 407 tests / 65 files, typecheck clean, lint clean.
After: **415 tests / 67 files**, typecheck clean, lint clean,
`next build --turbopack` exit 0 in 12.9s. Both new test files were confirmed
red against the pre-fix source before being kept (5 of 6, and 1 of 2 —
the passing cases are the ones the fixture happens not to exercise, and the
entries say which).

**The useful correction to the 2026-08-27 note is this: "no new defects found"
should be read as "this search strategy has stopped yielding", not as "the
code is clean". Changing the axis of the search was worth more this night than
another pass along the old one.** The decision table below is still unmoved,
and still needs a human.

---

## Run note (2026-08-27) — a night that found no new defect, and why that is the honest answer

This run landed one thing: the stranded `next` 15.5.24 security bump, drained
onto `main` and re-verified at V3 from scratch. **It found no new reproducible
bug**, and that is worth stating plainly rather than padding the commit log.

Ground covered without a finding, all recorded above under "Checked, not
applicable" so it is not re-walked: the AVIF and Windows Next.js criticals
re-derived from first principles; the MCP spec; Node EOL; a seventh secrets
pass and a seventh PII pass; the whole 18-route API surface for query-string
parsing, body validation, error-shape leakage, CSV escaping and `JSON.parse`
safety; `dangerouslySetInnerHTML` / `innerHTML` / `eval`; the post-login
`?next=` open-redirect; and the missing `/employee` layout gate.

Two rules in the standing instructions were load-bearing tonight and both held:
no fifth governance regex was added, and no fifth ad-hoc `executive_readonly`
route gate was added — the `/employee` subtree was investigated as a candidate
for exactly that and turned out not to be a defect at all.

The supply of concrete nightly-sized defects in this repository is close to
exhausted. Seven nights in, the Open list is unchanged in shape: **every
remaining item is blocked on a human decision**, and the table below has not
moved since 2026-08-25. The useful next action is a decision session on the
four product rows and a token with `workflow` scope for the CI row — not
another scanning pass.

---

## Backlog health check (2026-08-25)

This file is long, so it is worth stating plainly what the length is made of.
Of 384 lines, roughly 240 are **design notes** — recorded reasoning about why
four specific things were *not* fixed, each with a reproduction. Only about
ten lines are the Open list itself. Length here is documentation of judgement,
not accumulated debt, and it is doing its job: this run re-proposed nothing
that was already tracked, and skipped three false leads (the July Next.js
CVEs, Node 20 EOL, the esbuild advisory) in minutes because the answers were
already written down.

The real problem is different and worth naming. **Every long-lived Open item
is blocked on a decision only a human can make**, and none of those decisions
has been made in five nights:

| Item                                | Open since | Blocked on                         |
| ----------------------------------- | ---------- | ---------------------------------- |
| Governance normalize-then-match     | 08-21      | Product: false-positive tolerance  |
| ESLint 10                           | 08-21      | Upstream: Next 16 migration        |
| Live-mode session identity          | 08-22      | Product: what to show, and a schema change |
| `executive_readonly` list endpoints | 08-22      | Product: is a UUID list aggregate? |
| `executive_readonly` per-route floor | 08-26     | Product: same call as the row above, then encode it once |
| Demo manager fixture                | 08-24      | Product: which persona is the demo manager |
| No CI                               | 08-24      | Access: a token with `workflow` scope |
| RLS not on the data path            | 08-23      | Architecture: option 1 vs option 2 |

Nightly runs cannot clear any row in that table. What they *can* do is what
this run did — find and close concrete, reproducible defects — and that supply
is finite. If the Open list is still this shape in another week, the useful
response is a decision session on the four product rows, not more nightly
scanning.

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

Re-measured 2026-08-25 on Node v24.18.1, `npm_config_cache=/tmp/npmcache`,
`NODE_ENV` unset: `npm ci --include=dev` 9.4s, typecheck clean, lint clean,
`npm test` **395 tests / 64 files** in 1.4s, `npm run build` exit 0 in 9.5s.
Full V3 in well under a minute. The one thing to be careful of is
`npm run format:check`, which is red on 138 files at baseline and is **not**
part of V0–V3 — see the Open item about it.

Re-measured 2026-08-26 on **Node v22.14.0 / npm 10.9.2**, `TMPDIR=/tmp`,
`npm_config_cache=/tmp/npmcache`: `npm ci --include=dev` 7.1s, typecheck clean,
lint clean, `npm test` **407 tests / 65 files** in 1.3s, `npm run build` exit 0.

**The `NODE_ENV=production` trap above caught this run on its first command**,
and the note is what made it a thirty-second detour instead of a wrong
conclusion. The shell this run started in had `NODE_ENV=production` exported
by the environment, not by the repo, and the very first `npm ci` produced the
exact three symptoms the note predicts — `TS2307: Cannot find module 'vitest'`
from typecheck, `Cannot find package '@eslint/eslintrc'` from lint, and
`sh: vitest: command not found` from test. Re-running with `NODE_ENV` unset
turned all three green with no repo change. **If you see those three symptoms
together, check `echo $NODE_ENV` before believing anything else.** This note
has now paid for itself twice; leave it in place.

---

Re-measured 2026-08-30 on Node v24.18.1, npm cache on local disk, `NODE_ENV`
unset: `npm ci --include=dev` **4.9s / 495 packages**, `npm run typecheck`
clean, `npm run lint` clean, `npm test` **416 tests / 68 files in 2.3s**,
`npm run build` (`next build --turbopack`) exit 0 in **9.7s**. Whole V3 gate
is about **21 seconds**. The trap caught this run too: the first `npm ci`
installed 273 packages and typecheck reported the usual bogus
`TS2307: Cannot find module 'vitest'`, because `echo $NODE_ENV` was
`production`. **Check that variable before believing any red baseline.** The
claim that this repo is too large to build has now been disproved on nine
consecutive nights and should not be re-litigated.

## Design note — the `executive_readonly` rule is enforced per route, and that has a floor (2026-08-26)

The product rule is written down in three places and is not ambiguous.
BACKEND_STRUCTURE 6.1 grants `executive_readonly` `view_org_data: aggregate`;
SECURITY_AND_PRIVACY 6.1 gives it "aggregated dashboards only; no individual
PII"; 6.2 Example 6 requires a 403 when an executive asks for one employee's
record. `rbac.ts` even encodes it once, cleanly, as
`canReadIndividualEmployeeData`.

The rule is nonetheless **applied by hand, one route at a time**, and has now
been got wrong four times:

| # | Surface | Fixed by | Date |
| - | ------- | -------- | ---- |
| 1 | `GET /api/decisions/[id]` | `fix(rbac): deny executive_readonly an individual workforce decision` | 08-21 |
| 2 | `GET /api/context/team/[id]` | `fix(rbac): deny executive_readonly the team context graph` | 08-22 |
| 3 | `/hr/audit` page | `fix(rbac): gate the HR audit page on the audit-read permission` | 08-23 |
| 4 | `GET /api/organizational-learning` | **not fixed — see below** | 08-26 |

Plus one route pair still open as a product question (`GET /api/decisions`,
`GET /api/agent-actions`). That is five of roughly eighteen API routes where
the gate was, or may be, wrong for this one role.

### Reproduction of instance #4

`/api/organizational-learning` gates on `canReadOrganizationWorkforceData`,
which admits `executive_readonly`. Its `learningSignals` array is built by
`getLearningSignalsForAgent`, which loops every workforce decision in the
organization and, for any decision with a `partially_achieved` actual outcome,
emits a signal that interpolates the decision straight into the payload:

```ts
id: `signal-outcome-${decision.id}`,
title: `Partial outcomes on: ${decision.title}`,
```

Probed against the shipped fixtures with an `executive_readonly` role set:

```
GET /api/decisions/[id] allowed for executive_readonly: false
GET /api/organizational-learning allowed for executive_readonly: true
  - {"id":"signal-outcome-99999999-9999-4999-8999-999999999991",
     "title":"Partial outcomes on: Reskill QA automation toward AI-assisted quality"}
```

So the role is 403'd on the decision and then handed that same decision's
**UUID** and **free-text title** through a neighbouring endpoint. The endpoint
is named and documented as organizational *learning* — aggregate insight — but
its payload is not aggregate: it is per-decision, and `title` is operator-typed
free text with no constraint keeping an employee's name out of it.

**Severity, stated honestly.** With the shipped fixtures this leaks nothing
personal: all four decision titles are role- and team-level
("Reskill QA automation toward AI-assisted quality"). The `insight` string is a
fixed template from `summarizeOutcomeStatus`, not free text. So this is a
latent defect in the payload's *shape*, not an active PII leak today — which is
precisely why four rounds of route auditing walked past it.

### Why the fifth ad-hoc gate is the wrong move

Narrowing this one route takes about three lines and would be the fourth
same-class fix. It would also not change the thing that produced all four: the
rule lives in prose and is re-applied, from memory, by whoever writes the next
route. There are ~18 API routes and ~14 page/layout gates today; every new one
is a fresh chance to pick `canReadOrganizationWorkforceData` because it reads
like "org-wide data, and this is an org-wide endpoint". Instances #1 and #4 are
the *same mistake with the same helper*, five days apart.

A keyword-list-style rebuttal applies here too: the audit that finds instance
#5 is the same audit that missed #4, run again.

### Proposed shape

Make the rule checkable in one place instead of eighteen. Roughly in
increasing cost:

1. **A route-manifest test.** One table mapping every route path to its
   required predicate, and a test that imports each route module and asserts
   the gate it actually calls matches the table. The table becomes the single
   written form of BACKEND_STRUCTURE 6.1, and adding a route without adding a
   row fails the suite. Catches all four instances above.
2. **A payload invariant.** Assert structurally that no response reachable by
   an `executive_readonly` session contains an individual-level identifier —
   `employeeId`, `ownerEmployeeId`, `targetEmployeeId`, `participants`, or a
   record UUID from an individual-scoped table. This catches instance #4, which
   a manifest alone would only catch if someone correctly classified the route
   when writing its row.
3. **Types.** Give aggregate readers a distinct return type (`Aggregate<T>`)
   that structurally cannot carry an individual identifier, so the compiler
   rejects the mistake rather than a test catching it. Highest cost, highest
   assurance, and a wide refactor of `src/services/`.

Option 1 is a nightly-sized change and would have caught every instance found
so far. Option 2 is the one that catches the shape found this run. They
compose, and doing 1 then 2 is a reasonable order.

### Why this was not fixed in the 2026-08-26 run

Two reasons. The narrow fix is the anti-pattern this note exists to stop. And
the non-narrow fix needs a product decision that overlaps the already-open
question about the list endpoints: whether "aggregate" means *no individual
identifiers in the payload* or *no individual PII in the payload*. Those give
different answers for `signal-outcome-<uuid>` — the first forbids it, the
second permits it — and that call is not a maintenance one. Settle it once,
then encode it once, via option 1 or 2.

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

**(2026-08-25: those helpers are now fixed — see Closed — but the argument got
_stronger_, not weaker. Fixing them surfaced a third instance nobody had
tracked: `edgesForEntity`, a private helper, joined graph edges on entity id
alone, so a graph scoped to one organization still pulled in another
organization's edges and their free-text explanations. That one was invisible
to every audit so far precisely because it is not an exported function with a
missing parameter — it is a missing organization term inside a join. The
org-scoping class in `src/services/` has now taken eight fixes across the
repo's history (`abfd9ad`, `4088e0d`, `d164101`, `c7701a8`, `53c9f7e`, plus
this run's three). That is the floor this note predicted. Option 2's
structural invariant test would have caught the five exported ones; only
option 1, or a join-level convention enforced somewhere, catches the sixth
shape. Whoever takes this decision should weigh that.)**

**(2026-08-28: ten more, and a fourth shape that neither option would have
caught.** The 2026-08-25 note above says the class had taken eight fixes and
that the sixth shape — a missing organization term *inside* a join — needed
something stronger than a per-function parameter audit. This run found ten
further instances, and they are a different shape again: **the predicate was
never an id at all.** `data.roles.filter(r => r.isActive)`,
`opportunities.filter(o => o.status === 'open')`,
`opportunities.filter(o => o.department === 'Engineering')`, a
`learningResources` skill-id set membership, and `getSkills()`'s
`organizations[0]` default are all filters on *status*, and status is not
tenant-bounded. An audit that asks "does this exported function take an
organization?" returns *yes* for `getCareerPaths(employeeId)` — the employee
row carries one — and still misses it, because the function had the
organization in hand and simply did not use it in three of its four reads.

The distinguishing rule is short enough to be checkable, and worth writing
down because it is the fourth time this class has been re-derived from
scratch: **in this codebase, a read of a tenant-scoped table is safe only if
every predicate is an id that is itself already tenant-bounded. The moment a
predicate is a status, a flag, a department name or a set membership, the read
needs an explicit `organizationId` term.** By that rule the four shapes seen so
far — missing parameter, missing join term, status-only predicate, and a
first-row default — are one rule violated four ways rather than four separate
discoveries, and the rule is mechanically checkable in a way "does it take an
organization?" is not.

That does not change the recommendation. It sharpens it: option 2's structural
invariant should be stated over *predicates*, not over signatures. Ten
instances found in one night, in a file every prior run had already read, is
the strongest evidence yet that the application layer is carrying tenant
isolation alone and that spotting these by eye does not converge.)**

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
