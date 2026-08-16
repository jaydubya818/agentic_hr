# GrowthOS Security and Privacy

> **Status**: Canonical source of truth  
> **Version**: 1.0  
> **Last updated**: 2026-06-07  
> **Related docs**: [PRD.md](./PRD.md) | [BACKEND_STRUCTURE.md](./BACKEND_STRUCTURE.md) | [EVALS_AND_GOVERNANCE.md](./EVALS_AND_GOVERNANCE.md) | [TECH_STACK.md](./TECH_STACK.md)

---

## 1. Overview

GrowthOS handles sensitive employment-related data including skills profiles, career goals, growth plans, and manager coaching context. This document defines security principles, privacy controls, RBAC, data handling, and the MVP security checklist.

---

## 2. Security Principles

| Principle               | Implementation                                                           |
| ----------------------- | ------------------------------------------------------------------------ |
| Least privilege         | Users access minimum data for their role                                 |
| Defense in depth        | Middleware + service layer + RLS (Phase 8)                               |
| Secure by default       | Auth required for all app routes; deny on ambiguity                      |
| No secrets in client    | API keys server-side only                                                |
| Audit sensitive actions | All agent and recommendation events logged                               |
| Fail secure             | 403 on permission failure; no data leakage in errors                     |
| Input validation        | Zod on all API inputs, with length/size bounds on client-writable fields |
| Dependency hygiene      | Regular `npm audit`; all dependencies pinned to exact lockfile versions  |

---

## 3. Privacy Principles

| Principle            | Implementation                                                       |
| -------------------- | -------------------------------------------------------------------- |
| Data minimization    | Collect only workforce enablement data needed                        |
| Purpose limitation   | Data used for growth/mobility, not surveillance                      |
| Transparency         | Employees see their data; inferred skills labeled                    |
| Employee empowerment | Growth-focused outputs; no punitive labels                           |
| Consent              | Inferred skills visibility toggle; onboarding acknowledgment         |
| Right to context     | Employees can confirm/reject inferred skills (post-MVP confirm flow) |
| Retention limits     | Defined retention periods per data type                              |
| No sale of data      | Employment data never sold or used for ads                           |

---

## 4. Employee Data Handling

### 4.1 Data Categories

| Category        | Examples                        | Sensitivity | Encryption            |
| --------------- | ------------------------------- | ----------- | --------------------- |
| Identity        | Name, email, job title          | Medium      | At rest (Supabase)    |
| Skills          | Proficiency, source, confidence | Medium      | At rest               |
| Career          | Goals, growth plans             | Medium-High | At rest               |
| Manager context | Coaching prompts, notes         | High        | At rest               |
| Agent history   | Conversations, recommendations  | Medium      | At rest               |
| Audit           | Action logs                     | Medium      | At rest               |
| Auth            | Passwords, tokens               | High        | Supabase Auth managed |

### 4.2 Employee Rights (MVP)

| Right                             | MVP Support                  |
| --------------------------------- | ---------------------------- |
| View own data                     | Full profile access          |
| Edit career goal                  | Yes                          |
| Toggle inferred skills visibility | Yes (settings)               |
| Export own data                   | Post-MVP                     |
| Delete account                    | Org admin only (MVP)         |
| Dispute inferred skill            | Post-MVP confirm/reject flow |

### 4.3 Employee-Facing Privacy Copy (Onboarding)

> "GrowthOS uses your skills and career goals to suggest development opportunities. Some skills may be inferred from your profile and are always labeled. GrowthOS does not make employment decisions. You control whether inferred skills are visible to others."

---

## 5. Sensitive Data Boundaries

### 5.1 Never Store in GrowthOS (MVP)

- Social Security numbers / national IDs
- Bank account / payroll data
- Medical / disability records
- Performance review scores
- Compensation amounts
- Background check results
- Disciplinary records

### 5.2 Never Send to LLM

