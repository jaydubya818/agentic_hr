# GrowthOS GTM Narrative

> **Purpose:** Sales, investor, and demo talk tracks  
> **Last updated:** 2026-06-08  
> **Companion:** [RECORDING_SCRIPT.md](./RECORDING_SCRIPT.md) | [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) | [PITCH.md](./PITCH.md)

---

## One-liner

GrowthOS is an Agentic-HCM platform that helps organizations move from traditional HR service delivery to AI-first dynamic enablement.

**Tagline:** Grow the individual. Elevate the manager. Transform the organization.

---

## Category (say this clearly)

GrowthOS is the **governed agentic enablement layer** for employee growth, supermanager coaching, skills intelligence, internal mobility, and workforce readiness.

- It is **not** a generic HR chatbot.
- It is **not** payroll, benefits, or case management today.
- It is designed to work **alongside** your HRIS system of record until a broader scope is explicitly productized.

Do **not** say “replace your HRIS” unless leadership has approved PRD v2 and Horizon H6 ([ROADMAP_AGENTIC_HCM.md](./ROADMAP_AGENTIC_HCM.md)).

---

## Why now

1. **Work velocity** — Teams and roles change faster than annual review cycles and static job architectures.
2. **AI-first workplace** — Leaders need skills-informed workforce decisions, not another chat widget on legacy data.
3. **HR cost of change** — Maintaining fragmented HR stacks is slow, consultant-heavy, and misaligned with dynamic work.
4. **Manager gap** — Managers need talent intelligence in the flow of coaching, not another system to log into.
5. **Trust requirement** — Enterprise buyers demand explainability, governance, and human ownership of employment decisions.

---

## 30-second pitch

> GrowthOS helps employees grow with clear paths and evidence-backed recommendations, turns managers into supermanagers with team skills intelligence and coaching support, and gives HR workforce readiness and mobility insights—not ticket queues. Agents power the enablement layer with a governance trust layer that blocks prohibited employment-decision outputs. The MVP is mock-first and demo-ready; pilot persistence adds Supabase Auth, RLS, and audit history.

---

## 2-minute pitch

**Problem:** HR technology is fragmented. Employees lack growth clarity. Managers work around systems. HR is stuck answering the same questions and maintaining configs. Transactional HRIS data does not give agents or leaders the full picture for workforce enablement.

**Solution:** GrowthOS unifies growth, coaching, skills, learning, mobility, and workforce readiness in one **governed agentic layer**. Six specialized agents plus governance on every response. Every recommendation includes explanation, confidence, and evidence.

**Who it’s for:** Employees, managers, HRBPs, talent and L&D leaders, workforce planning, executives (read-only aggregates).

**Proof today:** Live demo with governance block, role-based access, eval harness, smoke tests. Optional Supabase and OpenAI paths for pilots.

**Ask:** Design-partner pilot on the enablement layer while HRIS remains system of record—or evaluate after Pilot Persistence Release ships.

---

## 5-minute pitch structure

| Segment | Time | Content |
|---------|------|---------|
| Hook | 30s | Service delivery → dynamic enablement; work changed, HR stack didn’t |
| Employee story | 90s | Growth profile, paths, plan, 1:1 prep ([DEMO_SCRIPT.md](./DEMO_SCRIPT.md)) |
| Manager story | 90s | Team skills, coaching agent, direct report view |
| HR story | 60s | Readiness, mobility, talent density, workforce readiness |
| Governance | 60s | Demo: governance block; human-owned employment decisions |
| Close | 30s | Mock-first MVP; pilot persistence next; enablement layer category |

Full talk track with routes: [RECORDING_SCRIPT.md](./RECORDING_SCRIPT.md).

---

## Proof points (demo-backed)

| Claim | How to show |
|-------|-------------|
| Explainable AI | Growth profile recommendations show confidence + evidence |
| Governance | Starter prompt **Demo: governance block** → blocked badge, safe fallback |
| Role security | Employee → `/hr/home` → `/forbidden` |
| Supermanager | Manager coaching dashboard + team skills |
| Workforce readiness | HR skills-readiness and workforce-readiness dashboards |
| Engineering quality | `npm run evals`, `npm run smoke`, CI validation |

---

## Differentiators (lead with these)

1. **Manager-centered execution** — Supermanager agent and team capability views, not employee-only self-service.
2. **Governance by design** — Prohibited employment-decision outputs blocked; eval suite enforces 100% block rate in CI.
3. **Explainability** — Confidence, evidence, confirmed vs inferred skills on every recommendation.
4. **Enablement layer focus** — Depth on growth, skills, mobility, readiness—not payroll bolt-ons.
5. **Mock-first pilot path** — Demo in minutes; persistence milestone defined ([PILOT_PERSISTENCE_RELEASE.md](./PILOT_PERSISTENCE_RELEASE.md)).
6. **HR transformation framing** — Answers and enablement vs ticket queues and static reports.

---

## Pilot CTA

**Stage 1 — Demo:** Mock mode, `alex.chen@techforward.io`, 15-minute script ([DEMO_SCRIPT.md](./DEMO_SCRIPT.md)).

**Stage 2 — Technical pilot:** Pilot Persistence Release (Supabase Auth, RLS, persisted recommendations, audit logs).

**Stage 3 — Design partner:** 1–3 organizations on enablement layer with optional HRIS read sync (Horizon H5).

**Success criteria for pilot:** Growth plan activation, manager weekly use, recommendation acceptance, governance evals green, RLS matrix pass.

---

## Landmine questions (answer honestly)

| Question | Answer |
|----------|--------|
| Does GrowthOS replace our HRIS? | Today: enablement layer beside HRIS. Full replacement requires future scope approval. |
| Can it fire or promote people? | No. Prohibited outputs are blocked by governance. |
| Where is data stored? | MVP demo: mock fixtures. Pilot: Supabase Postgres with RLS. |
| Which agents use live LLM? | Employee Growth, Supermanager, Dynamic Learning—optional OpenAI. |
| How do we audit AI decisions? | In-memory today; persisted audit logs in Pilot Persistence Release. |
| Multi-tenant / enterprise SSO? | Schema supports multi-tenant; SSO post-pilot roadmap item. |

More: [COMPETITIVE_POSITIONING.md](./COMPETITIVE_POSITIONING.md).

---

## What we do not claim

- Full HRIS rip-and-replace (today)
- Payroll, benefits, case management
- Automated hiring, promotion, termination, or performance ratings
- “AI will decide your workforce” — humans own employment decisions

---

## Internal alignment checklist (before external pitch)

- [ ] Category line matches [STRATEGY.md](./STRATEGY.md) Section 4
- [ ] No contradiction with [PRD.md](./PRD.md) Section 8
- [ ] Demo script and recording script routes match current build
- [ ] Pilot scope references [PILOT_PERSISTENCE_RELEASE.md](./PILOT_PERSISTENCE_RELEASE.md)
- [ ] No named competitor comparisons in customer-facing decks (use category table only)
