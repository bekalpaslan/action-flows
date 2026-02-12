# ReminderButtonBar Behavioral Contract

## Identity
**Component Name:** ReminderButtonBar
**File Path:** packages/app/src/components/SessionPanel/ReminderButtonBar.tsx
**Type:** Presentation
**Last Updated:** 2026-02-12

## Render Location
Horizontal button bar above chat input in ChatPanel. Displays reminder/prompt button suggestions for context-aware interactions.

## Lifecycle
- **Mount:** Loads reminder definitions from context
- **Update:** Re-renders when reminder set changes
- **Unmount:** Cleans up

## Props Contract
```typescript
interface ReminderButtonBarProps {
  reminders: ReminderDefinition[];
  onReminderSelect: (reminder: ReminderDefinition) => void;
}
```

## State Ownership
- **Active reminder:** Currently selected reminder
- **Hover state:** Which button is hovered
- **Visible reminders:** Filtered set of reminders to display

## Interactions
- **Click button:** Triggers reminder/prompt action
- **Hover:** Shows button tooltip
- **Right-click:** May show options menu

## Test Hooks
- `data-testid="reminder-button-bar"` on main container
- `data-testid="reminder-button-{id}"` on individual button
