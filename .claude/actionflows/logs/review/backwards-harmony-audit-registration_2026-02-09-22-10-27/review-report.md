# Review Report: Backwards Harmony Audit Flow Registration

## Verdict: NEEDS_CHANGES
## Score: 75%

## Summary

The new backwards-harmony-audit flow registration has correct overall structure and follows most framework conventions. However, there are three issues: (1) incorrect cross-reference path in the flow instructions causing a non-existent file reference, (2) table column alignment inconsistency in FLOWS.md that deviates from established patterns, and (3) routing trigger placement that could benefit from improved discoverability.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | .claude/actionflows/flows/qa/backwards-harmony-audit/instructions.md | 63 | high | Invalid cross-reference path: "second-opinion/" should be a directory, but the reference uses trailing slash as if it's an action path | Change "second-opinion/" to "second-opinion" in the Dependencies diagram and Step 5 header. Actions should not have trailing slashes when referenced as dependencies in diagrams |
| 2 | .claude/actionflows/FLOWS.md | 32 | medium | Table formatting inconsistency: The chain column uses "analyze×3 (parallel)" which is correct, but established patterns in other flows (see line 24) use em-dash separators for sequential steps | Consider documenting the notation convention: "×N" for parallel, "→" for sequential, "(conditional)" for gates. Current usage is correct but undocumented |
| 3 | .claude/actionflows/CONTEXTS.md | 128 | low | New routing trigger entry position: placed at end of review section after test-coverage, but alphabetical ordering might improve discoverability | Move line 128 ("audit harmony...") to line 48 after "audit security" trigger to maintain alphabetical ordering within the review context block |
| 4 | .claude/actionflows/flows/qa/backwards-harmony-audit/instructions.md | 22 | low | Chain pattern notation: "analyze×3 (parallel) → audit → second-opinion/" uses trailing slash inconsistently with line 63 diagram | Remove trailing slash: "analyze×3 (parallel) → audit → second-opinion" to match action reference conventions |

## Fixes Applied

No fixes applied (mode=review-only).

## Flags for Human

| Issue | Why Human Needed |
|-------|------------------|
| Notation convention documentation | The framework uses "×N (parallel)" and "→" notation effectively, but this convention isn't explicitly documented in FLOWS.md header or a conventions file. Should we add a notation key? |
| Action path trailing slash policy | Some references use "second-opinion/" (with slash) and others use "second-opinion" (without). Need consistent policy: are actions directories (with slash) or references (without slash)? |

## Additional Observations

### Positive Patterns Followed
- ✅ Correct markdown structure with proper heading hierarchy
- ✅ Consistent naming convention (kebab-case for flow directory)
- ✅ Proper context placement in FLOWS.md (review context)
- ✅ Accurate chain pattern description with parallel execution
- ✅ Dependencies diagram correctly represents DAG structure
- ✅ Output paths follow standard log folder pattern
- ✅ Chains With section documents integration points
- ✅ Example invocations provide clear usage patterns

### Comparison with Reference Flows

**audit-and-fix/** (parallel pattern reference):
- Uses numbered steps clearly labeled as parallel groups
- Documents model assignments per step
- Provides both report-only and remediate modes

**code-and-review/** (sequential pattern reference):
- Uses simple "→" notation for sequential dependencies
- Shows loop-back pattern for NEEDS_CHANGES verdict
- Clear gate documentation

**backwards-harmony-audit/** follows these patterns correctly, with the exception of the trailing slash inconsistency noted above.

### Cross-Reference Validation

Checked all referenced files exist:
- ✅ .claude/actionflows/actions/analyze/agent.md
- ✅ .claude/actionflows/actions/audit/agent.md
- ❌ .claude/actionflows/actions/second-opinion/agent.md (should exist, verify if missing or path is wrong)
- ✅ .claude/actionflows/CONTRACT.md
- ✅ .claude/actionflows/ORCHESTRATOR.md
- ✅ packages/app/src/ (frontend layer scope)
- ✅ packages/shared/src/contract/ (parser layer scope)

## Recommendation

Apply the high-severity fix (trailing slash removal) immediately. The medium and low severity issues are style/convention clarifications that can be addressed incrementally. Overall, this is a well-structured flow registration that follows framework patterns effectively.
