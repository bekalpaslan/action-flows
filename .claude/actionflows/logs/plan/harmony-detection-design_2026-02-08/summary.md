# Harmony Detection System — Design Summary

**Plan Location:** D:/ActionFlowsDashboard/.claude/actionflows/logs/plan/harmony-detection-design_2026-02-08/plan.md

---

## What Was Designed

A complete harmony detection system for monitoring orchestrator output compliance with the CONTRACT.md specification, including:

1. **Backend Service** - HarmonyDetector service that runs contract parsers on all orchestrator output
2. **Storage Extensions** - Harmony check history and aggregated metrics (Memory + Redis)
3. **API Endpoints** - REST endpoints for querying harmony data
4. **WebSocket Events** - Real-time harmony notifications
5. **Frontend Components** - Dashboard badges, panels, and indicators
6. **Frontend Hooks** - Data fetching and real-time updates

---

## Key Architecture Decisions

### 1. Proactive Parsing

Every orchestrator output is parsed immediately using the master `parseOrchestratorOutput()` function:
- **Valid parse** → All fields present, format recognized
- **Degraded parse** → Format recognized but some fields null (graceful degradation)
- **Violation** → No parser matched, format unknown

### 2. Three-Result System

```typescript
type HarmonyResult = 'valid' | 'degraded' | 'violation';
```

- **Valid:** 100% success (all fields extracted)
- **Degraded:** Partial success (format recognized, some fields missing)
- **Violation:** Complete failure (unknown format)

**Harmony Percentage:** `(valid + degraded) / total * 100`

Degraded parses count toward harmony because they enable graceful UI fallback.

### 3. Storage Strategy

**Session-Level:**
- Store last 100 harmony checks per session
- Calculate real-time metrics on demand
- TTL: 7 days (same as events)

**Project-Level:**
- Aggregate checks across all sessions in project
- Store last 200 checks per project
- Enable project-wide harmony tracking

**Implementation:**
- Memory: `Map<SessionId, HarmonyCheck[]>`
- Redis: `afw:harmony:session:{sessionId}` (list)

### 4. Event Broadcasting

Broadcast events when:
- **Violation occurs** → Always broadcast `harmony:violation` event
- **Significant change** → Broadcast when harmony % changes by 5+ points
- **Metrics update** → Broadcast `harmony:metrics-updated` event

This reduces WebSocket traffic while maintaining real-time awareness.

### 5. Frontend Integration

**Three Component Levels:**

1. **HarmonyBadge** - Small badge showing percentage with color coding
   - Green: 90-100% (excellent)
   - Yellow: 75-89% (good)
   - Orange: 50-74% (degraded)
   - Red: 0-49% (critical)

2. **HarmonyIndicator** - Inline icon for session headers, step nodes
   - ✓ Valid (green circle)
   - ⚠ Degraded (yellow circle)
   - ✗ Violation (red circle)

3. **HarmonyPanel** - Full metrics dashboard
   - Overview metrics
   - Format breakdown table
   - Recent violations with expandable details
   - Refresh controls

---

## API Surface

### GET /api/harmony/:sessionId

Get harmony metrics for a specific session.

**Query Parameters:**
- `since` - Filter checks after timestamp
- `result` - Filter by result type (valid/degraded/violation)
- `formatType` - Filter by format name
- `limit` - Maximum number of checks to return

**Response:**
```json
{
  "sessionId": "sess_abc123",
  "metrics": {
    "totalChecks": 50,
    "validCount": 42,
    "degradedCount": 5,
    "violationCount": 3,
    "harmonyPercentage": 94.0,
    "recentViolations": [...],
    "formatBreakdown": {
      "ChainCompilation": 10,
      "StepCompletion": 35,
      "DualOutput": 5
    },
    "lastCheck": "2026-02-08T22:00:00Z"
  },
  "recentChecks": [...]
}
```

### GET /api/harmony/project/:projectId

Get harmony metrics for all sessions in a project.

**Response:** Same structure as session endpoint, but aggregated.

### POST /api/harmony/:sessionId/check

Manually trigger harmony check (for testing/debugging).

