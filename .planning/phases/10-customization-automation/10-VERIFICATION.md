---
phase: 10-customization-automation
verified: 2026-04-08T17:30:00Z
status: human_needed
score: 37/37 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 30/37
  gaps_closed:
    - "pnpm type-check passes with zero errors"
    - "useHealingWatcher is called in ChatPanel with workbenchId and sessionId"
    - "POST /api/healing/attempts returns approvalId in 201 response body alongside attempt"
    - "ForkSwitcher, ForkButton, ForkBadge are rendered in the chat UI"
    - "CustomWorkbenchService and ForkMetadataService persist via Storage interface"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Visual inspection of Settings Extensions tabs"
    expected: "All 6 tabs (Skills, Scheduled Tasks, Custom Workbenches, Healing, Learnings, MCP) render correctly under Extensions heading in Settings workbench"
    why_human: "Requires running the app and visual verification of tab rendering, empty states, and dialog forms"
  - test: "Create and persist a skill"
    expected: "Creating a skill in Settings > Skills tab and reloading the page shows the skill still present"
    why_human: "Requires live backend + frontend interaction to verify full persistence loop"
  - test: "Custom workbench sidebar appearance"
    expected: "Creating a custom workbench shows it in the sidebar below a 'Custom' divider with the correct icon; clicking it activates the workbench"
    why_human: "Requires live UI interaction and visual confirmation"
  - test: "Healing approval card end-to-end"
    expected: "Triggering POST /api/healing/attempts from the backend causes a HealingApprovalCard to appear in the active workbench's chat panel; Approve/Decline buttons dismiss the card and update healing history"
    why_human: "Requires a live backend + WebSocket + frontend interaction to verify the full runtime-error -> approval card -> resolve cycle"
  - test: "Fork creation and switching"
    expected: "Using the ForkButton on a message opens the ForkDialog; creating a fork adds a tab to the ForkSwitcher above the message list; switching tabs changes the active branch"
    why_human: "Requires live Agent SDK sessions (Phase 6) or a mock to be present; fork session management is gated on SESSION-09"
---

# Phase 10: Customization & Automation Verification Report