- Full audit logs with PII patterns
- Other employees' data (when employee agent invoked)
- Auth tokens or API keys
- Raw Supabase service role credentials

### 5.3 LLM Data Handling

- Send only scoped grounding data per agent (see [EVALS_AND_GOVERNANCE.md](./EVALS_AND_GOVERNANCE.md))
- Truncate conversation history to last N messages
- Use `employee_id` references, not full names in prompts where possible
- Log prompt hashes, not full prompts, in production audit (configurable — see §8.2)

### 5.4 AI Interaction Transparency

Agent chat surfaces disclose that the user is interacting with an AI system
(EU AI Act Article 50 transparency obligations, effective 2 August 2026):

- The agent panel shows a persistent notice that responses are AI-generated,
  may be inaccurate, and that GrowthOS agents never make employment decisions.
- Response provenance is labeled per message mode (`Mock mode`, `Live
response`, `Fallback (mock)`).

---

## 6. Role-Based Access Controls

### 6.1 Role Definitions

| Role                 | Description                                   |
| -------------------- | --------------------------------------------- |
| `employee`           | Default; access own growth data               |
| `manager`            | Access direct reports' growth data            |
| `hr_admin`           | Org-wide workforce analytics and audit        |
| `org_admin`          | Full org configuration and user management    |
| `executive_readonly` | Aggregated dashboards only; no individual PII |

### 6.2 Permission Examples

#### Example 1: Employee views own growth profile

```
User: alex@techforward.com
Roles: [employee]
Request: GET /api/employees/me/growth-profile
Result: ALLOW — own data
```

#### Example 2: Employee views colleague's profile

```
User: alex@techforward.com
Roles: [employee]
Request: GET /api/employees/other-id/growth-profile
Result: DENY 403
```

#### Example 3: Manager views direct report

```
User: jordan@techforward.com
Roles: [employee, manager]
Request: GET /api/manager/employees/alex-id/summary
Context: alex.manager_id = jordan.employee_id
Result: ALLOW
```

#### Example 4: Manager views non-report

```
User: jordan@techforward.com
Request: GET /api/manager/employees/stranger-id/summary
Context: stranger not in jordan's team
Result: DENY 403
```

#### Example 5: HR views org readiness

```
User: sam@techforward.com
Roles: [employee, hr_admin]
Request: GET /api/hr/skills-readiness
Result: ALLOW — org-scoped aggregates + drill-down
```

#### Example 6: Executive views individual employee

```
User: exec@techforward.com
Roles: [executive_readonly]
Request: GET /api/manager/employees/alex-id/summary
Result: DENY 403 — aggregates only
```

#### Example 7: Manager invokes agent for team

```
User: jordan@techforward.com
Request: POST /api/agents/supermanager/invoke
Context: { employeeId: alex-id } (direct report)
Result: ALLOW — scoped to alex
```

#### Example 8: Employee invokes supermanager agent

```
User: alex@techforward.com
Request: POST /api/agents/supermanager/invoke
Result: DENY 403 — wrong agent for role
```

### 6.3 Row Level Security Policies (Phase 8)

```sql
-- Example: employees can read own record
CREATE POLICY employee_read_own ON employees
  FOR SELECT USING (
    user_id = auth.uid()::text::uuid  -- via users.auth_user_id mapping
  );

-- Example: managers read direct reports
CREATE POLICY manager_read_team ON employees
  FOR SELECT USING (
    manager_id IN (
      SELECT e.id FROM employees e
      JOIN users u ON u.id = e.user_id
      WHERE u.auth_user_id = auth.uid()
    )
  );
```

_Full RLS policies implemented in Phase 8 migrations._

---

## 7. Consent Model

### 7.1 Onboarding Consent

Step 1 of onboarding includes acknowledgment checkbox:

- [ ] I understand GrowthOS uses AI for development recommendations
- [ ] I understand some skills may be inferred and labeled as such

Stored: `employee_profiles.preferences.consent_ai_recommendations_at`

### 7.2 Inferred Skills Visibility

