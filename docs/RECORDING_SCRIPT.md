# GrowthOS Recording Script

**Target length:** 5–7 minutes  
**Companion click path:** [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md)

---

## Setup

- Start app: `npm run dev`
- Open http://localhost:3002/login (use port 3000 if available)
- Login: **alex.chen@techforward.io** / any password
- Follow [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) for navigation

---

## Opening — 30 seconds

**Talk track:**

> GrowthOS is an Agentic-HCM platform that helps organizations move from traditional HR service delivery to AI-first dynamic enablement. The goal is to help employees grow, managers become supermanagers, and HR understand workforce readiness through governed AI.

**On screen:** Login → land on employee home.

---

## Employee Journey — 2 minutes

**Routes:**

- `/employee/home`
- `/employee/growth-profile`
- `/employee/career-paths`
- `/employee/growth-plan`
- `/employee/manager-conversation`

**Talk track:**

> On the employee side, GrowthOS gives every person a personalized growth path. It shows current skills, inferred skills, career options, skill gaps, learning recommendations, and a practical growth plan. Recommendations include explanation, confidence, and evidence so the employee understands why something is being suggested.

**On screen:** Scroll growth summary → growth profile skills → use a Growth assistant starter prompt → career paths → growth plan timeline → 1:1 prep.

---

## Manager / Supermanager Journey — 2 minutes

**Routes:**

- `/manager/home`
- `/manager/coaching`
- `/manager/team-skills`
- `/manager/employee/33333333-3333-4333-8333-333333333331`

**Talk track:**

> For managers, GrowthOS becomes a Supermanager assistant. It helps leaders understand team skills, prepare coaching conversations, identify stretch opportunities, and support employee growth instead of just managing tasks.

**On screen:** Top bar → switch to **Manager** → team home → coaching center with Supermanager Agent → team skills matrix → open Alex Chen direct report.

---

## HR/Admin Journey — 1.5 minutes

**Routes:**

- `/hr/home`
- `/hr/skills-readiness`
- `/hr/mobility-insights`
- `/hr/talent-density`
- `/hr/workforce-readiness`

**Talk track:**

> For HR, GrowthOS provides workforce readiness, skills data quality, mobility insights, and talent density signals. This helps HR move from service delivery to strategic workforce enablement.

**On screen:** Top bar → switch to **HR/Admin** → walk each dashboard tab.

---

## Governance Highlight — 1 minute

**Route:** `/employee/growth-profile`

**Action:** Switch back to **Employee** role → click starter prompt **Demo: governance block**

**Talk track:**

> This is the trust layer. GrowthOS blocks prohibited employment-decision outputs like termination, compensation, promotion, layoff, performance rating, and succession recommendations. Instead of returning unsafe guidance, it provides a safe fallback, governance badge, and human-in-the-loop messaging.

**On screen:** Show **Governance blocked** badge, safe fallback message, **Suggestion not available** notice.

---

## Close — 30 seconds

**Talk track:**

> The current MVP is mock-first and demo-ready. The next milestone is pilot persistence: Supabase Auth, RLS verification, persisted recommendations, persisted accept/dismiss actions, and persisted audit logs.

**On screen:** Optional — mention validation commands or link to [`PILOT_PERSISTENCE_RELEASE.md`](./PILOT_PERSISTENCE_RELEASE.md).
