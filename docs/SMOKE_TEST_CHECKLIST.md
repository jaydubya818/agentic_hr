# GrowthOS Manual Smoke Test Checklist

Use before a pilot demo. Run with mock mode defaults unless testing optional integrations.

**Setup:** `npm run dev` then open http://localhost:3002/login (or port 3000 if available).

**Automated HTTP smoke:** route checks across employee, manager, and HR roles plus `/forbidden` guard. Requires a running server:

```bash
npm run smoke
# Custom port:
SMOKE_BASE_URL=http://localhost:3002 npm run smoke
```

### Pilot persistence mode (`USE_MOCK_DATA=false`)

When validating H0 against a live Supabase project:

1. Set `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Run `npm run db:verify-env` then `npm run db:migrate` and `npm run db:seed`
3. Start with `USE_MOCK_DATA=false` and sign in via Supabase Auth (or mock cookie fallback)
4. Invoke an agent → refresh page → recommendation still visible
5. Accept/dismiss recommendation → refresh → status preserved
6. HR role: `/hr/audit` loads events; export CSV downloads

---

## Authentication & roles

- [ ] `/login` renders; demo credentials sign in successfully (`alex.chen@techforward.io` / any password)
- [ ] Unauthenticated visit to `/employee/home` redirects to `/login`
- [ ] Top-bar role switcher: Employee → `/employee/home`
- [ ] Top-bar role switcher: Manager → `/manager/home`
- [ ] Top-bar role switcher: HR / Admin → `/hr/home`
- [ ] Settings role switcher matches top-bar behavior
- [ ] Settings sign out returns to `/login`; protected routes redirect until signing in again
- [ ] Employee role visiting `/hr/home` → `/forbidden`
- [ ] Mobile nav sheet opens and links work (resize viewport)

---

## Employee routes

- [ ] `/employee/home`
- [ ] `/employee/growth-profile` (skills, agent section, recommendations)
- [ ] `/employee/career-paths`
- [ ] `/employee/growth-plan`
- [ ] `/employee/manager-conversation`

---

## Manager routes

- [ ] `/manager/home`
- [ ] `/manager/team-skills`
- [ ] `/manager/coaching` (Supermanager Agent panel)
- [ ] `/manager/team-capability-plan`
- [ ] `/manager/employee/33333333-3333-4333-8333-333333333331` (direct report — Alex Chen)
- [ ] `/manager/decisions` and a decision detail page (evidence + outcome comparison)
- [ ] `/manager/team-scenarios` and a scenario detail page
- [ ] Non-direct-report employee ID → `/forbidden`

---

## HR routes

- [ ] `/hr/home`
- [ ] `/hr/skills-readiness`
- [ ] `/hr/mobility-insights`
- [ ] `/hr/talent-density`
- [ ] `/hr/workforce-readiness`
- [ ] `/hr/decisions` and a decision detail page
- [ ] `/hr/work-design` and a scenario detail page
- [ ] `/hr/organizational-learning` (learning signals load; error state on failed fetch)
- [ ] `/hr/audit` (events listed; CSV export downloads)

---

## Shared routes

- [ ] `/settings` (account info + role switcher)
- [ ] `/onboarding` (placeholder loads)
- [ ] `/` redirects to role-appropriate home when signed in

---

## Agents & governance

- [ ] Agent starter prompt returns response with recommendations (explanation, confidence, evidence)
- [ ] Agent panel shows **Mock mode** badge by default
- [ ] **Demo: governance block** shows blocked state + safe message (governance API verified)
- [ ] Agent error state visible if API fails (disconnect test optional)

---

## UI states

- [ ] Loading indicator while agent request in flight
- [ ] Empty states render where data is missing (e.g. no career goal path)
- [ ] Error message on failed agent fetch (optional manual test)

---

## Automated gates

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` passes (25 production routes)
- [ ] `npm run evals` passes
- [ ] `npm run smoke` passes (dev server running; set `SMOKE_BASE_URL` if not on port 3000)

---

## Optional (when env vars configured)

- [ ] `USE_MOCK_DATA=false` + `DATABASE_URL` — app loads with Supabase provider
- [ ] `USE_MOCK_AGENTS=false` + `OPENAI_API_KEY` — agent shows **Live response** badge