Setting: `employee_profiles.inferred_skills_visible` (default: `true`)

When `false`:

- Inferred skills hidden from manager/HR views
- Employee still sees own inferred skills
- Gap analysis uses only confirmed skills for external views

### 7.3 Future Consent (Post-MVP)

- Opt-in to org-wide skill inference campaigns
- Data export request
- Third-party integration consent

---

## 8. Audit Logging

### 8.1 What Gets Logged

| Category               | Actions                                                                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Auth                   | login, logout, failed_login                                                                                                       |
| Data                   | profile_update, goal_update, plan_activate                                                                                        |
| Recommendations        | created, accepted, dismissed                                                                                                      |
| Agents                 | invoked, blocked, error                                                                                                           |
| Workforce intelligence | decision.created, decision.updated, decision.outcome_recorded, team_scenario.created, team_scenario.updated, agent_action.updated |
| Admin                  | role_granted, user_deactivated                                                                                                    |
| Demo                   | role_switched                                                                                                                     |

### 8.2 What Does NOT Get Logged

- Full LLM prompt/response text in production (configurable; hashes only)
- Passwords or tokens
- Unnecessary PII in `details` JSON

`agent.invocation` and `agent.response` are the only events that ever carry
agent chat text. `src/lib/audit/agent-content.ts` enforces the rule above: the
200-character preview is stored outside production, and in production the
value becomes a stable `sha256:<hex>` digest instead. `AUDIT_LOG_AGENT_CONTENT`
(`true`/`false`) overrides the default in either direction — set it to `true`
only for a demo environment seeded with fictional employees.

This matters because agent chat is the employee's own words (career doubts,
manager friction, mobility interest) and every `hr_admin` can read and
CSV-export the whole audit trail.

### 8.3 Audit Access

- `hr_admin` and `org_admin`: read access
- `employee` / `manager`: no audit access (MVP)
- Retention: 2 years (see Section 11)

---

## 9. Data Minimization

| Practice      | Detail                                |
| ------------- | ------------------------------------- |
| API responses | Return only fields needed for UI      |
| Agent prompts | Include only relevant skills/goals    |
| HR aggregates | No individual names in executive view |
| Logs          | Entity IDs, not full records          |
| Mock data     | No real PII in fixtures               |

---

## 10. Encryption Expectations

| Layer          | Requirement                             |
| -------------- | --------------------------------------- |
| In transit     | TLS 1.2+ (Vercel + Supabase default)    |
| At rest        | Supabase Postgres encryption (AES-256)  |
| Backups        | Supabase managed encrypted backups      |
| Client storage | No sensitive data in localStorage       |
| Cookies        | httpOnly, secure, sameSite=lax for auth |

---

## 11. Data Retention

| Data Type           | Retention                  | Deletion                 |
| ------------------- | -------------------------- | ------------------------ |
| Employee profile    | Active employment + 1 year | Org admin request        |
| Growth plans        | 3 years after archive      | Automated job (post-MVP) |
| Recommendations     | 2 years                    | Automated job (post-MVP) |
| Agent conversations | 90 days default            | Configurable per org     |
| Audit logs          | 2 years                    | Archive then delete      |
| Auth sessions       | Supabase default           | Auto-expire              |

MVP: Manual deletion; automated retention jobs in post-MVP.

**Implementation status (2026-08-15): this table is policy, not an implemented
control.** Nothing in `src/` enforces a retention period today:

- No deletion or erasure endpoint exists for employee profiles, growth plans,
  recommendations, or agent conversations. The only delete path in the codebase
  removes a single rejected inferred skill
  (`src/services/inferred-skill-service.ts`).
- Audit entries are never expired. The in-memory fallback store caps itself at
  5000 entries (`MAX_IN_MEMORY_AUDIT_ENTRIES`) purely to bound demo-server
  memory; the Postgres table grows without limit, and the 2-year / 90-day rows
  above are not differentiated in code.
