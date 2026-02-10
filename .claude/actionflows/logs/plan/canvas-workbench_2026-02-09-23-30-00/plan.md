# Implementation Plan: Canvas Workbench

## Overview

The Canvas workbench is a manual-only workbench (like Editor) where users paste HTML/CSS markup (e.g., Figma code exports with inline styles) into Monaco Editor instances and see them rendered live in a sandboxed iframe. This enables design system collaboration by providing instant visual feedback. The implementation follows the established workbench pattern: shared types → component creation → routing integration → barrel export.

---

## Steps

### Step 1: Update Shared Types for Canvas Workbench
- **Package:** packages/shared
- **Files:** `packages/shared/src/workbenchTypes.ts`
- **Changes:**
  1. Add `'canvas'` to the `WorkbenchId` discriminated union type (line ~29)
  2. Add `'canvas'` to the `WORKBENCH_IDS` const array (line ~35)
  3. Add canvas configuration to `DEFAULT_WORKBENCH_CONFIGS` object:
     ```typescript
     canvas: {
       id: 'canvas',
       label: 'Canvas',
       icon: '🎨',
       hasNotifications: false,
       notificationCount: 0,
       tooltip: 'Live HTML/CSS preview for design collaboration',
       routable: false,  // Manual-only, like Editor
       triggers: [],
       flows: [],
       routingExamples: [],
     }
     ```
  4. **Do NOT add to ROUTABLE_WORKBENCHES** — Canvas is manual-only, users navigate to it explicitly
- **Depends on:** Nothing
- **Why manual-only:** Canvas handles user-provided HTML/CSS markup. Like Editor, it's a utility workbench that users navigate to explicitly when they want to preview designs, not something the orchestrator routes sessions to.

### Step 2: Create Canvas Workbench Component (TypeScript)
- **Package:** packages/app
- **Files:** `packages/app/src/components/Workbench/CanvasWorkbench.tsx`
- **Changes:** Create new component with the following structure:
  - **Props interface:**
    ```typescript
    export interface CanvasWorkbenchProps {
      initialMarkup?: string;      // Initial HTML with inline styles
      onContentChange?: (markup: string) => void;
    }
    ```
  - **State management:**
    - `markup: string` — User-provided HTML (Figma exports use inline styles)
    - `isPreviewVisible: boolean` — Toggle preview panel
  - **Layout structure:**
    - Header: Title + Clear/Reset button
    - Content: Split pane (60% Monaco Editor / 40% iframe preview)
    - Left: Monaco Editor with `language="html"` for syntax highlighting
    - Right: Sandboxed `<iframe>` with `srcDoc` attribute
  - **Key decisions:**
    1. **Single input panel:** Users paste complete HTML divs with inline styles (Figma pattern), so no separate CSS panel needed
    2. **Monaco Editor over textarea:** Provides syntax highlighting, line numbers, auto-indent
    3. **Sandboxed iframe rendering:** Use `<iframe srcDoc={...}>` with no `sandbox` attribute restrictions for full CSS/HTML support
    4. **XSS mitigation:** iframe provides isolation; no `dangerouslySetInnerHTML` on main document
    5. **localStorage persistence:** Save markup to `localStorage` key `afw-canvas-markup` on change (debounced 500ms)
  - **Monaco configuration:**
    ```typescript
    import Editor from '@monaco-editor/react';

    <Editor
      height="100%"
      language="html"
      value={markup}
      onChange={(value) => handleMarkupChange(value || '')}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        wordWrap: 'on',
        automaticLayout: true,
      }}
    />
    ```
  - **Iframe structure:**
    ```typescript
    <iframe
      title="Canvas Preview"
      className="canvas-workbench__iframe"
      srcDoc={`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; }
            </style>
          </head>
          <body>${markup}</body>
        </html>
      `}
      sandbox="allow-same-origin"
    />
    ```
- **Depends on:** Step 1 (shared types)
- **Why srcDoc:** Safer than `src` with data URLs; no external network requests; iframe provides DOM isolation

