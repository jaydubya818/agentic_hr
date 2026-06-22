# GrowthOS Strategy

> **Status:** Canonical strategy brief  
> **Last updated:** 2026-06-08  
> **Related:** [PRD.md](./PRD.md) | [PITCH.md](./PITCH.md) | [GTM_NARRATIVE.md](./GTM_NARRATIVE.md) | [COMPETITIVE_POSITIONING.md](./COMPETITIVE_POSITIONING.md) | [ROADMAP_AGENTIC_HCM.md](./ROADMAP_AGENTIC_HCM.md)

---

## 1. Why GrowthOS exists

Work is changing faster than most HR technology can adapt. Teams form and reform. Roles evolve. Skills shift in quarters, not years. Yet most organizations still run people programs on fragmented systems that capture **transactions**, not **how work actually changes**—and bolt AI on top as a chat layer instead of rebuilding around agents.

GrowthOS exists to help organizations move from **traditional HR service delivery** to **AI-first dynamic enablement**: governed agents that help employees grow, managers coach with talent intelligence, and HR lead workforce readiness—not ticket queues.

---

## 2. Problem

| Stakeholder | Pain |
|-------------|------|
| **Employees** | Unclear growth paths; skills invisible or stale; development feels bureaucratic |
| **Managers** | No real-time talent picture; coaching is ad hoc; systems are worked around |
| **HR** | Stuck in ticket mode; untrusted skills data; slow, costly system change |
| **Leaders** | Incomplete context for workforce decisions; agents lack grounding data |

**Structural forces:**

- Change in HR is slow and costly—consultants and in-house teams maintain legacy configuration.
- Employees cannot find what they need; managers route around HR systems.
- Systems record payroll events and course completions, not skills, growth intent, or decision rationale.
- Bolt-on AI chat does not fix fragmented data or governance gaps.

---

## 3. Vision and mission

**Vision:** An AI-first dynamic enablement platform where every person has a growth path, every manager has talent intelligence, and workforce change is skills-informed, explainable, and responsibly governed.

**Mission:** Help organizations grow people, redesign work, increase talent density, and adopt AI at scale—with humans owning consequential employment decisions.

**North star** (from [PRD.md](./PRD.md)): Every person has a growth path. Every manager has talent intelligence. Every role can evolve. Every workforce decision is skills-informed, data-ready, and responsibly AI-enabled.

---

## 4. Category: enablement layer vs system of record

GrowthOS is **not** positioned today as a full payroll, benefits, or HR case-management replacement.

| Category | What it optimizes | GrowthOS today |
|----------|-------------------|----------------|
| **Legacy HRIS** | Transactions, compliance, payroll | Integrates via read adapters (post-MVP) |
| **Bolt-on AI on HRIS** | Chat and search on existing data | Not our model—we are not a generic HR chatbot |
| **Full agentic HRIS replacement** | Rip-and-replace system of record | Out of MVP scope; requires PRD v2 if pursued |
| **Agentic HCM enablement layer** | Growth, skills, coaching, mobility, readiness | **Current category** |

**Category line:** GrowthOS is the **governed agentic enablement layer** for growth, supermanager coaching, skills intelligence, internal mobility, and workforce readiness—designed to work **alongside** an HRIS system of record until a deliberate expansion is approved.

See [COMPETITIVE_POSITIONING.md](./COMPETITIVE_POSITIONING.md) for market framing without vendor names.

---

## 5. Strategic pillars

These pillars align product, GTM, and roadmap. They are **GrowthOS themes**, not competitor copy.

### 5.1 Agents power enablement (not just the interface)

Six MVP agents plus a Governance Agent on every invoke:

- Employee Growth, Supermanager, Skills Intelligence, Dynamic Learning, Internal Mobility, Governance

Agents ground recommendations in org data, produce explainable outputs, and pass through governance before delivery.

### 5.2 Self-maintaining enablement data

Long-term: agents help maintain **skills taxonomies, role-skill maps, inferred-skill review queues, and data readiness**—not payroll configuration or benefits enrollment. Horizon H3 in [ROADMAP_AGENTIC_HCM.md](./ROADMAP_AGENTIC_HCM.md).

Today: schema, RLS, and seed path ready; mock fixtures for demo.

### 5.3 Answers, not tickets

