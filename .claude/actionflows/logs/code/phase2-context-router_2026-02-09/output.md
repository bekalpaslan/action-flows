# Phase 2: Context Router Implementation

**Date:** 2026-02-09
**Agent:** code/
**Task:** Create context routing algorithm for Context-Native Routing

## Summary

Created `packages/backend/src/routing/contextRouter.ts` implementing the core routing algorithm that matches user requests to workbench contexts based on trigger keyword matching.

## Implementation Details

### Module Structure

The module exports four main functions:

1. **`extractKeywords(request: string): string[]`**
   - Extracts meaningful keywords from user requests
   - Filters out stop words (common English words like "the", "and", "is")
   - Filters out short words (<= 2 characters)
   - Returns lowercase keywords for matching

2. **`calculateMatchScore(keywords: string[], contextTriggers: string[]): { score: number; matchedTriggers: string[] }`**
   - Scores each trigger phrase by counting how many trigger words appear in the keywords
   - Uses a refined best-match algorithm:
     - `score = bestMatchRatio * 0.7 + (matchedTriggersCount / totalTriggers) * 0.3`
   - This heavily weights the best single trigger match while also considering breadth
   - Returns normalized score (0.0-1.0) and list of matched trigger phrases

3. **`routeRequest(request: string): RoutingResult`**
   - Main routing function implementing the full algorithm
   - Extracts keywords → scores all routable contexts → applies thresholds → returns result
   - Confidence thresholds:
     - `>= 0.9`: Automatic routing (high confidence)
     - `>= 0.5`: Include in disambiguation options
     - `< 0.5`: Fallback to top match or 'work' default
   - Returns `RoutingResult` with:
     - `selectedContext`: The chosen workbench (or null if disambiguation needed)
     - `confidence`: The confidence score
     - `alternativeContexts`: Top 2-3 alternatives
     - `triggerMatches`: Which trigger phrases matched
     - `requiresDisambiguation`: Whether user input is needed

4. **`USE_CONTEXT_ROUTING`**
   - Feature flag constant, default `false`
   - Allows consumers to check if routing is enabled

### Algorithm Flow

```
User Request → Keyword Extraction → Context Scoring → Confidence Check → Selection or Disambiguation
```

**Example:**
- Request: "fix the login bug"
- Keywords: ["fix", "login", "bug"]
- Top match: `maintenance` (triggers: "fix bug", "debug", "repair")
- Best trigger: "fix bug" (100% match: 2/2 words)
- Score: ~0.7-0.8 (high but not auto-route)
- Result: May require disambiguation if other contexts also score well

### Scoring Refinement

The design doc's naive approach (average all trigger match ratios) produced very low scores because most triggers don't match. The refined algorithm:
- Uses the **best single trigger match** as the primary signal (70% weight)
- Uses the **number of matched triggers** as secondary breadth signal (30% weight)
- This ensures "fix the login bug" against maintenance's "fix bug" trigger produces a strong score

### Type Safety

- Imports types from `@afw/shared` package
- Pure module with no side effects
- No Express dependencies (routing logic is decoupled)
- All functions exported for testability

## Files Created

- `packages/backend/src/routing/contextRouter.ts` (267 lines)

## Verification

✅ TypeScript compilation passes (`pnpm type-check`)
✅ No linting errors
✅ Pure module with proper ES module imports

## Next Steps

- Phase 3: Create unit tests for the routing algorithm
- Phase 4: Create API endpoint that uses `routeRequest()`
- Phase 5: Integrate with orchestrator session creation
