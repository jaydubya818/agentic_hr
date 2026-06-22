# PRD v2 Gate — Agentic HRIS Core (H6)

**Status:** GATED — no implementation until leadership approves  
**Last updated:** 2026-06-08  
**Horizon:** H6 in [`ROADMAP_AGENTIC_HCM.md`](./ROADMAP_AGENTIC_HCM.md)

---

## Purpose

Document scope for a potential **Agentic HRIS core** (compensation, performance, succession, full HRIS replacement) separate from the GrowthOS **enablement layer**. This gate blocks Phase 19+ engineering until explicit stakeholder sign-off.

---

## In scope (candidate PRD v2 topics)

- Workforce transactions beyond enablement (if product strategy shifts)
- Deep HRIS write-back and policy automation
- Compensation planning workflows
- Formal performance management cycles
- Succession planning with employment-decision outputs

---

## Explicitly out of scope until approved

- Any production logic for termination, layoffs, demotion, compensation changes, promotion decisions, hiring decisions, performance ratings, or succession placement
- Replacing Workday / SuccessFactors as system of record
- Autonomous employment decisions without human-in-the-loop

---

## Architecture boundary

| Layer | Responsibility |
|-------|----------------|
| **Enablement (GrowthOS MVP + H0–H5)** | Growth profiles, skills, learning, mobility insights, governed agents, audit |
| **HRIS core (H6, gated)** | HR transactions, comp, performance cycles — **not started** |

Enablement agents must remain read-mostly on HRIS data via [`src/integrations/`](../../src/integrations/) adapters. No write-back without a separate security review.

---

## Stakeholder gate

| Decision | Owner | Date | Outcome |
|----------|-------|------|---------|
| Proceed with PRD v2 drafting | Leadership | 2026-06-08 | **Deferred** — planning doc only |
| Approve H6 implementation | Leadership | — | **Not approved** |

**Recorded in:** [`progress.txt`](../../progress.txt) Phase 18.

---

## Next steps (only after approval)

1. Publish full PRD v2 with FR IDs and governance matrix
2. Architecture review ADR (enablement vs HRIS core)
3. Spawn Phases 19+ in a new implementation plan — not [`IMPLEMENTATION_PLAN_POST_MVP.md`](./IMPLEMENTATION_PLAN_POST_MVP.md)
