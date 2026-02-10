# Review Report: Canvas Workbench Layout Refinement

## Verdict: NEEDS_CHANGES
## Score: 35%

## Summary
The implementation provides a functional collapsible editor system with correct React patterns and CSS containment, but it fundamentally mismatches the requirements by implementing HORIZONTAL collapse (left/right) instead of VERTICAL collapse (top/bottom). The user specified "collapsible downward" — meaning the editor should stack vertically on top of the preview and collapse downward. Additionally, the flex layout direction and transition properties are optimized for horizontal movement rather than vertical. This architectural mismatch requires layout restructuring.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | packages/app/src/components/Workbench/CanvasWorkbench.css | 64-70 | critical | `.canvas-workbench__content` uses `flex` direction (implicitly row) creating horizontal split, but requirements specify vertical stacking with editor on top, preview below. This is the core architectural mismatch. | Change `.canvas-workbench__content` to `flex-direction: column` to stack editor vertically above preview. |
| 2 | packages/app/src/components/Workbench/CanvasWorkbench.css | 73-81 | critical | `.canvas-workbench__editor` uses `flex: 0 0 60%` and `flex-basis 0.3s ease` transition, which controls horizontal width. For vertical collapse, this should transition height instead. | Change to `flex: 0 0 auto` with `height: auto` expanded state, `height: 0` collapsed state. Use `transition: height 0.3s ease` instead. |
| 3 | packages/app/src/components/Workbench/CanvasWorkbench.css | 92-100 | high | `.canvas-workbench__preview` does not have flex constraints suitable for vertical layout. With vertical stacking, preview should fill remaining vertical space but needs proper `min-height: 0` constraint. | Add `min-height: 0` to `.canvas-workbench__preview` to enable flex scrolling in column-direction parent. |
| 4 | packages/app/src/components/Workbench/CanvasWorkbench.css | 113-119 | low | Responsive dark mode filter on iframe may reduce visibility slightly. Not critical but worth testing. | Test preview clarity with `filter: brightness(0.95)` on real content; consider reducing or removing filter. |

## Flags for Human

| Issue | Why Human Needed |
|-------|-----------------|
| Layout Direction Mismatch | Requires decision on whether to flip layout from horizontal (current) to vertical (required). This is a fundamental architectural change affecting the entire flex tree structure. Must confirm requirements before proceeding with fix. |
| CSS Containment Purpose | The `contain: layout style` on `.workbench-main` is correct and prevents layout escape, but verify this is intentional and that nested flex children don't need to override containment in any scenario. |
| Preview Width Management | With vertical layout, the preview should fill the full width. Current `min-width: 0` is correct pattern, but confirm no horizontal width constraints are needed. |

## Fixes Applied
None. Mode = review-only. All fixes require human approval due to architectural change nature.

---

## Quality Assessment

**What Works Well:**
- ✅ React hook patterns: `useState`, `useCallback` correctly implemented
- ✅ Event handling: `onClick` handlers properly bound, no closure issues
- ✅ Local storage integration: Proper try/catch and debounce on persist
- ✅ CSS containment: `contain: layout style` correctly applied to prevent layout escape
- ✅ No `position: fixed` violations: Layout uses flexbox, not absolute positioning with 100vh
- ✅ Scrollbar styles: Custom webkit scrollbar properly scoped
- ✅ Transition smoothness: 0.3s ease transition is performant

**Critical Gaps:**
- ❌ Layout axis: Horizontal (left/right) instead of vertical (top/bottom)
- ❌ CSS transitions: Target horizontal flex-basis instead of vertical height
- ❌ Button labels match vertical intent but CSS doesn't: "▼ Hide Editor" / "▲ Show Editor" are correct for vertical, contradicting the horizontal implementation

**Pattern Adherence:**
- React: ✅ Follows component composition, hooks rules, proper event handling
- TypeScript: ✅ Props interface defined, no implicit `any`, branded types not applicable here
- CSS: ⚠️ BEM naming correct, containment correct, but flexbox direction violates requirements
