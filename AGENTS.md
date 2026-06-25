## Learned User Preferences

- Treat documentation in `docs/`, `CLAUDE.md`, and `progress.txt` as the source of truth; do not invent requirements.
- Read mandatory project docs before any code changes (see `CLAUDE.md` for the full list).
- Follow `docs/IMPLEMENTATION_PLAN.md` (Phases 0–11) and `docs/IMPLEMENTATION_PLAN_POST_MVP.md` (Phases 12–18) in phase order; complete only the specified phase or sub-phase batch.
- Do not skip phases or start the next phase until the current one passes validation.
- Stop at required checkpoints before risky areas (e.g., schema vs RLS vs persistence).
- When requirements are ambiguous, make the smallest reasonable choice and record the assumption in `progress.txt`.
- During implementation, modify only `progress.txt` among canonical docs unless explicitly asked to update specs.
- Do not edit attached plan files when implementing from a plan.
- Preserve mock-mode defaults (`USE_MOCK_DATA=true`, `USE_MOCK_AGENTS=true`); keep the app building without live Supabase credentials until persistence phases require them.
- Run `npm run typecheck`, `npm run lint`, relevant tests, and `npm run build` before marking work complete.
- Stay within minimal scope; no drive-by refactors, unauthorized dependencies, or features outside the current task.
- Do not name competitors or vendors in strategy or competitive docs; use category-based positioning only.

## Learned Workspace Facts

- GrowthOS (Agentic-HCM) is a documentation-first Next.js 15 App Router HCM platform (Employee, Manager, HR experiences + six MVP agents).
- GrowthOS is an agentic enablement layer beside existing HRIS, not a full HRIS replacement; horizon H6 is gated on PRD v2 (`docs/PRD_V2_GATE.md`).
- Mock mode uses `src/services/data-provider/mock-provider.ts` and `data/mock/`; when `USE_MOCK_DATA=false`, Supabase auth/session and persistence (recommendations, audit) activate with mock fallback.
- Post-MVP Phases 12–18 are complete through H5; H6 remains documentation-only until PRD v2.
- **Workforce Intelligence (Phase WI)** adds context graph, decision memory, team scenarios, agent action plans, and organizational learning; see `docs/WORKFORCE_INTELLIGENCE.md`.
- Tagline: Grow people. Reconfigure work. Remember why. Learn what works.
- Demo fixtures use TechForward Inc. with deterministic IDs in `src/lib/mock/ids.ts` (e.g., Alex Chen employee, Jordan Lee manager).
- UI uses GrowthOS design tokens: primary `#1E4D8C`, accent `#0D9488`, Inter, card-based dashboards per `docs/FRONTEND_GUIDELINES.md`.
- Every AI recommendation must include explanation, confidence score, and at least one evidence item.
- GrowthOS must not produce employment-decision outputs (termination, layoffs, compensation, promotions, hiring, ratings, succession).
- Managers see direct reports only; unauthorized access routes to `/forbidden`.
- Service layer holds business logic; API inputs/outputs use shared Zod schemas.
- Postgres schema lives under `src/lib/db/schema/` with Drizzle migrations; all tenant-scoped tables include `organization_id`; RBAC roles are employee, manager, hr_admin, org_admin, executive_readonly; `DATABASE_URL` is optional for build.
- Agent invocations go through governance checks and `POST /api/agents/[agentId]/invoke`.
