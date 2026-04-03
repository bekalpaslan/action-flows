---
phase: 08-neural-validation-safety
plan: 01
subsystem: hooks
tags: [claude-code-hooks, design-system, validation, regex, pretooluse, posttooluse]

# Dependency graph
requires:
  - phase: 03-design-system
    provides: Design tokens, component library, manifest.ts
provides:
  - PreToolUse hook blocking raw CSS violations in .tsx/.css files
  - PostToolUse hook surfacing design compliance warnings via additionalContext
  - Shared design-rules module with CRITICAL_PATTERNS and WARNING_PATTERNS
  - Violation reporter for backend event tracking
  - Unit tests for all regex patterns (27 tests)
affects: [08-02, 08-03, 08-04, 10-customization-automation]

# Tech tracking
tech-stack:
  added: [vitest (hooks package)]
  patterns: [PreToolUse exit(2) blocking, PostToolUse hookSpecificOutput advisory, shared regex design rules, fire-and-forget violation reporting]

key-files:
  created:
    - packages/hooks/src/utils/design-rules.ts
    - packages/hooks/src/utils/violation-reporter.ts
    - packages/hooks/src/afw-design-validate-pre.ts
    - packages/hooks/src/afw-design-validate-post.ts
    - packages/hooks/src/__tests__/design-rules.test.ts
    - packages/hooks/vitest.config.ts
  modified:
    - .claude/settings.json
    - packages/hooks/package.json

key-decisions:
  - "Moderate rule strictness: block raw hex/rgb in CSS property context, warn on quoted hex strings elsewhere"
  - "Defense-in-depth: PostToolUse also checks CRITICAL_PATTERNS at warning level in case PreToolUse was bypassed"
  - "Silent failure mode: uncaught hook errors exit 0 to never block agent workflow"
  - "manifest.json already existed from Phase 3 -- no duplicate creation needed"

patterns-established:
  - "Design rule module pattern: shared DesignRule[] arrays with rule/pattern/message shape"
  - "Hook content extraction: handles Write (content), Edit (new_string), MultiEdit (edits[].new_string)"
  - "Windows path normalization in hooks: path.normalize().replace(/\\\\/g, '/')"
  - "Violation reporter fire-and-forget: fetch with AbortSignal.timeout(3000), catch silently"

requirements-completed: [NEURAL-01, NEURAL-02, NEURAL-03, NEURAL-05, NEURAL-06, NEURAL-07]

# Metrics
duration: 10min
completed: 2026-04-03
---

# Phase 8 Plan 1: Hook-Based Design System Enforcement Summary

**PreToolUse/PostToolUse hooks blocking raw CSS violations with shared regex rules module, 27 unit tests, and fire-and-forget violation reporting**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-03T14:18:30Z
- **Completed:** 2026-04-03T14:28:30Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created shared design-rules.ts module with 3 CRITICAL_PATTERNS (no-raw-hex, no-raw-color-fn, no-inline-style) and 1 WARNING_PATTERN (hex-outside-tokens)
- Built PreToolUse hook that blocks .tsx/.css file writes containing raw CSS values (exit 2)
- Built PostToolUse hook that warns on design system non-compliance via hookSpecificOutput.additionalContext
- Registered both hooks in .claude/settings.json with Write|Edit|MultiEdit matcher
- 27 unit tests verifying all regex pattern matching and skip behavior

## Task Commits

Each task was committed atomically:

1. **Task 1: Design rules module, violation reporter, manifest.json, and unit tests** - `0364e64` (test: RED), `1b08330` (feat: GREEN)
2. **Task 2: PreToolUse/PostToolUse hooks and settings.json registration** - `d07bbc5` (feat)

## Files Created/Modified
- `packages/hooks/src/utils/design-rules.ts` - Shared CRITICAL_PATTERNS, WARNING_PATTERNS, VALIDATED_EXTENSIONS, SKIP_PATTERNS
- `packages/hooks/src/utils/violation-reporter.ts` - Fire-and-forget POST to backend /api/validation/violations
- `packages/hooks/src/afw-design-validate-pre.ts` - PreToolUse hook: blocks raw hex/rgb/inline-style (exit 2)
- `packages/hooks/src/afw-design-validate-post.ts` - PostToolUse hook: warns via hookSpecificOutput.additionalContext
- `packages/hooks/src/__tests__/design-rules.test.ts` - 27 unit tests for all regex patterns
- `packages/hooks/vitest.config.ts` - Vitest configuration for hooks package
- `packages/hooks/package.json` - Added vitest devDependency and test script
- `.claude/settings.json` - Registered PreToolUse and PostToolUse design validation hooks

## Decisions Made
- Moderate rule strictness per D-03: CSS property context hex/rgb is blocked, quoted hex strings elsewhere are warned
- Defense-in-depth: PostToolUse also checks CRITICAL_PATTERNS at warning level as second layer
- Silent failure mode: all uncaught hook errors exit 0 to never interfere with agent workflow
- manifest.json already existed from Phase 3 (03-04-PLAN.md) -- verified present and valid, no duplicate creation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Design validation hooks are live and enforcing on all Write/Edit/MultiEdit tool calls
- Ready for 08-02 (violation dashboard UI) which consumes violation events from the backend
- Ready for 08-03 (/btw signaling) which builds on the hook infrastructure
- Ready for 08-04 (approval gates) which adds human-in-the-loop to the validation pipeline

## Self-Check: PASSED

All 8 created/modified files verified present. All 3 commit hashes verified in git log.

---
*Phase: 08-neural-validation-safety*
*Completed: 2026-04-03*