- "Manual deletion" therefore means direct database work by an operator, which
  should be assumed for any pilot that ingests real employee records.

Closing this gap needs a retention job plus an erasure path per data type;
until then, do not represent retention limits as an implemented control in
pilot or procurement conversations.

---

## 12. Environment Variable Handling

### 12.1 Variable Classification

| Variable                        | Classification         | Exposure         |
| ------------------------------- | ---------------------- | ---------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Public                 | Client bundle OK |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (RLS-protected) | Client bundle OK |
| `SUPABASE_SERVICE_ROLE_KEY`     | **Secret**             | Server only      |
| `DATABASE_URL`                  | **Secret**             | Server only      |
| `OPENAI_API_KEY`                | **Secret**             | Server only      |
| `ANTHROPIC_API_KEY`             | **Secret**             | Server only      |
| `USE_MOCK_DATA`                 | Internal               | Server only      |

### 12.2 Rules

- Store secrets in `.env.local` (gitignored) locally
- Store in Vercel Environment Variables for deployment
- Never commit `.env` files
- Never log env var values
- Rotate keys on team member departure
- `NEXT_PUBLIC_*` must never contain secrets

### 12.3 `.env.example` (Phase 1)

```bash
# Public (client-safe)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server-only secrets
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
OPENAI_API_KEY=

# Feature flags
USE_MOCK_DATA=true
USE_MOCK_AGENTS=true
```

---

## 13. API Key Handling

| Rule          | Detail                                               |
| ------------- | ---------------------------------------------------- |
| Location      | `src/lib/ai/providers/` server-side only             |
| Import guard  | Never import provider in `'use client'` files        |
| Rate limiting | Agent endpoints: 20 req/min/user (Phase 9)           |
| Key rotation  | Document in runbook; no downtime rotation via Vercel |
| Mock mode     | No API keys required when `USE_MOCK_AGENTS=true`     |

---

## 14. Security Risks