### Step 3: Create Canvas Workbench Styles (CSS)
- **Package:** packages/app
- **Files:** `packages/app/src/components/Workbench/CanvasWorkbench.css`
- **Changes:** Create stylesheet following BEM naming convention:
  - **Root container:** `.canvas-workbench` — Full height/width flex column
  - **Header:** `.canvas-workbench__header` — Fixed height (60px), flex row, space-between
  - **Content:** `.canvas-workbench__content` — Flex row, fills remaining space
  - **Editor panel:** `.canvas-workbench__editor` — 60% width, Monaco container
  - **Preview panel:** `.canvas-workbench__preview` — 40% width, iframe container
  - **iframe:** `.canvas-workbench__iframe` — White background, 100% dimensions, border
  - **Color scheme:** Match existing workbenches (dark mode: `#1a1a1a`, `#252526`, `#3c3c3c`)
  - **Layout pattern:**
    ```css
    .canvas-workbench {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      background-color: #1a1a1a;
      overflow: hidden;
    }

    .canvas-workbench__content {
      flex: 1;
      display: flex;
      min-height: 0;
      overflow: hidden;
    }

    .canvas-workbench__editor {
      flex: 0 0 60%;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #3c3c3c;
      overflow: hidden;
    }

    .canvas-workbench__preview {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 1rem;
      overflow: auto;
    }

    .canvas-workbench__iframe {
      flex: 1;
      background-color: #ffffff;
      border: 1px solid #3c3c3c;
      border-radius: 4px;
      min-height: 400px;
    }
    ```
- **Depends on:** Nothing (can be done in parallel with Step 2)

### Step 4: Add Canvas Route to WorkbenchLayout
- **Package:** packages/app
- **Files:** `packages/app/src/components/Workbench/WorkbenchLayout.tsx`
- **Changes:**
  1. Import CanvasWorkbench component at top:
     ```typescript
     import { CanvasWorkbench } from './CanvasWorkbench';
     ```
  2. Add case to `renderWorkbenchContent()` switch statement (around line 135):
     ```typescript
     case 'canvas':
       return <CanvasWorkbench />;
     ```
  3. Place after `'editor'` case, before `default` case
- **Depends on:** Step 1 (types), Step 2 (component)
- **Why here:** WorkbenchLayout is the routing switch that maps WorkbenchId → component; all workbenches must be registered here

### Step 5: Export Canvas Workbench from Barrel
- **Package:** packages/app
- **Files:** `packages/app/src/components/Workbench/index.ts`
- **Changes:**
  1. Add barrel export for component and types:
     ```typescript
     export { CanvasWorkbench } from './CanvasWorkbench';
     export type { CanvasWorkbenchProps } from './CanvasWorkbench';
     ```
  2. Place alphabetically between other workbench exports
- **Depends on:** Step 2 (component exists)
- **Why barrel exports:** Centralized exports enable clean imports (`import { CanvasWorkbench } from '../Workbench'`)

### Step 6: Rebuild Shared Package
- **Package:** packages/shared
- **Files:** N/A (build step)
- **Changes:**
  1. Navigate to shared package: `cd packages/shared`
  2. Run build: `pnpm build`
  3. Verify build output in `packages/shared/dist/`
  4. Return to monorepo root: `cd ../..`
- **Depends on:** Step 1 (shared types updated)
- **Why rebuild:** TypeScript needs compiled `.d.ts` files for updated `WorkbenchId` type to be available to frontend package

### Step 7: Manual Testing and Verification
- **Package:** All
- **Files:** N/A (testing step)
- **Changes:**
  1. Start dev server: `pnpm dev`
  2. Open dashboard in browser: `http://localhost:5173`
  3. Click Canvas icon in TopBar (should see 🎨 icon)
  4. Verify workbench renders with Monaco Editor + iframe preview
  5. **Test case 1 - Basic HTML:**
     - Paste: `<div style="padding: 20px; background: #f0f0f0;"><h1>Hello Canvas</h1></div>`
     - Verify: Renders in preview iframe
  6. **Test case 2 - Figma export (inline styles):**
     - Export a Figma frame as HTML
     - Paste complete HTML with inline styles
     - Verify: Design renders accurately in iframe
  7. **Test case 3 - Persistence:**
     - Enter markup → refresh page → verify markup persists
  8. **Test case 4 - Clear:**
     - Click Clear button → verify editor and preview reset
  9. Type check: `pnpm type-check` (all packages)
  10. Build check: `pnpm build` (all packages)
