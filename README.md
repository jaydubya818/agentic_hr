# GrowthOS

**Grow the individual. Elevate the manager. Transform the organization.**

GrowthOS is an Agentic-HCM platform that helps organizations move from traditional HR service delivery to AI-first dynamic enablement.

**Current MVP status:** Demo-ready through Phase 11. Mock data and mock agents are the default. Employee, Manager, and HR experiences plus six governed agents are implemented. Optional Supabase persistence and OpenAI live calls are available when credentials are configured.

---

## Documentation-first workflow

This project is built **documentation-first**. Requirements, routes, schema, agents, and implementation order live in `/docs` before code changes.

**Rule:** If code and docs conflict, fix code to match docs (or propose a doc update first). Do not invent features, routes, tables, or agent capabilities outside the canonical documents.

Before contributing or using an AI coding assistant, read:

1. [`CLAUDE.md`](./CLAUDE.md) — operating manual for assistants
2. [`progress.txt`](./progress.txt) — current phase and task status

---

## Canonical documentation

| Document | Purpose |
|----------|---------|
| [`docs/PRD.md`](./docs/PRD.md) | Product requirements, personas, functional requirements |
| [`docs/APP_FLOW.md`](./docs/APP_FLOW.md) | Routes, user journeys, empty/error states |
| [`docs/TECH_STACK.md`](./docs/TECH_STACK.md) | Locked stack, architecture, forbidden choices |
| [`docs/FRONTEND_GUIDELINES.md`](./docs/FRONTEND_GUIDELINES.md) | Design system, colors, components, accessibility |
| [`docs/BACKEND_STRUCTURE.md`](./docs/BACKEND_STRUCTURE.md) | Schema, APIs, services, mock strategy |
| [`docs/EVALS_AND_GOVERNANCE.md`](./docs/EVALS_AND_GOVERNANCE.md) | Agent rules, evals, prohibited outputs |
| [`docs/SECURITY_AND_PRIVACY.md`](./docs/SECURITY_AND_PRIVACY.md) | RBAC, env handling, MVP security checklist |
| [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) | Phased tasks with acceptance criteria (Phases 0–11) |
| [`docs/IMPLEMENTATION_PLAN_POST_MVP.md`](./docs/IMPLEMENTATION_PLAN_POST_MVP.md) | Post-MVP phases 12–18 (H0–H6) |
| [`docs/PITCH.md`](./docs/PITCH.md) | Product pitch, differentiators, demo flow |
| [`docs/STRATEGY.md`](./docs/STRATEGY.md) | Strategy brief, pillars, category, 12-month priorities |
| [`docs/GTM_NARRATIVE.md`](./docs/GTM_NARRATIVE.md) | Sales/demo talk tracks and pilot CTA |
| [`docs/COMPETITIVE_POSITIONING.md`](./docs/COMPETITIVE_POSITIONING.md) | Market categories and deal guidance (no vendor names) |
| [`docs/ROADMAP_AGENTIC_HCM.md`](./docs/ROADMAP_AGENTIC_HCM.md) | Post-pilot product horizons (H0–H6) |
| [`docs/ONE_PAGER.md`](./docs/ONE_PAGER.md) | Single-page leave-behind |
| [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md) | Pilot demo walkthrough (click path) |
| [`docs/RECORDING_SCRIPT.md`](./docs/RECORDING_SCRIPT.md) | 5–7 minute demo talk track |
| [`docs/SMOKE_TEST_CHECKLIST.md`](./docs/SMOKE_TEST_CHECKLIST.md) | Pre-demo manual smoke checklist |
| [`docs/PILOT_PERSISTENCE_RELEASE.md`](./docs/PILOT_PERSISTENCE_RELEASE.md) | Next engineering milestone |

---

## Run locally

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3002/login](http://localhost:3002/login) — or port 3000 if available (Next.js uses the next free port when 3000 is in use).

**Demo sign-in:** `alex.chen@techforward.io` / any password. Use the **top-bar role switcher** or **Settings** to explore Manager and HR views.

### Demo routes (summary)

| Journey | Key routes |
|---------|------------|
| Employee | `/employee/home`, `growth-profile`, `career-paths`, `growth-plan`, `manager-conversation` |
| Manager | `/manager/home`, `coaching`, `team-skills`, `employee/33333333-3333-4333-8333-333333333331` |
| HR/Admin | `/hr/home`, `skills-readiness`, `mobility-insights`, `talent-density`, `workforce-readiness` |
| Governance | `/employee/growth-profile` → starter **Demo: governance block** |
| Guard (optional) | Employee opens `/hr/home` → `/forbidden` |

Full walkthrough: [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md) · Recording talk track: [`docs/RECORDING_SCRIPT.md`](./docs/RECORDING_SCRIPT.md)

### Mock mode (default)

No Supabase or OpenAI credentials are required for the pilot demo. `.env.example` defaults:

| Variable | Default | Purpose |
|----------|---------|---------|
| `USE_MOCK_DATA` | `true` | Load fixture JSON instead of Supabase |
| `USE_MOCK_AGENTS` | `true` | Mock agent responses (no LLM calls) |

### Optional: Supabase persistence

Set `USE_MOCK_DATA=false` and provide:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string (Supabase) |
| `DIRECT_URL` | Direct Postgres URL (if used by migrations) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin key (never expose to client) |

Then run migrations and seed:

```bash
npm run db:migrate
npm run db:seed
```

The app falls back to mock data if the database is unavailable.

### Optional: Live OpenAI agents

Set `USE_MOCK_AGENTS=false` and provide:

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Server-side LLM calls |
| `OPENAI_MODEL` | Optional model override (default in `.env.example`) |

Live mode applies to **Employee Growth**, **Supermanager**, and **Dynamic Learning** agents only. Missing keys or API errors fall back to mock responses.

---

## Validation commands

Run before a demo or PR:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run evals
```

With the dev server running (`npm run dev` in another terminal):

```bash
npm run smoke
# If dev server is on a different port:
SMOKE_BASE_URL=http://localhost:3002 npm run smoke
```

See [`docs/SMOKE_TEST_CHECKLIST.md`](./docs/SMOKE_TEST_CHECKLIST.md) for the full manual checklist (25 production routes; 21 automated HTTP checks).

---

## Demo walkthrough

Follow [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md) for a 15-minute pilot script covering:

1. Employee growth journey
2. Manager / Supermanager coaching
3. HR workforce readiness dashboards
4. Governance blocked-output demo (`Demo: governance block` starter prompt)
5. Role guard (`/forbidden`)

---

## Available scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint (`eslint-config-next` + TypeScript) |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`) |
| `npm run test` | Vitest unit and integration tests |
| `npm run evals` | Agent evaluation harness |
| `npm run smoke` | HTTP route smoke test (server must be running) |
| `npm run db:migrate` | Apply Drizzle migrations |
| `npm run db:seed` | Seed mock fixture data into Postgres |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting without writing |

