# Review Report: Intel Dossier Phase 1 MVP

## Verdict: NEEDS_CHANGES
## Score: 82%

## Summary

The Intel Dossier Phase 1 MVP is largely well-implemented with proper TypeScript types, clean separation of concerns, and good adherence to project patterns. The shared types are well-defined using branded types, backend routes follow Express patterns correctly, storage methods enforce bounds properly, and frontend components are cleanly structured. However, there are 5 critical issues that must be fixed before deployment: API response format mismatch in `useDossiers.ts` that will cause runtime errors, inconsistent HTTP verb usage (PUT vs PATCH), missing validation in `triggerAnalysisSchema`, missing WebSocket broadcast initialization, and missing barrel exports.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | packages/app/src/hooks/useDossiers.ts | 62 | critical | API response format mismatch. Backend returns `{ count, dossiers }` but frontend expects plain array `data` (line 62: `setDossiers(data)`). This will cause `dossiers` to be set to `undefined` and break the UI. | Change line 62 to `setDossiers(data.dossiers || [])` to match backend response structure at `packages/backend/src/routes/dossiers.ts:81-84` |
| 2 | packages/backend/src/routes/dossiers.ts | 124 | high | Inconsistent HTTP verb. Schema comment says `PATCH /api/intel/dossiers/:id` (line 506 in api.ts) but route uses `router.put` instead of `router.patch`. Frontend hook uses PATCH (line 105 of useDossiers.ts). This creates API contract mismatch. | Change line 124 from `router.put('/:id', ...)` to `router.patch('/:id', ...)` to match schema documentation and frontend expectation |
| 3 | packages/backend/src/schemas/api.ts | 524 | medium | Missing body validation in triggerAnalysisSchema. Schema allows empty body `{}` which defaults `force: false`, but POST /api/dossiers/:id/analyze should explicitly validate body or make it optional in validateBody middleware. | Add `.optional()` to the schema or document that empty body is valid: `export const triggerAnalysisSchema = z.object({ force: z.boolean().optional().default(false) }).optional()` |
| 4 | packages/backend/src/index.ts | 270-343 | medium | Missing WebSocket broadcast initialization. `setBroadcastDossierFunction` is called (line 343) but there's no verification that the WebSocket server is initialized. If WS setup fails, dossier events will silently fail to broadcast. | Add conditional check: `if (wss) { setBroadcastDossierFunction(...) }` similar to how terminal and file watcher broadcasts are set up |
| 5 | packages/app/src/components/IntelDossier/index.ts | n/a | low | Missing barrel export file. Directory `packages/app/src/components/IntelDossier/` exists with 7+ component files but no `index.ts` barrel export. This is inconsistent with project patterns (SessionPanel, ChainDAG all have index.ts). | Create `packages/app/src/components/IntelDossier/index.ts` exporting all components: DossierList, DossierCard, DossierView, DossierCreationDialog, WidgetRenderer |
| 6 | packages/shared/src/dossierTypes.ts | 100 | low | Nullable field without null check guidance. `layoutDescriptor: LayoutDescriptor \| null` (line 109) but no comment explaining when it's null vs when it's populated. Frontend checks for null at DossierView.tsx:126 but pattern isn't documented. | Add JSDoc comment: `/** Current widget layout (null if never analyzed, populated after first analysis) */` |
| 7 | packages/backend/src/storage/memory.ts | 544-558 | low | Eviction logic uses `Infinity` comparison but doesn't handle empty Map edge case. If `dossiers.size >= MAX_DOSSIERS` and Map is somehow empty, `oldestId` stays undefined and nothing is evicted, causing silent failure to add new dossier. | Add guard: `if (!oldestId && this.dossiers.size > 0) { throw new Error('Eviction failed') }` before line 556 |
| 8 | packages/app/src/components/IntelDossier/WidgetRenderer.tsx | 31 | low | Missing widget type from WIDGET_REGISTRY. Type assertion at widgets/index.ts:38-43 casts all widgets to `React.ComponentType<WidgetProps>` but doesn't verify prop compatibility. If a widget doesn't accept `data` and `span`, runtime error occurs. | Add runtime validation or TypeScript constraint: `const WidgetComponent = WIDGET_REGISTRY[widget.type] as React.ComponentType<WidgetProps> \| undefined` and check `if (!WidgetComponent) { return <UnknownWidget ... /> }` |

## Fixes Applied

N/A — Review-only mode

## Flags for Human

| Issue | Why Human Needed |
|-------|-----------------|
| Backend route organization | The routes are mounted at `/api/dossiers` and `/api/suggestions` but schema comments reference `/api/intel/dossiers` and `/api/intel/suggestions`. This suggests either (1) routes should be grouped under `/api/intel/*` namespace for consistency, or (2) schema comments are wrong. Decision needed on preferred API structure. |
| Widget suggestion promotion flow | The `POST /api/suggestions/:id/promote` endpoint (suggestions.ts:165) returns placeholder response saying "Phase 1: Promotion acknowledged but not implemented yet". This endpoint should either be removed or clearly marked as `@deprecated` until Phase 2 implementation. Decision needed on whether to keep stub endpoints in MVP. |
| Empty state messaging | DossierView.tsx:128-133 shows "No Analysis Yet" but doesn't explain that clicking "Re-analyze" will trigger Phase 2 agent spawning (not yet implemented). User might click and see no visible change. Decision needed on whether to disable button or show "Coming in Phase 2" tooltip. |

---

## Additional Context

### TypeScript Type-Check Results