- **Depends on:** Steps 1-6 (all implementation complete)
- **Success criteria:**
  - No TypeScript errors
  - Canvas workbench accessible via TopBar navigation
  - Monaco Editor renders with HTML syntax highlighting
  - iframe preview updates live as user types
  - localStorage persists markup across page reloads

---

## Dependency Graph

```
Step 1 (shared types)
   ↓
Step 6 (rebuild shared) ──┐
   ↓                      │
Step 2 (component) ───────┤
   ↓                      │
Step 4 (routing) ─────────┤
   ↓                      │
Step 5 (barrel export) ───┤
   ↓                      │
Step 7 (testing) ←────────┘

Step 3 (CSS) ──────────────┘ (parallel with Step 2)
```

**Parallelizable steps:** Step 2 and Step 3 (component logic and styling)

**Critical path:** Step 1 → Step 6 → Step 2 → Step 4 → Step 5 → Step 7

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **XSS vulnerability from user HTML** | HIGH - User-provided HTML could execute malicious scripts | Use sandboxed iframe with `srcDoc` (not `dangerouslySetInnerHTML`). iframe provides DOM isolation. Consider adding `sandbox="allow-same-origin"` to restrict scripts while preserving CSS. |
| **Monaco Editor not rendering** | MEDIUM - Breaks input UX if Monaco fails to load | Monaco is already a dependency (used in EditorWorkbench). Import pattern already established. Fallback: use `<textarea>` if Monaco fails. |
| **iframe CSP violations in Electron** | MEDIUM - Electron's strict CSP may block iframe rendering | Test in Electron build. If CSP issues arise, configure `Content-Security-Policy` in `main.js` to allow `frame-src 'self' data:`. |
| **localStorage quota exceeded** | LOW - Large HTML markup could exceed 5-10MB localStorage limit | Add try-catch around `localStorage.setItem()`. Show toast warning if quota exceeded. Consider IndexedDB for larger data. |
| **Monaco workers not loading** | LOW - Monaco requires web workers for syntax highlighting | Workers already configured in `monaco-config.ts` (used by EditorWorkbench). Reuse existing configuration. |
| **TypeScript build errors after shared types change** | MEDIUM - Adding to discriminated union could cause exhaustive switch errors | Run `pnpm type-check` after Step 1. Fix any exhaustive switch errors by adding `canvas` cases. |

---

## Verification

**Pre-commit checklist:**
- [ ] Type check passes across all packages (`pnpm type-check`)
- [ ] All packages build successfully (`pnpm build`)
- [ ] No ESLint errors (`pnpm lint`)
- [ ] Canvas workbench accessible via TopBar
- [ ] Monaco Editor renders with HTML syntax highlighting
- [ ] iframe preview updates live on input change
- [ ] localStorage persists markup across reloads
- [ ] Clear button resets editor and preview
- [ ] No console errors in browser DevTools
- [ ] No Harmony violations logged (check dashboard WebSocket events)

**Post-deployment checks:**
- [ ] Electron build includes Canvas workbench
- [ ] No CSP violations in Electron app console
- [ ] Canvas workbench works in production build (not just dev mode)

---

## Design Decisions Log

### 1. Single Input Panel (HTML only, no separate CSS)
**Decision:** Provide one Monaco Editor for HTML input, not separate HTML/CSS panels.

**Rationale:** Figma code exports use complete HTML divs with inline styles (e.g., `<div style="background: #fff; padding: 20px;">...</div>`). Users will paste the entire exported markup, which already contains all necessary styles. Splitting into HTML/CSS panels would require users to manually extract inline styles, reducing utility.

**Alternative considered:** Separate HTML/CSS panels like CodePen. Rejected because Figma's export format doesn't separate concerns, and forcing users to restructure markup adds friction.

