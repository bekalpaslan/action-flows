# E2E Test: Human Decision Gate

## Scenario
Validate human decision options in Harmony Workbench.

## Tests

### Fix Now Button
- **Action:** Click "Fix Now"
- **Expected:** Healing chain compiled, presented for approval

### Investigate Button
- **Action:** Click "Investigate"
- **Expected:** Gate logs opened, detailed violation info shown

### Ignore Button
- **Action:** Click "Ignore"
- **Expected:** Violation dismissed, no healing triggered
- **Note:** Health score remains affected until manually addressed

### Multiple Violations
- **Action:** Select multiple, click "Fix All"
- **Expected:** Batch healing chain compiled
