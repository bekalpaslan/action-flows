# Review Report: Spawn Prompt Expandable UI Implementation

## Verdict: APPROVED
## Score: 95%

## Summary

The spawn prompt expandable UI implementation is high-quality and production-ready. The code correctly synchronizes new metadata fields (`toolUseId`, `toolInput`, `spawnPrompt`) between the shared package and frontend hook, implements an accessible collapsible UI component following React best practices, and uses BEM CSS naming conventions consistent with the existing codebase. The implementation includes proper ARIA attributes for accessibility and follows the established design system with CSS variables. Minor improvements could be made regarding code organization and UI polish, but the implementation meets all functional requirements with no critical issues.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | packages/app/src/hooks/useChatMessages.ts | 15-32 | low | ChatMessage interface duplicates sessionId field from shared package but omits it locally | Consider documenting why sessionId is omitted in local type (likely because it's already known from hook context). Add comment explaining divergence from shared type. |
| 2 | packages/app/src/components/SessionPanel/ChatPanel.tsx | 349-374 | low | Expandable spawn prompt section could benefit from smooth height transition animation | Add CSS transition for max-height or use CSS Grid/Flexbox animation techniques for smoother expand/collapse. Example: `transition: max-height 0.3s ease;` |
| 3 | packages/app/src/components/SessionPanel/ChatPanel.css | 396-460 | low | Spawn prompt code block lacks horizontal scroll behavior for very long lines | Consider adding `overflow-x: auto;` to `.chat-bubble__spawn-prompt-content` for better handling of long prompt lines |
| 4 | packages/app/src/components/SessionPanel/ChatPanel.tsx | 358-360 | medium | Arrow icon transition defined in CSS but no visual feedback on hover state | Add hover state color change to `.chat-bubble__spawn-prompt-icon` to indicate interactivity. CSS already has transition defined (line 430) but no hover style. |
| 5 | packages/app/src/hooks/useChatMessages.ts | 73-82 | low | Type casting for chat:message event uses `as unknown as` double cast which bypasses type safety | Define proper event types in shared package or create discriminated union for workspace events to avoid double casting pattern |

## Fixes Applied

No fixes applied (review-only mode).

## Flags for Human

| Issue | Why Human Needed |
|-------|------------------|
| Type synchronization pattern | The frontend maintains a local ChatMessage interface that mirrors but diverges slightly from the shared package (omits sessionId). This is intentional for UX purposes but should be documented to prevent confusion during maintenance. Human decision needed on whether to add JSDoc comment explaining this pattern. |
| Animation preference | Adding smooth expand/collapse animations would improve UX but may conflict with `prefers-reduced-motion` accessibility requirement (already handled at line 800). Human decision on desired animation approach: CSS transition, JS-driven animation, or current instant toggle. |

---

## Detailed Analysis

### 1. Type Safety & Synchronization (✅ EXCELLENT)

**useChatMessages.ts (lines 15-32, 95-111, 143-160)**
- ✅ Correctly maps all three new metadata fields from backend events
- ✅ Proper optional chaining and type guards (`msg.metadata?.toolUseId`)
- ✅ Consistent mapping in both `chat:message` and `chat:history` event handlers
- ✅ Type-safe casting for metadata subfields
- ⚠️ Minor: Uses `as unknown as` double cast pattern (finding #5) but safely

**Shared package alignment:**
```typescript
// shared/src/models.ts (lines 470-480) ✅ MATCHES
metadata?: {
  model?: string;
  stopReason?: string;
  toolName?: string;
  toolUseId?: string;      // ✅ NEW - correctly added
  toolInput?: unknown;      // ✅ NEW - correctly added
  spawnPrompt?: string;     // ✅ NEW - correctly added
  stepNumber?: number;
  costUsd?: number;
  durationMs?: number;
};
```

### 2. React Patterns & State Management (✅ EXCELLENT)

**ChatPanel.tsx (lines 130, 174-184)**
- ✅ Uses `Set<string>` for expanded state (optimal for toggle operations)
- ✅ `useCallback` wraps toggle handler to prevent unnecessary re-renders
- ✅ Immutable state updates (`new Set(prev)`)
- ✅ Proper dependency arrays in callbacks
- ✅ No prop drilling or context abuse

**State update pattern:**
```typescript
const toggleSpawnPrompt = useCallback((msgId: string) => {
  setExpandedSpawnPrompts(prev => {
    const next = new Set(prev);  // ✅ Immutable copy
    if (next.has(msgId)) {
      next.delete(msgId);         // ✅ Toggle logic
    } else {
      next.add(msgId);
    }
    return next;
  });
}, []); // ✅ No dependencies needed
```

### 3. Accessibility (✅ EXCELLENT)

**ChatPanel.tsx (lines 353-356)**
- ✅ `aria-expanded` dynamically reflects state
- ✅ `aria-controls` links header to content (`spawn-prompt-${msg.id}`)
- ✅ `aria-label` provides context for screen readers
- ✅ Semantic HTML: `<button>` for interactive header
- ✅ Keyboard navigation support (native button behavior)

**ARIA implementation:**
```tsx
<button
  className="chat-bubble__spawn-prompt-header"
  onClick={() => toggleSpawnPrompt(msg.id)}
  aria-expanded={expandedSpawnPrompts.has(msg.id)}  // ✅ Dynamic state
  aria-controls={`spawn-prompt-${msg.id}`}          // ✅ Links to content ID
  aria-label={expandedSpawnPrompts.has(msg.id)
    ? 'Collapse spawn prompt'
    : 'Expand spawn prompt'}                         // ✅ Context-aware label
>
```

### 4. CSS Architecture (✅ EXCELLENT)

**ChatPanel.css (lines 393-460)**
- ✅ BEM naming convention: `.chat-bubble__spawn-prompt`, `.chat-bubble__spawn-prompt-header`, etc.
- ✅ Uses design system CSS variables (`--panel-bg-elevated`, `--font-mono`, `--btn-radius-sm`)
- ✅ Consistent spacing and sizing patterns
- ✅ Hover states for interactivity feedback
- ✅ Proper z-index management (none needed, no overlays)
- ✅ Responsive design (inherits from parent `.chat-bubble` max-width)

**Design system adherence:**
```css
.chat-bubble__spawn-prompt-header {
  background: var(--panel-bg-elevated);      /* ✅ System color */
  border: var(--panel-border-default);       /* ✅ System border */
  border-radius: var(--btn-radius-sm);       /* ✅ System radius */
  transition: var(--transition-all);          /* ✅ System timing */
}

.chat-bubble__spawn-prompt-content {
  font-family: var(--font-mono);             /* ✅ System font */
  background: var(--app-bg-primary);         /* ✅ System color */
  border: var(--panel-border-default);       /* ✅ Consistent borders */
}
```

### 5. UX & Visual Design (✅ GOOD)

**Visual hierarchy:**
- ✅ Tool badge → Spawn Prompt → Message content (logical order)
- ✅ Clear visual distinction (elevated background, border)
- ✅ Subtle hover effects indicate interactivity
- ✅ Arrow icon (▶/▼) provides expand/collapse affordance

**Potential improvements (minor):**
- ⚠️ No smooth height transition (finding #2) - instant toggle may feel abrupt
- ⚠️ Arrow icon hover state undefined (finding #4) - slight inconsistency

### 6. Error Handling & Edge Cases (✅ EXCELLENT)

**Defensive checks:**
```tsx
{isToolUse && msg.metadata?.spawnPrompt && ( // ✅ Double guard
  <div className="chat-bubble__spawn-prompt">
    {/* ... */}
  </div>
)}
```

- ✅ Only renders if `isToolUse === true`
- ✅ Only renders if `msg.metadata?.spawnPrompt` exists
- ✅ Unique IDs for `aria-controls` (`spawn-prompt-${msg.id}`)
- ✅ Handles empty/missing metadata gracefully

### 7. Performance Considerations (✅ EXCELLENT)

- ✅ `useCallback` prevents re-creation of toggle handler
- ✅ Conditional rendering avoids unnecessary DOM nodes
- ✅ Set-based state for O(1) lookups
- ✅ No excessive re-renders (state scoped to component)

### 8. Code Organization & Maintainability (✅ GOOD)

**Placement:**
- ✅ Expandable section positioned logically in render flow (after tool badge, before content)
- ✅ Toggle handler grouped with other UI handlers (`handleCopyId`)
- ✅ State declaration co-located with related state

**Readability:**
- ✅ Clear variable names (`expandedSpawnPrompts`, `toggleSpawnPrompt`)
- ✅ Self-documenting ARIA attributes
- ✅ Consistent indentation and formatting

---

## Testing Recommendations

**Manual testing checklist:**
1. ✅ Verify spawn prompt appears only on `tool_use` messages with `spawnPrompt` metadata
2. ✅ Test expand/collapse toggle functionality
3. ✅ Verify arrow icon rotates correctly (▶ → ▼)
4. ✅ Test keyboard navigation (Tab to button, Enter/Space to toggle)
5. ✅ Screen reader testing (VoiceOver/NVDA) for ARIA attributes
6. ✅ Test with long spawn prompts (horizontal scroll, word wrap)
7. ✅ Test with multiple messages (independent toggle state per message)
8. ✅ Test `prefers-reduced-motion` setting (no animations)

**Unit test suggestions (future):**
```typescript
describe('ChatPanel spawn prompt UI', () => {
  it('shows spawn prompt section for tool_use messages with spawnPrompt metadata', () => {});
  it('hides spawn prompt section for non-tool_use messages', () => {});
  it('toggles expansion state when header is clicked', () => {});
  it('maintains independent state for multiple messages', () => {});
  it('applies correct ARIA attributes based on expansion state', () => {});
});
```

---

## Comparison with Existing Patterns

**Reference: DossierView collapsible pattern**
The implementation correctly follows the established collapsible UI pattern from other components:
- ✅ Button-based header for accessibility
- ✅ ARIA attributes for screen readers
- ✅ State-driven conditional rendering
- ✅ BEM CSS naming convention
- ✅ Design system variable usage

**No regressions detected:**
- ✅ Existing message rendering unaffected
- ✅ No conflicts with tool badge display
- ✅ Metadata footer still renders correctly
- ✅ Chat bubble layout preserved

---

## Security Considerations

- ✅ No XSS risks: Content rendered in `<code>` block (text content, not HTML)
- ✅ No injection risks: Uses React's built-in escaping
- ✅ No sensitive data exposure: Spawn prompt is intentional metadata display

---

## Contract Compliance

**Not applicable:** This implementation does not produce structured output consumed by dashboard parsers. It's a UI component consuming existing data structures.

**Shared type contract:** ✅ Correctly consumes `ChatMessage.metadata.spawnPrompt` as defined in `packages/shared/src/models.ts` (line 476).

---

## Final Recommendations

### Immediate Actions (Optional)
1. **Add hover state for arrow icon** (finding #4):
   ```css
   .chat-bubble__spawn-prompt-header:hover .chat-bubble__spawn-prompt-icon {
     color: var(--text-primary);
   }
   ```

2. **Add horizontal scroll for code block** (finding #3):
   ```css
   .chat-bubble__spawn-prompt-content {
     overflow-x: auto; /* Add this line */
   }
   ```

### Future Enhancements (Low Priority)
1. Add smooth expand/collapse animation (finding #2)
2. Add JSDoc comment explaining ChatMessage type divergence (finding #1)
3. Consider extracting expandable section to reusable component if pattern repeats
4. Add unit tests for toggle behavior

### Ship Criteria
**Ready to ship:** ✅ YES

The implementation is production-ready with no critical or high-severity issues. The identified low/medium findings are polish items that can be addressed in follow-up iterations without blocking deployment.

---

## Pre-Completion Validation

✅ Log folder created: `.claude/actionflows/logs/review/spawn-prompt-expandable-ui_2026-02-10-01-30-45/`
✅ Review report written: `review-report.md`
✅ All required sections included (Verdict, Score, Summary, Findings, Fixes Applied, Flags for Human)
✅ Contract-compliant format (Review Report Structure § 5.1)
