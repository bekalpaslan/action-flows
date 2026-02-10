# Review Report: Canvas Workbench Implementation

## Verdict: NEEDS_CHANGES
## Score: 82%

## Summary

The Canvas workbench implementation is well-structured and follows established patterns, but has **2 critical security issues** with the iframe sandbox configuration that must be addressed before deployment. The sandbox attribute uses `allow-same-origin` which permits JavaScript execution, contradicting both the plan's security model and iframe security best practices. Additionally, there are minor issues with cleanup handlers, CSS unit inconsistency, and unused imports. The component correctly implements Monaco integration, localStorage persistence, and BEM naming patterns.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | packages/app/src/components/Workbench/CanvasWorkbench.tsx | 156 | critical | **SECURITY: Sandbox attribute permits JavaScript execution.** `sandbox="allow-same-origin"` allows JavaScript to execute in the iframe. The plan (line 98-99) specifies `sandbox="allow-same-origin"` to "restrict scripts while preserving CSS", but this is **incorrect** — `allow-same-origin` does NOT block scripts. It only prevents the iframe from having a null origin. Scripts can still execute freely, creating XSS vulnerability. | Change to `sandbox="allow-same-origin allow-scripts"` if scripts are needed, OR use **no sandbox attribute** for full restrictions, OR add a CSP meta tag in the iframe document. **Recommended:** Remove sandbox entirely or use strict CSP. See MDN: `allow-same-origin` + user content = XSS risk. |
| 2 | packages/app/src/components/Workbench/CanvasWorkbench.tsx | 156 | critical | **SECURITY: Plan contradicts implementation.** Plan states (line 259, 415-434) that `sandbox="allow-same-origin"` blocks `<script>` tags, but this is factually incorrect. MDN documentation confirms `allow-same-origin` allows scripts to run if the iframe's origin matches the parent. The sandbox attribute does NOT provide the promised script blocking. | Either: (1) Remove `allow-same-origin` to truly block scripts (but CSS may break), (2) Add Content-Security-Policy meta tag to block scripts: `<meta http-equiv="Content-Security-Policy" content="script-src 'none'">`, or (3) Accept script execution risk and document it clearly. |
| 3 | packages/app/src/components/Workbench/CanvasWorkbench.tsx | 67-71 | medium | **Cleanup: debounceTimer cleanup in useEffect missing.** The `useEffect` cleanup function clears the timer, but does NOT call `onContentChange` with the final value. If the component unmounts during the debounce delay, the last change is lost. | In the cleanup function, add: `if (debounceTimer.current) { clearTimeout(debounceTimer.current); localStorage.setItem(STORAGE_KEY, markup); onContentChange?.(markup); }` to ensure final state is persisted. |
| 4 | packages/app/src/components/Workbench/CanvasWorkbench.tsx | 18-24 | low | **Import order: configureMonaco called at module level.** `configureMonaco()` is called immediately on module load (line 24), before React even initializes. While this works (Monaco needs global setup), EditorWorkbench (line 33) does the same, so Monaco is configured multiple times. | No change needed for functionality, but consider calling `configureMonaco()` in App.tsx or main.tsx once globally, rather than in every component that uses Monaco. Document that multiple calls are idempotent (or make them idempotent with a guard). |
| 5 | packages/app/src/components/Workbench/CanvasWorkbench.tsx | 94-109 | low | **Function naming: `generateIframeContent` vs inline template.** Function `generateIframeContent()` is only called once (line 155). For a simple template string, inlining it directly in the JSX would be clearer. Function abstraction is useful for complex logic, but this is just string interpolation. | Consider inlining the template directly in `srcDoc={...}` for simplicity, or keep the function if you plan to add more complex HTML generation logic (viewport settings, custom fonts, etc.). Current approach is acceptable but slightly verbose. |
| 6 | packages/app/src/components/Workbench/CanvasWorkbench.css | 102 | low | **Units: font-family declared without system fallback on iframe.** CSS line 102 sets `font-family: system-ui, -apple-system, sans-serif` in the iframe body (via srcDoc template), but CanvasWorkbench.css doesn't apply styles inside the iframe (CSS is scoped to parent). This is correct behavior, but the comment "Dark mode adjustments" (line 103) suggests the CSS file affects iframe content, which it doesn't. | Clarify comment on line 103: Change to "Dark mode adjustments for iframe container" to indicate the filter applies to the iframe element, not its contents. Or remove the `@media` block if not needed (current `filter: brightness(0.95)` dims the entire iframe, not just dark mode). |
| 7 | packages/app/src/components/Workbench/CanvasWorkbench.css | 24, 98 | low | **Units: height uses fixed `60px` (header) and `300px` (iframe min-height).** Fixed pixel heights may not scale well on different screen sizes or zoom levels. Consider using `rem` units for better accessibility. | Change line 24 `height: 60px;` to `height: 3.75rem;` and line 98 `min-height: 300px;` to `min-height: 18.75rem;`. This is a minor improvement for accessibility, not a blocker. |
| 8 | packages/app/src/components/Workbench/CanvasWorkbench.tsx | 86 | low | **UX: confirm() blocks UI thread.** Native `confirm()` dialog blocks the entire browser UI, preventing background tabs or keyboard shortcuts from working. Modern React apps typically use modal components for confirmations. | Replace `confirm('Clear canvas...')` with a custom modal component (e.g., `<ConfirmDialog />`) for better UX. Alternatively, use `window.confirm()` explicitly to indicate it's a browser API. Current implementation is functional but dated. |
| 9 | packages/shared/src/workbenchTypes.ts | 14 | low | **Documentation: JSDoc comment says "9 workbenches" but lists 11.** Comment on line 4 says "9 workbenches" but `WorkbenchId` type has 11 members (work, maintenance, explore, review, archive, settings, pm, harmony, editor, intel, canvas). This is stale documentation. | Update line 4 to: "Defines the 11 workbenches that form the primary navigation structure". |
| 10 | packages/app/src/components/Workbench/index.ts | 11 | low | **Barrel export: CanvasWorkbenchProps exported but not used externally.** `CanvasWorkbenchProps` is exported from the barrel (line 11) but WorkbenchLayout.tsx (line 559) doesn't pass any props to `<CanvasWorkbench />`. Props are optional (`initialMarkup?`, `onContentChange?`), so the component works, but exporting unused types adds noise. | Keep the export for future extensibility (props may be used later), or add a comment: `// Exported for future extensibility` to clarify intent. This is not a bug, just a design question. |

