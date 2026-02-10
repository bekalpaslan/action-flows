# Workbench Architecture Analysis

**Aspect:** workbench-architecture
**Scope:** How workbench types are defined in shared types, how WorkbenchLayout routes to workbench components, how existing workbenches (Intel, Editor, etc.) are registered and wired. Focus on the exact pattern needed to add a new workbench type called "canvas".
**Date:** 2026-02-09
**Agent:** analyze/

---

## 1. Workbench Type System (Shared Types)

The workbench type system is defined in `packages/shared/src/workbenchTypes.ts` and follows a **centralized, strongly-typed** pattern.

### 1.1 Core Type Definitions

```typescript
// File: packages/shared/src/workbenchTypes.ts

export type WorkbenchId =
  | 'work'
  | 'maintenance'
  | 'explore'
  | 'review'
  | 'archive'
  | 'settings'
  | 'pm'
  | 'harmony'
  | 'editor'
  | 'intel';

export const WORKBENCH_IDS: readonly WorkbenchId[] = [
  'work', 'maintenance', 'explore', 'review',
  'archive', 'settings', 'pm', 'harmony',
  'editor', 'intel'
] as const;
```

**Pattern:** All workbench IDs are defined in a **discriminated union type** and a **const array** for iteration.

### 1.2 Workbench Configuration Schema

Each workbench has a `WorkbenchConfig` with the following structure:

```typescript
export interface WorkbenchConfig {
  id: WorkbenchId;                   // Unique identifier
  label: string;                     // Display name
  icon: string;                      // Emoji or icon name
  hasNotifications: boolean;         // Badge capability
  notificationCount: number;         // Current count
  glowColor?: string;                // Notification color
  disabled?: boolean;                // Disabled state
  tooltip?: string;                  // Hover tooltip

  // Context-Native Routing
  routable: boolean;                 // Can receive sessions
  triggers: string[];                // Keywords for routing
  flows: string[];                   // Available flows
  routingExamples: string[];         // Example requests
}
```

### 1.3 Default Configuration Registry

All workbenches are registered in `DEFAULT_WORKBENCH_CONFIGS`:

```typescript
export const DEFAULT_WORKBENCH_CONFIGS: Record<WorkbenchId, WorkbenchConfig> = {
  intel: {
    id: 'intel',
    label: 'Intel',
    icon: '🕵️',
    hasNotifications: true,
    notificationCount: 0,
    glowColor: '#673ab7',
    tooltip: 'Intelligence dossiers and persistent monitoring',
    routable: true,
    triggers: ['dossier', 'intel', 'intelligence', 'monitor', 'watch', 'track', 'insight'],
    flows: ['intel-analysis/'],
    routingExamples: [
      'create a dossier for auth system',
      'monitor the database layer',
    ],
  },
  // ... other workbenches
};
```

### 1.4 Routable Workbenches

Workbenches that can receive orchestrator-routed sessions are tracked separately:

```typescript
export const ROUTABLE_WORKBENCHES: readonly WorkbenchId[] = [
  'work', 'maintenance', 'explore', 'review',
  'settings', 'pm', 'intel'
] as const;

export function isRoutable(workbenchId: WorkbenchId): boolean {
  return ROUTABLE_WORKBENCHES.includes(workbenchId);
}
```

---

## 2. WorkbenchLayout Routing (Frontend)

The `WorkbenchLayout` component (located at `packages/app/src/components/Workbench/WorkbenchLayout.tsx`) is responsible for **switching between workbench views**.

### 2.1 Routing Mechanism

```typescript
// File: packages/app/src/components/Workbench/WorkbenchLayout.tsx

const renderWorkbenchContent = (workbench: WorkbenchId): ReactNode => {
  switch (workbench) {
    case 'work':
      return <WorkWorkbench {...props} />;
    case 'maintenance':
      return <MaintenanceWorkbench />;
    case 'explore':
      return <ExploreWorkbench {...props} />;
    case 'review':
      return <ReviewWorkbench />;
    case 'archive':
      return <ArchiveWorkbench {...props} />;
    case 'settings':
      return <SettingsWorkbench />;
    case 'pm':
      return <PMWorkbench {...props} />;
    case 'harmony':
      return <HarmonyWorkbench sessionId={activeSessionId} />;
    case 'editor':
      return <EditorWorkbench sessionId={activeSessionId || ('' as SessionId)} />;
    case 'intel':
      return <IntelWorkbench />;
    default:
      return (
        <div className="workbench-placeholder">
          <h1>Unknown Workbench</h1>
        </div>
      );
  }
};
```

