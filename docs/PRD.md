# GrowthOS Product Requirements Document (PRD)

> **Status**: Canonical source of truth  
> **Version**: 1.0  
> **Last updated**: 2026-06-07  
> **Related docs**: [APP_FLOW.md](./APP_FLOW.md) | [TECH_STACK.md](./TECH_STACK.md) | [BACKEND_STRUCTURE.md](./BACKEND_STRUCTURE.md) | [EVALS_AND_GOVERNANCE.md](./EVALS_AND_GOVERNANCE.md) | [SECURITY_AND_PRIVACY.md](./SECURITY_AND_PRIVACY.md)

---

## 1. Product Overview

**GrowthOS** is an Agentic-HCM platform that helps organizations move from traditional HR service delivery to AI-first dynamic enablement.

**Tagline**: Grow the individual. Elevate the manager. Transform the organization.

**Alternate tagline**: Grow people. Redesign work. Increase talent density. Enable the business.

**North Star**: Every person has a growth path. Every manager has talent intelligence. Every role can evolve. Every workforce decision is skills-informed, data-ready, and responsibly AI-enabled.

GrowthOS creates an intelligent enablement layer that dynamically connects people, skills, work, learning, managers, workforce planning, internal mobility, talent density, frontline enablement, work redesign, and governance.

---

## 2. Vision

Create an AI-first dynamic enablement platform that helps employees grow, managers become supermanagers, HR redesign work, and organizations continuously adapt to the AI-first workplace.

---

## 3. Mission

Help organizations:

- Grow people
- Redesign work
- Increase talent density
- Responsibly adopt AI at scale

---

## 4. Problem Statement

Traditional HR systems and operating models are too fragmented and static for the AI-first workplace:

| Stakeholder | Problem |
|-------------|---------|
| **Employees** | Lack clear growth paths; skills are invisible or outdated; career development feels bureaucratic |
| **Managers** | Lack real-time talent intelligence; coaching is ad hoc; stretch assignments are guesswork |
| **HR** | Lack trusted skills data; workflows are reactive service delivery; cannot model work/skills/AI evolution |
| **Business leaders** | Cannot model how work, skills, people, and AI should evolve together |

GrowthOS solves this by unifying growth, skills intelligence, learning, mobility, and governance into one agentic platform with explainable AI recommendations and human accountability for sensitive decisions.

---

## 5. Target Users

| User Type | Primary Goals in GrowthOS |
|-----------|---------------------------|
| **Employees** | Discover growth paths, close skill gaps, execute growth plans |
| **Managers** | Coach effectively, plan team capability, assign stretch work |
| **HR business partners** | Monitor adoption, data readiness, workforce insights |
| **Talent management leaders** | Internal mobility, talent density, succession readiness (insights only in MVP) |
| **Learning & development leaders** | Learning recommendations tied to skills and roles |
| **Workforce planning teams** | Skills-informed readiness indicators |
| **Business executives** | Strategic workforce visibility (read-only aggregates in MVP) |
| **HRIT / system administrators** | User management, permissions, audit, configuration |

---

## 6. Personas

### 6.1 Alex — Individual Contributor (Software Engineer)

- **Role**: Employee at a mid-size tech company
- **Goals**: Understand career options, build skills for Staff Engineer path, prepare for growth conversations
- **Pains**: Unclear what skills matter; LMS feels disconnected from career; manager conversations lack structure
- **Success**: Has an active 30/60/90 growth plan, knows top 3 skill gaps, feels empowered not labeled

### 6.2 Jordan — Engineering Manager (Supermanager)

- **Role**: Manager of 8 engineers
- **Goals**: See team skills holistically, coach each person, plan capability for upcoming projects
- **Pains**: Skills data scattered; hard to spot gaps before project failure; coaching prompts are generic
- **Success**: Uses team dashboard weekly; assigns stretch work informed by skills; team growth plan adoption > 60%

### 6.3 Sam — HR Business Partner

