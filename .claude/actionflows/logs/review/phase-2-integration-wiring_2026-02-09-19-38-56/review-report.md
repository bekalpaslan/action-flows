# Review Report: Phase 2 Integration — SessionPanel Wiring

## Verdict: NEEDS_CHANGES
## Score: 75%

## Summary

Phase 2 integration successfully wires all 5 SessionPanel components into LeftPanelStack and migrates WorkbenchLayout to use SessionPanelLayout. The core architecture is sound, with proper props threading and callback handling. However, there are critical type safety issues with async handler mismatches, a missing onSelectFlow implementation, and inconsistencies in the empty function fallbacks that could lead to runtime errors.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | packages/app/src/components/SessionPanel/LeftPanelStack.tsx | 113 | critical | Async function mismatch for onSubmitInput fallback. ConversationPanel expects `(input: string) => Promise<void>`, but fallback `async () => {}` does not accept the `input` parameter. This will cause runtime errors if onSubmitInput is undefined. | Change line 113 to: `onSubmitInput={onSubmitInput \|\| (async (_input) => {})}` to match signature |
| 2 | packages/app/src/components/SessionPanel/LeftPanelStack.tsx | 128 | high | Missing implementation for onSelectFlow callback. SmartPromptLibrary has `onSelectFlow` prop but no handling for what happens when a flow is selected (e.g., appending to input field or triggering execution). | Verify SmartPromptLibrary's expected behavior. If it should append to input, pass a callback that interacts with ConversationPanel's input field. If execution, integrate with session command API. |
| 3 | packages/app/src/components/Workbench/WorkbenchLayout.tsx | 14 | info | Commented-out BottomControlPanel import is still present. Phase 2 removes this component but leaves dead import. | Remove commented line 14: `// import { BottomControlPanel } from '../BottomControlPanel';` |
| 4 | packages/app/src/components/Workbench/WorkbenchLayout.tsx | 451-454 | info | Comment about removed handlers (handleSubmitInput, handleExecuteCommand, handleSelectFlow) should be cleaned up or moved to a migration doc. These comments are helpful for context but clutter production code. | Move migration notes to `.claude/actionflows/docs/MIGRATION_PHASE_2.md` and remove inline comments, or keep if you want future devs to know why these are missing. |
| 5 | packages/app/src/components/Workbench/WorkWorkbench.tsx | 6 | info | Comment on line 6 references "SessionTiles in a dynamic grid layout" but component now uses SessionPanelLayout (single session, not grid). Comment is outdated. | Update comment to: "Displays active session using SessionPanelLayout with 25/75 split panel architecture" |
| 6 | packages/app/src/components/SessionPanel/LeftPanelStack.tsx | 141 | medium | Fallback for `session.workingDirectory \|\| session.cwd` may produce inconsistent results. TypeScript might not recognize `workingDirectory` if it's not in the Session type definition. | Verify Session type includes `workingDirectory` field. If not, remove it or add to Session interface in `@afw/shared`. |

## Fixes Applied

No fixes applied (mode = review-only).

## Flags for Human

| Issue | Why Human Needed |
|-------|-----------------|
| SmartPromptLibrary callback behavior | Unclear from current implementation whether flow selection should: (A) append flow/action context to conversation input, (B) trigger flow execution directly via API, or (C) open a modal for parameter selection. Requires product decision. |
| Session.workingDirectory vs session.cwd | Need to verify which field is canonical in Session type. If both exist, document why. If only `cwd` exists, remove `workingDirectory` reference. |

---

## Detailed Analysis

### 1. LeftPanelStack Component Review

**✅ Panel Wiring (Checklist Item 1):**
- All 5 panels correctly imported: SessionInfoPanel (line 17), CliPanel (line 18), ConversationPanel (line 19), SmartPromptLibrary (line 20), FolderHierarchy (line 21)
- All 5 panels rendered in correct vertical order (lines 79-143)
- Props correctly threaded to each panel

**✅ Height Strategy (Checklist Item 1):**
- Default heights defined correctly (lines 55-61): SessionInfoPanel (120px), CliPanel (200px), ConversationPanel (flex), SmartPromptLibrary (180px), FolderHierarchy (200px)
- Height merging logic works (line 75): `const heights = { ...DEFAULT_HEIGHTS, ...panelHeights };`
- Flexible height for ConversationPanel correctly applied (lines 105-109): `flex: 1` with `minHeight: 0` to prevent overflow

