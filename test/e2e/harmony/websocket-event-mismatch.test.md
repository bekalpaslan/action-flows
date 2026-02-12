# E2E Test: WebSocket Event Name Mismatch

## Scenario
Backend emits event with name frontend doesn't recognize.

## Setup
- Backend emits "chain:gate_checkpoint"
- Frontend expects "chain:gate_updated"
- Events not reaching UI

## Expected Detection
- Result: CRITICAL
- Health score: 45/100
- Pattern: "Event name mismatch, frontend receiving 0 events"

## Expected Presentation
- CRITICAL status in Harmony Workbench
- Immediate attention required
- Healing flow: harmony-audit-and-fix/

## Expected Healing (when triggered)
- Analyze: Identify naming convention (backend uses underscore, frontend uses camelCase)
- Fix: Align event names (choose one convention)
- Review: Verify events flow correctly

## Verification
- Real-time updates working
- Health score: 100/100
- No dropped events
