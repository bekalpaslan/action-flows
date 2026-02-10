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

## Props Contract

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| data.alerts | `Array<{severity: 'info'\|'warn'\|'error', message: string}>` | ✅ | Alert list |
| span | `number` | ✅ | Grid column span |

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
