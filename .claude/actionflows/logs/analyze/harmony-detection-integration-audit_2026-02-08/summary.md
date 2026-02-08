# Harmony Detection Integration Audit — Summary

**Date:** 2026-02-08
**Agent:** analyze/
**Full Report:** `./report.md`

---

## Executive Summary

Comprehensive audit of existing pattern detection infrastructure, contract parsers, and frontend architecture to inform harmony detection service design. The harmony detection service will monitor orchestrator output compliance with CONTRACT.md by leveraging the existing contract parser system.

---

## Key Findings

### Infrastructure Status

✅ **Contract Parsers:** Fully implemented, production-ready
- All 17 formats have parsers
- Master parser `parseOrchestratorOutput()` complete
- Type guards for runtime validation
- Version system in place

✅ **Backend Architecture:** Ready for new service
- Service pattern established (PatternAnalyzer, FrequencyTracker)
- Storage layer flexible (Memory + Redis)
- WebSocket broadcasting proven
- Route pattern consistent

✅ **Frontend Patterns:** Hook-based and composable
- Data fetching hook pattern common
- WebSocket subscription hooks exist
- Component composition standard

⚠️ **Gaps Identified:**
- No HarmonyDetector service
- No harmony storage methods
- No harmony event types
- No harmony API endpoints
- No frontend harmony components

---

## Integration Points

### 1. Contract Parser Usage

**Flow:**
```
Orchestrator Output → parseOrchestratorOutput(text)
                             ↓
                      ┌──────┴──────┐
                      ↓             ↓
                 ParsedFormat      null
                      ↓             ↓
              Valid/Degraded    Violation
```

**P0 Parsers (Critical):**
- `parseChainCompilation()` - Chain compilation table
- `parseStepCompletion()` - Step completion announcement

**P1 Parsers (High-Value):**
- `parseReviewReport()` - Review reports
- `parseErrorAnnouncement()` - Error messages

---

### 2. Backend Service Architecture

**New Service:**
- **Location:** `packages/backend/src/services/harmonyDetector.ts`
- **Pattern:** Same as PatternAnalyzer (singleton, storage-backed, WebSocket-aware)
- **Methods:**
  - `checkOutput(text, sessionId, context)` - Validate orchestrator output
  - `getHarmonyMetrics(target)` - Get aggregated metrics
  - `setBroadcastFunction(fn)` - Wire to WebSocket

**Storage Extensions:**
```typescript
interface Storage {
  // Add to existing interface
  addHarmonyCheck(check: HarmonyCheck): void | Promise<void>;
  getHarmonyChecks(target, filter): HarmonyCheck[] | Promise<HarmonyCheck[]>;
  getHarmonyMetrics(target): HarmonyMetrics | Promise<HarmonyMetrics>;
}
```

---

### 3. API Surface

**New Endpoints:**
- `GET /api/harmony/:sessionId` - Session-level metrics
- `GET /api/harmony/project/:projectId` - Project-level metrics
- `POST /api/harmony/:sessionId/check` - Manual validation
- `GET /api/harmony/stats` - Global statistics

**Response Format:**
```typescript
interface HarmonyMetrics {
  totalChecks: number;
  validCount: number;
  degradedCount: number;
  violationCount: number;
  harmonyPercentage: number; // (valid + degraded) / total * 100
  recentViolations: HarmonyCheck[];
  formatBreakdown: Record<string, number>;
  lastCheck: Timestamp;
}
```

---

### 4. Frontend Integration

**Components to Create:**
- `HarmonyBadge` - Display harmony percentage (dashboard header)
- `HarmonyIndicator` - Small inline status (session pane, step nodes)
- `HarmonyPanel` - Full metrics dashboard (registry browser tab)

**Hook to Create:**
- `useHarmonyMetrics(target, targetType)` - Fetch and subscribe to metrics

**Where to Display:**
1. Dashboard header (global harmony %)
2. Session pane (per-session indicator)
3. Chain visualization (real-time warnings)
4. Notifications panel (threshold alerts)
5. Registry browser (harmony tab)