- **Role**: HRBP supporting Engineering org (~200 employees)
- **Goals**: Ensure skills data readiness, monitor growth program adoption, spot mobility opportunities
- **Pains**: Cannot trust skills inventory; HR stuck in ticket mode; executives ask for data GrowthOS should provide
- **Success**: Data readiness score > 70%; can show mobility funnel and adoption metrics to leadership

### 6.4 Riley — L&D Leader

- **Role**: Owns learning strategy and content curation
- **Goals**: Connect learning resources to skill gaps and career paths
- **Pains**: Recommendations feel generic; low completion rates; no link to internal roles
- **Success**: Learning recommendations accepted at higher rate when tied to growth plans

### 6.5 Morgan — Workforce Planning Analyst

- **Role**: Workforce planning team member
- **Goals**: Understand skills coverage vs. future role requirements
- **Pains**: Planning spreadsheets disconnected from live skills data
- **Success**: Uses workforce readiness indicators and talent density views for quarterly planning

---

## 7. MVP Scope

**MVP Name**: GrowthOS MVP — Employee Growth + Supermanager Enablement

### 7.1 Employee Experience

| Feature | Description |
|---------|-------------|
| Growth profile | Unified view of skills, goals, and growth status |
| Skills summary | Confirmed vs. inferred skills with confidence |
| Career goal input | User-defined target role or direction |
| Recommended career paths | AI-suggested paths with explanations |
| Skill gap analysis | Gaps between current skills and target role |
| Learning recommendations | Resources mapped to gaps |
| 30/60/90-day growth plan | Structured plan with milestones |
| Manager conversation prep | Talking points and questions for 1:1 |

### 7.2 Manager / Supermanager Experience

| Feature | Description |
|---------|-------------|
| Team skills dashboard | Aggregate and per-person skills view |
| Employee growth summaries | Status of each report's growth plan |
| Coaching prompts | Contextual coaching suggestions |
| Stretch assignment suggestions | Skill-aligned project/task ideas |
| Team skill gap view | Collective gaps vs. team goals |
| Manager action recommendations | Prioritized next actions |
| Team capability planning | Plan team skill development over time |

### 7.3 HR / Admin Experience

| Feature | Description |
|---------|-------------|
| Skills data readiness dashboard | Quality/completeness of skills data |
| Internal mobility insights | Movement patterns and open opportunities |
| Growth plan adoption metrics | % employees with active plans |
| Talent density indicators | Simplified concentration-of-skills metric |
| Skill gap visibility | Org-level gap heatmaps |
| Workforce readiness indicators | Readiness vs. planned role demand |

### 7.4 MVP Agents

| Agent | MVP Priority | Purpose |
|-------|--------------|---------|
| Employee Growth Agent | Yes | Personal growth paths, plans, conversation prep |
| Supermanager Agent | Yes | Team coaching, actions, capability planning |
| Skills Intelligence Agent | Yes | Skill inference, gap analysis, confidence scoring |
| Dynamic Learning Agent | Yes | Learning recommendations tied to gaps |
| Internal Mobility Agent | Yes | Internal opportunity matching |
| Governance Agent | Yes | Policy checks, prohibited output blocking, audit |
| Talent Density Agent | Future | Advanced density modeling |
| Work Redesign Agent | Future | AI-first work redesign |
| Frontline Workforce Agent | Future | Frontline-specific enablement |
| HR Capability Agent | Future | HR operating model enablement |

---

## 8. Out of Scope (MVP Non-Goals)

The MVP must **not**:

1. Make termination recommendations
2. Make layoff recommendations
3. Make compensation recommendations
4. Make promotion decisions
5. Generate performance ratings
6. Automate hiring decisions
7. Automate succession decisions
8. Build payroll, benefits, or HR case management workflows
9. Build full Workday, SuccessFactors, Oracle, Greenhouse, or LMS integrations
10. Create a generic HR chatbot
11. Create a simple job board
12. Create only an LMS recommendation tool

See [EVALS_AND_GOVERNANCE.md](./EVALS_AND_GOVERNANCE.md) for enforcement rules.

---

## 9. Product Principles

