# GrowthOS Frontend Guidelines

> **Status**: Canonical source of truth  
> **Version**: 1.0  
> **Last updated**: 2026-06-07  
> **Related docs**: [PRD.md](./PRD.md) | [APP_FLOW.md](./APP_FLOW.md) | [TECH_STACK.md](./TECH_STACK.md)

---

## 1. Design Principles

GrowthOS should feel like a **modern enterprise SaaS** product:

| Principle | Expression |
|-----------|------------|
| Clean | Generous whitespace; no visual clutter |
| Trustworthy | Evidence-backed recommendations; no hype |
| Executive-ready | Suitable for leadership demos |
| Human-centered | Empowering language; growth-oriented |
| Calm | Soft neutrals; restrained motion |
| Modern | Contemporary typography and components |
| Professional | No gimmicks, memes, or consumer-social patterns |
| Strategic | Data-forward dashboards; clear hierarchy |

**Avoid**: Overly playful UI, gamification badges, punitive labels, neon colors, dense HR-admin tables without hierarchy.

---

## 2. Visual Identity

### 2.1 Brand Personality

- **Voice**: Clear, supportive, strategic
- **Metaphor**: Growth journey — paths, milestones, capability building
- **Not**: Performance punishment, ranking, or "HR ticket system"

### 2.2 Logo / Wordmark (Placeholder)

- Text wordmark: **GrowthOS** in Inter Semibold
- Optional icon: upward growth arrow merged with network nodes (implement in Phase 11)
- Minimum clear space: 16px around wordmark

---

## 3. Color Palette

### 3.1 Core Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--background` | `#F8FAFC` | Page background (slate-50) |
| `--surface` | `#FFFFFF` | Cards, panels, modals |
| `--foreground` | `#0F172A` | Primary text (slate-900) |
| `--muted-foreground` | `#64748B` | Secondary text (slate-500) |
| `--border` | `#E2E8F0` | Borders, dividers (slate-200) |
| `--primary` | `#1E4D8C` | Primary actions, nav active |
| `--primary-hover` | `#163A6B` | Primary hover state |
| `--primary-foreground` | `#FFFFFF` | Text on primary |
| `--accent` | `#0D9488` | Growth accent (teal-600) |
| `--accent-foreground` | `#FFFFFF` | Text on accent |
| `--accent-muted` | `#CCFBF1` | Accent backgrounds (teal-100) |

### 3.2 Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--success` | `#059669` | Completed milestones, high confidence |
| `--success-muted` | `#D1FAE5` | Success backgrounds |
| `--warning` | `#D97706` | Medium confidence, attention |
| `--warning-muted` | `#FEF3C7` | Warning backgrounds |
| `--error` | `#DC2626` | Errors, destructive actions |
| `--error-muted` | `#FEE2E2` | Error backgrounds |
| `--info` | `#2563EB` | Informational callouts |

### 3.3 Skill & Confidence Colors

| Skill Source | Badge Style |
|--------------|-------------|
| Confirmed | `bg-slate-100 text-slate-700 border-slate-200` + check icon |
| Inferred | `bg-amber-50 text-amber-800 border-amber-200` + sparkle icon |

| Confidence Level | Color | Threshold |
|------------------|-------|-----------|
| High | `#059669` | ≥ 0.75 |
| Medium | `#D97706` | 0.50 – 0.74 |
| Low | `#DC2626` | < 0.50 |

### 3.4 Chart Colors (Ordered Series)

1. `#1E4D8C` (primary blue)
2. `#0D9488` (teal)
3. `#6366F1` (indigo)
4. `#8B5CF6` (violet)
5. `#EC4899` (pink)
6. `#F59E0B` (amber)

---

## 4. Typography

### 4.1 Font Families

| Use | Font | Fallback |
|-----|------|----------|
| UI | **Inter** | system-ui, sans-serif |
| Monospace | **JetBrains Mono** | monospace |

Load via `next/font/google` in root layout.

### 4.2 Type Scale

| Token | Size | Weight | Line Height | Use |
|-------|------|--------|-------------|-----|
| `text-display` | 36px / 2.25rem | 600 | 1.2 | Page heroes (sparingly) |
| `text-h1` | 30px / 1.875rem | 600 | 1.3 | Page titles |
| `text-h2` | 24px / 1.5rem | 600 | 1.35 | Section headers |
| `text-h3` | 20px / 1.25rem | 600 | 1.4 | Card titles |
| `text-h4` | 18px / 1.125rem | 500 | 1.4 | Subsection headers |
| `text-body` | 16px / 1rem | 400 | 1.5 | Body copy |
| `text-body-sm` | 14px / 0.875rem | 400 | 1.5 | Secondary body |
| `text-caption` | 12px / 0.75rem | 400 | 1.4 | Labels, metadata |
| `text-mono` | 13px / 0.8125rem | 400 | 1.4 | Confidence scores, codes |

