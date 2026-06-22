# GrowthOS MVP Demo Script

## Prerequisites

```bash
cp .env.example .env.local
npm install
npm run dev
```

Defaults (no credentials required):

- `USE_MOCK_DATA=true`
- `USE_MOCK_AGENTS=true`

Open [http://localhost:3002/login](http://localhost:3002/login) (or port 3000 if available — Next.js picks the next free port when 3000 is in use).

---

## 1. Employee growth journey

1. Sign in with **alex.chen@techforward.io** and any password.
2. Land on `/employee/home` — review growth summary and recommendations.
3. Open **Growth Profile** (`/employee/growth-profile`):
   - Review confirmed vs inferred skills.
   - Open **Growth assistant** → choose an agent → use a starter prompt.
4. Visit **Career Paths** (`/employee/career-paths`) — skill alignment and gaps.
5. Visit **Growth Plan** (`/employee/growth-plan`) — 30/60/90 timeline.
6. Visit **1:1 Prep** (`/employee/manager-conversation`) — conversation prep.

---

## 2. Manager / Supermanager coaching journey

1. Switch to **Manager** via the top-bar role dropdown or **Settings** (`/settings`).
2. Land on `/manager/home` — team overview (demo uses Jordan Lee’s manager fixture).
3. Open **Coaching** (`/manager/coaching`) — invoke **Supermanager Agent**.
4. Visit **Team Skills** (`/manager/team-skills`) — capability matrix.
5. Open a direct report, e.g. `/manager/employee/33333333-3333-4333-8333-333333333331` (Alex Chen).

---

## 3. HR / Admin workforce readiness journey

1. Switch to **HR / Admin** in the top bar or Settings.
2. Visit `/hr/home` — workforce KPIs.
3. Review:
   - `/hr/skills-readiness`
   - `/hr/mobility-insights`
   - `/hr/talent-density`
   - `/hr/workforce-readiness`

---

## 4. Governance blocked-output demo

1. As **Employee**, open `/employee/growth-profile`.
2. In **Growth assistant** (Employee Growth agent), click the starter prompt **Demo: governance block**.
3. Confirm:
   - Amber **Governance blocked** badge on the agent panel.
   - Safe fallback message in the chat (no termination recommendation shown).
   - **Suggestion not available** notice card.

Automated coverage: `npm run test` (governance-service tests) and `npm run evals`.

---

## 5. Role guard demo (optional)

1. While signed in as **Employee**, manually open `/hr/home`.
2. Confirm redirect to `/forbidden` with return-home action.

---

## Agent mode badges

| Badge | Meaning |
|-------|---------|
| Mock mode | Default demo (`USE_MOCK_AGENTS=true`) |
| Live response | `USE_MOCK_AGENTS=false` + valid `OPENAI_API_KEY` |
| Fallback (mock) | Live requested but key missing or provider failed |
| Review recommended | Low-confidence flagged response (human-in-the-loop) |
| Governance blocked | Prohibited employment-decision language blocked |

---

## Manual smoke test

See [SMOKE_TEST_CHECKLIST.md](./SMOKE_TEST_CHECKLIST.md). With the dev server running:

```bash
npm run smoke
# If dev server is not on port 3000:
SMOKE_BASE_URL=http://localhost:3002 npm run smoke
```

---

## Validation before demo

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run evals
```
