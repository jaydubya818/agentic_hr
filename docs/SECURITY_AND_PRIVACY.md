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

| Principle | Implementation |
|-----------|----------------|
| Least privilege | Users access minimum data for their role |
| Defense in depth | Middleware + service layer + RLS (Phase 8) |
| Secure by default | Auth required for all app routes; deny on ambiguity |
| No secrets in client | API keys server-side only |
| Audit sensitive actions | All agent and recommendation events logged |
| Fail secure | 403 on permission failure; no data leakage in errors |
| Input validation | Zod on all API inputs |
| Dependency hygiene | Regular `npm audit`; all dependencies pinned to exact lockfile versions |

---

## 3. Privacy Principles

| Principle | Implementation |
|-----------|----------------|
| Data minimization | Collect only workforce enablement data needed |
| Purpose limitation | Data used for growth/mobility, not surveillance |
| Transparency | Employees see their data; inferred skills labeled |
| Employee empowerment | Growth-focused outputs; no punitive labels |
| Consent | Inferred skills visibility toggle; onboarding acknowledgment |
| Right to context | Employees can confirm/reject inferred skills (post-MVP confirm flow) |
| Retention limits | Defined retention periods per data type |
| No sale of data | Employment data never sold or used for ads |

---

## 4. Employee Data Handling

### 4.1 Data Categories

| Category | Examples | Sensitivity | Encryption |
|----------|----------|-------------|------------|
| Identity | Name, email, job title | Medium | At rest (Supabase) |
| Skills | Proficiency, source, confidence | Medium | At rest |
| Career | Goals, growth plans | Medium-High | At rest |
| Manager context | Coaching prompts, notes | High | At rest |
| Agent history | Conversations, recommendations | Medium | At rest |
| Audit | Action logs | Medium | At rest |
| Auth | Passwords, tokens | High | Supabase Auth managed |

### 4.2 Employee Rights (MVP)

| Right | MVP Support |
|-------|-------------|
| View own data | Full profile access |
| Edit career goal | Yes |
| Toggle inferred skills visibility | Yes (settings) |
| Export own data | Post-MVP |
| Delete account | Org admin only (MVP) |
| Dispute inferred skill | Post-MVP confirm/reject flow |

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
- Log prompt hashes, not full prompts, in production audit (configurable)

---

## 6. Role-Based Access Controls

### 6.1 Role Definitions

| Role | Description |
|------|-------------|
| `employee` | Default; access own growth data |
| `manager` | Access direct reports' growth data |
| `hr_admin` | Org-wide workforce analytics and audit |
| `org_admin` | Full org configuration and user management |
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

*Full RLS policies implemented in Phase 8 migrations.*

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

| Category | Actions |
|----------|---------|
| Auth | login, logout, failed_login |
| Data | profile_update, goal_update, plan_activate |
| Recommendations | created, accepted, dismissed |
| Agents | invoked, blocked, error |
| Workforce intelligence | decision.created, decision.updated, decision.outcome_recorded, team_scenario.created, team_scenario.updated, agent_action.updated |
| Admin | role_granted, user_deactivated |
| Demo | role_switched |

### 8.2 What Does NOT Get Logged

- Full LLM prompt/response text in production (configurable; hashes only)
- Passwords or tokens
- Unnecessary PII in `details` JSON

### 8.3 Audit Access

- `hr_admin` and `org_admin`: read access
- `employee` / `manager`: no audit access (MVP)
- Retention: 2 years (see Section 11)

---

## 9. Data Minimization

| Practice | Detail |
|----------|--------|
| API responses | Return only fields needed for UI |
| Agent prompts | Include only relevant skills/goals |
| HR aggregates | No individual names in executive view |
| Logs | Entity IDs, not full records |
| Mock data | No real PII in fixtures |

---

## 10. Encryption Expectations

| Layer | Requirement |
|-------|-------------|
| In transit | TLS 1.2+ (Vercel + Supabase default) |
| At rest | Supabase Postgres encryption (AES-256) |
| Backups | Supabase managed encrypted backups |
| Client storage | No sensitive data in localStorage |
| Cookies | httpOnly, secure, sameSite=lax for auth |

