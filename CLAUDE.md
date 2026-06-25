# GrowthOS — AI Assistant Operating Manual

> This file governs how AI coding assistants (Claude, Cursor) must work on the GrowthOS project.

---

## Project Summary

**GrowthOS** is an Agentic-HCM platform for AI-first dynamic enablement. The MVP focuses on **Employee Growth + Supermanager Enablement** with HR analytics dashboards.

**MVP includes**:
- 3 experiences: Employee, Manager, HR/Admin
- 6 agents: Employee Growth, Supermanager, Skills Intelligence, Dynamic Learning, Internal Mobility, Governance
- Mock data first (Phases 3–7), then Supabase (Phase 8), then live LLM (Phase 9)

**Tagline**: Grow the individual. Elevate the manager. Transform the organization.

---

## Mandatory Reading Before Any Code or Documentation Changes

Before making any code or documentation changes, always read in this order:

1. `/AGENTS.md` — learned user preferences and durable workspace facts
2. `/CLAUDE.md` — this operating manual
3. `/progress.txt` — current phase, in-progress task, assumptions, and blockers
4. Relevant docs for the task — from the canonical set below

**Canonical docs** (read those applicable to the current task):

- `/docs/PRD.md`
- `/docs/APP_FLOW.md`
- `/docs/TECH_STACK.md`
- `/docs/FRONTEND_GUIDELINES.md`
- `/docs/BACKEND_STRUCTURE.md`
- `/docs/EVALS_AND_GOVERNANCE.md`
- `/docs/SECURITY_AND_PRIVACY.md`
- `/docs/IMPLEMENTATION_PLAN.md`
- `/docs/WORKFORCE_INTELLIGENCE.md` (Phase WI — context graph, decision memory, scenarios, action plans, org learning)

Do not implement features, routes, schema changes, or agent behaviors not defined in these documents.

---

## Rules for Implementation

1. **Documentation is the source of truth** — If code and docs conflict, fix code to match docs (or propose a doc update first).
2. **Do not invent requirements** — No new features, routes, tables, or agent capabilities without updating PRD and related docs.
3. **Follow the implementation plan** — Execute tasks by ID (e.g., `4.3`) from `IMPLEMENTATION_PLAN.md` in phase order.
4. **Minimal scope** — Implement only the current task; no drive-by refactors.
5. **Match existing patterns** — Use approved stack, folder structure, naming conventions.
6. **Validate with Zod** — All API inputs/outputs use shared schemas.
7. **Service layer required** — No business logic in React components or route handlers directly.
8. **Update progress.txt** — After every completed task.
9. **No secrets in client code** — API keys server-side only.
10. **Test what you build** — Run lint, typecheck, and relevant tests before marking done.

---

## Rules for Not Inventing Requirements

**Allowed without doc update**:
- Bug fixes that restore documented behavior
- Copy/style tweaks within FRONTEND_GUIDELINES
- Test additions for documented behavior
- Refactors that don't change behavior

**Requires doc update first**:
- New routes or pages
- New database tables or columns
- New agent types or capabilities
- New recommendation types
- New user roles
- Changes to prohibited AI outputs
- Technology substitutions

When unsure, check PRD functional requirements (FR-*) and open questions in `progress.txt`.

---

## Approved Tech Stack Summary

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| UI | React 19, Tailwind 4, shadcn/ui |
| Data fetching | TanStack Query v5 |
| Validation | Zod 3.x |
| ORM | Drizzle |
| Database | Supabase Postgres |
| Auth | Supabase Auth |
| Charts | Recharts |
| Icons | Lucide React |
| AI | `lib/ai/` abstraction (OpenAI first) |
| Tests | Vitest, RTL, Playwright |
| Deploy | Vercel |

**Forbidden**: MongoDB, Prisma, Redux, CSS-in-JS, GraphQL-only API, client-side LLM calls. See `TECH_STACK.md` Section 13.

---

## Approved Route Summary

**Employee**: `/employee/home`, `/employee/growth-profile`, `/employee/career-paths`, `/employee/growth-plan`, `/employee/manager-conversation`

**Manager**: `/manager/home`, `/manager/team-skills`, `/manager/employee/[id]`, `/manager/coaching`, `/manager/team-capability-plan`

**HR**: `/hr/home`, `/hr/skills-readiness`, `/hr/mobility-insights`, `/hr/talent-density`, `/hr/workforce-readiness`

**Shared**: `/login`, `/onboarding`, `/settings`

---

## Approved Design Constraints

- Enterprise SaaS aesthetic: clean, calm, trustworthy
- Primary color: `#1E4D8C`; Accent: `#0D9488`
- Font: Inter (UI), JetBrains Mono (monospace)
- Card-based dashboards, skill chips, confidence indicators
- Recommendation cards: title, explanation, confidence, evidence, actions
- Empowering UX tone — no punitive labels
- WCAG 2.1 AA accessibility

