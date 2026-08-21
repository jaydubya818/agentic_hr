# Nightly backlog

Initiatives found by the scheduled maintenance runs that are too large, too
risky, or too product-dependent to land inside a single nightly window. Runs
read this file first to avoid re-proposing work that is already tracked here.

## Open

- [ ] 2026-08-21 — Replace regex-only governance filtering with a normalize-then-match pipeline — the filter is bypassed by Unicode tricks that no additional keyword pattern can catch; see "Design note" below.
- [ ] 2026-08-21 — ESLint 9 → 10 is blocked by `eslint-config-next@15.5.23` — the 9.x line is EOL (2026-08-06) but the upgrade is coupled to the Next 16 migration; see "Design note" below.
- [ ] 2026-08-21 — Raise the `engines.node` floor off Node 20 — Node 20 reached EOL on 2026-04-30, so `engines.node: ">=20"` and `@types/node@20.19.42` both advertise support for an unsupported runtime.
- [ ] 2026-08-21 — Decide whether `executive_readonly` may read the workforce decision **list** — the single-record leak is closed (see Closed), but `filterDecisionsForSession` still returns every decision in the organization to the role. Each row carries `ownerEmployeeId`, so "aggregate" is doing some work in `BACKEND_STRUCTURE` 6.1 that the list endpoint does not honour. Narrowing it changes what the executive dashboard can render, so it is a product question, not a patch.

## Closed

- [x] 2026-08-21 — `executive_readonly` could read an individual workforce decision — closed by `54de61d`. `GET /api/decisions/[id]` now gates on `canReadIndividualEmployeeData`, so the role gets the 403 that `SECURITY_AND_PRIVACY` 6.2 Example 6 requires. Scoped deliberately to the single-record read; the list question is still open above.

## Checked, not applicable

- 2026-08-21 — Next.js May and July 2026 security releases — the 15.x fixed versions are 15.5.18 and 15.5.21; this repo pins **15.5.23**, which is ahead of both. Per-advisory reachability is already recorded in `SECURITY_AND_PRIVACY.md` §14.9, and the version reasoning in §14.8. Do not re-check unless the pin moves backwards.
- 2026-08-21 — Committed secrets — no Supabase `service_role` key, JWT, or Postgres connection string is committed. `.env*` is gitignored (`!.env.example`), and `.env.example` ships empty values only. The two `postgres://` strings in the tree are `drizzle.config.ts`'s localhost default and a test fixture.
- 2026-08-21 — Real PII in seed data — `drizzle/seed/seed-mock-data.ts` and `data/mock/` use synthetic personas at the fictional `techforward.io` domain (Alex Chen, Jordan Lee, Morgan Kim, Riley Nguyen, Sam Patel, `engineer1..7`). No SSNs, phone numbers, or real addresses.
- 2026-08-21 — Agent-harness control-plane invariants 1–3 ("deterministic code owns the graph", "agents are bounded nodes", "typed envelopes are the only cross-phase channel") — **the premise does not hold here.** This is a product with an agent feature, not an agent harness: there is no multi-phase graph for code to own. `invokeAgent` is a single call with no phase sequencing, no retry policy, and no inter-agent handoff, so there is no sequencing for an agent to usurp. Invariant 3 was applied in the small where a boundary does exist (`bff9848` carries the scanned text in the governance result rather than letting the audit stage re-derive it). Do not re-open unless the product grows real multi-step agent orchestration.
- 2026-08-21 — Agent-harness invariant 4, "code-checked gates replace self-certification", as applied to `src/evals` — **already satisfied; no change needed.** All three eval files (`agent-eval`, `workforce-intelligence-eval`, `enablement-qa-eval`) assert with `expect` against fixtures and pure functions (`findProhibitedMatches`, `validateAgentOutput`, `validateActionPlan`, `filterDisallowedActions`). Nothing anywhere in the suite reads a model's claim of success, a self-reported score, or an LLM-as-judge verdict. The evals are deterministic and offline. Invariant 4 *did* find a real gap outside the eval directory, in RBAC — see Closed.
- 2026-08-21 — "Gains live in tools, middleware and memory, not the system prompt" — **already the architecture.** The prohibited-content control is deterministic code (`findProhibitedMatches` over `PROHIBITED_PATTERNS`) that runs on the model's output and cannot be talked out of blocking; the prompt layer only *also* asks for good behaviour. That is the structural-over-prose ordering the article argues for. The one caveat is that evals EV-03/EV-04 assert on prompt *wording* (`toMatch(/confidence/i)`), which is the weak prose layer — but they are cheap regression guards on a real requirement, not a substitute for the code gate, so rewriting them would be churn. Do not re-check.

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

### What the second 2026-08-21 run did instead

Commit `bff9848` did not touch what the filter blocks. It made the filter's
decisions *attributable*: `agent.invocation` now records
`scannedContentPreview`, a digest of the exact string the patterns ran
against, alongside the verdict. Before that, a bypassed input and a clean one
both logged `matchedPatterns: []` and were byte-identical in the audit trail,
so none of the seven bypasses above would leave any trace to count. They are
now at least distinguishable after the fact, which is what makes it possible
to measure how often this happens before deciding how aggressive the
canonicalization needs to be. When the pipeline below lands, that same field
should carry the canonical form.

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