**Pattern:** Simple switch statement that maps `WorkbenchId` → React component.

### 2.2 Active Workbench State Management

```typescript
import { useWorkbenchContext } from '../../contexts/WorkbenchContext';

export function WorkbenchLayout({ children }: WorkbenchLayoutProps) {
  const { activeWorkbench, setActiveWorkbench } = useWorkbenchContext();

  // Workbench transition animation state
  const [transitionClass, setTransitionClass] = useState<string>('workbench-enter-done');

  // ... handle transitions and render
  return (
    <div className="workbench-layout">
      <TopBar
        activeWorkbench={activeWorkbench}
        onWorkbenchChange={setActiveWorkbench}
      />
      <main className="workbench-main">
        <div className={`workbench-content ${transitionClass}`}>
          {renderWorkbenchContent(activeWorkbench)}
        </div>
      </main>
    </div>
  );
}
```

---

## 3. Workbench Context (State Management)

The `WorkbenchContext` (located at `packages/app/src/contexts/WorkbenchContext.tsx`) provides **global workbench state** to all components.

### 3.1 Context API

```typescript
interface WorkbenchContextValue {
  activeWorkbench: WorkbenchId;
  setActiveWorkbench: (id: WorkbenchId) => void;
  workbenchConfigs: Map<WorkbenchId, WorkbenchConfig>;
  workbenchNotifications: Map<WorkbenchId, number>;
  addNotification: (workbenchId: WorkbenchId) => void;
  clearNotifications: (workbenchId: WorkbenchId) => void;
  previousWorkbench: WorkbenchId | null;
  goBack: () => void;
  routingFilter: WorkbenchId | null;
  setRoutingFilter: (filter: WorkbenchId | null) => void;
  filterSessionsByContext: (sessions: Session[]) => Session[];
}
```

### 3.2 localStorage Persistence

```typescript
const STORAGE_KEY = 'afw-active-workbench';

export function WorkbenchProvider({ children }: WorkbenchProviderProps) {
  const [activeWorkbench, setActiveWorkbenchState] = useState<WorkbenchId>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (stored as WorkbenchId) || 'work';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeWorkbench);
  }, [activeWorkbench]);
}
```

---

## 4. Existing Workbench Component Patterns

### 4.1 IntelWorkbench Pattern (Complex, Sidebar + Main)

```typescript
// File: packages/app/src/components/Workbench/IntelWorkbench.tsx

export interface IntelWorkbenchProps {
  dossiers?: IntelDossier[];
  isLoading?: boolean;
  error?: string | null;
  onNewDossier?: () => void;
  onDossierSelect?: (dossierId: string) => void;
}

export function IntelWorkbench({
  dossiers: externalDossiers,
  isLoading = false,
  error = null,
  onNewDossier,
  onDossierSelect
}: IntelWorkbenchProps) {
  return (
    <div className="intel-workbench">
      {/* Header */}
      <header className="intel-workbench__header">
        <h1>Intel</h1>
        <button onClick={handleNewDossier}>+ New Dossier</button>
      </header>

      {/* Content: Sidebar + Main */}
      <div className="intel-workbench__content">
        <aside className="intel-workbench__sidebar">
          <DossierList {...props} />
        </aside>
        <main className="intel-workbench__main">
          {selectedDossier ? <DossierView /> : <EmptyState />}
        </main>
      </div>
    </div>
  );
}
```

**CSS Structure:**

```css
.intel-workbench {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #1a1a1a;
  overflow: hidden;
}

.intel-workbench__content {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.intel-workbench__sidebar {
  width: 320px;
  background-color: #1e1e1e;
  border-right: 1px solid #3c3c3c;
  overflow-y: auto;
}

.intel-workbench__main {
  flex: 1;
  overflow: hidden;
}
```

### 4.2 EditorWorkbench Pattern (Full-Screen Editor)