### 2. Sandboxed iframe with srcDoc
**Decision:** Use `<iframe srcDoc={markup}>` with `sandbox="allow-same-origin"`.

**Rationale:**
- **srcDoc** is safer than data URLs or `dangerouslySetInnerHTML` (no DOM injection into main document)
- **iframe isolation** prevents user HTML from accessing dashboard state or APIs
- **sandbox attribute** restricts scripts while preserving CSS/HTML rendering
- **allow-same-origin** needed for CSS to render properly

**Alternative considered:**
1. **Shadow DOM:** Provides encapsulation but less isolation than iframe. Styles can still leak. Rejected for weaker security boundary.
2. **dangerouslySetInnerHTML:** Direct DOM injection is highest XSS risk. Rejected due to security concerns.

### 3. Monaco Editor over textarea
**Decision:** Use `@monaco-editor/react` with `language="html"`.

**Rationale:**
- Monaco provides syntax highlighting, making it easier to spot markup errors
- Line numbers help users navigate large Figma exports
- Auto-indent and bracket matching improve editing experience
- Monaco already installed and configured in project (used by EditorWorkbench)

**Alternative considered:** Plain `<textarea>`. Simpler but lacks essential DX features for editing HTML.

### 4. Not Routable (Manual-Only Workbench)
**Decision:** Set `routable: false` in workbench config; do NOT add to `ROUTABLE_WORKBENCHES`.

**Rationale:** Canvas is a utility workbench like Editor. Users navigate to it explicitly when they want to preview design markup. It's not a context for orchestrator sessions (no flows, no agent routing). Making it routable would add unnecessary complexity.