| Risk                                                               | Likelihood | Impact   | Mitigation                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------ | ---------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IDOR on employee endpoints                                         | Medium     | High     | Session scope checks; RLS                                                                                                                                                                                                                                                        |
| LLM prompt injection                                               | Medium     | Medium   | Input sanitization; governance filter                                                                                                                                                                                                                                            |
| API key exposure                                                   | Low        | Critical | Server-only; env vars; code review                                                                                                                                                                                                                                               |
| Over-permissive RLS                                                | Medium     | High     | Policy review; integration tests                                                                                                                                                                                                                                                 |
| Agent outputs PII leak                                             | Low        | High     | Governance; no cross-employee data                                                                                                                                                                                                                                               |
| Demo role switch in prod                                           | Low        | Medium   | Live mode requires the database-backed role before switching; the active role is clamped to held roles on every request                                                                                                                                                          |
| Cross-team writes via crafted IDs                                  | Medium     | High     | Team-scenario and workforce-decision writes validate that the target team belongs to the organization and is managed by the caller (unless the role has org-wide access), and that decision owners are in-organization employees; scope violations return 403                    |
| Participant-only decision edits                                    | Medium     | Medium   | Decision updates and outcome recording require the decision owner, the manager of the decision's team, or an org-wide role; participation alone grants read access only                                                                                                          |
| Login credential stuffing                                          | Medium     | High     | Live-mode password login is throttled per email (10 attempts / 15 minutes, 429 with Retry-After); successful login clears the counter                                                                                                                                            |
| Action plans targeting arbitrary employees                         | Medium     | High     | Action-plan creation validates that the plan team is managed by the caller and that the plan employee and every proposed-action target are the caller, a direct report, or covered by an org-wide role                                                                           |
| Account takeover via unverified email linking                      | Low        | Critical | Live-mode session resolution only links a database user to a Supabase auth user by email when the provider reports the email as confirmed                                                                                                                                        |
| Internal error text leaking in API responses                       | Medium     | Medium   | Workforce write routes map only Zod issues, malformed JSON, and known scope messages to 4xx bodies via a shared helper; unexpected errors surface as generic 500s                                                                                                                |
| Cross-organization reads via context graphs or agent grounding     | Low        | High     | Context-graph endpoints resolve targets only within the caller's organization (cross-org ids read as 404), and agent invocation rejects a known employee context from another organization before grounding                                                                      |
| Cross-organization reads via workforce-intelligence scenario pages | Low        | High     | Role-evolution scenario lookups and team-scenario comparisons filter by the session organization; foreign-organization ids render as 404 with empty comparison deltas                                                                                                            |
| Failed audit-log loads misread as an empty audit trail             | Low        | Medium   | The HR audit page distinguishes load failures from an empty log and shows an explicit error instead of "no events"                                                                                                                                                               |
| Pages grounded on demo fixtures in live mode                       | Medium     | High     | Employee, manager, and HR pages resolve the acting employee, manager, and organization from the session; demo-fixture identities apply only in mock mode, and a live session without a matching record renders an empty state or redirects instead of showing fixture-keyed data |
| Forged active-role cookie reaching HR/manager pages                | Medium     | High     | Beyond the cookie-based middleware guard, the HR and manager route-group layouts re-check the session's roles server-side (database-backed in live mode) and redirect to /forbidden when the role does not grant the subtree                                                     |
| Applying a proposed action to the wrong employee's growth plan     | Low        | Medium   | Growth-plan application pins targeted actions to their recorded target employee; the request body's employeeId only selects the employee for plan-level actions, and the permission check runs against the effective target                                                      |
| Duplicate growth-plan items via repeated apply requests            | Low        | Medium   | The first apply flips the action to `applied` and later applies return 409; an apply request carrying any other status is rejected (400) so the caller cannot overwrite the flip and reopen the action                                                                           |
| Cross-team updates to plan-level proposed actions                  | Medium     | Medium   | Actions without a target employee may only be updated by an org-wide role or a manager within the plan's scope (manages the plan's team, or the plan's employee is themselves or a direct report); plans with neither remain org-wide only                                       |
| Oversized write payloads exhausting memory or storage              | Low        | Medium   | Workforce-intelligence write schemas bound every free-text field (300 chars short-form, 5000 long-form) and cap schemaless `metadata` records at 16 KB serialized; agent messages and login credentials carry their own length limits                                            |
| Open redirect via the login `next` parameter                       | Low        | Medium   | The post-login destination is client-validated against an allowlist shape: same-origin absolute paths only (external URLs, `//host` and `/\\host` forms, `/api`, `/login`, and the role-gated `/hr` and `/manager` subtrees are ignored in favor of the server default)          |
| Rate-limit tracking table exhaustion                               | Low        | Medium   | Login and agent-invocation limiters bound their in-memory key tables (1000 keys) and fail closed (429) for new keys while the table is saturated with in-window activity, so distributed key floods cannot grow memory or bypass throttling                                      |
| Dependency vulnerability                                           | Medium     | Medium   | npm audit; Dependabot                                                                                                                                                                                                                                                            |
| npm supply-chain worm (Shai-Hulud, Aug 2026)                       | Low        | Critical | Committed lockfile (lockfileVersion 3) pins every transitive version; install with `npm ci` so the lockfile is authoritative; audit below found no compromised versions in the tree; `.npmrc` disables npm install scripts, the worm's execution vector (see 14.2)               |

### 14.1 npm supply-chain audit (2026-08-08)

Prompted by the Shai-Hulud npm worm disclosed 2026-08-04 (compromised
`keyv` releases plus 400+ downstream packages, with payloads hidden in
AI-agent/IDE config files and credential harvesting on install):

- `keyv` appears in the tree only as a dev-only transitive dependency
  (`eslint` → `flat-cache` → `keyv`), locked to 4.5.4 — a long-standing
  release, not one of the recently published compromised versions.