**Request Body:**
```json
{
  "text": "## Chain: Feature Implementation\n...",
  "context": {
    "stepNumber": 2,
    "chainId": "chain_xyz",
    "actionType": "code/"
  }
}
```

**Response:**
```json
{
  "check": { ... },
  "parsed": "ChainCompilation",
  "result": "valid"
}
```

---

## WebSocket Events

### harmony:check

Emitted after every harmony check (throttled by significant change threshold).

```typescript
{
  type: 'harmony:check',
  sessionId: 'sess_abc123',
  checkId: 'hc_1234567890_abcdef',
  result: 'valid' | 'degraded' | 'violation',
  parsedFormat: 'ChainCompilation' | null,
  text: 'Truncated output...',
  missingFields: ['title'] | null,
  context: { stepNumber: 2, chainId: 'chain_xyz' }
}
```

### harmony:violation

Emitted immediately when parsing fails.

```typescript
{
  type: 'harmony:violation',
  sessionId: 'sess_abc123',
  checkId: 'hc_1234567890_abcdef',
  text: 'Raw text that failed to parse',
  timestamp: '2026-02-08T22:00:00Z',
  context: { stepNumber: 2 }
}
```

### harmony:metrics-updated

Emitted when harmony percentage changes significantly (5+ points).

```typescript
{
  type: 'harmony:metrics-updated',
  sessionId: 'sess_abc123',
  harmonyPercentage: 87.5,
  totalChecks: 50,
  violationCount: 3
}
```

---

## Integration Points

### Backend: Where to Call Harmony Detection

**Recommended Location:** Wherever orchestrator output is received (WebSocket handler, hook processor, etc.)

```typescript
// In backend/src/index.ts or orchestrator output processor

async function processOrchestratorOutput(
  text: string,
  sessionId: SessionId,
  context?: { stepNumber?: number; chainId?: string }
) {
  // Run harmony detection
  const harmonyResult = await harmonyDetector.checkOutput(text, sessionId, context);

  // Continue with normal processing
  // ...
}
```

### Frontend: Where to Display Harmony Status

**1. Dashboard Header (Global Harmony Badge)**
- Location: `packages/app/src/components/AppContent.tsx`
- Component: `<HarmonyBadge percentage={85} showLabel />`
- Click handler: Opens HarmonyPanel

**2. Session Pane (Per-Session Indicator)**
- Location: `packages/app/src/components/SessionPane/SessionPane.tsx`
- Component: `<HarmonyIndicator status="valid" />`
- Tooltip: Explains current harmony status

**3. Harmony Panel (Full Metrics)**
- Location: New tab or expandable section in dashboard
- Component: `<HarmonyPanel target={sessionId} targetType="session" />`
- Shows: Metrics, format breakdown, recent violations

---

## File Manifest

### Files to Create (13 new files)

**Shared Package (1 file):**
- `packages/shared/src/harmonyTypes.ts` - Harmony types and interfaces

**Backend Package (2 files):**
- `packages/backend/src/services/harmonyDetector.ts` - Harmony detection service
- `packages/backend/src/routes/harmony.ts` - API endpoints

**Frontend Package (10 files):**
- `packages/app/src/hooks/useHarmonyMetrics.ts` - Data fetching hook
- `packages/app/src/components/HarmonyBadge/HarmonyBadge.tsx` - Badge component
- `packages/app/src/components/HarmonyBadge/HarmonyBadge.css` - Badge styles
- `packages/app/src/components/HarmonyPanel/HarmonyPanel.tsx` - Panel component
- `packages/app/src/components/HarmonyPanel/HarmonyPanel.css` - Panel styles
- `packages/app/src/components/HarmonyIndicator/HarmonyIndicator.tsx` - Indicator component
- `packages/app/src/components/HarmonyIndicator/HarmonyIndicator.css` - Indicator styles

### Files to Modify (7 existing files)

**Shared Package (2 files):**
- `packages/shared/src/events.ts` - Add 3 harmony event types
- `packages/shared/src/index.ts` - Export harmony types