| # | Principle | Operational Implication |
|---|-----------|-------------------------|
| 1 | Documentation is the source of truth | Code must trace to PRD FR IDs; no undocumented features |
| 2 | AI must not invent requirements | Agents use grounded data only; no fabricated skills or roles |
| 3 | AI recommendations must be explainable | Every recommendation includes rationale and evidence |
| 4 | Sensitive employment decisions require human ownership | System suggests development actions only |
| 5 | GrowthOS supports growth and coaching; not final employment decisions | UI copy and agent prompts enforce boundaries |
| 6 | Skills and recommendations include confidence and evidence | Confirmed vs. inferred distinction always visible |
| 7 | Reduce bureaucracy; HR shifts to business enablement | Self-service employee flows; HR sees aggregates not tickets |
| 8 | Human-centered, trustworthy, enterprise-ready | Professional tone; no gamification or punitive labels |
| 9 | AI-first work redesign with human validation | Future Work Redesign Agent requires human sign-off |
| 10 | Mock data first, then Supabase, then enterprise integrations | Phased data strategy per [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) |

---

## 10. Core Use Cases

| ID | Use Case | Primary Actor | MVP Agent(s) |
|----|----------|---------------|--------------|
| UC-01 | Employee sets career goal and receives path options | Employee | Employee Growth, Skills Intelligence |
| UC-02 | Employee reviews skill gaps for target role | Employee | Skills Intelligence |
| UC-03 | Employee accepts 30/60/90 growth plan | Employee | Employee Growth, Dynamic Learning |
| UC-04 | Employee prepares for manager 1:1 | Employee | Employee Growth |
| UC-05 | Manager views team skills dashboard | Manager | Supermanager, Skills Intelligence |
| UC-06 | Manager reviews employee growth summary | Manager | Supermanager |
| UC-07 | Manager uses coaching prompts in 1:1 | Manager | Supermanager |
| UC-08 | Manager assigns stretch work based on skills | Manager | Supermanager |
| UC-09 | Manager builds team capability plan | Manager | Supermanager |
| UC-10 | Employee discovers internal opportunity | Employee | Internal Mobility |
| UC-11 | HR monitors skills data readiness | HR Admin | Skills Intelligence, Governance |
| UC-12 | HR reviews growth plan adoption | HR Admin | Governance |
| UC-13 | HR analyzes internal mobility funnel | HR Admin | Internal Mobility |
| UC-14 | HR views talent density snapshot | HR Admin | Skills Intelligence (simplified) |
| UC-15 | System blocks prohibited AI output | System | Governance |

---

## 11. User Stories

### 11.1 Employee Stories

| ID | Story | Acceptance Hints |
|----|-------|------------------|
| US-E01 | As an employee, I want to see my growth profile so I understand my current state | Shows skills, goals, plan status |
| US-E02 | As an employee, I want to see confirmed vs. inferred skills | Visual distinction + confidence |
| US-E03 | As an employee, I want to set a career goal | Persist goal; link to target role |
| US-E04 | As an employee, I want recommended career paths | ≥2 paths with explanations |
| US-E05 | As an employee, I want skill gap analysis | Gaps ranked by importance |
| US-E06 | As an employee, I want learning recommendations | Tied to specific gaps |
| US-E07 | As an employee, I want a 30/60/90 growth plan | Milestones at 30, 60, 90 days |
| US-E08 | As an employee, I want manager conversation prep | Talking points + questions |
| US-E09 | As an employee, I want to accept/modify my growth plan | Editable milestones |
| US-E10 | As an employee, I want to see internal opportunities | Matched to skills (not a job board) |

### 11.2 Manager Stories

| ID | Story | Acceptance Hints |
|----|-------|------------------|
| US-M01 | As a manager, I want a team skills dashboard | All direct reports visible |
| US-M02 | As a manager, I want per-employee growth summaries | Plan status + recent activity |
| US-M03 | As a manager, I want coaching prompts | Contextual to employee situation |
| US-M04 | As a manager, I want stretch assignment suggestions | Skill-aligned, optional accept |
| US-M05 | As a manager, I want team skill gap view | Aggregate gaps vs. team goals |
| US-M06 | As a manager, I want action recommendations | Prioritized list |
| US-M07 | As a manager, I want team capability planning | Time-bound team development view |
| US-M08 | As a manager, I want to drill into one employee | Route `/manager/employee/[id]` |