```typescript
// File: packages/app/src/components/Workbench/EditorWorkbench.tsx

export interface EditorWorkbenchProps {
  sessionId: SessionId;
  initialFiles?: string[];
  fileToOpen?: string | null;
  onFileOpened?: () => void;
}

export function EditorWorkbench({ sessionId, initialFiles = [] }: EditorWorkbenchProps) {
  const [openFiles, setOpenFiles] = useState<EditorFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);

  return (
    <div className="editor-workbench">
      {/* Header Bar */}
      <div className="editor-workbench__header">
        <h1>Editor</h1>
        <div className="editor-workbench__breadcrumb">
          {/* File path breadcrumb */}
        </div>
      </div>

      {/* Editor Tabs */}
      <EditorTabs files={openFiles} activeFilePath={activeFilePath} />

      {/* Main Editor Content */}
      <div className="editor-workbench__content">
        <Editor language={language} value={content} />
      </div>
    </div>
  );
}
```

### 4.3 ExploreWorkbench Pattern (File Explorer)

```typescript
// File: packages/app/src/components/Workbench/ExploreWorkbench.tsx

export interface ExploreWorkbenchProps {
  sessionId?: string;
  onFileSelect?: (path: string) => void;
  onFileOpen?: (path: string) => void;
  showHidden?: boolean;
}

export function ExploreWorkbench({ sessionId, onFileSelect, onFileOpen }: ExploreWorkbenchProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  return (
    <div className="explore-workbench">
      {/* Search bar */}
      <input
        type="text"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
      />

      {/* File tree */}
      <FileTree
        entries={filteredEntries}
        expandedDirs={expandedDirs}
        onFileOpen={onFileOpen}
      />
    </div>
  );
}
```

---

## 5. Workbench Registration (Barrel Export)

All workbenches are exported from a single index file:

```typescript
// File: packages/app/src/components/Workbench/index.ts

export { WorkbenchLayout } from './WorkbenchLayout';
export { WorkWorkbench } from './WorkWorkbench';
export { EditorWorkbench } from './EditorWorkbench';
export type { EditorWorkbenchProps } from './EditorWorkbench';
export { IntelWorkbench } from './IntelWorkbench';
export type { IntelWorkbenchProps } from './IntelWorkbench';
// ... all other workbenches
```

---

## 6. Pattern for Adding a New "Canvas" Workbench

Based on the analysis, here is the **exact 7-step pattern** to add a new "canvas" workbench:

### Step 1: Update Shared Types

**File:** `packages/shared/src/workbenchTypes.ts`

```typescript
// 1.1: Add 'canvas' to WorkbenchId union type
export type WorkbenchId =
  | 'work'
  | 'maintenance'
  | 'explore'
  | 'review'
  | 'archive'
  | 'settings'
  | 'pm'
  | 'harmony'
  | 'editor'
  | 'intel'
  | 'canvas';  // ← ADD THIS

// 1.2: Add 'canvas' to WORKBENCH_IDS array
export const WORKBENCH_IDS: readonly WorkbenchId[] = [
  'work', 'maintenance', 'explore', 'review',
  'archive', 'settings', 'pm', 'harmony',
  'editor', 'intel', 'canvas'  // ← ADD THIS
] as const;

// 1.3: Add configuration to DEFAULT_WORKBENCH_CONFIGS
export const DEFAULT_WORKBENCH_CONFIGS: Record<WorkbenchId, WorkbenchConfig> = {
  // ... existing configs
  canvas: {
    id: 'canvas',
    label: 'Canvas',
    icon: '🎨',  // or '🖼️'
    hasNotifications: false,
    notificationCount: 0,
    tooltip: 'Live HTML/CSS render view',
    routable: true,  // If users should be able to route to it
    triggers: ['canvas', 'render', 'preview', 'html', 'css', 'markup'],
    flows: ['canvas-render/'],  // If applicable
    routingExamples: [
      'render this HTML markup',
      'preview this CSS in canvas',
      'show me the live canvas view',
    ],
  },
};

// 1.4: Add to ROUTABLE_WORKBENCHES if routing is desired
export const ROUTABLE_WORKBENCHES: readonly WorkbenchId[] = [
  'work', 'maintenance', 'explore', 'review',
  'settings', 'pm', 'intel', 'canvas'  // ← ADD THIS IF ROUTABLE
] as const;
```

### Step 2: Create the Canvas Workbench Component

**File:** `packages/app/src/components/Workbench/CanvasWorkbench.tsx`