Full spec: `FRONTEND_GUIDELINES.md`

---

## Approved Data Model Constraints

- All tables include `organization_id` (multi-tenant ready)
- UUID primary keys
- Skills have `source`: `confirmed` | `inferred`
- Recommendations require: explanation, confidence, evidence
- Growth plan status: `draft` | `active` | `completed` | `archived`
- Roles: `employee`, `manager`, `hr_admin`, `org_admin`, `executive_readonly`

Full schema: `BACKEND_STRUCTURE.md`

---

## Agent Behavior Constraints

- Ground all outputs in database/mock data — never invent skills or roles
- Every recommendation: explanation + confidence + ≥1 evidence
- Governance Agent must pass all outputs before user display
- **Prohibited**: termination, layoff, compensation, promotion decisions, performance ratings, hiring decisions, punitive labels
- **Allowed**: development actions, growth paths, learning, stretch assignments, coaching prompts, internal opportunity matches
- Log all agent invocations to `agent_conversations` + `audit_logs`

Full rules: `EVALS_AND_GOVERNANCE.md`

---

## Security and Privacy Constraints

- Enforce RBAC in middleware + service layer + RLS (Phase 8+)
- Manager sees direct reports only
- Employee sees own data only
- No PII in logs; no API keys in client bundle
- `USE_MOCK_DATA=true` for Phases 3–7 (no Supabase required)
- Inferred skills must be labeled; employee can toggle visibility

Full spec: `SECURITY_AND_PRIVACY.md`

---

## Forbidden Actions

### Product Forbidden (MVP Non-Goals)

- Termination, layoff, or compensation recommendations
- Promotion decisions or performance ratings
- Automated hiring or succession decisions
- Payroll, benefits, or case management features
- Full HRIS/LMS integrations
- Generic HR chatbot or job board

### Engineering Forbidden

- Writing code before Phase 0 docs are complete
- Inventing routes, tables, or agents not in docs
- Direct LLM calls from client components
- Raw SQL string concatenation
- Committing `.env.local` or API keys
- Using forbidden technologies (see TECH_STACK.md)
- Skipping governance checks on agent output
- Punitive UI labels ("low performer", "not promotable")

---

## How to Update progress.txt

After completing each implementation task:

1. Open `/progress.txt`
2. Move task ID from "In Progress" to "Completed" (append to list)
3. Set "In Progress" to next task ID
4. Set "Next" to the following task
5. Update "Current Phase" if phase completed
6. Add any new blockers to "Open Questions"
7. Update "Last updated" date

**Format**:

```
Completed: ...; Phase X.Y
In Progress: Phase X.Z
Next: Phase X.Z+1
```

---

## Cursor / Claude Session Startup Instructions

When starting a new coding session:

1. **Read** `/AGENTS.md`, then `/CLAUDE.md`, then `/progress.txt`, then docs relevant to the current task (see Mandatory Reading section)
2. **Identify** current phase and in-progress task from `progress.txt`
3. **Confirm** task is defined in `IMPLEMENTATION_PLAN.md` with acceptance criteria
4. **Implement** only that task's scope
5. **Verify** — run `npm run lint`, `npm run typecheck`, relevant tests
6. **Update** `progress.txt`
7. **Report** using the required response format below

If `progress.txt` says Phase 0 or docs incomplete, do not write application code.

---

## Required Response Format After Completing Tasks

After each task, respond with:

```
## Task [ID] — [Title]

**Status**: Complete | Blocked

**Files changed**:
- path/to/file.ts

**Verification**:
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Tests pass (if applicable)
- [ ] Acceptance criteria met (list each)

**Acceptance criteria evidence**:
- [Brief note per criterion]

**Blockers** (if any):
- [Description]

**progress.txt**: Updated
```

---

## Quick Reference Links

| Doc | Purpose |
|-----|---------|
| [PRD.md](./docs/PRD.md) | What to build |
| [APP_FLOW.md](./docs/APP_FLOW.md) | Routes and UX flows |
| [TECH_STACK.md](./docs/TECH_STACK.md) | How to build (stack) |
| [FRONTEND_GUIDELINES.md](./docs/FRONTEND_GUIDELINES.md) | How it should look |
| [BACKEND_STRUCTURE.md](./docs/BACKEND_STRUCTURE.md) | Data and APIs |
| [EVALS_AND_GOVERNANCE.md](./docs/EVALS_AND_GOVERNANCE.md) | AI rules |
| [SECURITY_AND_PRIVACY.md](./docs/SECURITY_AND_PRIVACY.md) | Security model |
| [IMPLEMENTATION_PLAN.md](./docs/IMPLEMENTATION_PLAN.md) | Build order |