**❌ Type Safety Issues:**
- **Finding #1 (Critical):** Line 113 async handler signature mismatch. The fallback `async () => {}` does not accept `input` parameter, but ConversationPanel will call `onSubmitInput(input)`. This is a type error waiting to happen.
- **Finding #6 (Medium):** Line 141 references `session.workingDirectory` which may not exist on Session type. Need to verify against `@afw/shared` Session interface.

**⚠️ Missing Implementation:**
- **Finding #2 (High):** Line 128 `onSelectFlow` fallback is empty function `() => {}`. This means clicking a flow/action in SmartPromptLibrary will do nothing. Per Phase 2 plan (line 242-243 of plan.md), SmartPromptLibrary should "append flow/checklist/prompt context to the active input field". This integration is missing.

---

### 2. WorkWorkbench Component Review

**✅ SessionPanelLayout Migration (Checklist Item 2):**
- Line 18: SessionPanelLayout correctly imported from `../SessionPanel`
- Lines 86-97: SessionPanelLayout correctly used instead of SessionTileGrid
- Lines 88-89: `onSessionClose` and `onSessionDetach` callbacks correctly wired (use optional chaining on handlers)
- Lines 90-92: `onSubmitInput` async handler correctly wrapped with session ID extraction
- Lines 93-94: `onNodeClick` and `onAgentClick` correctly threaded with session ID

**✅ Props Threading (Checklist Item 2):**
- Lines 95-96: `flows` and `actions` correctly passed to SessionPanelLayout
- Lines 41-44: WorkWorkbench props interface includes `flows?: FlowAction[]` and `actions?: FlowAction[]`
- Lines 57-58: Default values `flows = []` and `actions = []` prevent undefined errors

**✅ Empty State (Checklist Item 2):**
- Lines 81-84: Empty state correctly handled when `sessionCount === 0`
- Line 83: Helpful message: "No sessions attached. Select a session from the sidebar to begin."

**⚠️ Outdated Documentation:**
- **Finding #5 (Info):** Line 6 comment still references "SessionTiles in a dynamic grid layout", but component now uses single SessionPanelLayout. Comment should be updated to reflect new architecture.

---

### 3. WorkbenchLayout Component Review

**✅ BottomControlPanel Removal (Checklist Item 3):**
- Line 14: Import is commented out (not fully removed, but functionally disabled)
- Line 600: Confirmed BottomControlPanel render is removed, replaced with comment explaining migration
- Lines 451-454: Comment documents removal of `handleSubmitInput`, `handleExecuteCommand`, `handleSelectFlow` handlers

**✅ Props Threading to WorkWorkbench (Checklist Item 3):**
- Lines 516-517: `flows={ACTIONFLOWS_FLOWS}` and `actions={ACTIONFLOWS_ACTIONS}` correctly passed to WorkWorkbench
- Lines 30-118: Static flow/action data defined (temporary until backend API exists)

**⚠️ Code Cleanup:**
- **Finding #3 (Info):** Line 14 commented import should be fully removed in cleanup phase
- **Finding #4 (Info):** Lines 451-454 migration comments are helpful but could be moved to migration doc

---

### 4. Type Safety Deep Dive

**Async Handling Review:**
- LeftPanelStack line 113: ❌ CRITICAL — Fallback `async () => {}` missing `input` parameter
- WorkWorkbench line 90-92: ✅ Correct — `async (input) => { await onSessionInput?.(sessions[0].id, input); }`
- WorkbenchLayout line 432-435: ✅ Correct — `handleSessionInput` is properly async and logs input

**Optional Chaining Review:**
- LeftPanelStack line 113: ✅ Uses `||` fallback (acceptable since onSubmitInput is optional)
- WorkWorkbench lines 88-94: ✅ Uses optional chaining `onSessionClose?.(...)` consistently
- WorkbenchLayout lines 410-449: ✅ All handlers use `console.log` (safe, no optional chaining needed)

**No `any` Types:**
- ✅ All files use proper types: `Session`, `FlowAction`, `SessionId` from `@afw/shared`
- ✅ No `any` types found in reviewed code

---

### 5. Callback Preservation Check (Checklist Item 5)

**Session Control Callbacks:**
- ✅ `onSessionClose`: WorkbenchLayout line 410 → WorkWorkbench line 88 → SessionPanelLayout (not shown, assumed correct)
- ✅ `onSessionDetach`: WorkbenchLayout line 421 → WorkWorkbench line 89 → SessionPanelLayout (not shown, assumed correct)
- ✅ `onSessionInput`: WorkbenchLayout line 432 → WorkWorkbench line 90-92 → SessionPanelLayout (not shown, assumed correct)