- No `cacheable-request` or `got` chains (the other known infection
  paths) resolve anywhere in `package-lock.json`.
- The lockfile is committed with exact resolved URLs, so `npm ci`
  installs cannot silently pick up newly published versions.
- Agent/IDE config directories were inspected: `.cursor/` contains only
  inert JSON hook state (no scripts or obfuscated content), and no
  `.claude/` executable configuration is present.

Re-run this audit when bumping `eslint` or adding any dependency that
pulls `keyv`, `cacheable-request`, or `got`. Prefer `npm ci` over
`npm install` in every environment that does not intend to change
dependencies.

### 14.2 Install-script hardening (2026-08-09)

The ChainDrop/Shai-Hulud campaign (Aug 4–5 2026 wave) executed through
malicious `preinstall` scripts in compromised releases (`keyv@6.0.0`,
`flat-cache@6.1.24`, `file-entry-cache@11.1.6`, `@cacheable/*`, and 400+
downstream packages; the `axios` publisher account was also compromised).
A re-audit of `package-lock.json` on 2026-08-09 confirms the tree is still
clean: `keyv@4.5.4`, `flat-cache@4.0.1`, and `file-entry-cache@8.0.0` are
the only packages from the affected families, all dev-only transitives of
`eslint` that predate the compromised releases, and no `axios`,
`cache-manager`, `cacheable`, or `@cacheable/*` package resolves at all.

As defense in depth, `.npmrc` now sets `ignore-scripts=true`, so npm never
runs dependency lifecycle scripts (`preinstall`/`install`/`postinstall`) —
the execution vector for this class of worm.

Tradeoff: a dependency that relies on an install script to build or fetch
native binaries will not run it. None of the current dependencies need
install scripts (Next.js SWC, Tailwind Oxide, and esbuild all ship prebuilt
platform binaries as optional dependencies). If a future dependency breaks
under this setting, review its script and run `npm rebuild <package>` to
execute scripts for that one package. `npm run <script>` (dev, build, test)
is unaffected; npm would skip `pre`/`post` hooks on our own scripts, but
this package.json defines none.

### 14.3 Supply-chain re-audit (2026-08-15)

Re-ran the 14.1/14.2 checks against the committed lockfile
(`lockfileVersion: 3`, 864 resolved packages). Result: unchanged and clean.

| Package            | Resolved | Compromised release | Reachable? |
| ------------------ | -------- | ------------------- | ---------- |
| `keyv`             | 4.5.4    | 6.0.0               | No         |
| `flat-cache`       | 4.0.1    | 6.1.24              | No         |
| `file-entry-cache` | 8.0.0    | 11.1.6              | No         |

New this pass: the declared semver ranges, not just the pinned versions,
sit below the compromised majors — `eslint` asks for
`file-entry-cache: ^8.0.0`, which asks for `flat-cache: ^4.0.0`, which asks
for `keyv: ^4.5.4`. A plain `npm install` therefore cannot resolve into the
compromised releases either; `npm ci` remains the rule regardless.

Also absent from the tree: `cacheable`, `@cacheable/*`, `cacheable-request`,
`got`, `axios`, `cache-manager`. `chalk` resolves to 4.1.2 / 5.6.2 and `debug`
to 4.4.3 / 3.2.7 — all after the 2025 publisher-compromise republish, none on
a compromised version.

All three affected packages remain **dev-only transitives of `eslint`**; none
ship in the deployed bundle.

### 14.4 Framework patch status (2026-08-15)

`next` is pinned at **15.5.22**. The July 2026 scheduled release patched nine
CVEs in **16.2.11** and, on the maintenance line, **15.5.21** — so this repo is
already above the patched 15.5 release and is not exposed to CVE-2026-64645
(SSRF via request-controlled rewrite destinations), the Server Actions DoS, or
the internal Server Function endpoint disclosure. CVE-2026-64642
(middleware/proxy bypass) requires the 16.x line with App Router + Turbopack +
a single `config.i18n.locales` entry; this repo is on 15.5 and configures no
`i18n` block, so it is doubly out of scope.

