# Aggregated Learnings

> Orchestrator reads this to avoid repeating mistakes.

## Foundational: Fix Root Causes, Not Symptoms

When something goes wrong: Stop → Diagnose → Root cause → Fix source → Document here.

## By Action Type

*(Sections added as learnings accumulate)*

## Anti-Patterns

### Indirect References for Required Steps
**Pattern:** "Follow: {path}" without explicit tool names
**Fix:** Inline the required behavior with tool names and parameters

### Orchestrator Doing Project Work
**Pattern:** "No action fits, I'll do it myself"
**Fix:** Compose from existing actions. Use action modes for assess+fix.

## Proven Approaches

### Registry Updates Only
Orchestrator can only add/remove single lines in registry files (INDEX.md, FLOWS.md, ACTIONS.md, LEARNINGS.md). Everything else — including framework file edits — goes through compiled chains.

### Explicit Required Steps
REQUIRED marker + inline tool + inline params + "Do NOT skip" warning.