## Fixes Applied

N/A — Mode is `review-only` (default). No fixes applied.

## Flags for Human

| Issue | Why Human Needed |
|-------|-----------------|
| **Sandbox security model decision** | The plan assumes `sandbox="allow-same-origin"` blocks scripts, but it doesn't. Human must decide: (1) Accept script execution risk (Figma exports may contain scripts), (2) Use CSP to block scripts but allow CSS, or (3) Remove sandbox and use stricter isolation (may break some CSS). This is a **security vs functionality tradeoff** requiring product/design input. See [MDN: Sandbox security warning](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox). |
| **localStorage quota handling** | Plan mentions showing a "toast warning" if localStorage quota is exceeded (line 262), but component currently only logs to console (line 63). Should this surface to the user? Requires UX decision on error handling. |
| **Resizable split pane future enhancement** | Plan lists "resizable split pane" as a future enhancement (line 364). If this is a priority, consider using `react-split-pane` now instead of fixed 60/40 split. Current implementation is fine, but adding resize later requires refactoring CSS. |

## Learnings

**Issue:** Review uncovered a critical misconception in the plan regarding iframe sandbox security.

**Root Cause:** Plan author (and implementing agent) misunderstood `sandbox="allow-same-origin"` behavior. The attribute does NOT block JavaScript execution — it only affects the iframe's origin policy. Scripts can still run freely if `allow-scripts` is implicitly enabled (which it is when `allow-same-origin` is set without other restrictions).

**Suggestion:** Before implementing security-sensitive features (XSS mitigation, sandboxing, CSP), always cross-reference plan assumptions against authoritative sources (MDN, OWASP). In this case, the plan confidently stated (line 415-434) that the sandbox blocks scripts, but this is factually incorrect per [MDN iframe sandbox docs](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe#attr-sandbox).

**[FRESH EYE]** The plan's "Security Considerations" section (lines 411-437) is detailed and well-intentioned, but contains a **fundamental error** that propagated into the implementation. This highlights the value of security-focused code review: even well-documented plans can embed incorrect assumptions. Consider adding a "security review" checkpoint for features handling user-generated content (XSS, injection, sandboxing).

**[FRESH EYE]** EditorWorkbench (line 33 of EditorWorkbench.tsx) and CanvasWorkbench (line 24 of CanvasWorkbench.tsx) both call `configureMonaco()` at module load. This means Monaco is configured **twice** if both workbenches are imported. While likely harmless (Monaco configuration is probably idempotent), this could be refactored to a single global initialization in `main.tsx` or `App.tsx`. Not a bug, but a code smell indicating duplicated setup logic.

---

## Additional Context

### Security Issue Deep Dive

The plan states (line 98-99):
```typescript
sandbox="allow-same-origin"
```

And claims (line 259, 415-434) this blocks `<script>` tags. **This is incorrect.**

**What `sandbox="allow-same-origin"` actually does:**
- Allows the iframe to maintain the same origin as the parent document
- **Does NOT block JavaScript** — scripts execute normally
- Only prevents the iframe from having a null origin (which would break CSS)

**What the plan intended to achieve:**
- Block JavaScript execution (`<script>` tags, event handlers)
- Allow CSS rendering (inline styles, `<style>` tags)

**Correct implementations:**

**Option 1: Use Content Security Policy (CSP) — RECOMMENDED**
```typescript
const generateIframeContent = (htmlMarkup: string): string => {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="script-src 'none'; object-src 'none';">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; background: #ffffff; }
    </style>
  </head>
  <body>
    ${htmlMarkup}
  </body>
</html>`;
};
```

**Option 2: No sandbox attribute (strictest isolation)**
```typescript
<iframe
  title="Canvas Preview"
  className="canvas-workbench__iframe"
  srcDoc={generateIframeContent(markup)}
  // No sandbox attribute = all restrictions enabled by default
