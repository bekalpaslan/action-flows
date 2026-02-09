# Code Changes: Phase 1 Routing Metadata

**Task:** Implement Phase 1 of Context-Native Routing — Add routing metadata to workbench configs (non-breaking, types only)

**Design Document:** `.claude/actionflows/docs/DESIGN-context-native-routing.md`

---

## Files Modified

| File | Change |
|------|--------|
| `packages/shared/src/workbenchTypes.ts` | Added routing metadata fields to `WorkbenchConfig` interface; populated routing metadata for all 9 workbenches; added `ROUTABLE_WORKBENCHES` constant and `isRoutable()` utility |
| `packages/shared/src/index.ts` | Added exports for routing types and new workbench utilities (`ROUTABLE_WORKBENCHES`, `isRoutable`) |

## Files Created

| File | Purpose |
|------|---------|
| `packages/shared/src/routingTypes.ts` | New routing types: `RoutingResult`, `DisambiguationRequest`, `RoutingDecision` |

---

## Changes Detail

### 1. Enhanced WorkbenchConfig Interface

Added 4 new routing fields to `WorkbenchConfig`:
- `routable: boolean` — Whether orchestrator can route sessions to this context
- `triggers: string[]` — Trigger keywords/phrases that route to this context
- `flows: string[]` — Available flows in this context
- `routingExamples: string[]` — Example user requests for this context

**Non-breaking:** All existing fields remain intact; new fields are required but populated in all configs.

### 2. Populated Routing Metadata for All 9 Workbenches

#### Routable Contexts (6)

**work** (🔨):
- Triggers: `implement`, `build`, `create`, `add feature`, `develop`, `code`, `write`, `generate`, `construct`, `design`
- Flows: `code-and-review/`, `post-completion/`
- Examples: "implement user authentication", "build a dashboard component"

**maintenance** (🔧):
- Triggers: `fix bug`, `resolve issue`, `patch`, `refactor`, `optimize`, `cleanup`, `improve performance`, `technical debt`, `debug`, `repair`
- Flows: `bug-triage/`, `code-and-review/`
- Examples: "fix the login bug", "refactor the session storage"

**explore** (🔍):
- Triggers: `explore`, `investigate`, `research`, `learn`, `understand`, `explain`, `how does`, `study`, `analyze`, `discover`
- Flows: `doc-reorganization/`, `ideation/`
- Examples: "explore the WebSocket implementation", "research best practices"

**review** (👁️):
- Triggers: `review`, `code review`, `audit`, `check quality`, `security scan`, `inspect`, `examine`, `validate`, `verify`
- Flows: `audit-and-fix/`
- Examples: "review the auth implementation", "audit security vulnerabilities"

**settings** (⚙️):
- Triggers: `configure`, `set up`, `change settings`, `create flow`, `create action`, `onboard me`, `framework health`, `setup`, `initialize`
- Flows: `onboarding/`, `flow-creation/`, `action-creation/`, `framework-health/`
- Examples: "configure backend port", "create a new testing flow"

**pm** (📋):
- Triggers: `plan`, `roadmap`, `organize`, `track tasks`, `project management`, `what's next`, `priorities`, `schedule`, `coordinate`
- Flows: `planning/`
- Examples: "plan the next sprint", "create a roadmap for Q2"

#### Non-Routable Contexts (3)

**archive** (📦), **harmony** (🎵), **editor** (📝):
- All set to `routable: false` with empty triggers, flows, and examples
- Archive and harmony are auto-target contexts
- Editor is manual-only

### 3. Added Routing Utilities

**`ROUTABLE_WORKBENCHES`** constant:
```typescript
export const ROUTABLE_WORKBENCHES: readonly WorkbenchId[] = [
  'work', 'maintenance', 'explore', 'review', 'settings', 'pm',
] as const;
```

**`isRoutable()`** function:
```typescript
export function isRoutable(workbenchId: WorkbenchId): boolean {
  return ROUTABLE_WORKBENCHES.includes(workbenchId);
}
```

### 4. Created routingTypes.ts

New types for routing system:

**RoutingResult:**
- Represents the outcome of routing a user request
- Includes selected context, confidence score, alternatives, trigger matches
- Flags whether disambiguation is needed

**DisambiguationRequest:**
- Sent when multiple contexts match equally well
- Contains original request and possible contexts with scores

**RoutingDecision:**
- Final decision metadata attached to session
- Tracks context, confidence, method (automatic/disambiguated/manual), timestamp

### 5. Updated Exports

Added to `packages/shared/src/index.ts`:
- Type exports: `RoutingResult`, `DisambiguationRequest`, `RoutingDecision`
- Value exports: `ROUTABLE_WORKBENCHES`, `isRoutable`

---

## Verification

**Type Check:** ✅ PASS

```bash
pnpm type-check
# Result: All packages compile without errors
```

**Non-Breaking Guarantee:**
- ✅ All existing WorkbenchConfig fields preserved
- ✅ No changes to existing function signatures
- ✅ New fields populated for all workbenches (no partial migration)
- ✅ Routing logic NOT activated (metadata only, no behavior change)

---

## Next Steps (Not Implemented)

Phase 1 is complete and non-breaking. Future phases will:

**Phase 2:** Implement routing algorithm in `packages/backend/src/routing/contextRouter.ts`
**Phase 3:** Rewrite framework docs (ORGANIZATION.md → CONTEXTS.md)
**Phase 4:** Wire routing to UI (session creation, badges, disambiguation)
**Phase 5:** Remove department references

---

## Notes

- Trigger lists sourced from design doc Section 11 (Appendix: Complete Context Definitions)
- Flow lists verified against `.claude/actionflows/FLOWS.md`
- All 9 workbenches have routing metadata populated (even non-routable ones use empty arrays)
- TypeScript strict mode passes with no errors
- No runtime behavior changes — this is a pure type/metadata enhancement

---

## Learnings

**Issue:** None — execution proceeded as expected.

**Root Cause:** N/A

**Suggestion:** N/A

**[FRESH EYE]**
- The routing metadata fits naturally into the existing WorkbenchConfig structure
- Having empty routing metadata for non-routable workbenches (rather than omitting the fields) maintains type consistency and simplifies future code
- The trigger lists are comprehensive and cover natural language variations well
- The design doc's trigger lists were well-researched and map cleanly to the existing flow structure
