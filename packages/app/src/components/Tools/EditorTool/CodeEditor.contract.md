# CodeEditor Behavioral Contract

## Identity
**Component Name:** CodeEditor (EditorTool)
**File Path:** packages/app/src/components/Tools/EditorTool/EditorTool.tsx
**Type:** Feature
**Last Updated:** 2026-02-12

## Render Location
Full-featured code editor within Editor workbench or as embedded tool. Uses Monaco Editor with syntax highlighting, debugging, and diff viewing capabilities.

## Lifecycle
- **Mount:** Initializes Monaco Editor instance, loads file content from backend
- **Update:** Updates editor content when file changes, re-renders on theme changes
- **Unmount:** Disposes Monaco Editor instance to prevent memory leaks

## Props Contract
```typescript
interface EditorToolProps {
  /** Current file path being edited */
  filePath?: string;
  /** Initial file content */
  content?: string;
  /** Language/mode for syntax highlighting */
  language?: string;
  /** Whether editor is in read-only mode */
  readOnly?: boolean;
  /** Called when content changes */
  onChange?: (content: string) => void;
  /** Called when file save is requested */
  onSave?: (content: string) => void;
}
```

## State Ownership
- **Editor instance:** Monaco Editor core instance
- **Current content:** Active file content in editor
- **Dirty flag:** Whether content has unsaved changes
- **Cursor position:** Current cursor/selection state
- **View state:** Scroll position and folded regions
- **Diff view state:** Whether showing diff and baseline content

## Interactions
- **Type/edit:** Modifies content via onChange callback
- **Ctrl+S:** Triggers onSave callback
- **Find (Ctrl+F):** Opens find dialog
- **Replace (Ctrl+H):** Opens find-and-replace
- **Format (Shift+Alt+F):** Auto-formats document
- **Go to line (Ctrl+G):** Jump to line number
- **Syntax error hover:** Shows error details

## Test Hooks
- `data-testid="code-editor"` on main editor container
- `data-testid="editor-content"` on content area
- `data-testid="editor-line-{lineNum}"` on specific line
- `data-testid="editor-error-{lineNum}"` on error marker