/>
```
⚠️ **Warning:** This may break some CSS (e.g., CSS that relies on same-origin policies for fonts, images).

**Option 3: Accept script execution risk (if Figma exports need it)**
```typescript
<iframe
  title="Canvas Preview"
  className="canvas-workbench__iframe"
  srcDoc={generateIframeContent(markup)}
  sandbox="allow-same-origin allow-scripts"
  // Explicitly allow scripts if required for Figma interactivity
/>
```
Document this as a known risk: "Canvas allows user JavaScript to execute in a sandboxed iframe."

### Architecture Compliance

✅ **Follows patterns correctly:**
- Shared types updated first (workbenchTypes.ts)
- Discriminated union `WorkbenchId` type extended
- Switch-case routing in WorkbenchLayout
- BEM CSS naming (`.canvas-workbench__element`)
- Barrel exports in `index.ts`
- Monaco Editor integration pattern matches EditorWorkbench
- localStorage persistence pattern matches existing workbenches

✅ **TypeScript correctness:**
- Proper branded types usage (none needed for Canvas, as it's not session-scoped)
- Props interface exported for type safety
- useCallback/useRef used correctly for performance
- No `any` types (except in monaco-config.ts, which is third-party setup)

✅ **React patterns:**
- Functional component with hooks
- Proper useEffect cleanup (though incomplete — see Finding #3)
- Debounced state updates for performance
- Controlled component pattern (value + onChange)

### Performance Considerations

✅ **Good:**
- Debounced localStorage writes (500ms) prevent excessive disk I/O
- Monaco `automaticLayout: true` handles responsive resizing
- `useCallback` prevents unnecessary re-renders

⚠️ **Potential issues:**
- Very large HTML (>1MB) may cause UI lag on input change (iframe re-renders on every srcDoc update)
- No virtualization for large content (acceptable for design preview use case)

### Code Quality

**Strengths:**
- Clear comments explaining feature purpose (lines 1-16)
- Constants defined at module level (STORAGE_KEY, DEBOUNCE_DELAY)
- Error handling for localStorage operations (try/catch)
- Proper TypeScript types for all props and state

**Weaknesses:**
- Security assumptions incorrect (see Findings #1, #2)
- Cleanup logic incomplete (see Finding #3)
- Minor inconsistencies (confirm() UX, fixed pixel units)

---

## Recommendations

### Immediate Actions (Before Commit)

1. **Fix critical security issue:** Implement CSP in iframe (Option 1 above) or document script execution risk
2. **Fix cleanup handler:** Ensure final state is persisted on unmount (Finding #3)
3. **Update stale documentation:** Change "9 workbenches" to "11 workbenches" (Finding #9)

### Future Improvements (Post-MVP)

1. **Resizable split pane:** Use `react-split-pane` or similar library for user-adjustable editor/preview ratio
2. **Toast notifications:** Surface localStorage quota errors to user (currently console-only)
3. **Custom confirm dialog:** Replace native `confirm()` with React modal for better UX
4. **Global Monaco setup:** Move `configureMonaco()` to `main.tsx` to avoid duplicate calls
5. **Unit tests:** Add Vitest tests for localStorage persistence, clear button, debounce behavior

---

## Conclusion

The Canvas workbench implementation demonstrates solid understanding of React patterns, TypeScript, and the ActionFlows architecture. However, the **critical sandbox security misconfiguration** (Findings #1, #2) must be addressed before deployment. The plan's security assumptions were incorrect, and the implementation faithfully reproduced those incorrect assumptions.

**Recommended next steps:**
1. Human decision on security tradeoff (CSP vs script execution)
2. Apply sandbox/CSP fix based on decision
3. Fix cleanup handler (Finding #3)
4. Update documentation (Finding #9)
5. Commit with security fix documented in commit message
