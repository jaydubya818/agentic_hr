# GrowthOS Competitive and Category Positioning

> **Purpose:** Market framing, deal guidance, and integration posture  
> **Last updated:** 2026-06-08  
> **Constraint:** Category-based positioning only—no named competitors or third-party product comparisons in customer-facing materials.

---

## 1. Market landscape (categories)

Enterprise HR technology clusters into four buyer-relevant categories:

| Category | Buyer mental model | Typical strengths | Typical gaps for dynamic work |
|----------|-------------------|-------------------|-------------------------------|
| **Legacy HRIS** | System of record for HR transactions | Payroll, compliance, core employee data | Slow change; weak growth/skills intelligence; ticket-heavy HR ops |
| **Bolt-on AI on HRIS** | Chat/search layer on existing stack | Fast to pilot; familiar vendor | Fragmented data; shallow governance; chat ≠ enablement workflows |
| **Full agentic HRIS replacement** | Rip-and-replace with agents at the core | Unified narrative; self-maintaining ops story | Long implementation; broad scope; employment-decision risk if governance weak |
| **Agentic HCM enablement layer** | Growth, skills, coaching, mobility beside HRIS | Focused value; faster pilot; governance-first | Not payroll/benefits; requires integration for SoR data |

**GrowthOS category:** Agentic HCM **enablement layer** (row 4).

---

## 2. GrowthOS summary (current product)

| Dimension | Status |
|-----------|--------|
| **MVP** | Demo-ready Phase 11; mock-first default |
| **Experiences** | Employee, Manager/Supermanager, HR/Admin |
| **Agents** | 6 MVP agents + Governance on every invoke |
| **Governance** | Prohibited employment-decision outputs blocked; eval CI |
| **Persistence** | Schema + RLS ready; Pilot Persistence Release next |
| **Integrations** | Read adapters planned (Workday, SuccessFactors) post-MVP |
| **Live LLM** | Optional; 3 low-risk agents |

---

## 3. Category comparison matrix

Use this in internal deal strategy and RFP positioning. **Do not** map rows to specific vendor names in external decks.

| Capability | Legacy HRIS | Bolt-on AI layer | Full agentic HRIS replacement | GrowthOS enablement layer |
|------------|-------------|------------------|-------------------------------|---------------------------|
| System of record (payroll, benefits) | Core | Uses existing SoR | Target: replace SoR | **Not in scope (MVP)** |
| Employee growth paths & plans | Weak / module | Chat-only | Varies | **Core** |
| Manager coaching / team skills | Weak / separate tools | Chat-only | Varies | **Core** |
| Skills intelligence (confirmed vs inferred) | Often stale | Depends on SoR data | Varies | **Core** |
| Internal mobility insights | Module / separate | Limited | Varies | **Core** |
| Workforce readiness dashboards | Reporting | Limited | Varies | **Core** |
| Governance / prohibited outputs | Policy only | Often weak | Varies | **Core + evals** |
| Explainability (confidence, evidence) | Rare | Varies | Varies | **Required** |
| Time to credible demo | Months | Weeks | Months | **Days (mock-first)** |
| Integration posture | N/A | Read from SoR | Replace SoR | **Read from SoR; enablement beside** |

---

## 4. When GrowthOS wins

Buyer signals that favor GrowthOS:

- Need **governed growth, coaching, skills, and mobility** without HRIS rip-and-replace
- HRIS **stays** as system of record for payroll and core HR transactions
- Require **explainable AI** with confidence, evidence, and employment-decision guardrails
- Want **fast proof** (mock demo → pilot persistence → design partner)
- Managers are a **primary buyer** for talent intelligence and coaching enablement
- HR wants to move from **tickets and static reports** to workforce readiness answers
- Talent/L&D need skills-linked learning and career paths, not generic course catalogs alone

---

## 5. When another category wins

| Buyer requirement | Likely better fit |
|-------------------|-----------------|
| Single-vendor mandate to replace payroll + benefits + case management in one project | Full HRIS replacement or legacy HRIS upgrade |
| Only need enterprise search / FAQ on existing HR portal | Bolt-on AI layer |
| No appetite for AI governance or human-in-the-loop for sensitive topics | Policy-only legacy approach (or immature AI) |
| Zero integration tolerance and no HRIS read APIs | Legacy HRIS native modules only |

GrowthOS should **not** compete on payroll replacement in current scope.

---

## 6. Partner posture (integration, not rip-and-replace)

**Default GTM:** GrowthOS as the **enablement layer on top of** the customer’s HRIS system of record.

| Integration | Direction | Priority |
|-------------|-----------|----------|
| Workday | Read: employees, roles, skills | Post-MVP (H5) |
| SuccessFactors | Read: learning completions | Post-MVP (H5) |
| Internal job postings | Read: opportunities | Post-MVP |
| Learning catalogs | Read: resources | Post-MVP |

Pattern: `src/integrations/` adapters write to canonical tables—never bypass service layer ([BACKEND_STRUCTURE.md](./BACKEND_STRUCTURE.md) Section 14).

**Messaging:** “We make your workforce data actionable for growth and readiness—we don’t replace your payroll system.”

---

## 7. Deal landmines (prepare answers)

| Topic | GrowthOS position |
|-------|-------------------|
| **Employment decisions** | Blocked by governance; humans own termination, promotion, comp, ratings, hiring, succession |
| **Data residency** | Supabase/Postgres; customer-controlled region in enterprise deploy |
| **RLS / RBAC** | Five roles; cross-org never allowed; matrix in PILOT_PERSISTENCE_RELEASE |
| **Audit trail** | In-memory MVP; persisted in Pilot Persistence Release |
| **Bias / fairness** | Evals, inferred-skill labeling, no punitive labels in agents |
| **SSO / SCIM** | Post-pilot enterprise roadmap |
| **Custom skills taxonomy** | Supported via org data; maintenance agents in H3 |

---

## 8. Demo proof path

Always anchor technical claims to the live demo:

1. Login: `alex.chen@techforward.io` / any password
2. Employee → Manager → HR journeys ([DEMO_SCRIPT.md](./DEMO_SCRIPT.md))
3. Governance: **Demo: governance block** on growth profile
4. Guard: employee `/hr/home` → `/forbidden`
5. Automation: `npm run smoke`, `npm run evals`

---

## 9. Honest gaps (do not oversell)

| Gap | Mitigation timeline |
|-----|---------------------|
| Mock auth | Pilot Persistence Release |
| Audit logs in-memory | Pilot Persistence Release |
| No payroll/benefits/case mgmt | Out of scope unless H6 / PRD v2 |
| Limited live LLM agents | Expand only with governance review |
| No production HRIS sync yet | Horizon H5 |
| `/onboarding` placeholder | Horizon H4 |

---

## 10. Internal use only

This document is for **sales engineering, product, and leadership**. Customer-facing collateral should use:

- Category table (Section 3) without vendor columns labeled with company names
- [GTM_NARRATIVE.md](./GTM_NARRATIVE.md) talk tracks
- [ONE_PAGER.md](./ONE_PAGER.md) leave-behind

Do not publish named competitor battlecards from this repository.
