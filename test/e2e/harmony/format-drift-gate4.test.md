# E2E Test: Format Drift at Gate 4

## Scenario
Chain Compilation Table output missing required columns.

## Setup
- Orchestrator outputs Format 1.1 with only 4 columns (missing 'Inputs', 'Waits For')
- Backend parses at Gate 4 checkpoint

## Expected Detection
- Result: DEGRADED
- Violation: "Missing columns: 'Inputs', 'Waits For'"
- Health score drops to 87/100

## Expected Presentation
- HarmonyViolationEvent broadcast
- Harmony Workbench shows DEGRADED status
- "Fix Now" button available

## Expected Healing (when triggered)
- Flow: parser-update/
- Action: Update parseChainCompilation() to accept 4 or 6 column formats
- Backward compatible

## Verification
- Health score returns to 100/100
- No new violations for same pattern
- Terrain stabilizes
