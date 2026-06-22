# Pilot Persistence Release

## Goal

Move GrowthOS from mock demo to pilot-ready persistence while preserving mock fallback.

## Scope

1. Apply Supabase migrations
2. Seed demo data
3. Replace mock auth/session with Supabase Auth where safe
4. Verify RLS with role matrix tests
5. Persist recommendations
6. Persist recommendation accept/dismiss state
7. Persist audit logs
8. Preserve mock fallback mode
9. Keep all validation passing

## Non-Goals

- Do not add new product features
- Do not add new agents
- Do not add new routes unless `APP_FLOW.md` is updated first
- Do not expand LLM usage to high-risk workflows
- Do not remove mock mode
- Do not build compensation, promotion, termination, hiring, performance rating, layoff, or succession workflows

## Required Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string (Supabase pooler or direct) |
| `DIRECT_URL` | Direct Postgres URL if used by Drizzle migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin operations (never expose to client) |
| `USE_MOCK_DATA=false` | Enable Supabase data provider |
| `USE_MOCK_AGENTS=true` | Keep mock agents by default during pilot |
| `OPENAI_API_KEY` | Optional — live agent mode |
| `OPENAI_MODEL` | Optional — model override |

## Implementation Order

1. **Supabase environment setup verification** — confirm all vars, test connectivity
2. **Apply migration instructions and validation** — `npm run db:migrate` (0000 schema + 0001 RLS)
3. **Seed script validation** — `npm run db:seed`, verify TechForward fixture data
4. **Supabase Auth/session integration** — replace mock cookie session where safe; preserve demo fallback
5. **RLS role matrix tests** — automated tests per matrix below
6. **Recommendation persistence** — write agent recommendations to Postgres
7. **Recommendation accept/dismiss persistence** — survive page refresh and sessions
8. **Audit log persistence** — replace in-memory audit store
9. **Final smoke/eval validation** — full gate including `npm run smoke`

## RLS Role Matrix

Cross-org access is **never** allowed.

| Capability | employee | manager | hr_admin | org_admin | executive_readonly |
|------------|----------|---------|----------|-----------|-------------------|
| Own profile access | Yes (own only) | Yes (own only) | Yes (own only) | Yes (own only) | Yes (own only) |
| Direct report access | No | Yes (team only) | No | No | No |
| Org aggregate access | No | No (team scope only) | Yes | Yes | Yes (read-only aggregates) |
| Audit log access | No | No | Yes (org-scoped) | Yes (org-scoped) | Read-only aggregate |
| Write recommendations | Own context only | Team context | Org HR context | Org config | No |
| Manage user roles | No | No | Limited HR ops | Yes | No |
| Cross-org access | **Never** | **Never** | **Never** | **Never** | **Never** |

### Expected behavior by role

- **employee** — Access only own private growth data, skills, plans, and recommendations.
- **manager** — Access team-scoped data for direct reports only; no org-wide HR aggregates.
- **hr_admin** — Access org-scoped HR dashboards, skills readiness, mobility, workforce data.
- **org_admin** — Manage org-scoped configuration, users, and roles within the organization.
- **executive_readonly** — Read-only, aggregate-first access; no individual employee PII unless policy allows.

Reference: `drizzle/migrations/0001_rls_rbac.sql`, `src/lib/auth/rbac.ts`, `docs/SECURITY_AND_PRIVACY.md`.

## Validation Commands

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run evals
npm run smoke   # requires running server; SMOKE_BASE_URL=http://localhost:3002 if needed
```

## Exit Criteria

- [x] App works with `USE_MOCK_DATA=true` (demo mode unchanged)
- [x] App works with `USE_MOCK_DATA=false` when Supabase env vars are set
- [x] RLS role matrix tests pass (`rbac-matrix.test.ts` + `rls-migration.test.ts`)
- [x] Demo data seeded successfully (`npm run db:seed`)
- [x] Recommendations persist across sessions (when persistence enabled)
- [x] Accept/dismiss state persists (`PATCH /api/recommendations/[id]/status`)
- [x] Audit logs persist to Postgres (`audit-service` dual-write)
- [x] Governance blocked-output demo still works (`Demo: governance block`)
- [x] No prohibited employment-decision logic introduced
- [x] Mock fallback still works when database unavailable

## Related Documents

- [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) — phase history and task IDs
- [`BACKEND_STRUCTURE.md`](./BACKEND_STRUCTURE.md) — schema and API contracts
- [`SECURITY_AND_PRIVACY.md`](./SECURITY_AND_PRIVACY.md) — RBAC and env handling
- [`EVALS_AND_GOVERNANCE.md`](./EVALS_AND_GOVERNANCE.md) — agent rules and prohibited outputs