---

## Project structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login, onboarding (Phase 2+)
│   ├── (app)/              # Authenticated layout
│   │   ├── employee/
│   │   ├── manager/
│   │   ├── hr/
│   │   └── settings/
│   └── api/                # Route handlers
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/             # Sidebar, TopBar
│   ├── employee/
│   ├── manager/
│   ├── hr/
│   ├── agents/
│   └── shared/
├── hooks/
├── lib/
│   ├── ai/                 # LLM abstraction (Phase 9+)
│   ├── auth/
│   ├── db/                 # Drizzle client (Phase 8+)
│   └── utils.ts            # Shared utilities (e.g. cn())
├── services/               # Business logic
├── schemas/                # Zod schemas
└── types/
docs/                       # Canonical product & technical docs
progress.txt                # Implementation progress tracker
```

See [`docs/TECH_STACK.md`](./docs/TECH_STACK.md) for the full stack and architecture.

---

## Current MVP scope

### Employee experience

- Growth profile, skills summary, career goal input
- Recommended career paths, skill gap analysis
- Learning recommendations, 30/60/90 growth plan
- Manager conversation prep

### Manager / Supermanager experience

- Team skills dashboard, employee growth summaries
- Coaching prompts, stretch assignment suggestions
- Team skill gap view, manager action recommendations
- Team capability planning

### HR / Admin experience

- Skills data readiness dashboard
- Internal mobility insights
- Growth plan adoption metrics
- Talent density indicators (simplified MVP)
- Skill gap visibility, workforce readiness indicators

### MVP agents

- Employee Growth Agent
- Supermanager Agent
- Skills Intelligence Agent
- Dynamic Learning Agent
- Internal Mobility Agent
- Governance Agent

---

## Out of scope (MVP non-goals)

- No termination, layoff, compensation, or promotion recommendations
- No performance ratings or automated hiring/succession decisions
- No payroll, benefits, or HR case management
- No full Workday / SuccessFactors / Oracle / Greenhouse / LMS integrations
- No generic HR chatbot, simple job board, or LMS-only recommendation tool

Employment decisions remain **human-owned**. The system never recommends termination, promotion, compensation, or similar employment actions.

---

## Governance summary

GrowthOS blocks prohibited employment-decision outputs (termination, layoff, demotion, compensation, promotion decisions, hiring decisions, performance ratings, succession, punitive labels). Every recommendation includes explanation, confidence, and evidence. Low-confidence outputs trigger human-in-the-loop messaging. Demo the trust layer with the **Demo: governance block** starter prompt on `/employee/growth-profile`.

Details: [`docs/EVALS_AND_GOVERNANCE.md`](./docs/EVALS_AND_GOVERNANCE.md)

---

## Known limitations (demo)

- Mock auth only — session always starts as Alex Chen
- Role switcher changes active role, not persona
- Manager/HR views use demo fixtures (Jordan Lee team, org HR metrics)
- `/onboarding` is a placeholder
- Audit logs in-memory unless Supabase persistence is wired
- Live LLM limited to Employee Growth, Supermanager, and Dynamic Learning agents
- Supabase migrations require `DATABASE_URL` to be configured and applied
- Smoke test requires a running dev server

---

## Next milestone

**Pilot Persistence Release** — Supabase Auth, RLS verification, persisted recommendations, accept/dismiss state, and audit logs. See [`docs/PILOT_PERSISTENCE_RELEASE.md`](./docs/PILOT_PERSISTENCE_RELEASE.md).

---

## Tech stack (summary)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| UI | React 19, Tailwind 4, shadcn/ui |
| Data (Phase 8+) | Supabase Postgres + Drizzle |
| AI (Phase 9+) | OpenAI behind abstraction layer |

Full details: [`docs/TECH_STACK.md`](./docs/TECH_STACK.md).

---

## License

Private — not for public distribution.
