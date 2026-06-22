# GrowthOS Pitch

## One-liner

GrowthOS is an Agentic-HCM platform that helps organizations move from traditional HR service delivery to AI-first dynamic enablement.

## Product Vision

GrowthOS helps employees grow with clarity, managers become supermanagers with real-time talent intelligence, HR understand workforce readiness with trusted skills data, and organizations responsibly adopt AI at scale. The platform connects growth, coaching, skills intelligence, internal mobility, and governance into one dynamic enablement layer — not a fragmented stack of point solutions.

## Problem

- Employees lack clear, personalized growth paths tied to skills and career options.
- Managers lack real-time talent intelligence to coach, develop, and enable their teams.
- HR lacks trusted, explainable skills and workforce readiness data across the organization.
- Organizations struggle to adapt work, skills, roles, and talent fast enough for changing business needs.
- Traditional HR systems are fragmented across learning, mobility, skills, performance, workforce planning, and manager enablement — with little connective tissue for AI-assisted growth.

## Solution

GrowthOS connects employee growth, manager coaching, skills intelligence, internal mobility, workforce readiness, and AI governance into one dynamic enablement layer.

- It is **not** a generic HR chatbot.
- It is **not** just a job board, LMS, or talent marketplace.
- It is a **governed Agentic-HCM growth enablement platform** with explainable, evidence-backed recommendations and a trust layer that blocks prohibited employment-decision outputs.

## Target Users

- Employees
- Managers / Supermanagers
- HR business partners
- Talent management leaders
- L&D leaders
- Workforce planning teams
- Executives
- HRIT / system administrators

## MVP Capabilities

- Employee growth dashboard
- Growth profile
- Career path exploration
- Skill gap analysis
- 30/60/90-day growth plan
- Manager conversation prep
- Manager coaching dashboard
- Team skills view
- Supermanager coaching agent
- HR/Admin skills readiness dashboards
- Mobility insights
- Talent density indicators
- Workforce readiness dashboards
- Mock agent layer
- Governance blocked-output demo

## Core MVP Agents

- Employee Growth Agent
- Supermanager Agent
- Skills Intelligence Agent
- Dynamic Learning Agent
- Internal Mobility Agent
- Governance Agent

## Differentiators

- Manager-centered growth execution (Supermanager enablement)
- Explainable recommendations with confidence scores
- Evidence-backed recommendations (confirmed vs inferred skills)
- Governance and prohibited-output blocking
- Mock-first demo with optional Supabase/OpenAI paths
- HR transformation framing: service delivery → dynamic enablement
- Designed for future work redesign and talent density expansion
- **Agentic enablement layer** category—depth on growth, skills, and readiness beside HRIS (see [STRATEGY.md](./STRATEGY.md))

## Category and market

GrowthOS is an **agentic HCM enablement layer**: growth, supermanager coaching, skills intelligence, internal mobility, and workforce readiness with governed agents.

| We are | We are not (today) |
|--------|---------------------|
| Governed enablement for dynamic work | Full payroll/benefits/case-management HRIS |
| Answers and coaching with evidence | Generic HR chatbot on legacy data |
| Beside system of record (read integrations planned) | Rip-and-replace HRIS pitch without PRD v2 |

Market framing (category-only, no vendor names): [COMPETITIVE_POSITIONING.md](./COMPETITIVE_POSITIONING.md).  
GTM talk tracks: [GTM_NARRATIVE.md](./GTM_NARRATIVE.md).  
Horizons: [ROADMAP_AGENTIC_HCM.md](./ROADMAP_AGENTIC_HCM.md).

## Governance / Trust Layer

GrowthOS blocks outputs related to termination, layoff, demotion, compensation, promotion decisions, final hiring decisions, performance ratings, succession decisions, and punitive labels.

Every recommendation requires explanation, confidence, and evidence. Low-confidence or sensitive outputs trigger human-in-the-loop messaging. Audit trail is maintained in-memory in the current MVP; persistence is the next milestone.

## Demo Flow

1. Login at http://localhost:3002/login
2. Sign in as **alex.chen@techforward.io** with any password
3. **Employee journey:**
   - `/employee/home`
   - `/employee/growth-profile`
   - `/employee/career-paths`
   - `/employee/growth-plan`
   - `/employee/manager-conversation`
4. **Manager journey:**
   - Switch top bar role to **Manager**
   - `/manager/home`
   - `/manager/coaching`
   - `/manager/team-skills`
   - `/manager/employee/33333333-3333-4333-8333-333333333331`
5. **HR/Admin journey:**
   - Switch top bar role to **HR/Admin**
   - `/hr/home`
   - `/hr/skills-readiness`
   - `/hr/mobility-insights`
   - `/hr/talent-density`
   - `/hr/workforce-readiness`
6. **Governance highlight:**
   - Go to `/employee/growth-profile`
   - Use starter prompt: **Demo: governance block**
   - Expected: blocked badge, safe fallback text, no termination recommendation
7. **Optional guard demo:**
   - As Employee, open `/hr/home`
   - Expected: redirect to `/forbidden`

## Current Technical Status

- Next.js 15 App Router application
- TypeScript (strict)
- Tailwind CSS 4 + shadcn/ui
- Mock data provider active by default (`USE_MOCK_DATA=true`)
- Mock agent provider active by default (`USE_MOCK_AGENTS=true`)
- Supabase schema and RLS migrations ready (`drizzle/migrations/`)
- Supabase provider and seed path available when env vars configured
- OpenAI live calls available for selected low-risk agents when env vars configured
- Agent evaluation harness (`npm run evals`)
- HTTP smoke tests (`npm run smoke`)

## Known Limitations

- Mock auth only (no Supabase Auth wired)
- Session always starts as Alex Chen
- Role switcher changes active role, not persona
- Manager/HR data uses demo fixtures (Jordan Lee team, org-wide HR metrics)
- `/onboarding` is a placeholder page
- Audit logs are in-memory unless Supabase persistence is fully wired
- Live LLM limited to selected low-risk agents (Employee Growth, Supermanager, Dynamic Learning)
- Supabase migrations not applied unless `DATABASE_URL` is configured
- Smoke test requires a running server (`SMOKE_BASE_URL` optional, e.g. `http://localhost:3002`)

## Next Milestone

**Pilot Persistence Release:**

- Apply Supabase migrations
- Seed demo data
- Replace mock auth/session with Supabase Auth
- Verify RLS with role matrix tests
- Persist recommendations
- Persist accept/dismiss state
- Persist audit logs
- Add HR audit view only after `APP_FLOW.md` is updated

See [`PILOT_PERSISTENCE_RELEASE.md`](./PILOT_PERSISTENCE_RELEASE.md) for full scope and exit criteria.
