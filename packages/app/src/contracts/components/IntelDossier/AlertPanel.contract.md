# Component Contract: AlertPanelWidget

**File:** `packages/app/src/components/IntelDossier/widgets/AlertPanelWidget.tsx`
**Type:** widget
**Parent Group:** IntelDossier/widgets
**Contract Version:** 1.0.0
**Last Reviewed:** 2026-02-10

---

## Identity

- **Component Name:** AlertPanelWidget
- **Introduced:** 2024-Q4
- **Description:** Panel displaying list of alerts with severity icons (ℹ️ info, ⚠️ warn, 🚨 error) and messages.

---

## Render Location

Renders as a grid cell within the IntelDossier/DossierView layout container. Positioned based on `span` prop (CSS Grid column span). Typically appears in 2-column or 3-column grid layouts for dossier content visualization.

---

## Lifecycle

Pure render component. No effects or lifecycle hooks. Receives data and renders immediately based on props. No mounting/unmounting side effects.

---

## Props Contract

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| data.alerts | `Array<{severity: 'info'\|'warn'\|'error', message: string}>` | ✅ | Alert list |
| span | `number` | ✅ | Grid column span |

---

## State Ownership

None — this widget renders from props only. Alert list and messages are passed via `data.alerts` prop; no local state management.

---

## Interactions

### Parent Communication
- **Mechanism:** none
- **Description:** Stateless widget renders alert data without callbacks
- **Example:** Parent passes `data.alerts` → Widget renders alerts

### Child Communication
- **Child:** none
- **Mechanism:** none
- **Description:** Pure render component with no child components

### Sibling Communication
- **Sibling:** Other widgets in DossierView grid
- **Mechanism:** parent-mediated
- **Description:** Grid layout positioning via `span` prop coordinates widget placement

### Context Interaction
- **Context:** none
- **Role:** none
- **Operations:** none

---

## Side Effects

None — pure presentation component with no side effects.

---

## Test Hooks

**CSS Classes:**
- `.widget-alert-panel`
- `.widget-alert-panel__title`
- `.widget-alert-panel__list`
- `.widget-alert-panel__alert`
- `.widget-alert-panel__alert--info`
- `.widget-alert-panel__alert--warn`
- `.widget-alert-panel__alert--error`
- `.widget-alert-panel__icon`
- `.widget-alert-panel__message`

---

**Contract Authored:** 2026-02-10
**Version:** 1.0.0
