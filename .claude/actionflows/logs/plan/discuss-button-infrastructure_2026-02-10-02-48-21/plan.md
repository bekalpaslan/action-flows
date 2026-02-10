# Implementation Plan: Let's Discuss Button System (Infrastructure + Tier 1)

## Overview

Create a lightweight "Let's Discuss" button system that prefills the chat input with "I want to discuss this [Component Name] element" and optionally includes component context as a collapsible section. This plan covers infrastructure setup plus Tier 1 integration (5 components: ChatPanel, FlowVisualization, ChainDAG, StepInspector, HarmonyPanel). The system is deliberately simple—no backend changes needed yet, discussion protocols TBD for future flows.

**Design Philosophy:**
- Component-level buttons (not registry-based) for better discoverability
- Frontend-only implementation (no backend changes)
- Prefill chat input + optional collapsible context section
- Simple message format: "I want to discuss this [Component Name] element"
- Placeholder for future discussion protocols

---

## Steps

### Step 1: Create DiscussButton Component

**Package:** `packages/app/`
**Files:**
- `packages/app/src/components/DiscussButton/DiscussButton.tsx` (create)
- `packages/app/src/components/DiscussButton/DiscussButton.css` (create)

**Changes:**
- Create reusable `DiscussButton` component with:
  - Icon button (💬 speech bubble emoji)
  - Label: "Let's Discuss"
  - Props: `componentName: string`, `componentContext?: Record<string, unknown>`, `onDiscuss?: (message: string) => void`
  - Click handler: calls `onDiscuss` callback with prefilled message
- Styling:
  - Medium-sized button suitable for panel headers
  - Accent color (blue/purple)
  - Hover: slight scale + glow
  - Disabled state when chat unavailable
- BEM CSS convention: `.discuss-button`, `.discuss-button__icon`, `.discuss-button__label`, `.discuss-button--disabled`

**Depends on:** Nothing

---

### Step 2: Create DiscussDialog Component

**Package:** `packages/app/`
**Files:**
- `packages/app/src/components/DiscussButton/DiscussDialog.tsx` (create)
- `packages/app/src/components/DiscussButton/DiscussDialog.css` (create)

**Changes:**
- Create modal dialog for discuss flow with:
  - Header: "Discuss [Component Name]"
  - Pre-filled message textarea (editable): "I want to discuss this [Component Name] element"
  - Collapsible "Component Context" section (expandable <details>):
    - Shows JSON-formatted component context (if provided)
    - User can view but not edit (read-only)
  - Actions: "Send to Chat" (primary), "Cancel" (secondary)
- Dialog closes after send or cancel
- Follow `CustomPromptDialog` pattern for consistency
- Props: `componentName: string`, `componentContext?: Record<string, unknown>`, `onSend: (message: string, context?: Record<string, unknown>) => void`, `onCancel: () => void`, `isLoading?: boolean`
- Styling: Modal backdrop + centered dialog, follows existing dialog patterns
- BEM CSS: `.discuss-dialog`, `.discuss-dialog__header`, `.discuss-dialog__message`, `.discuss-dialog__context`, `.discuss-dialog__actions`

**Depends on:** Nothing

---

### Step 3: Create useDiscussButton Hook

**Package:** `packages/app/`
**Files:**
- `packages/app/src/hooks/useDiscussButton.ts` (create)

**Changes:**
- Create hook for state management:
  - State: `isDialogOpen: boolean`, `isSending: boolean`
  - Methods: `openDialog()`, `closeDialog()`, `handleSend(message: string, context?: Record<string, unknown>)`
  - Integration with `useChatMessages` hook to send message
  - Returns: `{ isDialogOpen, isSending, openDialog, closeDialog, handleSend }`
- Hook signature:
  ```typescript
  function useDiscussButton(params: {
    componentName: string;
    componentContext?: Record<string, unknown>;
    sessionId: SessionId;
  }): {
    isDialogOpen: boolean;
    isSending: boolean;
    openDialog: () => void;
    closeDialog: () => void;
    handleSend: (message: string, context?: Record<string, unknown>) => Promise<void>;
  }
  ```
