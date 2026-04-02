# Phase 3: Design System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 03-design-system
**Areas discussed:** Token migration, Component scope, Dark/light theme

---

## Token Migration

| Option | Description | Selected |
|--------|-------------|----------|
| Bridge: Tailwind reads tokens | Keep design-tokens.css, Tailwind @theme maps to CSS vars | |
| Replace: Tailwind owns tokens | Migrate values into Tailwind config, delete design-tokens.css | ✓ |
| You decide | Claude picks | |

**User's choice:** Replace — Tailwind v4 becomes single source of truth
**Notes:** Clean ownership. No dual-system maintenance.

---

## Component Scope

| Option | Description | Selected |
|--------|-------------|----------|
| All 12 now | Complete library before workbench content | ✓ |
| Critical 6 first | Button, Card, Input, Badge, Tabs, Dialog subset | |
| You decide | Claude picks based on downstream needs | |

**User's choice:** All 12 now
**Notes:** Complete component library upfront ensures all downstream phases have everything they need.

---

## Dark/Light Theme

| Option | Description | Selected |
|--------|-------------|----------|
| Dark only for v1 | Ship dark theme only, light later | |
| Both themes now | Dark + light from the start, tokens structured for switching | ✓ |
| You decide | Claude picks | |

**User's choice:** Both themes now
**Notes:** Avoids retrofit. Tokens structured for theme switching from day one.

---

## Claude's Discretion

- Tailwind v4 @theme structure and naming
- Component library directory organization
- Theme switching mechanism
- Component manifest format
- Storybook inclusion decision
- Radix primitive selection per component

## Deferred Ideas

None