```typescript
import { useState } from 'react';
import './CanvasWorkbench.css';

export interface CanvasWorkbenchProps {
  /** Initial HTML content */
  initialHtml?: string;
  /** Initial CSS content */
  initialCss?: string;
  /** Callback when content changes */
  onContentChange?: (html: string, css: string) => void;
}

export function CanvasWorkbench({
  initialHtml = '',
  initialCss = '',
  onContentChange,
}: CanvasWorkbenchProps) {
  const [htmlContent, setHtmlContent] = useState<string>(initialHtml);
  const [cssContent, setCssContent] = useState<string>(initialCss);

  const handleHtmlChange = (value: string) => {
    setHtmlContent(value);
    onContentChange?.(value, cssContent);
  };

  const handleCssChange = (value: string) => {
    setCssContent(value);
    onContentChange?.(htmlContent, value);
  };

  return (
    <div className="canvas-workbench">
      {/* Header */}
      <header className="canvas-workbench__header">
        <h1 className="canvas-workbench__title">Canvas</h1>
        <div className="canvas-workbench__controls">
          <button type="button" onClick={() => { /* Clear canvas */ }}>
            Clear
          </button>
        </div>
      </header>

      {/* Content: Editor + Preview */}
      <div className="canvas-workbench__content">
        {/* Left: Input panels */}
        <aside className="canvas-workbench__inputs">
          <div className="canvas-workbench__input-panel">
            <h3>HTML</h3>
            <textarea
              value={htmlContent}
              onChange={(e) => handleHtmlChange(e.target.value)}
              placeholder="Paste HTML markup here..."
            />
          </div>
          <div className="canvas-workbench__input-panel">
            <h3>CSS</h3>
            <textarea
              value={cssContent}
              onChange={(e) => handleCssChange(e.target.value)}
              placeholder="Paste CSS styles here..."
            />
          </div>
        </aside>

        {/* Right: Live render preview */}
        <main className="canvas-workbench__preview">
          <h3>Live Preview</h3>
          <iframe
            title="Canvas Preview"
            className="canvas-workbench__iframe"
            srcDoc={`
              <!DOCTYPE html>
              <html>
                <head>
                  <style>${cssContent}</style>
                </head>
                <body>${htmlContent}</body>
              </html>
            `}
          />
        </main>
      </div>
    </div>
  );
}
```

### Step 3: Create the Canvas Workbench Styles

**File:** `packages/app/src/components/Workbench/CanvasWorkbench.css`

```css
.canvas-workbench {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #1a1a1a;
  overflow: hidden;
}

.canvas-workbench__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background-color: #252526;
  border-bottom: 1px solid #3c3c3c;
  flex-shrink: 0;
}

.canvas-workbench__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #e0e0e0;
  margin: 0;
}

.canvas-workbench__content {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.canvas-workbench__inputs {
  width: 400px;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  border-right: 1px solid #3c3c3c;
  overflow-y: auto;
}

.canvas-workbench__input-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  border-bottom: 1px solid #3c3c3c;
}

.canvas-workbench__input-panel h3 {
  margin: 0 0 0.5rem 0;
  color: #a0a0a0;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
}

.canvas-workbench__input-panel textarea {
  flex: 1;
  background-color: #252526;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
  color: #e0e0e0;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.875rem;
  padding: 0.75rem;
  resize: none;
}

.canvas-workbench__preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background-color: #1a1a1a;
}

.canvas-workbench__preview h3 {
  margin: 0 0 0.5rem 0;
  color: #a0a0a0;
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
}

.canvas-workbench__iframe {
  flex: 1;
  background-color: #ffffff;
  border: 1px solid #3c3c3c;
  border-radius: 4px;
}
```

### Step 4: Add Canvas Route to WorkbenchLayout

**File:** `packages/app/src/components/Workbench/WorkbenchLayout.tsx`

```typescript
import { CanvasWorkbench } from './CanvasWorkbench';

const renderWorkbenchContent = (workbench: WorkbenchId): ReactNode => {
  switch (workbench) {
    // ... existing cases
    case 'canvas':
      return <CanvasWorkbench />;
    // ... remaining cases
  }
};
```

### Step 5: Export Canvas Workbench from Barrel

**File:** `packages/app/src/components/Workbench/index.ts`

```typescript
export { CanvasWorkbench } from './CanvasWorkbench';
export type { CanvasWorkbenchProps } from './CanvasWorkbench';
```

### Step 6: Rebuild Shared Package

```bash
cd packages/shared
pnpm build
```

