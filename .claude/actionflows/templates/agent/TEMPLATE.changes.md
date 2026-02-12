# Code Changes Template

**Purpose:** Used by `code/` action agents to document implementation results
**Contract Reference:** None (free-form documentation)
**Parser:** None (displayed as markdown in dashboard)
**Producer:** See `.claude/actionflows/actions/code/agent.md`

---

## Required Sections

These sections MUST be present in every changes report:

1. **Title** (H1) — Describes what was implemented
2. **Metadata Header** — Completion Date, Timestamp, Status
3. **Summary** — 1-2 paragraph description of changes
4. **Files Modified** — List of changed files

---

## Optional Sections

These sections are commonly used but not required:

- **Implementation Details** — Detailed breakdown per component/module
- **Verification** — TypeScript check, test results
- **Impact Analysis** — Scope, risk, backward compatibility
- **Learnings** — Issue/Root Cause/Suggestion pattern

---

## Template Structure

```markdown
# {Title} Implementation

**Completion Date:** {YYYY-MM-DD}
**Timestamp:** {YYYY-MM-DD-HH-MM-SS}
**Status:** {COMPLETE | PARTIAL | FAILED}

---

## Summary

{1-2 paragraph summary of changes made}

---

## Files Modified

1. `{path}` — {description}
2. `{path}` — {description}
3. `{path}` — {description}

---

## Implementation Details

### {Section Title}

**File:** `{path}`

**Changes:**
- {Change 1}
- {Change 2}
- {Change 3}

**Rationale:**
{Why these changes were made}

---

## Verification

✅ TypeScript type-checking: PASS
✅ {Other verification steps}
❌ {Failed verification with explanation}

**Type-check command:**
```bash
pnpm type-check
```

**Output:**
```
{Relevant output}
```

---

## Impact Analysis

**Scope:** {frontend | backend | shared | multiple}
**Risk:** {Low | Medium | High}
**Backward Compatibility:** {100% | Partial | Breaking}

**Affected Areas:**
- {Area 1}
- {Area 2}

**Breaking Changes:**
- {Change 1 with migration path}

---

## Learnings

**Issue:** {Description}

**Root Cause:** {Analysis}

**Suggestion:** {Fix}
```

---

## Field Descriptions

### Metadata Header

- **Completion Date:** Date in YYYY-MM-DD format
- **Timestamp:** Full datetime in YYYY-MM-DD-HH-MM-SS format (matches log folder name)
- **Status:** Enum (`COMPLETE` | `PARTIAL` | `FAILED`)
  - `COMPLETE` — All requested changes implemented and verified
  - `PARTIAL` — Some changes implemented, remaining work documented in Learnings
  - `FAILED` — Implementation blocked, reason documented in Learnings

### Summary

- 1-2 paragraphs describing what was implemented
- High-level overview, not line-by-line changes
- Should answer: "What problem does this solve?" and "How was it solved?"

### Files Modified

- Numbered list of all changed files
- Include relative path from project root
- Brief description of change type (e.g., "Added auth middleware", "Refactored error handling")
- Include both new files and modified files

### Implementation Details

- Optional but recommended for complex changes
- Group changes by component, module, or logical unit
- Include **File**, **Changes** (bullet list), and optional **Rationale** subsections
- Use code snippets sparingly (only for key additions)

### Verification

- Document TypeScript type-check results
- Include test execution if applicable
- List manual verification steps performed
- Use ✅ for passed checks, ❌ for failed checks
- If checks failed, explain why and what needs to be fixed

### Impact Analysis

- **Scope:** Which packages/areas affected
- **Risk:** Assessment of deployment risk
- **Backward Compatibility:** Whether existing code continues to work
- **Affected Areas:** List of features/modules impacted
- **Breaking Changes:** Document any breaking changes with migration paths

### Learnings

- Optional section at the end
- Use the standard Issue/Root Cause/Suggestion pattern
- **Critical for PARTIAL or FAILED status:** Document remaining work or blockers
- Include `[FRESH EYE]` insights if discovered during implementation

---

## Status-Specific Guidelines

### COMPLETE Status

- All requested changes implemented
- All verification checks passed
- No remaining work (or only trivial follow-ups)
- Learnings section can be "None — execution proceeded as expected."

### PARTIAL Status

- Some changes implemented successfully
- Some work blocked or deferred
- **MUST document remaining work in Learnings section** (not "Next Steps")
- **MUST explain what's missing and why**
- Example: "Contract format parser created (33%) but Zod schema and frontend integration pending"

### FAILED Status

- Implementation blocked or could not be completed
- **MUST document blocker in Learnings section**
- **MUST explain what was attempted and why it failed**
- Example: "Cannot implement feature X because dependency Y is missing"

---

## Example

```markdown
# Accessibility ARIA Labels Implementation

**Completion Date:** 2026-02-13
**Timestamp:** 2026-02-13-14-30-45
**Status:** COMPLETE

---

## Summary

Added ARIA labels to all interactive components in the frontend (ReactFlow nodes, control panel buttons, input fields) to improve screen reader accessibility. All labels follow WCAG 2.1 Level AA standards and provide meaningful descriptions of component purpose and state.

---

## Files Modified

1. `packages/app/src/components/ReactFlowCanvas.tsx` — Added aria-label to all node types
2. `packages/app/src/components/ControlPanel.tsx` — Added aria-labels to buttons and controls
3. `packages/app/src/components/ChatPanel.tsx` — Added aria-label to input field and send button
4. `packages/app/src/components/LogPanel.tsx` — Added aria-label to log entries and filters

---

## Implementation Details

### ReactFlow Nodes

**File:** `packages/app/src/components/ReactFlowCanvas.tsx`

**Changes:**
- Added `aria-label` prop to all node components (ActionNode, ChainNode, SessionNode)
- Labels describe node type and current state (e.g., "Action node: analyze, status: completed")
- Used template literals to construct dynamic labels based on node data

**Rationale:**
Screen readers need to announce node purpose and state when users navigate the flow visualization.

### Control Panel Buttons

**File:** `packages/app/src/components/ControlPanel.tsx`

**Changes:**
- Added `aria-label` to pause, resume, cancel, skip buttons
- Labels describe button action (e.g., "Pause execution", "Resume execution")
- Disabled buttons include state in label (e.g., "Pause execution (disabled)")

---

## Verification

✅ TypeScript type-checking: PASS
✅ All ARIA attributes are valid HTML attributes
✅ No breaking changes to component interfaces
✅ No visual appearance changes

**Type-check command:**
```bash
pnpm type-check
```

**Output:**
```
All packages passed type-checking with 0 errors
```

---

## Impact Analysis

**Scope:** frontend
**Risk:** Low
**Backward Compatibility:** 100%

**Affected Areas:**
- ReactFlow canvas (node interaction)
- Control panel (button interaction)
- Chat panel (input field interaction)
- Log panel (log entry navigation)

**Breaking Changes:**
None — all changes are additive (aria-label props)

---

## Learnings

**Issue:** None — execution proceeded as expected.

**Root Cause:** N/A

**Suggestion:** N/A

**[FRESH EYE]** Consider adding aria-live regions for dynamic status updates (e.g., chain execution progress).
```

---

## Cross-References

- **Agent Definition:** `.claude/actionflows/actions/code/agent.md`
- **Contract Specification:** N/A (free-form documentation)
- **Frontend Display:** Dashboard displays as markdown (no parsing)
- **Related Templates:** `TEMPLATE.report.md`, `TEMPLATE.review-report.md`, `TEMPLATE.test-report.md`