### 14.5 Known-vulnerability audit (2026-08-16)

`next` and `eslint-config-next` moved 15.5.22 → **15.5.23**, the current
release on the 15.5 maintenance line (npm dist-tag `backport`). 14.4 otherwise
still holds.

`npm audit` reports 7 findings on the resulting lockfile — 3 high, 4 moderate.
None are fixable without a breaking change, and none are reachable here:

| Advisory                                 | Sev      | Resolved path                            |
| ---------------------------------------- | -------- | ---------------------------------------- |
| `postcss` <=8.5.22 (4 advisories)        | high     | `next/node_modules/postcss` @ 8.4.31     |
| `sharp` <0.35.0 (libvips CVEs)           | high     | `sharp` @ 0.34.5, optional dep of `next` |
| `esbuild` <=0.24.2 (GHSA-67mh-4wv8-2f99) | moderate | `drizzle-kit` → `@esbuild-kit/*`         |

- **postcss** — `next` pins this copy exactly, so it cannot be bumped from
  here. All four advisories need attacker-controlled CSS (`sourceMappingURL`
  path traversal and arbitrary `.map` disclosure, XSS via an unescaped
  `</style>`); our CSS is first-party and processed only at build time. The
  separate **top-level** `postcss` that Tailwind uses resolves to 8.5.26,
  which is patched.
- **sharp** — `next/image` is not used anywhere in `src/`, and
  `next.config.ts` declares no `images.remotePatterns`, so the image optimizer
  never runs. `next` declares `^0.34.3`; an override past that range is
  unsupported by the framework.
- **esbuild** — dev-only. The advisory concerns the esbuild **dev server**
  accepting requests from any origin; `drizzle-kit` uses esbuild to bundle
  `drizzle.config.ts` and starts no server. It never ships in the bundle.

`npm audit fix --force` would install `next@16.3.1` and downgrade
`drizzle-kit` to `0.18.1`; both are breaking and neither is justified by the
reachability analysis above. Re-check when the repo next moves to the 16.x
line.

---

## 15. Privacy Risks

| Risk                            | Likelihood | Impact   | Mitigation                                   |
| ------------------------------- | ---------- | -------- | -------------------------------------------- |
| Inferred skills harm employee   | Medium     | High     | Labeling; visibility toggle; empowering copy |
| Manager surveillance perception | Medium     | Medium   | Growth-focused UI; no monitoring language    |
| Biased AI recommendations       | Medium     | High     | Fairness evals; governance                   |
| Data retention beyond need      | Medium     | Medium   | Retention policy is documented in Section 11 but **not implemented**: no retention job and no erasure endpoint exist, so records persist until an operator deletes them by hand. Treat as an open gap for any pilot handling real employee data |
| Cross-org data leak             | Low        | Critical | organization_id on all queries; RLS          |

---

## 16. MVP Security Checklist

### 16.1 Authentication

- [ ] All `(app)` routes require valid session
- [ ] `/api/*` routes validate session (except health check)
- [ ] Logout clears session
- [ ] Password minimum length enforced (Supabase settings: 8+)

### 16.2 Authorization

- [ ] Middleware enforces role per route group
- [ ] Manager endpoints verify direct report relationship
- [ ] HR endpoints require `hr_admin` or `org_admin`
- [ ] Agent endpoints validate agent-role pairing
- [ ] 403 responses do not leak existence of records

### 16.3 Data Protection

- [ ] No secrets in `NEXT_PUBLIC_*` vars
- [ ] No API keys in client bundle (verify with build scan)
- [ ] Zod validation on all POST/PATCH bodies
- [ ] SQL via Drizzle only (no raw string concatenation)

### 16.4 Supabase (Phase 8)

- [ ] RLS enabled on all tables
- [ ] Policies tested per role
- [ ] Service role key used only in server contexts
- [ ] Anon key used client-side with RLS