Backend and shared packages: ✅ **Pass** (no errors)
Frontend package: ⚠️ **Pre-existing errors** (not related to Intel Dossier feature)

Relevant frontend files all type-check correctly when isolated. The 50+ frontend errors are from unrelated files (ChainDAG, ControlButtons, useAllSessions, etc.) and do not block Intel Dossier deployment.

### Pattern Adherence

**✅ Follows project patterns:**
- Branded types for DossierId and SuggestionId (consistent with SessionId, ChainId)
- Factory functions `createDossierId()` and `createSuggestionId()` matching `brandedTypes` pattern
- Express Router with middleware chain (writeLimiter, validateBody)
- Zod schemas in `backend/src/schemas/api.ts` with exported TypeScript types
- React functional components with TypeScript props interfaces
- Custom hook pattern (useDossiers) with WebSocket subscription
- BEM CSS naming (`.intel-workbench__header`, `.dossier-list__items`)
- Storage interface extension with sync/async Promise.resolve() wrappers

**✅ Good practices observed:**
- Error handling with try/catch in all async operations
- Graceful degradation (empty states, loading states, error states)
- WebSocket event subscription with cleanup (useEffect return)
- Bounds enforcement in storage (MAX_DOSSIERS, MAX_SUGGESTIONS, MAX_DOSSIER_HISTORY)
- FIFO eviction when storage limits exceeded
- Dark theme CSS variables used consistently
- Accessibility: aria-label, semantic HTML, keyboard navigation support

### Security & Performance

**✅ Security:**
- No `any` types used (all properly typed)
- Zod validation on all POST/PUT/PATCH endpoints
- Rate limiting applied via `writeLimiter` middleware
- No SQL injection risk (using Map storage, not DB queries)
- No XSS risk (React auto-escapes, no dangerouslySetInnerHTML)
- Error sanitization via `sanitizeError()` function

**✅ Performance:**
- No N+1 queries (in-memory Map lookups are O(1))
- No unnecessary re-renders (useCallback, proper dependency arrays)
- Bounded data (max 100 dossiers, max 200 suggestions, max 50 history entries)
- Efficient eviction strategies (LRU for dossiers, LFU for suggestions)

### WebSocket Integration

**⚠️ Partial implementation:**
- Backend broadcast events defined: `dossier:created`, `dossier:updated`, `dossier:deleted`, `dossier:analyzing`, `dossier:analyzed`
- Frontend subscription pattern correct (useDossiers.ts:160-174)
- Event filtering uses `event.type.startsWith('dossier:')` which is robust
- **Missing:** Event type definitions in `packages/shared/src/events.ts` (dossier events not yet added to WorkspaceEvent union)
- **Missing:** WebSocket broadcast validation in backend index.ts

### CSS & Styling

**✅ Dark theme consistency:**
- All new CSS files use CSS variables (`--color-bg-primary`, `--color-text-primary`, etc.)
- No hardcoded colors found
- BEM naming convention followed throughout
- Grid layouts use modern CSS Grid (not float hacks)
- Responsive design patterns (no mobile-specific review requested, but patterns are there)

### Component Structure

**✅ Clean separation:**
- IntelWorkbench (container) → DossierList + DossierView (presentational)
- DossierList → DossierCard[] (composition)
- DossierView → WidgetRenderer → Widget components (dynamic rendering)
- Dialog pattern matches CustomPromptDialog (consistency)
- Widget registry pattern allows extensibility

### Testing Gaps

**⚠️ No tests provided:**
- No unit tests for dossier CRUD operations
- No integration tests for WebSocket events
- No component tests for IntelWorkbench/DossierList/DossierView
- Storage eviction logic should have edge case tests
- Widget registry dynamic rendering should have tests

This is acceptable for Phase 1 MVP but should be addressed before Phase 2.

---

## Recommendations

### Must Fix (Before Merge)
1. Fix critical API response format mismatch (Finding #1) ✅
2. Align HTTP verb to PATCH (Finding #2) ✅
3. Add WebSocket broadcast initialization check (Finding #4) ✅

### Should Fix (Before Production)
4. Create IntelDossier barrel export index.ts (Finding #5)
5. Add JSDoc for nullable layoutDescriptor (Finding #6)
6. Add eviction edge case guard (Finding #7)
7. Resolve API route namespace confusion (/api/dossiers vs /api/intel/dossiers)

### Nice to Have (Future)
8. Add unit tests for storage layer
9. Add component tests for UI
10. Document widget creation guide for Phase 2
11. Add TypeScript strict mode compliance check
12. Consider using discriminated union for DossierStatus ('idle' | 'analyzing' | 'error') with error payload

---

## Fresh Eye Discovery

[FRESH EYE] The widget suggestion system is architecturally sound. The pattern of Claude requesting missing widgets via `POST /api/suggestions` and storing them with frequency tracking creates a self-improving system. This is a clever way to discover what widgets users actually need without guessing upfront. The fallback content mechanism ensures graceful degradation when widgets don't exist yet.

[FRESH EYE] The dossier history system (DossierHistoryEntry[]) is well-designed for time-travel debugging. Storing snapshots of layoutDescriptor changes with timestamps and changedFiles allows replaying how the dossier evolved over time. This will be valuable for understanding how Claude's analysis improves across runs.

[FRESH EYE] The bounds enforcement in memory.ts is production-ready. The eviction strategies (oldest-first for dossiers, least-frequent-first for suggestions) are thoughtful and prevent memory leaks in long-running processes. However, consider surfacing eviction events to the UI so users know when old dossiers are auto-deleted.
