# GrowthOS Workforce Intelligence Extension

**Status:** Phase WI (12A–12G) complete  
**Tagline:** Grow people. Reconfigure work. Remember why. Learn what works.

GrowthOS Workforce Intelligence extends the MVP with five connected capabilities on top of existing employee, manager, HR, agent, and governance foundations—without replacing HRIS systems of record.

---

## Capabilities

### 1. Workforce Context Graph

Relational graph edges in Postgres (`workforce_context_edges`) connect employees, teams, roles, skills, projects, business priorities, learning resources, and opportunities.

**Query helpers:** `getEmployeeContextGraph`, `getTeamContextGraph`, `getBusinessPriorityContext`, `findPeopleForBusinessPriority`, `findSkillsAtRiskForTeam`, `explainRelationship`.

**API:** `GET /api/context/employee/[id]`, `GET /api/context/team/[id]`

### 2. Decision Memory

Captures allowed workforce decisions (development plans, stretch assignments, learning investments, team capability plans)—not prohibited employment decisions.

**Tables:** `workforce_decisions`, `decision_evidence`, `decision_outcomes`, `decision_participants`

**Routes:** `/manager/decisions`, `/manager/decisions/[id]`, `/hr/decisions`, `/hr/decisions/[id]`

**API:** `GET/POST /api/decisions`, `GET/PATCH /api/decisions/[id]`, `POST /api/decisions/[id]/outcomes`

### 3. Dynamic Team and Role Modeling

Governed scenarios for how teams, roles, and skill needs may change—modeling only, no autonomous reorganization.

**Tables:** `team_scenarios`, `team_scenario_roles`, `team_scenario_skills`, `role_evolution_scenarios`, `role_task_changes`

**Routes:** `/manager/team-scenarios`, `/manager/team-scenarios/[id]`, `/hr/work-design`, `/hr/work-design/[id]`

**API:** `GET/POST /api/team-scenarios`, `GET/PATCH /api/team-scenarios/[id]`

### 4. Answer-to-Action Agent Experiences

Agents return `AgentActionPlan` with governed `AgentProposedAction` items. UI in `ActionPlanPanel` (Add to growth plan, Save as decision, Send for review, Dismiss).

**Tables:** `agent_action_plans`, `agent_proposed_actions`

**API:** `GET/POST /api/agent-actions`, `PATCH /api/agent-actions/[id]`

### 5. Organizational Learning Loop

Aggregated outcome review and pattern analysis—non-causal language only.

**Services:** `decision-outcome-service`, `organizational-learning-service`

**Route:** `/hr/organizational-learning`

**API:** `GET /api/organizational-learning`

---

## Positioning

GrowthOS is the **workforce intelligence and dynamic enablement layer** for the AI-first enterprise. It integrates with existing HCM systems; it does not replace payroll, benefits, time tracking, or core HRIS record-keeping.

---

## Governance Constraints

**Allowed decision categories:** development plan approval, stretch assignment, internal opportunity exploration, team capability plan, reskilling investment, learning intervention, temporary project assignment, workforce scenario review, role evolution review.

**Prohibited (block + audit only):** termination, layoff, compensation, promotion, final hiring, performance ratings, succession.

**Disallowed action types:** terminate, layoff, change compensation, promote, reject candidate, assign performance rating, select successor, automatically reorganize team.

---

## Success Metrics (product)

- Context traceability on recommendations
- Decision rationale and outcome documentation rates
- Recommendation-to-action conversion
- Expected vs actual outcome review rate
- Governance intervention and blocked prohibited action counts

Demo metrics in fixtures are labeled fictional.

---

## Implementation Phases (WI)

| Sub-phase | Scope |
|-----------|--------|
| 12A | Documentation and domain model |
| 12B | Context graph schema, fixtures, services |
| 12C | Decision memory UI and APIs |
| 12D | Team scenarios and work design |
| 12E | Agent action plans |
| 12F | Organizational learning |
| 12G | RLS (`0003_workforce_intelligence_rls`), evals, smoke |

**Note:** Post-MVP horizon phases 12–18 (H0–H6) in `IMPLEMENTATION_PLAN_POST_MVP.md` are separate from this Workforce Intelligence milestone (documented as Phase WI / Phase 19).