---

## 11. Data Retention

| Data Type | Retention | Deletion |
|-----------|-----------|----------|
| Employee profile | Active employment + 1 year | Org admin request |
| Growth plans | 3 years after archive | Automated job (post-MVP) |
| Recommendations | 2 years | Automated job (post-MVP) |
| Agent conversations | 90 days default | Configurable per org |
| Audit logs | 2 years | Archive then delete |
| Auth sessions | Supabase default | Auto-expire |

MVP: Manual deletion; automated retention jobs in post-MVP.

---

## 12. Environment Variable Handling

### 12.1 Variable Classification

| Variable | Classification | Exposure |
|----------|----------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Client bundle OK |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (RLS-protected) | Client bundle OK |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Server only |
| `DATABASE_URL` | **Secret** | Server only |
| `OPENAI_API_KEY` | **Secret** | Server only |
| `ANTHROPIC_API_KEY` | **Secret** | Server only |
| `USE_MOCK_DATA` | Internal | Server only |

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

| Rule | Detail |
|------|--------|
| Location | `src/lib/ai/providers/` server-side only |
| Import guard | Never import provider in `'use client'` files |
| Rate limiting | Agent endpoints: 20 req/min/user (Phase 9) |
| Key rotation | Document in runbook; no downtime rotation via Vercel |
| Mock mode | No API keys required when `USE_MOCK_AGENTS=true` |

---

## 14. Security Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| IDOR on employee endpoints | Medium | High | Session scope checks; RLS |
| LLM prompt injection | Medium | Medium | Input sanitization; governance filter |
| API key exposure | Low | Critical | Server-only; env vars; code review |
| Over-permissive RLS | Medium | High | Policy review; integration tests |
| Agent outputs PII leak | Low | High | Governance; no cross-employee data |
| Demo role switch in prod | Low | Medium | Live mode requires the database-backed role before switching; the active role is clamped to held roles on every request |
| Cross-team writes via crafted IDs | Medium | High | Team-scenario and workforce-decision writes validate that the target team belongs to the organization and is managed by the caller (unless the role has org-wide access), and that decision owners are in-organization employees; scope violations return 403 |
| Participant-only decision edits | Medium | Medium | Decision updates and outcome recording require the decision owner, the manager of the decision's team, or an org-wide role; participation alone grants read access only |
| Login credential stuffing | Medium | High | Live-mode password login is throttled per email (10 attempts / 15 minutes, 429 with Retry-After); successful login clears the counter |
| Action plans targeting arbitrary employees | Medium | High | Action-plan creation validates that the plan team is managed by the caller and that the plan employee and every proposed-action target are the caller, a direct report, or covered by an org-wide role |
| Account takeover via unverified email linking | Low | Critical | Live-mode session resolution only links a database user to a Supabase auth user by email when the provider reports the email as confirmed |
| Internal error text leaking in API responses | Medium | Medium | Workforce write routes map only Zod issues, malformed JSON, and known scope messages to 4xx bodies via a shared helper; unexpected errors surface as generic 500s |
| Dependency vulnerability | Medium | Medium | npm audit; Dependabot |

---

## 15. Privacy Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Inferred skills harm employee | Medium | High | Labeling; visibility toggle; empowering copy |
| Manager surveillance perception | Medium | Medium | Growth-focused UI; no monitoring language |
| Biased AI recommendations | Medium | High | Fairness evals; governance |
| Data retention beyond need | Low | Medium | Retention policy |
| Cross-org data leak | Low | Critical | organization_id on all queries; RLS |

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

---

## 17. Incident Response (Outline)

| Step | Action |
|------|--------|
| 1 | Identify scope (data types, users affected) |
| 2 | Rotate compromised keys immediately |
| 3 | Review audit logs for unauthorized access |
| 4 | Notify org admin / HR per contract |
| 5 | Document incident; update controls |

*Full IR plan post-MVP for enterprise customers.*

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