**Alternative considered:** Make routable with triggers like "preview", "canvas". Rejected because:
- No clear orchestrator flows for Canvas (it's a user-driven tool)
- Would pollute context routing with a manual workbench
- Users already understand "switch to Canvas to preview markup" pattern

### 5. localStorage Persistence (Not Session Metadata)
**Decision:** Save markup to `localStorage` key `afw-canvas-markup`.

**Rationale:**
- Canvas is not session-scoped (users can preview any markup, not tied to orchestrator sessions)
- localStorage provides simple persistence across page reloads without backend dependency
- Simpler than session metadata (no API calls, no WebSocket updates)

**Alternative considered:** Store in session metadata. Rejected because:
- Canvas doesn't map to orchestrator sessions
- Would require creating "ghost sessions" just for Canvas state
- localStorage is sufficient for this use case

**Limitation:** localStorage has 5-10MB quota. If users paste extremely large Figma exports (rare), show toast warning and suggest clearing. Consider IndexedDB migration if this becomes a real issue.

### 6. 60/40 Split Layout (Editor Left, Preview Right)
**Decision:** Allocate 60% width to Monaco Editor, 40% to iframe preview.

**Rationale:**
- Prioritizes editing space (where users spend most time)
- Still provides sufficient preview area for design feedback
- Follows "code-first" pattern of existing workbenches

**Alternative considered:**
1. **50/50 split:** Equal space, but editing HTML is more important than preview.
2. **Tabbed layout:** Switch between editor/preview tabs. Rejected because users need to see both simultaneously to verify markup renders correctly.
3. **Resizable split pane:** Better UX but adds complexity. Could be a future enhancement using `react-split-pane`.

---

## Future Enhancements (Out of Scope for Phase 1)

1. **Resizable split pane:** Allow users to drag divider between editor/preview
2. **Export rendered HTML:** Download button to save rendered markup as `.html` file
3. **CSS extraction tool:** Parse inline styles and generate external CSS stylesheet
4. **Multiple canvas tabs:** Switch between different markup snippets (like browser tabs)
5. **Figma plugin integration:** Automatically sync selected Figma frame to Canvas via API
6. **Responsive preview modes:** Toggle between desktop/tablet/mobile viewport sizes
7. **Dark/light mode toggle for preview:** Switch preview iframe background between themes
8. **Code formatting:** Auto-format HTML markup using Prettier on paste

---

## Files Changed Summary

| Package | File | Change Type | LOC |
|---------|------|-------------|-----|
| shared | `src/workbenchTypes.ts` | Modify | +15 |
| app | `src/components/Workbench/CanvasWorkbench.tsx` | Create | ~200 |
| app | `src/components/Workbench/CanvasWorkbench.css` | Create | ~150 |
| app | `src/components/Workbench/WorkbenchLayout.tsx` | Modify | +3 |
| app | `src/components/Workbench/index.ts` | Modify | +2 |

**Total estimated LOC:** ~370 lines

**Estimated implementation time:** 3-4 hours (including testing)

---

## Key Architecture Patterns Applied

1. **Discriminated union type system:** Canvas workbench follows the same `WorkbenchId` pattern as all other workbenches
2. **Switch-based routing:** WorkbenchLayout switch statement maps `'canvas'` → `<CanvasWorkbench />`
3. **BEM CSS naming:** `.canvas-workbench__element` follows established pattern
4. **Barrel exports:** Component exported from `index.ts` for clean imports
5. **Props-based configuration:** Component accepts `initialMarkup` prop, not global state hooks
6. **Monaco Editor integration:** Reuses existing Monaco configuration from EditorWorkbench
7. **localStorage persistence:** Follows same pattern as WorkbenchContext (active workbench persistence)

---

## Contract & Harmony Compliance

**Not applicable:** Canvas workbench does not produce structured output consumed by the dashboard backend. It's a client-side-only utility workbench with no WebSocket events, no session routing, no parser integration. No contract-defined formats required.

**Harmony status:** N/A (no backend integration)

---

## Security Considerations

### XSS Attack Vectors

1. **User HTML injection:** MITIGATED via iframe isolation (user markup never touches main document DOM)
2. **Script execution:** MITIGATED via `sandbox="allow-same-origin"` (blocks `<script>` tags while preserving CSS)
3. **localStorage poisoning:** LOW RISK (localStorage is origin-scoped; only affects current user)

### Iframe Sandbox Attributes

```html
<iframe sandbox="allow-same-origin" srcDoc="...">
```

**Allowed:**
- CSS rendering (inline styles, `<style>` tags)
- HTML structural elements (divs, spans, images, etc.)
- Same-origin resource loading (for data URLs)

**Blocked:**
- JavaScript execution (`<script>` tags, event handlers)
- Form submission
- Top-level navigation
- Pop-ups and modals

**Why allow-same-origin:** Required for CSS to apply properly. Without it, iframe has null origin and CSS may not render.

---

## Testing Strategy

### Unit Tests (Out of Scope for Phase 1)

Future testing with Vitest + React Testing Library:
- Component renders without errors
- Monaco Editor receives correct props
- iframe srcDoc updates when markup changes
- localStorage persistence on input change
- Clear button resets state

### Manual Testing (Phase 1)

1. **Functionality:**
   - Enter HTML → verify preview renders
   - Modify HTML → verify preview updates live
   - Refresh page → verify markup persists
   - Click Clear → verify editor and preview reset

2. **Edge cases:**
   - Empty input → verify no errors
   - Malformed HTML → verify iframe shows broken content gracefully
   - Very large HTML (>1MB) → verify localStorage warning if quota exceeded

3. **Browser compatibility:**
   - Chrome/Edge (Chromium)
   - Firefox
   - Electron desktop app

4. **Visual regression:**
   - Compare styling with existing workbenches (colors, spacing, borders)
   - Verify dark mode tokens applied correctly
   - Check responsive behavior on smaller viewports

---

## Documentation Updates (Post-Implementation)

After Canvas workbench is complete, update these docs:

1. **`docs/DOCS_INDEX.md`:**
   - Add Canvas to Workbench Types section
   - Describe use case (design system collaboration, Figma export preview)

2. **`docs/status/FRONTEND_IMPLEMENTATION_STATUS.md`:**
   - Add Canvas workbench to "Workbench Screens" section
   - Mark status: ✅ Complete

3. **`.claude/actionflows/CONTEXTS.md` (if applicable):**
   - Canvas is not a context (not routable), so no update needed

4. **User-facing docs (if exists):**
   - Add "Using Canvas Workbench" guide with screenshots
   - Include example: "How to preview Figma exports in Canvas"