- `handleSend` implementation:
  1. Format message with optional context as markdown collapsible
  2. Call `addUserMessage()` from `useChatMessages`
  3. Send via WebSocket (reuse ChatPanel's send logic)
  4. Close dialog on success

**Depends on:** Step 1, Step 2

---

### Step 4: Extend ChatPanel for Prefill Support

**Package:** `packages/app/`
**Files:**
- `packages/app/src/components/SessionPanel/ChatPanel.tsx` (modify)

**Changes:**
- Add `prefillMessage?: string` prop to `ChatPanelProps`
- Use `useEffect` to populate `input` state when `prefillMessage` changes
- Add `onPrefillConsumed?: () => void` callback to notify parent when prefill is consumed (on send or manual edit)
- Expose `setPrefillMessage` method via ref or callback prop for external components to trigger prefill
- **Alternative approach (simpler):** Export `addUserMessage` and `handleSendMessage` methods via context or prop callback for discuss button to call directly
- No visual changes to ChatPanel itself—just internal API extension

**Depends on:** Nothing

---

### Step 5: Integrate DiscussButton into FlowVisualization

**Package:** `packages/app/`
**Files:**
- `packages/app/src/components/FlowVisualization/FlowVisualization.tsx` (modify)
- `packages/app/src/components/FlowVisualization/FlowVisualization.css` (modify)

**Changes:**
- Add `DiscussButton` to FlowVisualization header/toolbar (ReactFlow Panel component)
- Use `useDiscussButton` hook with:
  - `componentName: "FlowVisualization"`
  - `componentContext: { chainId: chain.id, stepCount: chain.steps.length, status: chain.status, currentStep: selectedStep, swimlanes: swimlaneNames }`
  - `sessionId` (passed from parent or context)
- Render button in top-right corner using ReactFlow's `<Panel>` component
- Render `DiscussDialog` when dialog is open
- Position: absolute top-right, inside ReactFlow viewport
- CSS: `.flow-visualization__discuss-btn` positioned in top-right corner

**Depends on:** Step 1, Step 2, Step 3

---

### Step 6: Integrate DiscussButton into ChainDAG

**Package:** `packages/app/`
**Files:**
- `packages/app/src/components/ChainDAG/ChainDAG.tsx` (modify)
- `packages/app/src/components/ChainDAG/ChainDAG.css` (modify)

**Changes:**
- Add `DiscussButton` to ChainDAG header toolbar
- Use `useDiscussButton` hook with:
  - `componentName: "ChainDAG"`
  - `componentContext: { chainId: chain.id, stepCount: chain.steps.length, dependencies: chain.dependencies, status: chain.status }`
  - `sessionId`
- Render button in header toolbar (top-right)
- Render `DiscussDialog` when dialog is open
- CSS: `.chain-dag__header-discuss-btn` in header toolbar

**Depends on:** Step 1, Step 2, Step 3

---

### Step 7: Integrate DiscussButton into StepInspector

**Package:** `packages/app/`
**Files:**
- `packages/app/src/components/StepInspector/StepInspector.tsx` (modify)
- `packages/app/src/components/StepInspector/StepInspector.css` (modify)

**Changes:**
- Add `DiscussButton` to StepInspector header toolbar
- Use `useDiscussButton` hook with:
  - `componentName: "StepInspector"`
  - `componentContext: { stepNumber: step.stepNumber, action: step.action, status: step.status, duration: step.duration, model: step.model, chainId: step.chainId }`
  - `sessionId`
- Render button in header toolbar (top-right)
- Render `DiscussDialog` when dialog is open
- CSS: `.step-inspector__header-discuss-btn` in header toolbar

**Depends on:** Step 1, Step 2, Step 3

---

### Step 8: Integrate DiscussButton into HarmonyPanel

**Package:** `packages/app/`
**Files:**
- `packages/app/src/components/HarmonyPanel/HarmonyPanel.tsx` (modify)
- `packages/app/src/components/HarmonyPanel/HarmonyPanel.css` (modify)

**Changes:**
- Add `DiscussButton` to HarmonyPanel header toolbar
- Use `useDiscussButton` hook with:
  - `componentName: "HarmonyPanel"`
  - `componentContext: { harmonyPercentage: harmonyPercentage, totalChecks: totalChecks, violationCount: violationCount, degradedCount: degradedCount }`
  - `sessionId`
- Render button in header toolbar (top-right)
- Render `DiscussDialog` when dialog is open
- CSS: `.harmony-panel__header-discuss-btn` in header toolbar

**Depends on:** Step 1, Step 2, Step 3

---

### Step 9: Integrate DiscussButton into ChatPanel

**Package:** `packages/app/`
**Files:**
- `packages/app/src/components/SessionPanel/ChatPanel.tsx` (modify)
- `packages/app/src/components/SessionPanel/ChatPanel.css` (modify)

**Changes:**
- Add `DiscussButton` to ChatPanel header (right side, next to collapse toggle)
- Use `useDiscussButton` hook with:
  - `componentName: "ChatPanel"`
  - `componentContext: { messageCount: messages.length, sessionStatus: session?.status, cliState: cliState, chainCount: chainCount }`
  - `sessionId`
- Render button in header right section (before collapse toggle)
- Render `DiscussDialog` when dialog is open
- CSS: `.chat-panel-header__discuss-btn` in header right section

**Depends on:** Step 1, Step 2, Step 3, Step 4

---

### Step 10: Add SessionId Context Provider (if needed)

**Package:** `packages/app/`
**Files:**
- `packages/app/src/contexts/SessionContext.tsx` (create or check existing)

**Changes:**
- If SessionId is not already available via context:
  - Create `SessionContext` to provide current `sessionId` to all components
  - Wrap app tree with `SessionContext.Provider` in `App.tsx` or `SessionWindow.tsx`
  - Export `useSessionContext()` hook
- If SessionId is already available (e.g., via props or existing context):
  - Skip this step and use existing mechanism

**Depends on:** Nothing

---

### Step 11: Create Integration Guide Document

**Package:** `packages/app/`
**Files:**
- `packages/app/src/components/DiscussButton/README.md` (create)

**Changes:**
- Document the discuss button system:
  - Overview and purpose
  - Usage instructions for integrating into new components
  - Props documentation for `DiscussButton`, `DiscussDialog`, `useDiscussButton`
  - Example integration code snippet
  - Component context examples (what to include/exclude)
  - Future roadmap (discussion protocols, Tier 2/3/4 rollout)
- Markdown format, clear examples

**Depends on:** Step 1, Step 2, Step 3

---

## Dependency Graph

```
Step 1 (DiscussButton component)  →  Step 5 (FlowVisualization)
Step 2 (DiscussDialog component)  →  Step 6 (ChainDAG)
Step 3 (useDiscussButton hook)    →  Step 7 (StepInspector)
                                    →  Step 8 (HarmonyPanel)
                                    →  Step 9 (ChatPanel)

Step 4 (ChatPanel prefill support) →  Step 9 (ChatPanel integration)

Step 10 (SessionContext - parallel if needed)

Step 11 (Documentation - after all integrations)
```

**Parallelizable:**
- Steps 1, 2, 10 can run in parallel (independent infrastructure)
- Steps 5, 6, 7, 8 can run in parallel (independent component integrations, after Steps 1-3)
- Step 4 can run in parallel with Steps 1-3
- Step 9 requires Step 4 completion
- Step 11 runs last (documentation after all implementations)

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **SessionId not accessible in components** | Medium - Components can't call chat API without sessionId | Check existing context/props. Create SessionContext if needed (Step 10). Worst case: pass sessionId as prop from parent. |
| **Chat input doesn't support programmatic prefill** | Low - Current ChatPanel only handles user input manually | Extend ChatPanel with prefill support (Step 4). Simple state update to `input` field. |
| **Component context serialization fails** | Low - Large/circular objects break JSON.stringify | Sanitize context before passing: limit depth, exclude circular refs, summarize large arrays. Add try-catch in hook. |
| **Dialog z-index conflicts** | Low - Dialog may appear behind other panels | Use high z-index (e.g., 9999) in `.discuss-dialog-backdrop`. Follow existing modal patterns (CustomPromptDialog). |
| **Discuss button clutters panel headers** | Low - Headers may feel crowded with extra button | Keep button small and subtle. Use icon-only mode on narrow panels. Add tooltip for clarity. |
| **No ChatPanel open when discuss button clicked** | Medium - User clicks discuss but chat is hidden/collapsed | Check if ChatPanel is visible. If not, show toast: "Open Chat panel to discuss". Or auto-expand ChatPanel via parent callback. |
| **Context data contains sensitive info** | Low - User accidentally shares sensitive data in context | Document guidelines: exclude tokens, credentials, PII. Add context review step in dialog. |

---

## Verification

### Automated Checks
- [ ] Type check passes across all packages (`pnpm type-check`)
- [ ] Existing tests pass (`pnpm test`)
- [ ] Lint passes (`pnpm lint`)

### Manual Verification
- [ ] DiscussButton renders in all 5 Tier 1 components
- [ ] Button click opens DiscussDialog with correct component name
- [ ] Dialog shows pre-filled message: "I want to discuss this [Component Name] element"
- [ ] Component context displays correctly in collapsible section (if provided)
- [ ] "Send to Chat" button sends message to ChatPanel
- [ ] Message appears in ChatPanel with optional context as markdown collapsible
- [ ] Dialog closes after send or cancel
- [ ] Button disabled state works when chat is unavailable
- [ ] No console errors or warnings
- [ ] Button styling consistent across all components (BEM CSS)

### Integration Tests
- [ ] Discuss button + dialog flow in FlowVisualization
- [ ] Discuss button + dialog flow in ChainDAG
- [ ] Discuss button + dialog flow in StepInspector
- [ ] Discuss button + dialog flow in HarmonyPanel
- [ ] Discuss button + dialog flow in ChatPanel
- [ ] Context serialization edge cases (null, undefined, circular refs)
- [ ] ChatPanel prefill + send flow

---

## Implementation Notes

### Message Format

**Basic message (no context):**
```
I want to discuss this FlowVisualization element
```

**Message with context (collapsible markdown):**
```
I want to discuss this FlowVisualization element

<details>
<summary>Component Context</summary>

```json
{
  "chainId": "chain-abc123",
  "stepCount": 5,
  "status": "in_progress",
  "currentStep": 3,
  "swimlanes": ["orchestrator", "analyze", "code"]
}
```

</details>
```

**Rendering in ChatPanel:**
- Basic message: plain text
- Message with context: markdown with native `<details>` collapsible section

### Component Context Examples

**FlowVisualization:**
```typescript
{
  chainId: chain.id,
  stepCount: chain.steps.length,
  status: chain.status,
  currentStep: selectedStep,
  swimlanes: swimlaneNames
}
```

**ChainDAG:**
```typescript
{
  chainId: chain.id,
  stepCount: chain.steps.length,
  dependencies: chain.dependencies,
  status: chain.status
}
```

**StepInspector:**
```typescript
{
  stepNumber: step.stepNumber,
  action: step.action,
  status: step.status,
  duration: step.duration,
  model: step.model,
  chainId: step.chainId
}
```

**HarmonyPanel:**
```typescript
{
  harmonyPercentage: harmonyPercentage,
  totalChecks: totalChecks,
  violationCount: violationCount,
  degradedCount: degradedCount
}
```

**ChatPanel:**
```typescript
{
  messageCount: messages.length,
  sessionStatus: session?.status,
  cliState: cliState,
  chainCount: chainCount
}
```

### Context Sanitization

**Include:**
- Component name
- Current state/status
- Relevant IDs (sessionId, chainId, stepNumber)
- Counts and metrics
- Timestamp (optional, for debugging)

**Exclude:**
- Circular references (use JSON.stringify with try-catch)
- Large data structures (>1KB, summarize instead)
- Sensitive data (credentials, tokens, PII)
- Functions and callbacks

**Sanitization helper (in `useDiscussButton`):**
```typescript
function sanitizeContext(context: Record<string, unknown>): Record<string, unknown> {
  try {
    // Test JSON serialization
    JSON.stringify(context);
    return context;
  } catch (error) {
    // Fallback to safe subset
    return {
      _error: 'Context serialization failed',
      _keys: Object.keys(context)
    };
  }
}
```

### Button Placement Strategy

**Components with headers:**
- Add to header toolbar (top-right)
- Examples: FlowVisualization (ReactFlow Panel), ChainDAG, StepInspector, HarmonyPanel, ChatPanel

**Components without headers:**
- Floating button (bottom-right corner)
- Use absolute positioning
- Example: TerminalPanel (future Tier 3)

**Widget components:**
- Small icon-only button (top-right corner)
- No label, just icon
- Example: HarmonyIndicator (future Tier 4)

### Styling Guidelines

**Button:**
- Icon: 💬 (speech bubble emoji)
- Label: "Let's Discuss" or "Discuss"
- Size: Medium (32px height, padding 8px 12px)
- Color: Accent color (CSS variable `--accent-color` or `#5865F2`)
- Border-radius: 4px
- Font: 14px, medium weight

**States:**
- **Hover:** `transform: scale(1.05)`, `box-shadow: 0 2px 8px rgba(88, 101, 242, 0.3)`
- **Active:** `transform: scale(0.98)`
- **Disabled:** `opacity: 0.5`, `cursor: not-allowed`

**BEM Classes:**
- `.discuss-button`
- `.discuss-button__icon`
- `.discuss-button__label`
- `.discuss-button--disabled`

**Dialog:**
- Backdrop: `rgba(0, 0, 0, 0.6)`, z-index `9999`
- Dialog: white background, 500px width, centered
- Border-radius: 8px
- Padding: 24px
- Shadow: `0 4px 16px rgba(0, 0, 0, 0.2)`

**BEM Classes:**
- `.discuss-dialog`
- `.discuss-dialog-backdrop`
- `.discuss-dialog__header`
- `.discuss-dialog__message`
- `.discuss-dialog__context`
- `.discuss-dialog__actions`

---

## Future Enhancements (Out of Scope)

These are explicitly **not** part of this plan, reserved for future work:

1. **Discussion Protocols & Flows:**
   - Component-specific discussion flows (e.g., "debug this chain", "explain this visualization")
   - Flow registry integration (trigger `/discuss` flow)
   - Smart prompts based on component state

2. **Backend Integration:**
   - Store discussion history per component
   - Track discussion metrics (frequency, resolution time)
   - Backend API for discussion management

3. **Advanced Features:**
   - Keyboard shortcut (Ctrl+/)
   - Multi-component discussions (compare panels)
   - Discussion templates per component type
   - AI-suggested discussion topics
   - Usage analytics dashboard

4. **Tier 2/3/4 Rollout:**
   - DiffView, RegistryBrowser, SquadPanel, TimelineView (Tier 2)
   - Workbench components (12 total, Tier 2)
   - DossierView, TerminalPanel, CommandPalette, SessionArchive (Tier 3)
   - Widget components (HarmonyIndicator, ControlButtons, etc., Tier 4)

---

## Success Criteria

**This plan is complete when:**

1. ✅ All 5 Tier 1 components have working discuss buttons
2. ✅ Clicking button opens dialog with prefilled message
3. ✅ Dialog sends message to ChatPanel with optional context
4. ✅ No breaking changes to existing components
5. ✅ Type checking passes
6. ✅ Integration guide documented
7. ✅ Code follows BEM CSS convention
8. ✅ Manual verification checklist completed

**What success looks like:**
- User clicks discuss button on any Tier 1 component
- Dialog opens instantly with "I want to discuss this [Component Name] element"
- Optional context shown as collapsible section (read-only)
- User clicks "Send to Chat"
- Message appears in ChatPanel immediately
- Dialog closes
- Chat session ready for follow-up conversation

---

## Estimated Effort

**Total Time:** 8-12 hours

**Breakdown:**
- Step 1 (DiscussButton): 1-1.5 hours
- Step 2 (DiscussDialog): 1.5-2 hours
- Step 3 (useDiscussButton hook): 1-1.5 hours
- Step 4 (ChatPanel prefill): 0.5-1 hour
- Steps 5-9 (5 component integrations): 3-4 hours (0.5-0.8h each)
- Step 10 (SessionContext, if needed): 0.5-1 hour
- Step 11 (Documentation): 0.5-1 hour

**Parallelization Potential:**
- With 2 agents: ~6-8 hours (Steps 1-2 parallel, Steps 5-8 parallel)
- With 3 agents: ~5-7 hours (Steps 1-2-10 parallel, Steps 5-6-7-8 parallel)

---

## References

**Key Files from Analysis:**
- Analysis report: `.claude/actionflows/logs/analyze/discuss-button-integration_2026-02-10-02-39-23/SUMMARY.md`
- CustomPromptButton blueprint: `packages/app/src/components/CustomPromptButton/CustomPromptDialog.tsx`
- Chat integration: `packages/app/src/components/SessionPanel/ChatPanel.tsx`
- Chat hook: `packages/app/src/hooks/useChatMessages.ts`
- Button types: `packages/shared/src/buttonTypes.ts`

**Tier 1 Components:**
1. `packages/app/src/components/SessionPanel/ChatPanel.tsx`
2. `packages/app/src/components/FlowVisualization/FlowVisualization.tsx`
3. `packages/app/src/components/ChainDAG/ChainDAG.tsx`
4. `packages/app/src/components/StepInspector/StepInspector.tsx`
5. `packages/app/src/components/HarmonyPanel/HarmonyPanel.tsx`

**Design Patterns:**
- Follow `CustomPromptDialog` pattern for dialog structure
- Follow BEM CSS naming convention (e.g., `.discuss-button`, `.discuss-button__icon`)
- Follow React 18.2 best practices (hooks, functional components)
- Use TypeScript strict mode

---

## Notes for Code Agents

**When implementing Steps 1-3 (infrastructure):**
- Keep components simple and focused
- Follow existing component patterns (CustomPromptDialog as reference)
- Use BEM CSS strictly
- TypeScript: strict types, no `any`
- Props interfaces: document all props with JSDoc comments

**When implementing Steps 5-9 (integrations):**
- Read component file first to understand structure
- Find header/toolbar section
- Add button in top-right position
- Import and use `DiscussButton` + `DiscussDialog` + `useDiscussButton`
- Pass appropriate `componentContext` (see examples above)
- Add CSS for positioning (minimal changes, follow existing patterns)
- Test rendering in browser

**When implementing Step 4 (ChatPanel prefill):**
- Avoid breaking existing ChatPanel behavior
- Use controlled component pattern for input field
- Clear prefill after first send or edit
- Consider edge cases: prefill while typing, prefill overwrite

**Context serialization:**
- Always wrap in try-catch
- Test with real component state (not mock data)
- Keep context < 1KB for performance
- Sanitize before passing to dialog

**SessionId access:**
- Check props first (likely passed from parent)
- Check existing contexts (SessionContext, WebSocketContext)
- Create SessionContext only if absolutely needed
- Document how to access sessionId in README

---

**Plan Author:** Planning agent (analyze/discuss-button-integration → plan/discuss-button-infrastructure)
**Plan Date:** 2026-02-10
**Plan Version:** 1.0
**Scope:** Infrastructure + Tier 1 (5 components)
**Out of Scope:** Discussion protocols, backend changes, Tier 2/3/4 components
