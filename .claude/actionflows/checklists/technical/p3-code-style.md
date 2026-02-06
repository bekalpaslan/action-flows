# Code Style Checklist (P3 - Low)

## Purpose

Enforce consistent code style and maintainability conventions. Makes codebase predictable and reduces friction during code review. Enables automated tooling (prettier, eslint) to catch violations.

---

## Checklist

| # | Check | Pass Criteria | Severity |
|---|-------|---------------|----------|
| 1 | File Naming Conventions | Components: PascalCase (SessionPane.tsx). Utilities/hooks: camelCase (useSessionControls.ts). Styles: ComponentName.css co-located. All filenames kebab-case or PascalCase, no snake_case. | **LOW** |
| 2 | Import Ordering | External packages first (React, express). Internal @afw/shared imports next. Relative imports last. Alphabetical within groups. No circular dependencies. | **LOW** |
| 3 | CSS Co-located with Components | ComponentName.tsx paired with ComponentName.css in same directory. No global CSS unless shared utilities. Import statement in component. | **LOW** |
| 4 | Functional Components Only | No class components. All components use hooks (useState, useEffect, custom hooks). Functional expressions or arrow functions. | **LOW** |
| 5 | Hook Naming Convention | Custom hooks prefixed with `use` (useSessionControls, useChainData). Standard hooks (useState, useEffect) named correctly. Hook rules followed (top-level only, conditional logic inside). | **LOW** |
| 6 | Constants Extracted | Magic numbers/strings replaced with named constants. Constants UPPER_CASE. Grouped logically. No inline hardcoded values. | **LOW** |
| 7 | Dead Code Removed | No commented-out code. No unused exports. No unreachable statements. Linter enabled to catch automatically. | **LOW** |
| 8 | Console Logs Removed | No `console.log`, `console.warn`, `console.error` in production code. Logging through proper logger (if configured). Debug logs removed before commit. | **LOW** |
| 9 | Consistent Brace/Quote Style | Single quotes for strings (enforced by prettier). Braces on same line (one-true-brace style). No trailing commas unless in multiline. | **LOW** |
| 10 | Monorepo Build Order | Build scripts respect dependency order (shared → backend → app), tsconfig references configured correctly. Build succeeds without circular dependency errors. | **LOW** |
| 11 | No Trailing Whitespace | Files end with newline. No trailing spaces. Formatting tool (prettier) auto-fixes. | **LOW** |

---

## Notes

Style is subjective, but consistency is objective. Use automated tools (prettier, eslint, husky) to enforce before commit.