Employees and managers get **actionable growth and coaching answers** with explanation, confidence, and evidence—not HR case tickets. HR gets **readiness and mobility insights** instead of ad-hoc report requests.

Post-pilot: persisted recommendations and audit rationale strengthen “captures context behind decisions.”

### 5.4 Built for a dynamic workforce

Career paths, internal mobility, talent density signals, team capability planning, and workforce readiness dashboards support **fluid teams** and skills-informed change—not static org-chart administration alone.

---

## 6. Product principles (operational)

Carried from [PRD.md](./PRD.md) Section 9:

1. Documentation is source of truth.
2. AI must not invent requirements.
3. Every recommendation is explainable (rationale + evidence + confidence).
4. Sensitive employment decisions require human ownership.
5. GrowthOS supports growth and coaching—not final employment decisions.
6. Confirmed vs inferred skills are always distinguished.
7. HR shifts from service delivery to business enablement.
8. Human-centered, enterprise-ready tone.
9. AI-first work redesign requires human validation (future).
10. Mock first → Supabase → enterprise read integrations.

---

## 7. MVP status (2026-06-08)

- **Demo-ready** through Implementation Plan Phase 11
- Mock data and mock agents default (`USE_MOCK_DATA=true`, `USE_MOCK_AGENTS=true`)
- Employee, Manager, HR experiences + six governed agents
- Optional Supabase persistence and OpenAI live calls when configured
- **Next engineering milestone:** [PILOT_PERSISTENCE_RELEASE.md](./PILOT_PERSISTENCE_RELEASE.md)

---

## 8. Non-goals (carry forward)

MVP and near-term strategy **must not**:

1. Recommend termination, layoff, compensation, promotion, performance ratings, succession, or automated hiring decisions
2. Build payroll, benefits, or HR case management
3. Claim full HRIS replacement in GTM without PRD v2 and H6 approval
4. Ship a generic HR chatbot, job board, or LMS-only tool

Enforcement: [EVALS_AND_GOVERNANCE.md](./EVALS_AND_GOVERNANCE.md).

---

## 9. Twelve-month strategic priorities

| Priority | Outcome | Horizon |
|----------|---------|---------|
| **Pilot persistence** | Auth, RLS, persisted recommendations, audit logs | H0 |
| **Record and run pilots** | Demo + 2–3 design partners on enablement layer | Now |
| **Decision context** | HR audit view, exportable governance history | H2 |
| **Enablement Q&A** | Governed workforce/growth answers for employees and managers | H1 |
| **Data quality agents** | Skills/role maintenance workflows for org admins | H3 |
| **HRIS read fabric** | Workday/SF adapters into canonical tables | H5 |
| **Category gate** | Leadership decision on enablement-only vs HRIS core expansion | H6 gate |

Detailed horizons: [ROADMAP_AGENTIC_HCM.md](./ROADMAP_AGENTIC_HCM.md).

---

## 10. Success measures

| Metric | MVP / near-term target |
|--------|------------------------|
| Growth plan activation | ≥ 40% demo employees |
| Manager weekly dashboard use | ≥ 50% managers |
| Recommendation acceptance | ≥ 25% |
| Skills data readiness (org) | ≥ 65 |
| Prohibited output block rate | 100% in eval suite |
| Pilot customers on persistence | 1–3 after H0 exit |

---

## 11. Risks

| Risk | Mitigation |
|------|------------|
| AI trust deficit | Explainability, governance demo, evals CI |
| Poor skills data | Data readiness dashboard; confirmed-skill priority |
| Scope creep into HRIS | PRD Section 8; H6 gate |
| Messaging overreach (“replace HRIS”) | GTM checklist vs product scope |
| Integration complexity | Mock-first; adapter pattern in BACKEND_STRUCTURE |

---

## 12. Document map

| Audience | Document |
|----------|----------|
| Strategy | This file |
| Sales / demo narrative | [GTM_NARRATIVE.md](./GTM_NARRATIVE.md), [ONE_PAGER.md](./ONE_PAGER.md) |
| Market category | [COMPETITIVE_POSITIONING.md](./COMPETITIVE_POSITIONING.md) |
| Product roadmap | [ROADMAP_AGENTIC_HCM.md](./ROADMAP_AGENTIC_HCM.md) |
| Pitch + demo | [PITCH.md](./PITCH.md), [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) |
| Requirements | [PRD.md](./PRD.md) |
