# ChangePreview Behavioral Contract

## Identity
**Component Name:** ChangePreview
**File Path:** packages/app/src/components/ChangePreview/ChangePreview.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Code diff/change preview panel. Displays file changes, additions, and deletions in side-by-side or unified diff format.

## Lifecycle
- **Mount:** Loads file changes and prepares diff visualization
- **Update:** Re-renders when displayed file changes
- **Unmount:** Cleans up

## Props Contract
```typescript
interface ChangePreviewProps {
  /** Original file content */
  originalContent: string;
  /** Modified file content */
  modifiedContent: string;
  /** File path for context */
  filePath: string;
  /** Diff format: 'unified' or 'split' */
  format?: 'unified' | 'split';
  /** Whether preview is read-only */
  readOnly?: boolean;
}
```

## State Ownership
- **Diff lines:** Computed diff representation
- **Selected lines:** Highlighted lines for review
- **Scroll position:** Current view position
- **Format mode:** Current diff display format

## Interactions
- **Click line:** Highlights line for review
- **Hover hunk:** Shows hunk context menu
- **Copy button:** Copies change to clipboard
- **Accept/reject:** Approves or rejects changes

## Test Hooks
- `data-testid="change-preview"` on main container
- `data-testid="diff-added"` on added lines
- `data-testid="diff-removed"` on removed lines
- `data-testid="diff-context"` on context lines