### 11.3 HR / Admin Stories

| ID | Story | Acceptance Hints |
|----|-------|------------------|
| US-H01 | As HR, I want skills data readiness metrics | Score + breakdown by dimension |
| US-H02 | As HR, I want internal mobility insights | Applications, matches, movement |
| US-H03 | As HR, I want growth plan adoption metrics | % with active plans by org unit |
| US-H04 | As HR, I want talent density indicators | Simplified MVP metric |
| US-H05 | As HR, I want org skill gap visibility | Heatmap or ranked list |
| US-H06 | As HR, I want workforce readiness indicators | Role demand vs. skills supply |
| US-H07 | As HR, I want to audit agent activity | Searchable audit log |

### 11.4 System / Agent Stories

| ID | Story | Acceptance Hints |
|----|-------|------------------|
| US-A01 | As the system, I must log all agent interactions | agent_conversations + agent_messages |
| US-A02 | As the system, I must block prohibited recommendations | Governance Agent intercept |
| US-A03 | As the system, I must attach evidence to recommendations | recommendation_evidence records |
| US-A04 | As the system, I must enforce RBAC on all data access | Per [SECURITY_AND_PRIVACY.md](./SECURITY_AND_PRIVACY.md) |

---

## 12. Functional Requirements

### 12.1 Employee Requirements (FR-EMP)

| ID | Requirement |
|----|-------------|
| FR-EMP-001 | System shall display employee home dashboard at `/employee/home` |
| FR-EMP-001a | System shall display employee growth profile at `/employee/growth-profile` |
| FR-EMP-002 | System shall show skills with source type: `confirmed` or `inferred` |
| FR-EMP-003 | System shall display confidence score (0–1) for each inferred skill |
| FR-EMP-004 | System shall allow employee to set/update career goal linked to a target role |
| FR-EMP-005 | System shall generate ≥2 career path recommendations with explanations |
| FR-EMP-006 | System shall compute skill gaps between employee skills and target role skills |
| FR-EMP-007 | System shall recommend learning resources mapped to skill gaps |
| FR-EMP-008 | System shall generate 30/60/90-day growth plan with editable items |
| FR-EMP-009 | System shall provide manager conversation prep content |
| FR-EMP-010 | System shall allow employee to accept, modify, or dismiss recommendations |
| FR-EMP-011 | Employee shall only access their own profile and recommendations |
| FR-EMP-012 | System shall surface internal opportunity matches (not a job board) via recommendations on growth-profile and home |

### 12.2 Manager Requirements (FR-MGR)

| ID | Requirement |
|----|-------------|
| FR-MGR-001 | System shall display team skills dashboard for manager's direct reports only |
| FR-MGR-002 | System shall show growth plan status per direct report |
| FR-MGR-003 | System shall provide coaching prompts per employee |
| FR-MGR-004 | System shall suggest stretch assignments aligned to employee skills |
| FR-MGR-005 | System shall show aggregate team skill gaps |
| FR-MGR-006 | System shall provide prioritized manager action recommendations |
| FR-MGR-007 | System shall support team capability planning view |
| FR-MGR-008 | Manager shall not see employees outside their team (unless HR/admin role) |

### 12.3 HR / Admin Requirements (FR-HR)

| ID | Requirement |
|----|-------------|
| FR-HR-001 | System shall display org skills data readiness dashboard |
| FR-HR-002 | System shall show internal mobility insights (matches, interest, movement) |
| FR-HR-003 | System shall report growth plan adoption rate by org unit |
| FR-HR-004 | System shall display simplified talent density indicator |
| FR-HR-005 | System shall show org-level skill gap visibility |
| FR-HR-006 | System shall display workforce readiness indicators |
| FR-HR-007 | HR admin shall access audit logs for agent and recommendation activity |