### 4.3 Typography Rules

- Page titles: one `h1` per page
- Card titles: `h3` max (don't compete with page title)
- Muted text for supporting context only — not primary actions
- Max line length for prose: 65ch

---

## 5. Spacing Scale

Base unit: **4px**

| Token | Value | Common Use |
|-------|-------|------------|
| `space-1` | 4px | Tight icon gaps |
| `space-2` | 8px | Inline element gaps |
| `space-3` | 12px | Form field internal |
| `space-4` | 16px | Card padding (compact) |
| `space-6` | 24px | Card padding (default) |
| `space-8` | 32px | Section gaps |
| `space-12` | 48px | Page section separation |
| `space-16` | 64px | Major layout breaks |

**Card padding default**: 24px (`p-6`)

**Page content padding**: 32px horizontal on desktop (`px-8`), 16px on mobile (`px-4`)

---

## 6. Layout Rules

### 6.1 App Shell

```
┌─────────────────────────────────────────────────────┐
│ TopBar (56px): logo | org name | role switch | user │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │ Main Content                             │
│ (240px)  │ max-width: 1280px, centered              │
│          │ padding: 32px                            │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

- Sidebar collapses to icons-only at `lg` breakpoint (optional Phase 11)
- Mobile: sidebar becomes sheet/drawer

### 6.2 Grid Patterns

| Pattern | Grid |
|---------|------|
| Dashboard KPIs | 4 columns desktop, 2 tablet, 1 mobile |
| Recommendation list | Single column, max 720px |
| Team skills table | Full width with horizontal scroll on mobile |
| Two-column detail | 2/3 main + 1/3 sidebar on `xl` |

### 6.3 Border Radius

| Element | Radius |
|---------|--------|
| Buttons, inputs | 8px (`rounded-lg`) |
| Cards | 12px (`rounded-xl`) |
| Modals, sheets | 16px (`rounded-2xl`) |
| Skill chips | 9999px (`rounded-full`) |

### 6.4 Shadows

| Level | Shadow |
|-------|--------|
| Card default | `shadow-sm` |
| Card hover | `shadow-md` |
| Modal / sheet | `shadow-lg` |
| Dropdown | `shadow-md` |

---

## 7. Component Guidelines

### 7.1 shadcn/ui Components to Install (Phase 1)

- Button, Card, Badge, Input, Label, Textarea, Select
- Tabs, Dialog, Sheet, Dropdown Menu, Avatar
- Progress, Separator, Skeleton, Tooltip
- Table, ScrollArea, Alert, Toast (Sonner)

### 7.2 Custom Components (Build in Phases 4–7)

| Component | Path | Purpose |
|-----------|------|---------|
| `SkillChip` | `src/components/shared/SkillChip.tsx` | Skill with source badge |
| `ConfidenceIndicator` | `src/components/shared/ConfidenceIndicator.tsx` | Bar + label |
| `RecommendationCard` | `src/components/shared/RecommendationCard.tsx` | Standard recommendation UI |
| `AgentPanel` | `src/components/agents/AgentPanel.tsx` | Agent chat / response |
| `GrowthPlanTimeline` | `src/components/employee/GrowthPlanTimeline.tsx` | 30/60/90 view |
| `DataReadinessScorecard` | `src/components/hr/DataReadinessScorecard.tsx` | HR readiness |
| `TeamSkillsHeatmap` | `src/components/manager/TeamSkillsHeatmap.tsx` | Team matrix |
| `EmptyState` | `src/components/shared/EmptyState.tsx` | Consistent empty states |
| `PageHeader` | `src/components/layout/PageHeader.tsx` | Title + actions |
| `KpiCard` | `src/components/shared/KpiCard.tsx` | Dashboard metric |

### 7.3 Button Hierarchy

| Variant | Use |
|---------|-----|
| Primary (default) | Main CTA per section — one per card |
| Secondary (outline) | Alternative actions |
| Ghost | Tertiary / table actions |
| Destructive | Dismiss, delete — with confirmation |

---

## 8. Dashboard Patterns

### 8.1 Employee Home Dashboard

```
[PageHeader: "Good morning, Alex"]
[KPI row: Plan status | Skills count | Next milestone]
[Section: Active Growth Plan — timeline preview]
[Section: Top Skill Gaps — 3 chips with gap severity]
[Section: Recommendations — 2-3 RecommendationCards]
[Quick actions row]
```

### 8.2 Manager Home Dashboard

```
[PageHeader: "Team Overview"]
[KPI row: Team size | Plan adoption % | Open actions]
[Section: Action Recommendations — prioritized list]
[Section: Team Members — card grid with status]
[Section: Team Skill Gaps — summary chart]
```

### 8.3 HR Home Dashboard

```
[PageHeader: "Workforce Enablement"]
[KPI row: Data readiness | Plan adoption | Mobility rate | Readiness score]
[Section: Alerts — low readiness units]
[Section: Charts — 2-column readiness + adoption trends]
```

---

## 9. Card Patterns

### 9.1 Standard Card

```tsx
// Structure (conceptual)
<Card>
  <CardHeader>
    <CardTitle />
    <CardDescription />
  </CardHeader>
  <CardContent />
  <CardFooter />  // optional actions
</Card>
```

- White surface on slate background
- 24px padding
- Title + optional description
- Actions in footer, right-aligned

### 9.2 KPI Card

- Large number (30px, semibold)
- Label below (caption, muted)
- Optional trend indicator (+/- %)
- Optional sparkline (Phase 6+)

---

## 10. Form Patterns

### 10.1 Career Goal Form

- Target role: Searchable select (combobox)
- Optional description: Textarea, 500 char max
- Timeline preference: Select (6mo / 1yr / 2yr+)
- Submit: Primary button, full width on mobile

### 10.2 Validation

- Inline errors below field (red, caption size)
- Zod schemas shared client/server
- Disable submit until valid
- Toast on success

### 10.3 Form Layout

- Single column on mobile
- Max width 480px for focused forms
- Label above input (not floating)

---

## 11. Agent Response Patterns

### 11.1 Agent Panel Layout

```
┌─────────────────────────────────────┐
│ Agent: Employee Growth        [···] │
├─────────────────────────────────────┤
│ [Avatar] Response content...        │
│                                     │
│ Confidence: ████████░░ 82% (High)  │
│                                     │
│ Evidence:                           │
│ • Skill: TypeScript (confirmed)     │
│ • Role: Staff Engineer requires...  │
├─────────────────────────────────────┤
│ [Accept] [Modify] [Dismiss]         │
└─────────────────────────────────────┘
```

### 11.2 Streaming (Phase 9)

- Skeleton lines while streaming
- Cursor blink on active stream
- Final content replaces skeleton
- Governance check before display

### 11.3 Agent Message Styling

- Agent messages: left-aligned, surface background
- User messages: right-aligned, primary-muted background
- Timestamp: caption, muted, on hover

---

## 12. Recommendation Card Pattern

**Required fields on every recommendation card**:

| Field | Required |
|-------|----------|
| Title | Yes |
| Explanation (2–4 sentences) | Yes |
| Confidence indicator | Yes |
| Evidence links (≥1) | Yes |
| Recommendation type badge | Yes |
| Actions (Accept / Dismiss) | Yes |
| Created date | Yes |

**Layout**:

```
┌──────────────────────────────────────────────┐
│ [Badge: Learning]              Confidence: High│
│ Title: Complete Advanced TypeScript Course     │
│ Explanation: Based on your gap in...           │
│ Evidence: Role requirement · Skill gap        │
│ [Accept]  [Dismiss]  [View details]            │
└──────────────────────────────────────────────┘
```

**Prohibited card content**: "Promote", "Terminate", "Low performer", "Not promotable"

---

## 13. Chart Patterns

### 13.1 Recharts Standards

- Always include axis labels
- Tooltip on hover with formatted values
- Legend when >1 series
- Responsive container: `width="100%" height={300}`
- Accessible: `aria-label` on chart container

### 13.2 Chart Types by Page

| Page | Chart Type |
|------|------------|
| Team Skills | Heatmap or grouped bar |
| HR Readiness | Radial progress + bar by dept |
| Talent Density | Horizontal bar (top skills) |
| Workforce Readiness | Stacked bar (supply vs demand) |
| Adoption metrics | Line chart over time |

### 13.3 Empty Chart State

Show illustration + "Not enough data yet" — never render broken axes.

---

## 14. Responsive Breakpoints

| Breakpoint | Min Width | Behavior |
|------------|-----------|----------|
| `sm` | 640px | 2-column KPI grid |
| `md` | 768px | Sidebar visible |
| `lg` | 1024px | Full dashboard layouts |
| `xl` | 1280px | Two-column detail pages |
| `2xl` | 1536px | Max content width capped |

**Mobile-first**: Design for 375px minimum (iPhone SE).

---

## 15. Accessibility Rules

### 15.1 WCAG 2.1 AA Requirements

- Color contrast: 4.5:1 text, 3:1 large text and UI components
- All interactive elements keyboard accessible
- Focus ring visible: `ring-2 ring-primary ring-offset-2`
- Skip to main content link
- Form fields associated with labels (`htmlFor`)
- Images have alt text; decorative images `alt=""`

### 15.2 Component-Specific

| Component | A11y Requirement |
|-----------|------------------|
| ConfidenceIndicator | `aria-label="Confidence: High, 82 percent"` |
| SkillChip | `aria-label="TypeScript, confirmed skill"` |
| RecommendationCard | Actions are buttons with descriptive labels |
| Charts | Summary text alternative below chart |
| AgentPanel | `role="log"` for message list, `aria-live="polite"` |

### 15.3 Motion

- Respect `prefers-reduced-motion`
- No auto-playing animations > 3s
- Transitions: 150–200ms ease

---

## 16. UX Writing Tone

### 16.1 Voice Attributes

| Do | Don't |
|----|-------|
| "Your growth path" | "Your performance trajectory" |
| "Skills to develop" | "Deficiencies" |
| "Opportunity to grow" | "Not ready for promotion" |
| "We recommend" | "You must" |
| "Based on your skills and goals" | "AI determined" |

### 16.2 Confidence Copy

| Level | Label | Helper |
|-------|-------|--------|
| High | "High confidence" | "Strong match based on available data" |
| Medium | "Moderate confidence" | "Consider discussing with your manager" |
| Low | "Exploratory" | "Limited data — verify before acting" |

### 16.3 Error Copy

- Be specific but not technical: "We couldn't load your growth plan" not "Error 500"
- Always offer recovery action
- Never blame the user

### 16.4 Empty State Copy

- Lead with opportunity, not absence: "Start shaping your growth path" not "No data found"

---

## 17. Loading, Empty, and Error States

### 17.1 Loading

| Context | Pattern |
|---------|---------|
| Page load | Skeleton matching layout shape |
| Card data | Skeleton card (title + 3 lines) |
| Chart | Skeleton rectangle 300px height |
| Button action | Spinner + disabled state |
| Agent response | Typing indicator / skeleton lines |

### 17.2 Empty States

Use `EmptyState` component with:
- Icon (Lucide, muted)
- Headline (h3)
- Description (body-sm, muted)
- Primary CTA button

See [APP_FLOW.md](./APP_FLOW.md) Section 9 for page-specific copy.

### 17.3 Error States

| Severity | Pattern |
|----------|---------|
| Inline field error | Red text below field |
| Section error | Alert component (destructive variant) |
| Page error | Full-page with retry + go home |
| Toast error | Sonner toast, 5s duration |

---

## 18. Tailwind Configuration Notes

Map CSS variables in `globals.css`:

```css
:root {
  --background: #F8FAFC;
  --foreground: #0F172A;
  --primary: #1E4D8C;
  --accent: #0D9488;
  /* ... full token set from Section 3 */
}
```

Use `cn()` utility (clsx + tailwind-merge) for conditional classes.

---

## 19. Workforce Intelligence UI patterns (Phase WI)

Components under `src/components/workforce-intelligence/`:

| Pattern | Component | Use |
|---------|-----------|-----|
| Context relationships | `ContextGraphSummary`, `RelationshipCard` | Grouped entity links, not node-link graphs |
| Decision memory | `DecisionCard`, `DecisionTimeline`, `DecisionEvidenceList` | Manager/HR decision views |
| Outcomes | `DecisionOutcomeComparison` | Expected vs actual, non-causal labels |
| Scenarios | `ScenarioComparison`, `SkillSupplyDemandCard`, `RoleEvolutionCard` | Team and role modeling |
| Agent actions | `ActionPlanPanel`, `ProposedActionItem`, `HumanReviewBadge` | Answer-to-action flows |
| Learning | `OutcomePatternCard`, `LearningSignalCard` | HR organizational learning |

---

## 20. Cross-References

- Routes and page content: [APP_FLOW.md](./APP_FLOW.md)
- Tech implementation: [TECH_STACK.md](./TECH_STACK.md)
- API data shapes: [BACKEND_STRUCTURE.md](./BACKEND_STRUCTURE.md)