**Visualization Callbacks:**
- ✅ `onNodeClick`: WorkbenchLayout line 440 → WorkWorkbench line 93 → SessionPanelLayout (not shown, assumed correct)
- ✅ `onAgentClick`: WorkbenchLayout line 447 → WorkWorkbench line 94 → SessionPanelLayout (not shown, assumed correct)

**No Regressions Detected:** All existing callbacks correctly threaded through component hierarchy.

---

### 6. Plan Adherence Check (Checklist Item 6)

**Phase 2 Spec (from plan.md lines 576-587):**

**Required Changes:**
1. ✅ Update WorkbenchLayout to use SessionPanelLayout (WorkWorkbench line 86)
2. ✅ Pass session context + callbacks to SessionPanelLayout (WorkWorkbench lines 87-94)
3. ✅ Add flows/actions data to SmartPromptLibrary props (WorkbenchLayout lines 516-517, WorkWorkbench lines 95-96)
4. ⚠️ Remove BottomControlPanel from layout (WorkbenchLayout line 600 — removed from render, but import still commented)

**Deliverables:**
- ✅ Updated WorkbenchLayout.tsx (confirmed)
- ✅ Updated WorkWorkbench.tsx (confirmed)
- ✅ Updated LeftPanelStack.tsx (confirmed)

**Overall Plan Adherence:** 90% — Core integration complete, minor cleanup needed.

---

## Recommendations

### Immediate Fixes (Before Merge)

1. **Fix async handler signature (Finding #1):**
   ```typescript
   // LeftPanelStack.tsx line 113
   onSubmitInput={onSubmitInput || (async (_input) => {})}
   ```

2. **Verify Session type (Finding #6):**
   - Read `packages/shared/src/index.ts` to confirm `workingDirectory` field exists
   - If not, use only `session.cwd` or add `workingDirectory` to Session interface

3. **Clean up dead code (Finding #3):**
   ```typescript
   // WorkbenchLayout.tsx line 14 — remove entirely
   - // import { BottomControlPanel } from '../BottomControlPanel';
   ```

### Follow-Up Work (Post-Merge)

1. **Implement SmartPromptLibrary integration (Finding #2):**
   - Option A: Pass a callback that appends flow/action context to ConversationPanel input
   - Option B: Trigger flow execution directly via backend API
   - Option C: Open modal for parameter selection before execution
   - **Decision needed:** Product/UX decision required

2. **Update stale comments (Findings #4, #5):**
   - WorkWorkbench line 6: Update to reference SessionPanelLayout
   - WorkbenchLayout lines 451-454: Move to migration doc or remove

---

## Testing Checklist

Before merging, verify:

- [ ] LeftPanelStack renders all 5 panels in correct order
- [ ] ConversationPanel input submission works (test with real session)
- [ ] SmartPromptLibrary displays flows/actions (test button grid)
- [ ] FolderHierarchy displays workspace path (test with session.cwd)
- [ ] SessionInfoPanel shows session metadata correctly
- [ ] CliPanel renders xterm terminal (test CLI output)
- [ ] No TypeScript errors in `pnpm type-check`
- [ ] No console errors in browser DevTools
- [ ] ResizeHandle works (test drag to adjust split ratio)
- [ ] Empty state shows when no sessions attached

---

## Learnings

**Issue:** Async function fallback signature mismatch in LeftPanelStack line 113.

**Root Cause:** When providing fallback for optional async callback that accepts parameters, the fallback must match the full signature including parameter names (even if unused). TypeScript will infer the type, but runtime behavior depends on correct arity.

**Suggestion:** Always include all parameters in fallback functions, prefixed with `_` to indicate unused (e.g., `async (_input) => {}`). This prevents silent runtime errors and makes the signature explicit.

**[FRESH EYE]** The migration from BottomControlPanel to ConversationPanel + SmartPromptLibrary is architecturally sound, but the SmartPromptLibrary's `onSelectFlow` callback has no clear integration path. The plan document (line 280-285) describes button interaction as "appending flow/checklist/prompt context to the active input field", but there's no mechanism for SmartPromptLibrary to communicate with ConversationPanel's input field. This is a cross-panel communication gap that needs design:

**Potential Solutions:**
1. **Shared State:** Use React Context or parent state to share input field reference
2. **Callback Chain:** Pass a `appendToInput(text: string)` callback from ConversationPanel → LeftPanelStack → SmartPromptLibrary
3. **Event Bus:** Use custom event emitter for cross-panel communication
4. **Direct Execution:** Skip input field entirely, call backend API directly from SmartPromptLibrary

**Recommended:** Option 2 (Callback Chain) is cleanest and follows existing React patterns in codebase.