### 12.4 Agent Requirements (FR-AGT)

| ID | Requirement |
|----|-------------|
| FR-AGT-001 | All agents shall ground outputs in employee_skills, roles, and learning_resources |
| FR-AGT-002 | All recommendations shall include explanation text |
| FR-AGT-003 | All recommendations shall include confidence level (high/medium/low) |
| FR-AGT-004 | Governance Agent shall block prohibited output categories |
| FR-AGT-005 | All agent conversations shall be persisted |
| FR-AGT-006 | Agent responses shall cite evidence via recommendation_evidence |
| FR-AGT-007 | Employee Growth Agent shall not produce punitive labels |
| FR-AGT-008 | Supermanager Agent shall scope outputs to manager's team only |

### 12.5 Data Requirements (FR-DATA)

| ID | Requirement |
|----|-------------|
| FR-DATA-001 | MVP shall support mock data mode via `USE_MOCK_DATA=true` |
| FR-DATA-002 | All tenant-scoped tables (`organizations`, `users`, `employees`, `teams`, `skills`, `roles`, `learning_resources`, `opportunities`, `recommendations`, `data_readiness_scores`, `audit_logs`, `agent_conversations`) shall include `organization_id`; child records inherit scope via parent FK |
| FR-DATA-003 | Skills shall reference canonical skills table |
| FR-DATA-004 | Growth plans shall have status: `draft`, `active`, `completed`, `archived` |
| FR-DATA-005 | Recommendations shall have status: `pending`, `accepted`, `dismissed`, `expired` |

---

## 13. Agent Requirements (Detailed)

### 13.1 Employee Growth Agent

- **Inputs**: employee_profile, employee_skills, career_goals, roles, growth_plans
- **Outputs**: career paths, growth plans, conversation prep, development suggestions
- **Prohibited**: promotion decisions, performance labels, compensation, termination
- **Explainability**: Each path/plan item cites skills and role requirements
- **Logging**: Full conversation + recommendation records

### 13.2 Supermanager Agent

- **Inputs**: team roster, employee_skills, growth_plans, team goals
- **Outputs**: coaching prompts, stretch assignments, action recommendations, capability plans
- **Prohibited**: ranking employees, "low performer" labels, termination suggestions
- **Scope**: Direct reports only
- **Logging**: Manager-scoped audit entries

### 13.3 Skills Intelligence Agent

- **Inputs**: employee_skills, role_skills, work history (if available), confirmed skills
- **Outputs**: gap analysis, inferred skills (with confidence), data readiness contributions
- **Prohibited**: Inventing skills without evidence basis
- **Distinction**: Always label inferred vs. confirmed

### 13.4 Dynamic Learning Agent

- **Inputs**: skill gaps, learning_resources, employee preferences
- **Outputs**: Ranked learning recommendations with rationale
- **Prohibited**: Mandating training; only suggest

### 13.5 Internal Mobility Agent

- **Inputs**: employee_skills, opportunities, career_goals
- **Outputs**: Matched internal opportunities with fit explanation
- **Prohibited**: Hiring decisions; only surface matches

### 13.6 Governance Agent

- **Inputs**: All agent outputs before delivery
- **Outputs**: Pass/block decision, audit entry, sanitized response
- **Prohibited outputs to block**: See Section 8 and [EVALS_AND_GOVERNANCE.md](./EVALS_AND_GOVERNANCE.md)

---

## 14. Data Requirements

All entities defined in [BACKEND_STRUCTURE.md](./BACKEND_STRUCTURE.md):

`organizations`, `users`, `employees`, `employee_profiles`, `managers`, `teams`, `skills`, `employee_skills`, `roles`, `role_skills`, `career_goals`, `learning_resources`, `opportunities`, `growth_plans`, `growth_plan_items`, `recommendations`, `recommendation_evidence`, `agent_conversations`, `agent_messages`, `data_readiness_scores`, `audit_logs`, `permissions`, `user_roles`

**Phase strategy**:

1. **MVP Phase 3–7**: JSON mock fixtures in `data/mock/`
2. **Phase 8**: Supabase Postgres with Drizzle ORM
3. **Post-MVP**: Enterprise HRIS/LMS read integrations

---

## 15. Permission Requirements

| Role | Employee Data | Team Data | Org Data | Admin |
|------|---------------|-----------|----------|-------|
| `employee` | Own only | — | — | — |
| `manager` | Direct reports | Own team | — | — |
| `hr_admin` | All in org | All teams | All aggregates | Audit read |
| `org_admin` | All in org | All teams | All + config | Full |
| `executive_readonly` | — | — | Aggregates only | — |

Full RBAC in [SECURITY_AND_PRIVACY.md](./SECURITY_AND_PRIVACY.md).

---

## 16. Success Metrics

| Metric | MVP Target | Measurement |
|--------|------------|-------------|
| Growth plan activation rate | ≥ 40% of demo employees | employees with `active` growth plan / total |
| Manager weekly dashboard visits | ≥ 50% of managers | analytics event |
| Recommendation acceptance rate | ≥ 25% | accepted / total recommendations |
| Skills data readiness score | ≥ 65 org average | data_readiness_scores |
| Prohibited output block rate | 100% in eval suite | evals CI |
| Agent response latency (p95) | < 5s mock, < 15s live LLM | APM |
| Employee NPS (growth module) | ≥ 30 | survey (post-MVP) |

---

## 17. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI trust deficit | Low adoption | Explainability, confidence, evidence |
| Poor skills data quality | Bad recommendations | Data readiness dashboard; confirmed skill priority |
| Scope creep into HRIS | Delayed MVP | Strict non-goals; phased integrations |
| Biased skill inference | Fairness concerns | Evals, bias checks, human review |
| Over-automation perception | Employee backlash | Human-centered copy; no punitive labels |
| Integration complexity | Enterprise sales friction | Mock-first; Supabase; adapter pattern for future |

---

## 18. Assumptions

1. MVP demo targets **knowledge workers** (engineering/product) first
2. **Single organization** per demo environment; schema supports multi-tenant
3. **English-only** UI for MVP
4. **Email/password auth** via Supabase Auth for MVP
5. **Mock data** used for Phases 3–7 before Supabase persistence
6. **Drizzle ORM** selected over Prisma (see [TECH_STACK.md](./TECH_STACK.md))
7. **OpenAI** as first LLM provider behind abstraction layer
8. Managers have explicit `team_id` → direct report mapping
9. Talent density in MVP uses simplified metric (not full Talent Density Agent)

---

## 19. Open Questions

| # | Question | Default Assumption |
|---|----------|-------------------|
| OQ-01 | Should MVP start with mock data only or Supabase from day one? | Mock first (Phases 3–7), Supabase Phase 8 |
| OQ-02 | Which LLM provider should be used first? | OpenAI behind abstraction |
| OQ-03 | Should the first demo include role switching? | Yes, via Settings demo mode |
| OQ-04 | Engineering/knowledge workers first or frontline first? | Knowledge workers first |
| OQ-05 | How many demo personas in mock data? | 1 org, 12 employees, 2 managers, 1 HR admin |
| OQ-06 | Single-tenant demo or multi-tenant from start? | Single-tenant demo; multi-tenant schema |

---

## 20. Document Index

| Document | Purpose |
|----------|---------|
| [APP_FLOW.md](./APP_FLOW.md) | Routes, journeys, UX flows |
| [TECH_STACK.md](./TECH_STACK.md) | Technology choices |
| [FRONTEND_GUIDELINES.md](./FRONTEND_GUIDELINES.md) | Design system |
| [BACKEND_STRUCTURE.md](./BACKEND_STRUCTURE.md) | Schema, APIs, services |
| [EVALS_AND_GOVERNANCE.md](./EVALS_AND_GOVERNANCE.md) | AI governance |
| [SECURITY_AND_PRIVACY.md](./SECURITY_AND_PRIVACY.md) | Security model |
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Build phases |
