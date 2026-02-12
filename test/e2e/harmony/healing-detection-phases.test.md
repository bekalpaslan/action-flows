# E2E Test: Healing Detection Phases

## Scenario
Validate backend detection behavior across multiple violations.

## Tests

### Single Violation
- **Input:** One format violation
- **Expected:** Recorded, health score decreases slightly

### Pattern Detection
- **Input:** 3 violations of same type in 24h
- **Expected:** Pattern flagged as "critical"

### Drift Pattern Analysis
- **Input:** Similar violations grouped
- **Expected:** Analysis shows root cause pattern

### Threshold Flagging
- **Input:** Violations exceed critical threshold
- **Expected:** Health score < 70, CRITICAL status