### 16.5 AI Security (Phase 9)

- [ ] LLM calls server-side only
- [ ] Governance runs on all outputs
- [ ] Rate limiting on agent endpoints
- [ ] No employee PII in eval fixtures committed to repo

### 16.6 Operational

- [ ] `.env.local` in `.gitignore`
- [ ] `.env.example` has no real values
- [ ] HTTPS enforced (Vercel default)
- [ ] Error pages show generic messages in production

### 16.7 Framework security advisories (status 2026-08-06)

- **RSC deserialization RCE (CVE-2025-55182 / CVE-2025-66478, Dec 2025):** the
  vulnerable `react-server-dom-*` code ships bundled inside Next.js; the fix is
  taken by upgrading `next`, not the `react`/`react-dom` entries in
  `package.json`. Patched here via the 15.5 backport channel (currently
  **15.5.22**).
- **15.5 backport line:** 15.5.22 also covers the 2026 advisory batch fixed in
  15.5.21 (Server Action SSRF/DoS, response-body cache confusion, middleware
  bypass, image-optimization DoS).
- **Ongoing rule:** Next.js security fixes land on 16.2.x first and are
  backported to 15.5.x. Stay on the newest 15.5.x until the planned migration
  to the 16.2.x line (16.2.11+); check advisories before each release.

### 16.8 HTTP response headers (`next.config.ts`)

All routes send this baseline via the `headers()` config:

| Header                      | Value                                                        | Purpose                                                                                                                                               |
| --------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Content-Security-Policy`   | `frame-ancestors 'none'; object-src 'none'; base-uri 'self'` | Blocks embedding, plugin content, and `<base>` hijacking. Deliberately omits `script-src`/`style-src`, which need nonce plumbing and a verified build |
| `X-Content-Type-Options`    | `nosniff`                                                    | Disables MIME sniffing                                                                                                                                |
| `X-Frame-Options`           | `DENY`                                                       | Clickjacking fallback for agents without CSP `frame-ancestors`                                                                                        |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                            | Limits referrer leakage                                                                                                                               |
| `Strict-Transport-Security` | `max-age=31536000`                                           | Pins HTTPS after first visit                                                                                                                          |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()`                   | Denies unused sensor APIs                                                                                                                             |

`poweredByHeader: false` additionally suppresses the default
`X-Powered-By: Next.js` response header, so the framework is not advertised on
every response.

When a full CSP (with `script-src` nonces) is introduced, verify it against a
production build before shipping — inline bootstrapping in Next.js breaks
under a naive policy.

---

## 17. Incident Response (Outline)

| Step | Action                                      |
| ---- | ------------------------------------------- |
| 1    | Identify scope (data types, users affected) |
| 2    | Rotate compromised keys immediately         |
| 3    | Review audit logs for unauthorized access   |
| 4    | Notify org admin / HR per contract          |
| 5    | Document incident; update controls          |

_Full IR plan post-MVP for enterprise customers._

---

## 18. Workforce Intelligence privacy (Phase WI)

- **Decision rationale:** Visible to decision owner, scoped managers, and HR; not to unrelated employees.
- **Deliberation:** Employees do not access manager decision-memory routes in this phase.
- **Team scenarios:** Manager team scope; HR org scope; employees only if explicitly published to growth surfaces.
- **Outcomes:** Recorded by authorized roles; aggregated in organizational learning without individual narrative exposure.
- **Retention:** Decision and outcome records follow org audit retention policy; fixtures are fictional demo data.

---

## 19. Cross-References

- RBAC data model: [BACKEND_STRUCTURE.md](./BACKEND_STRUCTURE.md) Section 6
- AI governance: [EVALS_AND_GOVERNANCE.md](./EVALS_AND_GOVERNANCE.md)
- Tech env setup: [TECH_STACK.md](./TECH_STACK.md) Section 11
- Permission UX: [APP_FLOW.md](./APP_FLOW.md) Section 11