**Backend Package (4 files):**
- `packages/backend/src/storage/index.ts` - Add harmony methods to Storage interface
- `packages/backend/src/storage/memory.ts` - Implement memory storage methods
- `packages/backend/src/storage/redis.ts` - Implement Redis storage methods
- `packages/backend/src/index.ts` - Initialize harmony detector, add router, add broadcast

**Frontend Package (1 file):**
- `packages/app/src/components/AppContent.tsx` - Add HarmonyBadge to header

---

## Implementation Phases

### Phase 1: Backend Foundation (Day 1-2)
- Create harmony types
- Create HarmonyDetector service
- Extend Storage interface
- Implement memory/Redis storage
- Add harmony events

### Phase 2: API Surface (Day 3)
- Create harmony router
- Implement REST endpoints
- Wire WebSocket broadcasting
- Initialize service in index.ts

### Phase 3: Frontend Components (Day 4-5)
- Create useHarmonyMetrics hook
- Create HarmonyBadge component
- Create HarmonyIndicator component
- Create HarmonyPanel component

### Phase 4: Dashboard Integration (Day 6)
- Add badge to dashboard header
- Add indicator to session pane
- Add panel as expandable section
- Wire up event handlers

### Phase 5: Testing & Polish (Day 7)
- Unit tests for service
- Integration tests for API
- E2E tests for UI
- Performance optimization

---

## Success Criteria

**Must Have (P0):**
- ✅ HarmonyDetector parses orchestrator output correctly
- ✅ Storage persists harmony checks and metrics
- ✅ API endpoints return harmony data
- ✅ WebSocket events broadcast harmony changes
- ✅ HarmonyBadge displays in dashboard
- ✅ Violations are visible in UI

**Should Have (P1):**
- HarmonyPanel shows detailed metrics
- Format breakdown is accurate
- Harmony percentage calculation is correct

**Nice to Have (P2):**
- Global harmony stats endpoint
- Harmony threshold alerts (Slack)
- 7-day trend visualization
- Contract version mismatch warnings

---

## Performance Targets

**Parsing:**
- Average: 2ms per check
- Worst case: 8ms (all parsers fail)
- Strategy: Early return on first match

**Storage:**
- Memory: 100 checks/session (bounded)
- Redis: LPUSH + LTRIM for bounded lists
- TTL: 7 days (same as events)

**WebSocket:**
- Broadcast only on violations or 5%+ change
- Reduces traffic while maintaining real-time awareness

**Frontend:**
- Lazy load HarmonyPanel
- Debounce metrics refresh (1 second)
- Use React.memo for HarmonyBadge

---

## Key Insights from Audit

From the integration audit report:

1. **Contract parsers are production-ready** - All 17 formats have parsers implemented
2. **Storage layer supports new methods** - Both memory and Redis backends are flexible
3. **WebSocket infrastructure is proven** - Existing broadcast pattern works well
4. **Pattern detection is orthogonal** - PatternAnalyzer detects usage patterns (human behavior), HarmonyDetector detects format compliance (orchestrator output)
5. **Frontend is hook-based and composable** - Easy to add new data fetching hooks

---

## Related Documents

- **Integration Audit:** `.claude/actionflows/logs/analyze/harmony-detection-integration-audit_2026-02-08/report.md`
- **Contract Design:** `.claude/actionflows/logs/plan/orchestrator-contract-design_2026-02-08-21-35-00/summary.md`
- **Ideation Summary:** `.claude/actionflows/logs/ideation/framework-harmony-system_2026-02-08-21-10-43/summary.md`
- **Contract Parsers:** `packages/shared/src/contract/parsers/index.ts`
- **Contract Version:** `packages/shared/src/contract/version.ts`

---

## Next Steps

For **code/ agent**:

1. Start with Phase 1 (Backend Foundation)
2. Create harmony types and service
3. Extend storage layer
4. Test backend in isolation before moving to API
5. Follow the file manifest exactly

For **review/ agent**:

1. Verify harmony detection logic is correct
2. Check storage implementation (memory + Redis)
3. Validate API endpoint design
4. Review component structure and styling
5. Ensure WebSocket events follow existing patterns

---

**End of Summary**
