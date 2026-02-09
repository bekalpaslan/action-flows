# Code Changes: context-pattern-ui-wiring

## Files Modified
| File | Change |
|------|--------|
| packages/app/src/components/CustomPromptButton/CustomPromptDialog.tsx | Added context patterns textarea input field, implemented parsing logic to convert newline-separated patterns into string array, updated state and submit handler |
| packages/app/src/components/CustomPromptButton/CustomPromptDialog.css | Added `.context-patterns-input` styling for the context patterns textarea (smaller font, increased line height, min-height) |
| packages/app/src/hooks/useCustomPromptButtons.ts | Added `ButtonContext` import, implemented `convertPatternsToContexts()` function with pattern-based context inference, replaced hardcoded `['general']` with actual conversion logic |

## Files Created
| File | Purpose |
|------|---------|
| (none) | All changes were modifications to existing files |

## Implementation Details

### CustomPromptDialog.tsx Changes
1. Added `contextPatterns` state (string)
2. Added textarea input with:
   - Label: "Context Patterns (optional)"
   - Placeholder showing example regex patterns
   - 4 rows height
   - Helper text explaining purpose
3. Updated `handleSubmit` to:
   - Split textarea value by newline
   - Trim each line
   - Filter empty strings
   - Pass resulting array (or undefined if empty) to onSubmit

### CustomPromptDialog.css Changes
Added `.context-patterns-input` class with:
- Smaller font size (12px)
- Increased line height (1.6)
- Minimum height (80px)
- Inherits monospace font family from `.textarea-input`

### useCustomPromptButtons.ts Changes
1. Added `ButtonContext` type import from `@afw/shared`
2. Implemented `convertPatternsToContexts()` function:
   - Takes optional string[] of regex patterns
   - Returns ButtonContext[] array
   - Pattern matching logic:
     - Code files (.ts, .tsx, .js, .jsx, .py, .go, .rs, src/) → 'code-change' + 'file-modification'
     - Error/bug keywords → 'error-message'
     - Analysis/report keywords → 'analysis-report'
     - Documentation (.md, readme, doc) → 'file-modification'
     - No matches → defaults to 'general'
3. Updated button conversion in `fetchCustomPrompts`:
   - Replaced hardcoded `contexts: ['general']` with `contexts: convertPatternsToContexts(def.contextPatterns)`
   - Removed TODO comment

## Verification
- Type check: **PASS** (all packages passed TypeScript validation)
- Notes: None — all changes compile successfully

## Context Pattern Conversion Logic

The conversion function infers ButtonContext values from file path regex patterns using keyword analysis:

**Pattern Analysis:**
- Detects code file extensions and paths → assigns `code-change` and `file-modification` contexts
- Detects error/bug-related keywords → assigns `error-message` context
- Detects analysis/audit keywords → assigns `analysis-report` context
- Detects documentation patterns → assigns `file-modification` context
- Falls back to `general` if no patterns match

**Example conversions:**
- `[".*\\.tsx$", "src/components/.*"]` → `['code-change', 'file-modification']`
- `[".*error.*", ".*\\.log$"]` → `['error-message']`
- `[".*\\.md$", "README.*"]` → `['file-modification']`
- `[]` or `undefined` → `['general']`

This allows users to define context-sensitive custom prompt buttons that appear when working with specific file types or areas of the codebase.