---

## Gap Analysis Summary

### Backend (5 gaps)
1. ❌ HarmonyDetector service
2. ❌ Harmony storage methods
3. ❌ Harmony routes
4. ❌ Harmony event broadcasting
5. ❌ Orchestrator output processing pipeline

### Shared (2 gaps)
1. ❌ Harmony event types (`harmony:check`, `harmony:violation`)
2. ❌ Harmony types (`HarmonyCheck`, `HarmonyMetrics`, `HarmonyFilter`)

### Frontend (3 gaps)
1. ❌ Harmony components (Badge, Panel, Indicator)
2. ❌ Harmony hooks (`useHarmonyMetrics`)
3. ❌ Harmony UI integration (Dashboard, SessionPane, RegistryBrowser)

---

## Implementation Estimate

| Component | LOC | Complexity | Timeline |
|-----------|-----|------------|----------|
| Backend Foundation | ~550 | Medium | 2-3 days |
| API + Storage | ~250 | Low | 1-2 days |
| Frontend Components | ~330 | Medium | 2-3 days |
| Integration + Testing | ~100 | Medium | 1-2 days |
| **Total** | **~1,230** | **Medium** | **6-10 days** |

---

## Recommendations

### Implementation Priority

**Week 1: Backend Foundation**
1. Create HarmonyDetector service
2. Add harmony storage methods (Memory + Redis)
3. Define harmony event types
4. Wire to WebSocket broadcasting

**Week 2: API Surface**
1. Create harmony routes
2. Implement GET/POST endpoints
3. Add API validation

**Week 3: Frontend Components**
1. Create `useHarmonyMetrics()` hook
2. Build HarmonyBadge component
3. Integrate into Dashboard header

**Week 4: Advanced Features**
1. Build HarmonyPanel component
2. Add harmony tab to RegistryBrowser
3. Add violation notifications

---

### Design Decisions

**1. Harmony Percentage Calculation**
```
harmonyPercentage = (validCount + degradedCount) / totalChecks * 100
```
**Rationale:** Degraded parses are partial success (graceful degradation)

**2. Storage Strategy**
- Store last 100 checks per session + aggregated metrics
- Same TTL as events (7 days default)
- Memory/Redis backing

**3. Event Emission**
- Emit on every check (valid, degraded, violation)
- Frontend can filter as needed

**4. Parser Integration**
- Use `parseOrchestratorOutput()` master function
- Return `null` = violation, partial parse = degraded

---

## Next Steps for plan/ Agent

Reference these sections when designing:

1. **Service Architecture:** Section 3.1 - Where to create HarmonyDetector
2. **Storage Schema:** Section 3.2 - HarmonyCheck, HarmonyMetrics, HarmonyFilter types
3. **API Design:** Section 4.2 - Endpoint specifications
4. **Parser Integration:** Section 2.1-2.2 - How to call parsers
5. **Event Types:** Section 6.1.6 - Events to define
6. **Frontend Components:** Section 5.3-5.4 - Component specs and props

---

## Key Files for Reference

**Backend:**
- `packages/backend/src/services/patternAnalyzer.ts` - Service pattern example
- `packages/backend/src/routes/patterns.ts` - Route pattern example
- `packages/backend/src/storage/index.ts` - Storage interface
- `packages/backend/src/index.ts` - Router mounting, broadcast functions

**Shared:**
- `packages/shared/src/contract/parsers/index.ts` - Master parser
- `packages/shared/src/contract/guards.ts` - Type guards
- `packages/shared/src/events.ts` - Event types
- `packages/shared/src/patternTypes.ts` - Pattern types (reference for harmony types)

**Frontend:**
- `packages/app/src/hooks/useProjects.ts` - Data fetching hook pattern
- `packages/app/src/hooks/useWebSocket.ts` - WebSocket subscription pattern
- `packages/app/src/components/Dashboard/` - Dashboard layout

---

**End of Summary**
