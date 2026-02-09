# ConfidenceScorer Service Implementation

**Task:** Create ConfidenceScorer service in `packages/backend/src/services/`
**Context:** SRD Section 3.3 Confidence Scoring
**Status:** ✅ Complete

---

## Files Created

### 1. Core Service
**Path:** `packages/backend/src/services/confidenceScorer.ts`

- **Export Constants:**
  - `DEFAULT_WEIGHTS` — frequency (0.4), recency (0.3), consistency (0.3)
  - `CONFIDENCE_THRESHOLDS` — proposal (0.7), autoApply (0.9)
  - `RECENCY_CONFIG` — decayStartDays (7), decayEndDays (90)

- **Export Functions:**
  - `calculateConfidence(frequency, lastSeen, consistency, options?)` → `ConfidenceScore`
    - Weighted sum of normalized frequency, recency, and consistency scores
    - Supports custom weights and frequency thresholds
    - Returns clamped value [0.0, 1.0]
  - `meetsProposalThreshold(score)` → `boolean` — checks score >= 0.7
  - `meetsAutoApplyThreshold(score)` → `boolean` — checks score >= 0.9
  - `calculateConsistency(recentOccurrences, analysisWindowSize)` → `number` — ratio [0.0, 1.0]

- **Implementation Details:**
  - Recency decay: linear drop from full score at 7 days to zero at 90 days
  - Frequency score: capped at 1.0 (count / threshold)
  - All inputs validated and clamped to [0, 1]
  - Uses `@afw/shared` branded types: `ConfidenceScore`, `Timestamp`
  - TypeScript with strict type checking

### 2. Comprehensive Tests
**Path:** `packages/backend/src/__tests__/confidenceScorer.test.ts`

- **19 Test Cases** covering:
  - Basic confidence calculation with recent, high-frequency patterns
  - Recency decay behavior through confidence windows
  - Low frequency pattern handling
  - Custom weight configuration
  - Edge case clamping (negative/overflow values)
  - Threshold validation (proposal and auto-apply)
  - Consistency calculation with various ratios
  - Constants validation
  - Boundary conditions (decay start/end)
  - Default behavior when `now` not provided

- **All tests passing:** ✅ 19/19

---

## Implementation Specification Compliance

| Component | Status | Notes |
|-----------|--------|-------|
| Weights & Thresholds | ✅ | All constants defined per spec |
| `calculateConfidence()` | ✅ | Weighted sum formula implemented correctly |
| Recency decay (7-90 day window) | ✅ | Linear interpolation between bounds |
| Threshold checkers | ✅ | Both proposal (0.7) and autoApply (0.9) |
| `calculateConsistency()` | ✅ | Occurrence ratio with windowing |
| Type Safety | ✅ | Uses `@afw/shared` branded types |
| Error Handling | ✅ | Validates and clamps all values |

---

## TypeScript Verification

```
✅ confidenceScorer.ts: No type errors
✅ confidenceScorer.test.ts: All tests pass (19/19)
```

---

## Integration Points

The service is ready for integration with:
- **Pattern Detection API** — to score detected frequency/sequence patterns
- **Pattern Action Registry** — to determine proposal/auto-apply eligibility
- **Frontend Confidence Display** — to visualize pattern confidence levels
- **Pattern History Storage** — to track confidence scores over time

---

## Export Usage

```typescript
import {
  calculateConfidence,
  meetsProposalThreshold,
  meetsAutoApplyThreshold,
  calculateConsistency,
  DEFAULT_WEIGHTS,
  CONFIDENCE_THRESHOLDS,
  RECENCY_CONFIG,
} from '../services/confidenceScorer.js';
```

---

## Key Design Decisions

1. **Weight Normalization** — Weights are normalized to sum to 1.0, allowing flexible custom configurations
2. **Linear Recency Decay** — Simple linear interpolation from full score to zero over 7-90 day window
3. **Frequency Saturation** — Frequency score caps at 1.0 after 10 occurrences (configurable)
4. **Immutable Constants** — Configuration values exported as constants for deterministic behavior
5. **Pure Functions** — All functions are stateless, enabling parallel scoring operations

---

## Future Enhancement Points

- Configurable frequency thresholds per pattern type
- Non-linear decay curves (exponential, logarithmic)
- Historical score tracking for confidence trend analysis
- Adaptive weight tuning based on user feedback