This ensures the updated `WorkbenchId` type is available to all packages.

### Step 7: Test the Workbench

1. Start the dev server: `pnpm dev`
2. Navigate to the Canvas workbench via TopBar
3. Verify the workbench renders correctly
4. Verify routing works (if configured as routable)

---

## Recommendations

### 1. Use Monaco Editor for Better Code Input

Replace the `<textarea>` elements with Monaco Editor instances for syntax highlighting:

```typescript
import Editor from '@monaco-editor/react';

<Editor
  height="100%"
  language="html"
  value={htmlContent}
  onChange={(value) => handleHtmlChange(value || '')}
  theme="vs-dark"
/>
```

### 2. Add Split-Pane Resizing

Use a library like `react-split-pane` to allow users to resize the input/preview panels.

### 3. Add Export Functionality

Allow users to download the rendered HTML/CSS as a `.html` file.

### 4. Session Persistence

Store the HTML/CSS content in the session metadata so it persists across reloads:

```typescript
const { sessionId } = useParams();
const { updateSessionMetadata } = useSessionContext();

useEffect(() => {
  if (sessionId) {
    updateSessionMetadata(sessionId, {
      canvasHtml: htmlContent,
      canvasCss: cssContent,
    });
  }
}, [htmlContent, cssContent, sessionId]);
```

### 5. Add to Context Routing (if desired)

If the Canvas workbench should be reachable via orchestrator routing, ensure:
- `routable: true` in `DEFAULT_WORKBENCH_CONFIGS`
- Appropriate `triggers` keywords
- Inclusion in `ROUTABLE_WORKBENCHES` array

---

## Summary Table

| Step | File | Change |
|------|------|--------|
| 1 | `packages/shared/src/workbenchTypes.ts` | Add `'canvas'` to `WorkbenchId`, `WORKBENCH_IDS`, `DEFAULT_WORKBENCH_CONFIGS`, and optionally `ROUTABLE_WORKBENCHES` |
| 2 | `packages/app/src/components/Workbench/CanvasWorkbench.tsx` | Create component with props interface |
| 3 | `packages/app/src/components/Workbench/CanvasWorkbench.css` | Create styles following existing patterns |
| 4 | `packages/app/src/components/Workbench/WorkbenchLayout.tsx` | Add `case 'canvas': return <CanvasWorkbench />;` to switch |
| 5 | `packages/app/src/components/Workbench/index.ts` | Export `CanvasWorkbench` and `CanvasWorkbenchProps` |
| 6 | Terminal | Run `cd packages/shared && pnpm build` |
| 7 | Browser | Test navigation and rendering |

---

## Key Architecture Insights

1. **Centralized Type System:** All workbench IDs are defined once in `workbenchTypes.ts` and imported everywhere
2. **Switch-Based Routing:** WorkbenchLayout uses a simple switch statement for routing
3. **Context-Driven State:** WorkbenchContext manages active workbench, notifications, and history
4. **Consistent Component Pattern:** All workbenches follow a similar structure (header + content)
5. **CSS Naming Convention:** BEM-style naming (`workbench-name__element`)
6. **Barrel Exports:** All workbenches are re-exported from `index.ts` for clean imports
7. **Props-Based Configuration:** Workbenches accept props for data/callbacks, not hooks for global state

---

## Files Referenced

| File | Purpose |
|------|---------|
| `packages/shared/src/workbenchTypes.ts` | Workbench type definitions and configurations (344 lines) |
| `packages/app/src/components/Workbench/WorkbenchLayout.tsx` | Main layout component with routing logic (620 lines) |
| `packages/app/src/components/Workbench/index.ts` | Barrel export for all workbenches (40 lines) |
| `packages/app/src/contexts/WorkbenchContext.tsx` | Workbench state management context (201 lines) |
| `packages/app/src/components/Workbench/IntelWorkbench.tsx` | Example: Complex workbench with sidebar (190 lines) |
| `packages/app/src/components/Workbench/EditorWorkbench.tsx` | Example: Full-screen editor workbench (544 lines) |
| `packages/app/src/components/Workbench/ExploreWorkbench.tsx` | Example: File explorer workbench |
| `packages/app/src/components/Workbench/IntelWorkbench.css` | Example: Workbench styling pattern (273 lines) |
| `packages/shared/src/index.ts` | Shared types barrel export (346 lines) |