**Phase Goal:** The system sustains itself through self-healing flows, and users extend it with custom workbenches, skills, and automation
**Verified:** 2026-04-08
**Status:** human_needed (all automated checks pass; 5 items need live interaction to confirm)
**Re-verification:** Yes — gap closure after plans 10-08 and 10-09

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | All Phase 10 domain types exist in @afw/shared and are importable | VERIFIED | healingTypes.ts, skillTypes.ts, scheduleTypes.ts, customWorkbenchTypes.ts, forkTypes.ts — all exist and re-exported from shared/src/index.ts |
| 2  | WorkbenchId supports custom workbench IDs | VERIFIED | packages/app/src/lib/types.ts: WorkbenchId = DefaultWorkbenchId \| CustomWorkbenchId |
| 3  | Croner is installed and used for scheduling | VERIFIED | croner@10.0.1 in backend/package.json, `import { Cron } from 'croner'` in scheduledTaskService.ts |
| 4  | DeleteConfirmationDialog exists and is accessible | VERIFIED | role="alertdialog", variant="destructive", autoFocus on Cancel |
| 5  | Test scaffolds exist for HealingQuotaTracker, SkillService, SchedulerService | VERIFIED | All 3 test files exist, 6-7 test cases each |
| 6  | Skills CRUD works with workbench scope isolation | VERIFIED | SkillService uses `skill:${workbenchId}:${id}` key pattern, scope guard on update/delete |
| 7  | Skills REST routes registered at /api/skills | VERIFIED | backend/src/index.ts line 250 |
| 8  | Skill store persists with persist middleware | VERIFIED | persist({ name: 'afw-skills' }) using Record<string, Skill[]> |
| 9  | SkillsPanel renders list with create/edit/delete | VERIFIED | useSkillStore wired, loadSkills on mount, Create Skill button, empty state |
| 10 | Scheduled tasks use cron with Croner | VERIFIED | new Cron() in scheduledTaskService.ts, loadAllTasks(), job.nextRun() |
| 11 | Scheduled task run history pruned to 10 | VERIFIED | history.slice(0, MAX_RUN_HISTORY) in scheduledTaskService.ts |
| 12 | TaskHistoryList auto-refreshes every 30s | VERIFIED | REFRESH_INTERVAL_MS = 30_000, setInterval in useEffect |
| 13 | Healing quota tracker uses date-keyed storage | VERIFIED | `healingQuota:${wb}:${flow}:${YYYY-MM-DD}` key pattern, no cron for reset |
| 14 | HealingService filters error classes (D-01) | VERIFIED | HEALING_ERROR_CLASSES.includes(err.errorClass) check before creating approval |
| 15 | HealingService circuit breaker at 2/day (D-02) | VERIFIED | quota.attemptsUsed >= quota.maxAttempts check |
| 16 | HealingService creates approval request (D-03) | VERIFIED | approvalService.createRequest called |
| 17 | Healing approved->succeeded/failed transition (D-04) | VERIFIED | recordHealingOutcome validates attempt.status === 'approved' before transition |
| 18 | HealingApprovalCard wired into ChatPanel | VERIFIED | ChatPanel.tsx imports HealingApprovalCard and useHealingStore, renders card between ForkSwitcher and ChatInput when pendingApprovalId is set |
| 19 | CircuitBreakerNotice has role="status" and aria-live | VERIFIED | role="status" aria-live="polite" present |
| 20 | HealingHistoryPanel shows aggregate stats | VERIFIED | StatCard components for Total attempts, Success rate, Circuits active |
| 21 | Self-healing errors surface approval checkpoints in chat | VERIFIED | useHealingWatcher imported and called at ChatPanel.tsx line 46: `useHealingWatcher(workbenchId, sessionId ?? '')` |
| 22 | Healing approvalId correctly correlates frontend-backend | VERIFIED | healingService.ts line 89 returns `{ attempt, approvalId: approval.id }`; healing.ts route line 122 returns `{ success: true, attempt: result.attempt, approvalId: result.approvalId }` |
| 23 | Custom workbench CRUD with default protection (D-11) | VERIFIED | isDefaultWorkbench guard throws Error('Cannot modify default workbenches') |
| 24 | Custom workbenches appear in sidebar below Custom divider | VERIFIED | Sidebar.tsx imports useCustomWorkbenchStore, renders 'Custom' heading with role="heading" |
| 25 | Custom workbench store persists | VERIFIED | persist({ name: 'afw-custom-workbenches' }) |
| 26 | Custom workbench and fork backend persistence across restarts | VERIFIED | CustomWorkbenchService uses Storage KV (`customWorkbench:${id}`); ForkMetadataService uses Storage KV (`fork:${parentSessionId}:${id}` + `forkIndex:${id}`); both constructors receive `storage` parameter in index.ts |
| 27 | ForkMetadataService manages fork lifecycle (D-13, D-14) | VERIFIED | description required, mergeFork with theirs/parent/manual, discardFork marks abandoned |
| 28 | Fork routes return 503 with FORK_SESSION_UNAVAILABLE | VERIFIED | forks.ts line 73-76 |
| 29 | ISessionManager interface (no any types) | VERIFIED | export interface ISessionManager with typed forkSession signature |
| 30 | ForkDialog shows graceful degradation on 503 | VERIFIED | forkUnavailable state check shows "Fork requires active agent sessions" UI |
| 31 | Fork components rendered in chat UI | VERIFIED | ForkSwitcher rendered in ChatPanel.tsx lines 85-87 (conditional on sessionId); ForkButton imported and rendered in MessageList.tsx lines 4, 78-82; ForkBadge imported and rendered in MessageList.tsx lines 5, 74-76 |
| 32 | LearningsBrowser with search filter | VERIFIED | searchQuery state, filter on errorClass/errorMessage/workbenchId, shows 'approved' as provisional |
| 33 | McpConfigPanel with graceful fallback | VERIFIED | Informational non-error state on any fetch failure |
| 34 | SettingsPage integrates all Phase 10 panels | VERIFIED | All 6 panels imported (lines 17-22) and rendered (lines 115-130) in Extensions Tabs section |
| 35 | Existing Settings content preserved | VERIFIED | WorkbenchGreeting and FlowBrowser both present |
| 36 | pnpm type-check passes | VERIFIED | `pnpm type-check` exits 0 — zero errors across all 6 packages (shared, backend, app, hooks, second-opinion) |
| 37 | Test scaffolds use vitest patterns (vi.useFakeTimers, branded types) | VERIFIED | describe/it/expect, vi.useFakeTimers(), vi.setSystemTime() present |

