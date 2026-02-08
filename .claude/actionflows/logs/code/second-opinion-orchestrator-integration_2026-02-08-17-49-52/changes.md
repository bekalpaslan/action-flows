# Code Changes: Second Opinion Orchestrator Integration

## Files Created

| File | Purpose |
|------|---------|
| `.claude/actionflows/actions/second-opinion/agent.md` | Agent definition for second-opinion action |
| `.claude/actionflows/actions/second-opinion/instructions.md` | Action metadata and inputs specification (includes codePackage field) |

## Files Modified

| File | Change |
|------|--------|
| `.claude/actionflows/ORCHESTRATOR.md` | Added Rule 7a "Second Opinion Protocol" after Rule 7, defining auto-trigger rules, step insertion logic, spawning pattern, dual output presentation, and suppression mechanism |
| `.claude/actionflows/ACTIONS.md` | Added "Code-Backed Actions" section (new category for actions backed by packages/), added "Post-Action Steps" section (trigger rules table), added second-opinion to Model Selection Guidelines |
| `.claude/actionflows/FLOWS.md` | Updated 3 flow chains: action-creation/ (added second-opinion/), code-and-review/ (added second-opinion/), audit-and-fix/ (added second-opinion/) |

## Verification

- Type check: PASS (pnpm type-check successful)
- Notes: No TypeScript changes needed -- framework integration is pure markdown documentation updates
- review/ and audit/ output paths verified to be consumable (deterministic log folders)

## Implementation Details

### Key Design Points

1. **Code-Backed Actions Category:** Created a new section in ACTIONS.md to distinguish actions with real package dependencies from pure-instruction actions. This clarifies that second-opinion/ wraps packages/second-opinion/ rather than implementing logic directly in Claude.

2. **Auto-Trigger Rules:** Defined in ORCHESTRATOR.md Rule 7a. Second opinion is always inserted after review/ and audit/, opt-in for analyze/ and plan/, never for code/test/commit/.

3. **Non-Blocking Pattern:** The critical rule is that subsequent steps (e.g., commit) wait for the ORIGINAL action, NOT the second-opinion step. This ensures critiques are informational and never delay workflow.

4. **Graceful Degradation:** Second opinion agent reports SKIPPED for any failure (Ollama unavailable, timeout, etc.), never fails the chain.

5. **Dual Output Presentation:** ORCHESTRATOR.md now includes templates for presenting both original and critique outputs together in a unified format.

6. **Suppression Mechanism:** Human can say "skip second opinions" when approving a chain to remove auto-triggered second-opinion steps.

### Package Integration

The second-opinion/ action is a lightweight wrapper around packages/second-opinion/src/cli.ts. The agent:
- Runs CLI via `npx tsx`
- Reads CLI output markdown
- Formats completion message with key findings
- Never modifies original agent's output

### Flow Updates

Updated flows where second opinion adds value:
- **action-creation/**: Review framework code with second opinion
- **code-and-review/**: Review implementation code with second opinion
- **audit-and-fix/**: Double-check audit findings with second opinion

Did NOT update:
- flow-creation/, action-deletion/, doc-reorganization/ (less critical)
- bug-triage/ (test step provides verification)
- post-completion/ (no review step to critique)

The orchestrator still auto-inserts for ad-hoc chains containing review/ or audit/ steps.

## Next Steps

The orchestrator now has complete instructions for:
1. When to insert second-opinion/ steps
2. How to spawn the agent with correct inputs
3. How to present dual outputs
4. How to handle suppression requests

The framework is ready for the orchestrator to use second-opinion/ in compiled chains.