**Score:** 37/37 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/shared/src/healingTypes.ts` | HealingAttempt, HealingQuota, ErrorClass types | VERIFIED | All types present, MAX_HEALING_ATTEMPTS_PER_DAY=2 |
| `packages/shared/src/skillTypes.ts` | Skill, SkillId, SkillInvocation types | VERIFIED | All types present |
| `packages/shared/src/scheduleTypes.ts` | ScheduledTask, ScheduledTaskId, TaskRun types | VERIFIED | MAX_RUN_HISTORY=10 |
| `packages/shared/src/customWorkbenchTypes.ts` | CustomWorkbench, DefaultWorkbenchId, isDefaultWorkbench | VERIFIED | isDefaultWorkbench guard present |
| `packages/shared/src/forkTypes.ts` | ForkMetadata, ForkId, MergeResolution | VERIFIED | All types present |
| `packages/app/src/lib/types.ts` | WorkbenchId = DefaultWorkbenchId \| CustomWorkbenchId | VERIFIED | Widened union with type guard |
| `packages/app/src/workbenches/shared/DeleteConfirmationDialog.tsx` | Generic destructive-action dialog | VERIFIED | role="alertdialog", autoFocus on Cancel, variant="destructive" |
| `packages/backend/src/services/skillService.ts` | SkillService with Storage-backed scope isolation | VERIFIED | Uses Storage interface, scope guard |
| `packages/backend/src/routes/skills.ts` | REST endpoints for skill CRUD | VERIFIED | GET/POST/PUT/DELETE routes |
| `packages/app/src/stores/skillStore.ts` | Zustand store with persist | VERIFIED | persist({ name: 'afw-skills' }) |
| `packages/app/src/workbenches/settings/SkillsPanel.tsx` | Skills list panel | VERIFIED | Wired to useSkillStore |
| `packages/app/src/workbenches/settings/SkillDialog.tsx` | Create/edit form | VERIFIED | Name, Description, Trigger, Action fields |
| `packages/backend/src/services/scheduledTaskService.ts` | Croner-backed scheduler | VERIFIED | new Cron(), loadAllTasks(), recordRun() with pruning |
| `packages/backend/src/routes/scheduledTasks.ts` | REST + run-now routes | VERIFIED | Including POST /:wbId/:taskId/run |
| `packages/app/src/stores/scheduleStore.ts` | Zustand store with runNow | VERIFIED | No persist (re-fetches from backend) |
| `packages/app/src/workbenches/settings/ScheduledTasksPanel.tsx` | Task list panel | VERIFIED | Create Task button, empty state |
| `packages/app/src/workbenches/settings/TaskHistoryList.tsx` | Run history with 30s refresh | VERIFIED | setInterval(30_000), 10-run cap hint |
| `packages/backend/src/services/healingQuotaTracker.ts` | Date-keyed quota tracker | VERIFIED | YYYY-MM-DD key suffix, daily reset via key change |
| `packages/backend/src/services/healingService.ts` | Healing orchestration with composite return | VERIFIED | Returns `{ attempt, approvalId: approval.id }` — D-01/D-02/D-03/D-04 all implemented |
| `packages/app/src/stores/healingStore.ts` | Healing store with pendingApproval | VERIFIED | pendingApprovalId, pendingAttempt, resolveApproval |
| `packages/app/src/workbenches/chat/HealingApprovalCard.tsx` | In-chat approval card | VERIFIED | role="alertdialog", Approve Healing/Investigate buttons |
| `packages/app/src/workbenches/chat/CircuitBreakerNotice.tsx` | Circuit breaker display | VERIFIED | role="status" aria-live="polite" |
| `packages/app/src/hooks/useHealingWatcher.ts` | Hook to trigger healing pipeline | VERIFIED | Imported and called in ChatPanel.tsx line 46 — no longer orphaned |
| `packages/app/src/workbenches/settings/HealingHistoryPanel.tsx` | Healing history with stats | VERIFIED | StatCard row, ContentList of attempts |
| `packages/app/src/workbenches/settings/CustomWorkbenchesPanel.tsx` | Card grid with CRUD | VERIFIED | loadWorkbenches on mount, card grid |
| `packages/backend/src/services/customWorkbenchService.ts` | CRUD with default protection and Storage backing | VERIFIED | No `new Map`, uses Storage KV with `customWorkbench:${id}` key pattern; D-11 guard present |
| `packages/app/src/stores/customWorkbenchStore.ts` | Zustand store with persist | VERIFIED | persist({ name: 'afw-custom-workbenches' }) |
| `packages/app/src/workbenches/sidebar/Sidebar.tsx` | Sidebar with custom workbench items | VERIFIED | useCustomWorkbenchStore, "Custom" divider, role="heading" |
| `packages/app/src/lib/iconMap.ts` | ICON_MAP for icon resolution | VERIFIED | ICON_MAP, ICON_NAMES, DEFAULT_ICON exported |
| `packages/backend/src/services/forkMetadataService.ts` | Fork metadata CRUD backed by Storage | VERIFIED | No `new Map`, uses Storage KV with `fork:${parentSessionId}:${id}` + `forkIndex:${id}` reverse index |
| `packages/backend/src/routes/forks.ts` | ISessionManager + 503 graceful handling | VERIFIED | ISessionManager interface, FORK_SESSION_UNAVAILABLE code |
| `packages/app/src/stores/forkStore.ts` | Fork store with degradation flag (no unused imports) | VERIFIED | `import type { ForkMetadata, MergeResolution }` — ForkId removed; forkUnavailable, switchBranch, mergeFork, 503 detection |
| `packages/app/src/workbenches/chat/ForkDialog.tsx` | Fork creation with graceful degradation | VERIFIED | forkUnavailable check, "Fork requires active agent sessions" message |
| `packages/app/src/workbenches/chat/ForkSwitcher.tsx` | Tab bar for branch switching (wired in ChatPanel) | VERIFIED | `_workbenchId` prefix suppresses TS6133; rendered in ChatPanel.tsx lines 85-87 |
| `packages/app/src/workbenches/chat/ForkButton.tsx` | Hover-reveal fork button (wired in MessageList) | VERIFIED | Rendered in MessageList.tsx lines 78-82 inside `group relative` container |
| `packages/app/src/workbenches/chat/ForkBadge.tsx` | Fork point badge (wired in MessageList) | VERIFIED | Rendered in MessageList.tsx lines 72-76 when `isForked` is true |
| `packages/app/src/workbenches/chat/MergeDialog.tsx` | Merge resolution dialog | VERIFIED | RadioGroup with theirs/parent/manual, conditional manual textarea |
| `packages/app/src/workbenches/settings/LearningsBrowser.tsx` | Searchable learnings | VERIFIED | searchQuery filter, provisional 'approved' learnings |
| `packages/app/src/workbenches/settings/McpConfigPanel.tsx` | MCP config with fallback | VERIFIED | Informational fallback state, not error-red |
| `packages/app/src/workbenches/pages/SettingsPage.tsx` | Extensions tabs with all panels | VERIFIED | All 6 panels imported and rendered |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| shared/src/index.ts | healingTypes.ts, skillTypes.ts, scheduleTypes.ts, customWorkbenchTypes.ts, forkTypes.ts | re-export | VERIFIED | Lines 626-634 |
| app/src/lib/types.ts | shared/src/customWorkbenchTypes.ts | import CustomWorkbenchId | VERIFIED | Line 2 |
| backend/src/services/skillService.ts | Storage | this.storage.set/get/keys/delete | VERIFIED | `skill:${workbenchId}:${id}` key pattern |
| app/src/stores/skillStore.ts | /api/skills | fetch in CRUD methods | VERIFIED | All 4 operations wired |
| backend/src/services/scheduledTaskService.ts | croner | new Cron() | VERIFIED | Line 297 |
| app/src/stores/scheduleStore.ts | /api/scheduled-tasks | fetch calls | VERIFIED | Including /run endpoint |
| backend/src/services/healingService.ts | approvalService.ts | approvalService.createRequest | VERIFIED | Line 63; returns `{ attempt, approvalId: approval.id }` |
| backend/src/services/healingService.ts | healingQuotaTracker.ts | quotaTracker.getTodayQuota | VERIFIED | Line 56 |
| backend/src/routes/healing.ts | healingService.onRuntimeError | destructured result | VERIFIED | Line 122: `res.status(201).json({ success: true, attempt: result.attempt, approvalId: result.approvalId })` |
| app/src/workbenches/chat/ChatPanel.tsx | useHealingWatcher | hook call with workbenchId and sessionId | VERIFIED | Line 46: `useHealingWatcher(workbenchId, sessionId ?? '')` |
| app/src/workbenches/chat/ChatPanel.tsx | ForkSwitcher | conditional render above MessageList | VERIFIED | Lines 85-87 |
| app/src/workbenches/chat/MessageList.tsx | ForkButton | render inside group-relative message container | VERIFIED | Lines 4, 78-82 |
| app/src/workbenches/chat/MessageList.tsx | ForkBadge | render when isForkPoint is true | VERIFIED | Lines 5, 72-76 |
| backend/src/services/customWorkbenchService.ts | Storage | constructor injection, set/get/keys/delete | VERIFIED | CW_KEY_PREFIX pattern, no Map fields |
| backend/src/services/forkMetadataService.ts | Storage | constructor injection, set/get/keys/delete | VERIFIED | FORK_KEY_PREFIX + FORK_INDEX_PREFIX, no Map fields |
| backend/src/index.ts | CustomWorkbenchService | `new CustomWorkbenchService(storage)` | VERIFIED | Line 262 |
| backend/src/index.ts | ForkMetadataService | `new ForkMetadataService(storage)` | VERIFIED | Line 266 |
| app/src/workbenches/sidebar/Sidebar.tsx | customWorkbenchStore.ts | useCustomWorkbenchStore | VERIFIED | Line 4, 22 |
| app/src/workbenches/sidebar/Sidebar.tsx | iconMap.ts | ICON_MAP import | VERIFIED | Line 5, 74 |
| backend/src/routes/forks.ts | sessionManager | forkSession (ISessionManager) | VERIFIED | ISessionManager interface, 503 on null |
| app/src/stores/forkStore.ts | /api/forks | fetch calls including 503 handling | VERIFIED | forkUnavailable flag set on 503 |
| SettingsPage.tsx | SkillsPanel, ScheduledTasksPanel, CustomWorkbenchesPanel, HealingHistoryPanel, LearningsBrowser, McpConfigPanel | import and render in TabsContent | VERIFIED | Lines 17-22, 115-130 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| SkillsPanel | skills from getSkillsByWorkbench | skillStore → GET /api/skills/:wbId → SkillService → Storage | Yes (Storage-backed) | FLOWING |
| ScheduledTasksPanel | tasks from getTasksByWorkbench | scheduleStore → GET /api/scheduled-tasks/:wbId → ScheduledTaskService → Storage | Yes (Storage-backed) | FLOWING |
| HealingApprovalCard | attempt, approvalId from healingStore | useHealingWatcher (now called) subscribes to WS events → healingStore.addPendingApproval | Yes (event-driven via WS) | FLOWING |
| HealingHistoryPanel | attempts from healingStore.loadHistory | GET /api/healing/history → HealingService → Storage | Yes (Storage-backed) | FLOWING |
| CustomWorkbenchesPanel | workbenches from customWorkbenchStore | GET /api/custom-workbenches → CustomWorkbenchService → Storage KV | Yes (Storage-backed, persists across restarts) | FLOWING |
| LearningsBrowser | attempts from useHealingStore | GET /api/healing/history → HealingService → Storage | Yes | FLOWING |
| ForkSwitcher | forks via forksByParent | useForkStore.loadForks → GET /api/forks/:parentSessionId → ForkMetadataService → Storage KV | Yes (Storage-backed) | FLOWING |
| MessageList (ForkButton/ForkBadge) | sessionId, isForkPoint | useSessionStore + useForkStore | Yes (store-backed) | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED — requires running server. Key routes registered and structurally verified via static analysis. TypeScript compilation exit 0 across all 6 packages confirms structural correctness.

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CUSTOM-01 | 10-00, 10-01, 10-04, 10-08, 10-09 | Self-healing flows with circuit breaker | SATISFIED | Backend pipeline complete (D-01/D-02/D-03/D-04); useHealingWatcher now called in ChatPanel; approvalId returned from route; approval card renders when pendingApprovalId is set |
| CUSTOM-02 | 10-00, 10-01, 10-02 | Per-workbench skills CRUD | SATISFIED | Full CRUD via Storage-backed service, scope isolation verified |
| CUSTOM-03 | 10-00, 10-01, 10-03 | Scheduled tasks with cron, history, run-now | SATISFIED | Croner-backed, 10-run history, manual trigger |
| CUSTOM-04 | 10-01, 10-05, 10-09 | Custom workbench creation with persistence | SATISFIED | UI and default protection work; backend now uses Storage KV (no Map), persists across restarts |
| CUSTOM-05 | 10-01, 10-06, 10-08, 10-09 | Session forking UI | SATISFIED | ForkDialog, MergeDialog, ForkStore functional; ForkSwitcher/ForkButton/ForkBadge all wired into ChatPanel and MessageList; fork metadata persists via Storage |
| CUSTOM-06 | 10-07 | Learnings browser | SATISFIED | Search filter, provisional approved learnings, StatCard stats |
| CUSTOM-07 | 10-07 | MCP config panel | SATISFIED | Informational fallback, renders server list when available |

### Anti-Patterns Found

No blockers remain. All previously flagged blockers are resolved:
- Unused `ForkId` import removed from forkStore.ts
- Unused `workbenchId` parameter prefixed with `_` in ForkSwitcher.tsx
- `useHealingWatcher` now called in ChatPanel
- ForkSwitcher/ForkButton/ForkBadge now rendered in component tree
- CustomWorkbenchService and ForkMetadataService migrated from in-memory Maps to Storage KV
- Healing route now returns `approvalId` in 201 response

### Human Verification Required

#### 1. Settings Extensions Tab Rendering

**Test:** Start app with `pnpm dev`, navigate to Settings workbench, scroll to Extensions section
**Expected:** Six tabs visible (Skills, Scheduled Tasks, Custom Workbenches, Healing, Learnings, MCP), each shows correct empty state or content
**Why human:** Visual rendering of Radix Tabs, empty state copy, and dialog forms requires browser

#### 2. Skill Creation and Persistence

**Test:** Create a skill in Settings > Skills tab, reload the page
**Expected:** Skill still appears after reload (frontend persist) and after backend restart (backend Storage)
**Why human:** Requires live backend interaction to verify full persistence loop

#### 3. Custom Workbench in Sidebar

**Test:** Create a custom workbench in Settings, navigate back to sidebar
**Expected:** New workbench appears below "Custom" divider with chosen icon; clicking it activates the workbench
**Why human:** Visual confirmation of sidebar update and icon rendering

#### 4. Healing Approval Card End-to-End

**Test:** POST to `/api/healing/attempts` with a valid runtime error payload; observe the active workbench's chat panel
**Expected:** HealingApprovalCard appears in chat; Approve/Decline buttons work; healing history updates
**Why human:** Full WebSocket event pipeline (backend broadcast → useHealingWatcher subscription → healingStore update → ChatPanel render) requires live running server and browser

#### 5. Fork Creation and Branch Switching

**Test:** Click ForkButton on a chat message; fill ForkDialog; observe ForkSwitcher
**Expected:** Fork tab appears above message list; switching tabs changes the active branch indicator
**Why human:** Requires live Agent SDK sessions (SESSION-09) or mock presence; fork button hover-reveal requires browser interaction

### Gaps Summary

All 5 gaps from the initial verification (2026-04-07) are now closed:

1. **Build integrity** — `pnpm type-check` exits 0 across all 6 packages. Both TypeScript errors (unused ForkId import, unused workbenchId parameter) are resolved.

2. **Self-healing wiring** — `useHealingWatcher` is now imported and called in ChatPanel.tsx (line 46). The backend POST /api/healing/attempts route now returns `{ success: true, attempt, approvalId }` in the 201 response, enabling the frontend to correlate approval IDs without synthetic fallbacks.

3. **Fork UI integration** — ForkSwitcher is rendered above MessageList in ChatPanel (conditional on sessionId), ForkButton renders on every message inside a `group relative` container (visible on hover), and ForkBadge renders below messages that are fork points. All three components are no longer orphaned.

4. **Backend persistence (custom workbenches)** — CustomWorkbenchService fully rewritten to use Storage KV with `customWorkbench:${id}` key pattern. No `new Map` fields remain. Constructor receives `storage` parameter from index.ts.

5. **Backend persistence (fork metadata)** — ForkMetadataService fully rewritten to use Storage KV with `fork:${parentSessionId}:${id}` primary key and `forkIndex:${id}` reverse index. No `new Map` fields remain. Constructor receives `storage` parameter from index.ts.

No new regressions detected. All 37 truths now pass automated verification. Five items require live human testing to confirm visual rendering and end-to-end interaction flows.

---

_Verified: 2026-04-08_
_Verifier: Claude (gsd-verifier)_
