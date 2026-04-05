# Phase 10: Customization & Automation - Research

**Researched:** 2026-04-05
**Domain:** Self-healing automation, per-workbench scheduling, skills, custom workbenches, session forking
**Confidence:** HIGH for external libraries (Croner, Agent SDK fork), HIGH for internal integration points (SessionManager, ApprovalService, Storage), MEDIUM for data model choices (marked where applicable)

---

## Summary

Phase 10 adds five loosely-related subsystems on top of Phase 8 (Neural Validation, completed) and Phase 9 (Workbenches & Flow Management, in progress): self-healing flows with a daily circuit breaker, per-workbench user-created skills, cron-based scheduled tasks, user-created custom workbenches, and session forking. All five are additive — they introduce new services, new stores, and new branded types without mutating existing Phase 1–9 contracts.

The good news: the hard integration pieces are **already in place**. Phase 6's `SessionManager.forkSession()` already wraps the Agent SDK's native `sdkForkSession` — session forking is a UI-only build. Phase 8's `ApprovalService` has the exact two-state lifecycle (`createRequest` → `resolveRequest`) that self-healing approval checkpoints need. The existing `CircuitBreaker<T>` class in `packages/backend/src/infrastructure/circuitBreaker.ts` is generic and reusable, but its failure-count semantics are wrong for D-02 (daily quota per workbench-flow pair) — a new specialized `HealingQuotaTracker` service is required. The `Storage` interface supports generic key-value operations (`get`, `set`, `keys`, `delete`) which is how Phase 8 persists gate traces — new Phase 10 entities follow the same pattern.

**Primary recommendation:** Use **Croner 10.0.1** for cron scheduling (TypeScript-native, isomorphic, DST-aware, provides `nextRun()` which D-08 needs). Store per-workbench entities (skills, custom workbenches, scheduled tasks, healing attempts) through the existing `Storage.set/get/keys` key-value pattern with namespaced prefixes. Add new Zustand stores for skills, schedules, and custom workbenches mirroring the `flowStore.ts` shape. Use Agent SDK's native `forkSession` (already exposed via `SessionManager.forkSession()`) — build only the fork UI and fork-metadata storage. **Ship all five subsystems independently** — they share no runtime state except the `Storage` instance and `ApprovalService`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Self-Healing Flows**
- **D-01 Failure Detection Scope:** Circuit breaker counts **runtime/logic errors only**. Contract violations (design system, output format) do NOT trigger healing attempts.
- **D-02 Circuit Breaker Quota:** Track failures **per-workbench per-flow** with daily reset. Each workbench-flow pair gets maximum 2 healing attempts per calendar day. After 2 failed attempts, flow stops attempting healing and reports "Circuit breaker active".
- **D-03 User Visibility:** Healing is **not automatic** — requires manual user approval. When validation detects a runtime error: show approval checkpoint in chat. User can approve healing or investigate manually.
- **D-04 Healing Outcomes:** On success (after fix and re-validation): flow continues normally, logs success to learnings. On failure (2 attempts exhausted or user declines): flow stops, user is notified. Learnings update to prevent recurrence of same error class.

**Skills: Reusable Workbench Commands**
- **D-05 Skills Creation Method:** Users create skills via **UI form in Settings**. Form fields: Name, Description, Trigger pattern, Action description. No code editor required (v1 simplification).
- **D-06 Skills Scope & Reuse:** Skills are scoped to a single workbench (cannot leak data across workbenches). Skills can call other skills within the same workbench. Cross-workbench skill calls not allowed (scope isolation enforced).

**Scheduled Tasks UI**
- **D-07 Schedule Format:** Use **cron expressions** (standard 5-field cron syntax). Example: `0 9 * * 1-5` for weekday 9am.
- **D-08 Execution History:** Retain **last 10 executions** per scheduled task. Oldest runs automatically pruned when limit exceeded. Users can see status, timestamp, duration per run.
- **D-09 Manual Triggers & Failure Handling:** Users can **manually trigger scheduled tasks at any time** (Run Now button always available). On failure: log the error, notify user, do not auto-retry. Failed tasks do not block future scheduled runs.

**Custom Workbenches**
- **D-10 Creation & Configuration:** Custom workbenches created via **full configuration UI**. Users configure: name, personality, system prompt snippet, initial flows, layout preferences. Not template-based.
- **D-11 Persistence & Interaction:** Custom workbenches persist per-user/per-session like defaults. Custom workbenches have their own session, pipeline, chat, flows (same structure as defaults). Users can edit workbench personality/config after creation (via Settings). Cannot modify the 7 default workbenches (can only create new ones).

**Session Forking**
- **D-12 Fork Point Visualization:** Fork points shown with **simple badge indicator** in history. Forked branches listed separately below the fork point (not nested tree).
- **D-13 Merge Capability:** Forks are **mergeable back** to parent branch with **conflict resolution**. Users select how to resolve conflicts (theirs/parent/manual merge). Merged state updates session history to show merge commit.
- **D-14 Fork Naming & Limits:** **Required fork description** — user must provide intent when creating fork. No hard limit on fork count (unlimited forks allowed per session).

### Claude's Discretion

- Exact styling/layout for scheduled tasks UI
- Exact conflict resolution algorithm for merges (as long as user has choices)
- Healing prompt refinement (how to guide agents to fix the detected error)
- Custom workbench layout options (beyond name/personality/context)
- Fork visualization beyond simple badge (explore better UX if needed during planning)

### Deferred Ideas (OUT OF SCOPE)

- Skills browser/library view — Phase 11+ (cross-workbench skills discovery)
- Skills code editor — Phase 11 (after UI form v1 proves concept)
- Scheduled task notifications to Slack/email — separate integration phase
- Fork visualization as interactive tree — explore only if simple badge feels limiting
- Conflict resolution UI (visual merge tool) — start with simple text choice (theirs/parent)
- Workbench templates — deferred
- Scheduled task retry policies — deferred (D-09 explicitly forbids auto-retry)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CUSTOM-01 | Self-healing flows: validate → signal → fix → re-validate with circuit breaker (max 2 attempts) | See "Self-Healing Flows Architecture" — uses existing `ApprovalService` (Phase 8) + new `HealingQuotaTracker` service with daily-reset semantics (D-02 differs from generic CircuitBreaker). |
| CUSTOM-02 | Per-workbench skills — user-created reusable commands scoped to workbench context | See "Skills Architecture" — new `Skill` branded type, `skillStore`, `SkillService` (backend). Invocation via WebSocket `skill:invoke` message routed through `SessionManager.sendMessage`. |
| CUSTOM-03 | Scheduled tasks (cron) UI — recurring automation with status, next run, history per workbench | See "Scheduled Tasks Architecture" — uses **Croner 10.0.1** for cron parsing/scheduling. `ScheduledTaskService` singleton owns Croner instances. History pruned at 10 entries (D-08). |
| CUSTOM-04 | Custom workbench creation — user-defined domains beyond 7 defaults with own session, pipeline, chat, flows | See "Custom Workbenches Architecture" — extends `WORKBENCHES` array at runtime. `WorkbenchId` type widens from union to branded string. New `CustomWorkbench` model persisted via Storage. |
| CUSTOM-05 | Session forking UI — visual fork point in session history tree | See "Session Forking Architecture" — backend already exposes `SessionManager.forkSession()` via Agent SDK. Build UI + fork-metadata storage only. |
| CUSTOM-06 | Learning persistence UI — searchable learnings browser across workbenches | NOT IN SCOPE per CONTEXT.md (D-01..D-14 do not cover CUSTOM-06). Flag to planner: this requirement is in the phase but has no discussion decisions. Suggest deferring or requesting a CONTEXT supplement. |
| CUSTOM-07 | MCP server configuration panel in Settings workbench | NOT IN SCOPE per CONTEXT.md (no D-xx covers it). Flag to planner: requirement listed in phase but has no decisions. Suggest deferring or requesting supplement. |
</phase_requirements>

---

## Standard Stack

### Core (new additions for Phase 10)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **croner** | **10.0.1** (latest, published 2026-02-21) | Cron parsing, scheduling, next-run calculation | TypeScript-native, zero deps, DST-aware, isomorphic (Node + browser), provides `nextRun()` / `nextRuns(n)` that D-08 needs for "next run time" display. node-cron lacks next-run calculation. |

### Already Installed (reuse, don't re-add)

| Library | Version | Purpose | Phase Use |
|---------|---------|---------|-----------|
| `@anthropic-ai/claude-agent-sdk` | ^0.2.91 (latest: 0.2.92) | Agent session management, forking | Already exposes `forkSession` — used by Phase 6 SessionManager. Phase 10 consumes via existing `SessionManager.forkSession()`. |
| `zustand` | (already in app) | Client state management | New stores: `skillStore`, `scheduleStore`, `customWorkbenchStore`, `healingStore`. Use `persist` middleware for custom workbenches + skills (localStorage). |
| `uuid` | ^13.0.0 | ID generation | Skill IDs, ScheduledTask IDs, ForkMetadata IDs, HealingAttempt IDs. |
| `zod` | ^3.22.4 | Runtime schema validation | POST body validation for skill/schedule/workbench creation routes. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Croner | node-cron 4.2.1 | 5× more weekly downloads (~3M vs ~600K). But: no `nextRun()` API, types via separate `@types` package, less maintained. D-08 requires next-run display — Croner wins. |
| Croner | cron 4.4.0 | V3 added native TypeScript. But: heavier API surface, weaker cross-runtime support. Same disqualifier: next-run ergonomics. |
| Storage key-value | New SQLite backend | SQLite would give proper indexing for last-10-runs queries. But: adds infra dependency, breaks current Memory/Redis parity, overkill for <100 entities per workbench. |
| Custom WorkbenchId | Keep static union | Static union is simpler. But breaks D-11 ("persist per-user like defaults"). Must migrate to branded string type. |

**Installation:**

```bash
pnpm -F @afw/backend add croner
pnpm -F @afw/backend add -D @types/uuid  # if not present
```

**Version verification:**
- `croner` 10.0.1 confirmed via `npm view croner version` (published 2026-02-21)
- `node-cron` 4.2.1 confirmed (2026-03-18) — considered and rejected per rationale above
- `@anthropic-ai/claude-agent-sdk` 0.2.92 is latest — bump from 0.2.91 optional (not required for Phase 10)

---

## Architecture Patterns

### Recommended Layout

```
packages/backend/src/
├── services/
│   ├── healingQuotaTracker.ts     # NEW: per-workbench-per-flow daily quota (D-02)
│   ├── healingService.ts          # NEW: orchestrates validate→approve→fix→re-validate (D-03/D-04)
│   ├── skillService.ts            # NEW: CRUD + invocation for skills
│   ├── scheduledTaskService.ts    # NEW: Croner-backed cron scheduler
│   ├── customWorkbenchService.ts  # NEW: CRUD for user-created workbenches
│   └── forkMetadataService.ts     # NEW: fork description + parent tracking
├── routes/
│   ├── healing.ts                 # NEW: POST /api/healing/attempts, GET /api/healing/quota/:workbenchId
│   ├── skills.ts                  # NEW: /api/skills (workbench-scoped)
│   ├── scheduledTasks.ts          # NEW: /api/scheduled-tasks (workbench-scoped)
│   ├── customWorkbenches.ts       # NEW: /api/custom-workbenches
│   └── forks.ts                   # NEW: /api/forks (list/create/merge metadata)

packages/app/src/
├── stores/
│   ├── healingStore.ts            # NEW: quota state per workbench-flow, pending healing requests
│   ├── skillStore.ts              # NEW: per-workbench skills (persist to localStorage)
│   ├── scheduleStore.ts           # NEW: scheduled tasks + history
│   ├── customWorkbenchStore.ts    # NEW: extends base WORKBENCHES with user-created ones
│   └── forkStore.ts               # NEW: fork metadata per session
├── workbenches/
│   ├── settings/                  # NEW subdirectory for settings sub-panels
│   │   ├── SkillsPanel.tsx
│   │   ├── ScheduledTasksPanel.tsx
│   │   ├── CustomWorkbenchesPanel.tsx
│   │   └── HealingHistoryPanel.tsx
│   └── chat/
│       ├── HealingApprovalCard.tsx    # NEW: approval checkpoint in chat (D-03)
│       └── ForkBadge.tsx              # NEW: fork point indicator (D-12)

packages/shared/src/
├── skillTypes.ts                  # NEW: Skill, SkillId, SkillInvocation
├── scheduleTypes.ts               # NEW: ScheduledTask, ScheduledTaskId, TaskRun
├── customWorkbenchTypes.ts        # NEW: CustomWorkbench, WorkbenchId widening
├── healingTypes.ts                # NEW: HealingAttempt, HealingQuota, ErrorClass
└── forkTypes.ts                   # NEW: ForkMetadata, ForkId, MergeResolution
```

### Pattern 1: Storage via Key-Value Prefixes

**What:** Phase 10 entities persist through the existing `Storage.set/get/keys/delete` interface (from `packages/backend/src/storage/index.ts` lines 186–189), reusing the pattern already established by Phase 8 gate traces.

**When to use:** Any per-workbench entity with simple CRUD needs and moderate cardinality (<500 entities per workbench).

**Example:**

```typescript
// Source: existing pattern from healingRecommendations.ts getGateTraces()
// Key schema proposal:
//   skill:{workbenchId}:{skillId}
//   schedule:{workbenchId}:{taskId}
//   scheduleRun:{taskId}:{runId}           (last 10 per task, pruned)
//   customWorkbench:{workbenchId}
//   healingQuota:{workbenchId}:{flowId}:{YYYY-MM-DD}
//   healingAttempt:{attemptId}
//   fork:{parentSessionId}:{forkId}

class SkillService {
  constructor(private storage: Storage) {}

  async createSkill(workbenchId: string, skill: Skill): Promise<void> {
    const key = `skill:${workbenchId}:${skill.id}`;
    await this.storage.set!(key, JSON.stringify(skill));
  }

  async listSkills(workbenchId: string): Promise<Skill[]> {
    const keys = await this.storage.keys!(`skill:${workbenchId}:*`);
    const skills: Skill[] = [];
    for (const key of keys) {
      const data = await this.storage.get!(key);
      if (data) skills.push(JSON.parse(data));
    }
    return skills;
  }
}
```

**Storage interface compatibility:** The generic `set/get/keys/delete` methods are already marked optional on the `Storage` interface (see `packages/backend/src/storage/index.ts` line 186–189: `set?(key, value, ttlSeconds?)`). Both MemoryStorage and RedisStorage implement them. No storage migration required.

### Pattern 2: Zustand Store with persist Middleware (new for Phase 10)

**What:** Client-side persistence for user-created entities (skills, custom workbenches) using `zustand/middleware` `persist` to localStorage.

**When to use:** Any user-created data that should survive page reloads and sync to backend on mutation.

**Example:**

```typescript
// Source: zustand persist middleware docs
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SkillState {
  skills: Map<WorkbenchId, Skill[]>;
  addSkill: (workbenchId: WorkbenchId, skill: Omit<Skill, 'id'>) => Promise<void>;
  loadSkills: (workbenchId: WorkbenchId) => Promise<void>;
}

export const useSkillStore = create<SkillState>()(
  persist(
    (set, get) => ({
      skills: new Map(),
      addSkill: async (workbenchId, skill) => {
        const res = await fetch(`/api/skills/${workbenchId}`, {
          method: 'POST',
          body: JSON.stringify(skill),
        });
        const created = await res.json();
        // Update map …
      },
      loadSkills: async (workbenchId) => { /* GET /api/skills/{workbenchId} */ },
    }),
    {
      name: 'afw-skills',
      // Map requires custom serialization
      storage: {
        getItem: (name) => {
          const raw = localStorage.getItem(name);
          if (!raw) return null;
          const parsed = JSON.parse(raw);
          return { ...parsed, state: { ...parsed.state, skills: new Map(parsed.state.skills) } };
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify({
            ...value,
            state: { ...value.state, skills: Array.from(value.state.skills.entries()) },
          }));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
```

**Note:** Zustand's default JSON serializer does not handle `Map`. Either convert to plain objects before persisting, or use the custom storage shown above. The existing `sessionStore.ts`, `validationStore.ts`, and `flowStore.ts` do NOT use persist — they re-fetch on mount. For skills + custom workbenches, persist avoids a flash of empty state on reload.

### Pattern 3: Croner Singleton for Scheduling

**What:** One Croner instance per active scheduled task, managed by a `ScheduledTaskService` singleton in the backend.

**When to use:** Any time-based trigger within the backend process.

**Example:**

```typescript
// Source: https://croner.56k.guru (verified 2026-04-05)
import { Cron } from 'croner';
import type { ScheduledTask, TaskRun } from '@afw/shared';

export class ScheduledTaskService {
  private jobs = new Map<string, Cron>();

  registerTask(task: ScheduledTask): void {
    // Replace existing job if re-registering
    const existing = this.jobs.get(task.id);
    if (existing) existing.stop();

    const job = new Cron(task.cronExpression, { timezone: task.timezone ?? 'UTC' }, async () => {
      await this.executeTask(task);
    });

    this.jobs.set(task.id, job);
  }

  async executeTask(task: ScheduledTask): Promise<TaskRun> {
    const runId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    try {
      // Invoke task action (call flow, dispatch WS event, etc.)
      // On failure: log + notify, DO NOT retry (D-09)
      const result = await this.dispatchAction(task.action);
      return this.recordRun(task.id, { runId, startedAt, status: 'success', result });
    } catch (err) {
      return this.recordRun(task.id, { runId, startedAt, status: 'failure', error: String(err) });
    }
  }

  getNextRun(taskId: string): Date | null {
    return this.jobs.get(taskId)?.nextRun() ?? null;
  }

  getUpcomingRuns(taskId: string, count: number): Date[] {
    return this.jobs.get(taskId)?.nextRuns(count) ?? [];
  }

  async recordRun(taskId: string, run: TaskRun): Promise<void> {
    // Prune to last 10 (D-08)
    const history = await this.getRunHistory(taskId);
    const updated = [run, ...history].slice(0, 10);
    await this.storage.set!(`scheduleRun:${taskId}`, JSON.stringify(updated));
  }
}
```

**Timezone handling:** Croner accepts `{ timezone: 'America/New_York' }` in options. Default to UTC for v1; allow per-task override in v2.

### Pattern 4: Healing as Approval + Error-Class Match

**What:** Self-healing reuses Phase 8's `ApprovalService.createRequest()` — each detected runtime error spawns an approval request with action `'heal_runtime_error'`. User approval triggers the fix attempt.

**When to use:** Any time validation surfaces a runtime error that matches an error class with a known healing strategy.

**Example:**

```typescript
// Source: Phase 8 ApprovalService + new HealingService
export class HealingService {
  constructor(
    private approvalService: ApprovalService,
    private quotaTracker: HealingQuotaTracker,
    private storage: Storage,
  ) {}

  /** Called by validation layer when a runtime (not contract) error is detected */
  async onRuntimeError(err: RuntimeError, ctx: { workbenchId: string; flowId: string; sessionId: string }): Promise<void> {
    // D-01: filter to runtime/logic errors only (caller already did this)
    // D-02: check daily quota
    const quota = await this.quotaTracker.getTodayQuota(ctx.workbenchId, ctx.flowId);
    if (quota.attemptsUsed >= 2) {
      await this.notifyCircuitBreakerActive(ctx, quota);
      return;
    }

    // D-03: create approval request — healing is NOT automatic
    const approval = this.approvalService.createRequest({
      action: 'heal_runtime_error',
      description: `Attempt to heal: ${err.message} (attempt ${quota.attemptsUsed + 1}/2 today)`,
      workbenchId: ctx.workbenchId,
      sessionId: ctx.sessionId,
    });

    // Store correlation so WS handler can execute healing on approval
    await this.storage.set!(
      `healingAttempt:${approval.id}`,
      JSON.stringify({ approvalId: approval.id, error: err, ctx, status: 'awaiting_approval' }),
    );

    // Broadcast to chat panel (D-03: appears as decision gate)
    this.broadcastHealingApprovalRequest(approval, err, ctx);
  }
}
```

### Pattern 5: Fork Metadata as Separate Entity (SDK Forks ≠ UI Forks)

**What:** Agent SDK `forkSession` handles conversation history branching. Phase 10 wraps this with a `ForkMetadata` entity that stores: user-provided description (D-14), parent sessionId, fork point (message index or timestamp), branch name.

**Key insight:** The SDK returns a new session ID — we store fork metadata keyed by that ID. Merge (D-13) is NOT a native Agent SDK operation — it's a user-visible concept that creates a NEW sessionId with merged context via a new `query()` call.

**Example:**

```typescript
// Source: packages/backend/src/services/sessionManager.ts (already exists) +
//         https://platform.claude.com/docs/en/agent-sdk/sessions (verified 2026-04-05)
export class ForkMetadataService {
  async createFork(
    parentSessionId: string,
    workbenchId: string,
    description: string,  // D-14: required
  ): Promise<ForkMetadata> {
    // Existing Phase 6 method does the SDK work
    const newSessionId = await sessionManager.forkSession(workbenchId);
    if (!newSessionId) throw new Error('Fork failed');

    const metadata: ForkMetadata = {
      id: crypto.randomUUID() as ForkId,
      parentSessionId,
      forkSessionId: newSessionId,
      workbenchId,
      description,
      createdAt: new Date().toISOString(),
      status: 'active',  // 'active' | 'merged' | 'abandoned'
    };

    await this.storage.set!(`fork:${parentSessionId}:${metadata.id}`, JSON.stringify(metadata));
    return metadata;
  }

  async mergeFork(forkId: ForkId, resolution: 'theirs' | 'parent' | 'manual', manualContent?: string): Promise<string> {
    // D-13: merge is a new session with merged context
    const fork = await this.getFork(forkId);
    // Build merged prompt based on resolution strategy, start new session via SessionManager
    // Mark original fork as 'merged'
    // Returns new merged sessionId
  }
}
```

### Anti-Patterns to Avoid

- **Reusing generic CircuitBreaker for D-02:** The existing `CircuitBreaker<T>` class counts failures within a single in-memory instance, opens/closes based on consecutive failures, and resets after a time window. D-02 requires persistent per-workbench-per-flow daily counters across restarts. Mapping D-02's 2-attempts-per-day onto `CircuitBreaker.failureThreshold=2, resetTimeout=86400000` would work for a single workbench-flow pair but would require dozens of in-memory instances and would lose state on backend restart. Build a dedicated `HealingQuotaTracker` that persists to storage.

- **Storing fork history as nested tree in one record:** D-12 explicitly says "not nested tree". Keep each fork as a flat entity keyed by fork ID with `parentSessionId` as a pointer. The UI renders by fetching all forks for a parent and displaying them as sibling tabs.

- **Running Croner in a web worker:** Croner is isomorphic but the scheduled task orchestration (dispatch to `SessionManager`, write run history to `Storage`) must happen in the backend process. Do not run cron jobs client-side.

- **Widening WorkbenchId in one breaking PR:** `WorkbenchId` is currently a string union (`'work' | 'explore' | ...`). Widening to branded string will cascade type errors through every component that switches on workbench ID. Plan a migration PR that: (1) introduces `DefaultWorkbenchId` as the 7-value union, (2) introduces `CustomWorkbenchId` as branded string, (3) makes `WorkbenchId = DefaultWorkbenchId | CustomWorkbenchId`, (4) fixes compile errors, (5) adds persist store.

- **Allowing default workbench deletion:** D-11 says "cannot modify the 7 default workbenches". Custom workbench CRUD must reject any attempt to delete/modify a default workbench ID. Enforce at route layer AND service layer.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cron expression parsing/validation | Custom regex on `0 9 * * 1-5` | **Croner 10.0.1** | DST correctness, leap year handling, L/W/# special chars, timezone support, next-run calculation — Croner does all of this in zero deps. Hand-rolled cron parsers are a known footgun. |
| Cron scheduling loop | `setInterval` that checks expressions every minute | **Croner** | Croner calculates next fire time precisely and self-corrects for system clock drift. `setInterval` drifts and fires late after system sleep. |
| Session forking | Copy messages to new session ID manually | **SDK `forkSession` via existing `SessionManager.forkSession()`** | The SDK writes a fresh `.jsonl` file with copied history to `~/.claude/projects/<encoded-cwd>/`. Hand-rolled copying would bypass Agent SDK's conversation format assumptions and break on future SDK updates. |
| Approval request lifecycle | Custom pending/approved/denied state + timeout logic | **Existing `ApprovalService`** (Phase 8) | Already has 120s timeout, broadcast integration, WS wire format. Healing just creates an approval with action='heal_runtime_error'. |
| Daily quota reset | Cron job to zero counters at midnight | **Date-keyed storage** (`healingQuota:{wb}:{flow}:{YYYY-MM-DD}`) | No scheduled job needed — just key by today's date. Yesterday's record becomes naturally irrelevant and can be GC'd weekly. |
| History truncation to last N | Manual array shifting with atomic writes | **Replace-on-write with `.slice(0, 10)`** | Since each task has its own storage key, there's no concurrent-write concern for D-08 truncation. |
| Unique ID generation | `Date.now() + Math.random()` | **`crypto.randomUUID()`** (Node 18+) or existing `uuid` package | Node 18+ has built-in `crypto.randomUUID()`. Project already has `uuid` installed for legacy use. |

**Key insight:** The hard work of Phase 10 is orchestration and integration, not primitive implementation. Every core primitive (cron, session fork, approval lifecycle, storage) exists already. The code being written is the glue between them.

---

## Common Pitfalls

### Pitfall 1: WorkbenchId Union Breakage

**What goes wrong:** Phase 10 must support user-created workbench IDs, but `WorkbenchId` is currently `'work' | 'explore' | 'review' | 'pm' | 'settings' | 'archive' | 'studio'`. Widening this in one change breaks every exhaustive switch statement and type guard.

**Why it happens:** The 7-entry static union was intentional for type safety during Phase 1–9 (no custom workbenches existed). Phase 10 adds runtime-created IDs that can't be known at compile time.

**How to avoid:** Two-step widening —
1. Introduce `DefaultWorkbenchId = 'work' | 'explore' | 'review' | 'pm' | 'settings' | 'archive' | 'studio'` as alias for current type.
2. Introduce `CustomWorkbenchId = string & { readonly __brand: 'CustomWorkbenchId' }` (branded).
3. Redefine `WorkbenchId = DefaultWorkbenchId | CustomWorkbenchId`.
4. Existing code uses `DefaultWorkbenchId` in switches (no runtime break since all existing callers pass default IDs).
5. `isDefaultWorkbench(id): id is DefaultWorkbenchId` helper gates custom-only behavior.

**Warning signs:** TypeScript errors like "type string is not assignable to type 'work' | 'explore' | ..." when passing custom workbench IDs. Switch statements with `never` type assertions failing.

### Pitfall 2: Skill Invocation Crossing Workbenches

**What goes wrong:** A skill in workbench A calls another skill by name that happens to exist in workbench B, leaking context.

**Why it happens:** Skills have user-provided names, and duplicate names across workbenches are inevitable. Without strict scope enforcement, the resolver might find a skill in the wrong workbench.

**How to avoid:** Store skills keyed by `(workbenchId, skillId)` tuple. Invocation API accepts the workbenchId explicitly. Service layer rejects lookups that cross workbench boundary. Enforce D-06 at both the API and the SessionManager level — the session's workbenchId must match the skill's workbenchId.

**Warning signs:** Skill executions where the system prompt differs from the active workbench's personality. Chat messages from skill invocations appearing in the wrong workbench's chat panel.

### Pitfall 3: Cron Job Not Firing After System Sleep

**What goes wrong:** Scheduled task misses its fire time because the backend was suspended (laptop sleep, container pause). User sees task "scheduled for 9am" but no run recorded.

**Why it happens:** `setInterval`-based schedulers drift and miss fires. Croner recalculates next fire time on each iteration, but if the process was frozen across the fire time, that fire is simply skipped.

**How to avoid:** On backend startup, compare `lastRunAt` against `previousRun()` from Croner for each active task. If `lastRunAt < previousRun()`, the task was missed — log it. Do NOT auto-retry (violates D-09), but surface the miss to the user via the task history row with status `'missed'`.

**Warning signs:** Task history rows gap-absent for times when backend was down. Next-run display correct but run history sparse.

### Pitfall 4: Fork Metadata Orphaned from SDK Session

**What goes wrong:** User creates a fork with description via the UI. The SDK `forkSession` succeeds, `ForkMetadata` is written to Storage. Later, user deletes the underlying session file manually from `~/.claude/projects/` — or the SDK prunes it. ForkMetadata now references a non-existent session ID.

**Why it happens:** Phase 10 adds a metadata layer on top of Agent SDK sessions but doesn't own the session lifecycle. The SDK's `.jsonl` files are outside our control.

**How to avoid:** On fork read, verify the referenced session exists via `getSessionInfo(sessionId)`. If missing, mark the fork as `status: 'abandoned'` in Storage. Periodic cleanup job (daily, via Croner) prunes abandoned forks older than 30 days.

**Warning signs:** `getSessionInfo` throwing "session not found" when resuming a fork. Fork list showing sessions that can't be opened.

### Pitfall 5: Runtime vs Contract Error Classification Ambiguity

**What goes wrong:** D-01 says circuit breaker counts "runtime/logic errors only" — NOT contract violations. But some violations straddle both: a TypeScript type error at runtime could be classified either way.

**Why it happens:** The validation layer produces `ViolationSignal`s with a `rule` field (e.g., "no-raw-hex", "no-inline-style") but no explicit "runtime vs contract" dimension.

**How to avoid:** Define an explicit error classification in `packages/shared/src/healingTypes.ts`:
```typescript
export type ErrorClass =
  | 'runtime'       // TypeError, ReferenceError, null access — triggers healing
  | 'contract'      // design system violation, format mismatch — does NOT trigger healing
  | 'build'         // TypeScript compile error — treat as runtime (triggers healing)
  | 'test_failure'; // assertion failed — triggers healing
```
Map each `ViolationSignal.rule` to exactly one `ErrorClass` via a lookup table. Only classes in `{ runtime, build, test_failure }` create healing approval requests.

**Warning signs:** Healing requests appearing for "no-raw-hex" violations (should not happen per D-01). Healing circuit breaker tripping because contract violations burn quota.

### Pitfall 6: Zustand persist + Map Serialization

**What goes wrong:** Zustand's default JSON serializer drops `Map` entries silently. `useSkillStore` hydrates on reload with empty maps.

**Why it happens:** `JSON.stringify(new Map([['a', 1]]))` returns `"{}"`. The persist middleware uses JSON.stringify by default.

**How to avoid:** Either (a) use plain objects `Record<WorkbenchId, Skill[]>` instead of `Map<WorkbenchId, Skill[]>` in persisted stores, or (b) provide custom `storage` with Map↔Array conversion (see Pattern 2 code example above). Option (a) is simpler.

**Warning signs:** Skills / custom workbenches disappear on page reload despite being "persisted". localStorage shows `{}` instead of entries.

---

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — this is a greenfield additive phase. New entities only. No data migration required. | No action |
| Live service config | None — no external services configured with workbench names in their configuration. | No action |
| OS-registered state | None — no OS-level tasks, services, or daemons are registered with workbench names. Backend process owns all scheduling internally. | No action |
| Secrets/env vars | None — new features don't require new env vars. `AFW_API_KEY` and `AFW_CORS_ORIGINS` remain unchanged. | No action |
| Build artifacts | None — no package renames or binary artifacts change. Croner adds a new `node_modules/croner` directory but no stale artifacts. | No action |

**This is NOT a rename/refactor phase** — Phase 10 is purely additive. No existing runtime state is renamed or restructured. However, **one migration does exist**: widening `WorkbenchId` from union to union-of-union (see Pitfall 1). This is a **code edit only** — no stored data uses WorkbenchId as a key today, so no data migration is needed. Existing localStorage keys (none use WorkbenchId directly) remain valid.

---

## Code Examples

Verified patterns from official sources:

### Croner: Schedule a task with timezone and get next run

```typescript
// Source: https://croner.56k.guru (verified 2026-04-05)
import { Cron } from 'croner';

const job = new Cron(
  '0 9 * * 1-5',                        // Weekday 9am
  { timezone: 'America/New_York' },
  async () => {
    await runScheduledAction();
  }
);

// Introspection (needed for D-08 "next run time" display)
console.log(job.nextRun());              // Date of next fire
console.log(job.nextRuns(5));            // Next 5 fires
console.log(job.previousRun());          // Date of last fire (null if never ran)
console.log(job.currentRun());           // Date currently being processed (null if idle)

// Lifecycle
job.pause();
job.resume();
job.stop();                              // Permanently stop
console.log(job.isRunning());            // boolean
```

### Agent SDK: Fork a session

```typescript
// Source: https://platform.claude.com/docs/en/agent-sdk/sessions (verified 2026-04-05)
// Also: packages/backend/src/services/sessionManager.ts line 321 (already wired)
import { query } from '@anthropic-ai/claude-agent-sdk';

let forkedId: string | undefined;

for await (const message of query({
  prompt: "Instead of JWT, implement OAuth2 for the auth module",
  options: {
    resume: sessionId,
    forkSession: true
  }
})) {
  if (message.type === "system" && message.subtype === "init") {
    forkedId = message.session_id;  // The fork's ID
  }
  if (message.type === "result" && message.subtype === "success") {
    console.log(message.result);
  }
}
```

**Note:** The existing `SessionManager.forkSession()` uses the `sdkForkSession` helper (different API than above — no prompt needed). Both approaches create forks; the service uses the helper for creating an empty fork that the user will interact with next.

### Existing ApprovalService usage (reuse for healing)

```typescript
// Source: packages/backend/src/services/approvalService.ts (verified in repo)
import { approvalService } from './approvalService.js';

const request = approvalService.createRequest({
  action: 'heal_runtime_error',
  description: 'Attempt to heal: TypeError on flow "harmony-audit" (attempt 1/2 today)',
  workbenchId: 'work',
  sessionId: currentSessionId,
});

// Client polls or receives via WebSocket broadcast
// On approval:
const resolved = approvalService.resolveRequest(request.id, 'approved');
if (resolved?.status === 'approved') {
  // Trigger healing logic
  await healingService.executeHealingAttempt(request.id);
}
```

### Storage key-value pattern (reuse for all new entities)

```typescript
// Source: packages/backend/src/services/healingRecommendations.ts (existing pattern)
class EntityService {
  constructor(private storage: Storage) {}

  async list(prefix: string): Promise<Entity[]> {
    if (!('keys' in this.storage) || typeof this.storage.keys !== 'function') {
      return [];
    }
    const keys = await this.storage.keys(prefix);
    const entities: Entity[] = [];
    for (const key of keys) {
      const data = await this.storage.get!(key);
      if (data) entities.push(JSON.parse(data));
    }
    return entities;
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| node-cron 2.x for Node.js scheduling | Croner 10.x (TS-native, isomorphic, DST-aware) | Croner reached maturity ~2024; node-cron still popular but lacks next-run API | Choose Croner when you need introspection (next run times, pause/resume, timezone). |
| Manual session forking via message copying | `forkSession: true` option in `query()` (SDK native) | Agent SDK 0.2.x added native fork support late 2025 | Don't hand-roll — the SDK creates a proper `.jsonl` file in `~/.claude/projects/`. |
| `setInterval` with heartbeat loops | Cron-expression schedulers | Industry standard since ~2015, but Croner revived quality in JS | Croner self-corrects drift; `setInterval` does not. |
| Zustand stores without persistence | Zustand + `persist` middleware + custom Map serialization | Persist has been stable since 2022; Map support requires custom storage adapter | Use `persist` for user-created data; keep ephemeral state in vanilla stores. |

**Deprecated/outdated:**
- Any in-memory-only healing counter — violates D-02's "daily" semantic which requires persistence across backend restarts.
- Phase 8 `ApprovalService` storing requests only in memory — acceptable for v1 since approvals time out in 120s, but Phase 10 healing may want longer-lived approval history (deferred enhancement).

---

## Open Questions

1. **CUSTOM-06 (Learning persistence UI) has no CONTEXT decisions.**
   - What we know: Requirement listed in ROADMAP.md for Phase 10. Mentioned implicitly in D-04 ("Learnings update to prevent recurrence").
   - What's unclear: UX, data model, source (Phase 8 gate traces? `.claude/actionflows/LEARNINGS.md`?), search scope.
   - Recommendation: **Flag to planner — request CONTEXT supplement or defer CUSTOM-06 to Phase 11**.

2. **CUSTOM-07 (MCP server configuration panel) has no CONTEXT decisions.**
   - What we know: Requirement listed. `@modelcontextprotocol/sdk` is in dependencies. `packages/mcp-server/` exists.
   - What's unclear: Which MCP servers are configurable? Where does config persist? Is this just a form wrapper around `~/.claude/mcp-servers.json`?
   - Recommendation: **Flag to planner — request CONTEXT supplement or defer CUSTOM-07 to Phase 11**.

3. **Merge conflict resolution algorithm for forks (D-13).**
   - What we know: Users pick "theirs/parent/manual merge". CONTEXT.md marks exact algorithm as "Claude's Discretion".
   - What's unclear: What does "theirs" mean when conversation histories diverge? Concatenation? Replacement? How does "manual" UI work?
   - Recommendation: Plan v1 with simplest strategy — replace-entire-history (theirs wins or parent wins, full swap). Defer three-way-merge UI.

4. **Skills invocation contract — are skills "tools" or "slash-commands"?**
   - What we know: D-05 says form creates Name, Description, Trigger pattern, Action description. D-06 says skills can call other skills.
   - What's unclear: Is the trigger pattern a regex, a slash command, or a keyword? Does invocation happen via agent-side detection (agent notices user typed the trigger) or via explicit slash command routing (frontend parses `/skill-name`)?
   - Recommendation: Plan v1 as **explicit invocation only** (user clicks skill from a panel or types `/skill-name`). Defer trigger-pattern auto-detection.

5. **Custom workbench layout storage.**
   - What we know: D-10 says users configure "layout preferences".
   - What's unclear: What layout is configurable? Panel sizes? Pipeline collapse state? Which columns shown?
   - Recommendation: Plan v1 with ONE layout customization — default collapsed/expanded state of each panel (sidebar, chat, pipeline). Defer arbitrary panel positioning.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js ≥18.0 | Croner runtime | ✓ (assumed — pnpm 10.29 requires it) | (not explicitly pinned) | — |
| pnpm | Installing croner | ✓ | 10.29.3 | — |
| `@anthropic-ai/claude-agent-sdk` | Session forking | ✓ | ^0.2.91 installed | — |
| Croner | Cron scheduling | ✗ (not yet installed) | — | Install via pnpm |
| `zustand/middleware` persist | Client persistence | ✓ (zustand installed) | latest via zustand | LocalStorage direct access (worse DX) |
| localStorage | Zustand persist | ✓ (browser/Electron) | — | — |
| Redis (optional) | Storage backend | ✓ or ✗ (env-dependent) | 5.3 if used | MemoryStorage (already fallback) |

**Missing dependencies with no fallback:** None — all required infrastructure is available or trivially installable.

**Missing dependencies with fallback:** Croner is not installed yet; pnpm install is one command. No fallback needed since the feature can simply block on the install step.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | **Vitest 4.0** (backend: `@afw/backend`, app: `@afw/app`) |
| Config files | `packages/backend/vitest.config.ts`, `packages/app/vitest.config.ts` |
| Quick run command | `pnpm -F @afw/backend test -- --run packages/backend/src/services/__tests__/X.test.ts` |
| Full suite command | `pnpm test` (monorepo) or `pnpm -r test` |
| E2E (UI critical paths) | **Playwright 1.58.2** via `pnpm test:pw` |
| Type check | `pnpm type-check` (monorepo) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CUSTOM-01 | HealingQuotaTracker enforces 2-per-day per workbench-flow | unit | `pnpm -F @afw/backend test -- healingQuotaTracker` | ❌ Wave 0 |
| CUSTOM-01 | HealingService creates approval via ApprovalService on runtime error | unit | `pnpm -F @afw/backend test -- healingService` | ❌ Wave 0 |
| CUSTOM-01 | ErrorClass classifier routes only runtime/build/test to healing | unit | `pnpm -F @afw/backend test -- errorClass` | ❌ Wave 0 |
| CUSTOM-01 | Daily quota resets at midnight (date-keyed storage) | unit | `pnpm -F @afw/backend test -- healingQuotaTracker.test.ts -t "daily reset"` | ❌ Wave 0 |
| CUSTOM-02 | Skill CRUD via storage service | unit | `pnpm -F @afw/backend test -- skillService` | ❌ Wave 0 |
| CUSTOM-02 | Skill invocation rejected across workbench boundary | unit | `pnpm -F @afw/backend test -- skillService.test.ts -t "workbench scope"` | ❌ Wave 0 |
| CUSTOM-02 | skillStore loads + persists per workbench | unit | `pnpm -F @afw/app test -- skillStore` | ❌ Wave 0 |
| CUSTOM-03 | Croner schedules and fires task, records run history | unit | `pnpm -F @afw/backend test -- scheduledTaskService` | ❌ Wave 0 |
| CUSTOM-03 | History pruned to last 10 runs (D-08) | unit | `pnpm -F @afw/backend test -- scheduledTaskService.test.ts -t "prune history"` | ❌ Wave 0 |
| CUSTOM-03 | Manual trigger executes task immediately (D-09) | unit | `pnpm -F @afw/backend test -- scheduledTaskService.test.ts -t "manual trigger"` | ❌ Wave 0 |
| CUSTOM-03 | Failed task does NOT retry (D-09) | unit | `pnpm -F @afw/backend test -- scheduledTaskService.test.ts -t "no retry on failure"` | ❌ Wave 0 |
| CUSTOM-03 | `getNextRun()` returns Croner `nextRun()` | unit | `pnpm -F @afw/backend test -- scheduledTaskService.test.ts -t "next run"` | ❌ Wave 0 |
| CUSTOM-04 | CustomWorkbench CRUD rejects modifying defaults (D-11) | unit | `pnpm -F @afw/backend test -- customWorkbenchService` | ❌ Wave 0 |
| CUSTOM-04 | customWorkbenchStore merges custom into WORKBENCHES list | unit | `pnpm -F @afw/app test -- customWorkbenchStore` | ❌ Wave 0 |
| CUSTOM-04 | WorkbenchId type widening compiles (no regressions) | type-check | `pnpm type-check` | ✓ exists |
| CUSTOM-05 | ForkMetadataService creates fork via SessionManager, stores metadata | integration | `pnpm -F @afw/backend test -- forkMetadataService` | ❌ Wave 0 |
| CUSTOM-05 | Fork description required (D-14) | unit | `pnpm -F @afw/backend test -- forkMetadataService.test.ts -t "description required"` | ❌ Wave 0 |
| CUSTOM-05 | Merge creates new sessionId, marks fork as merged (D-13) | integration | `pnpm -F @afw/backend test -- forkMetadataService.test.ts -t "merge"` | ❌ Wave 0 |
| CUSTOM-05 | ForkBadge component renders at fork point | component | `pnpm -F @afw/app test -- ForkBadge` | ❌ Wave 0 |
| CUSTOM-01 (UI) | HealingApprovalCard renders in chat when healing request received | component | `pnpm -F @afw/app test -- HealingApprovalCard` | ❌ Wave 0 |
| CUSTOM-03 (UI) | ScheduledTasksPanel shows status, next run, history | component | `pnpm -F @afw/app test -- ScheduledTasksPanel` | ❌ Wave 0 |
| CUSTOM-04 (UI) | CustomWorkbenchesPanel creates + lists custom workbenches | component | `pnpm -F @afw/app test -- CustomWorkbenchesPanel` | ❌ Wave 0 |
| Full-stack smoke | Create scheduled task → wait for fire → verify run history | e2e | `pnpm test:pw -- scheduled-task-smoke.spec.ts` | ❌ Wave 0 |
| Full-stack smoke | Fork session → message fork → verify original untouched | e2e | `pnpm test:pw -- session-fork-smoke.spec.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm -F @afw/{affected-package} test -- --run {affected-test-file}` (< 10s)
- **Per wave merge:** `pnpm test` (monorepo unit suite) + `pnpm type-check` (< 2 minutes)
- **Phase gate:** Full suite green (`pnpm test && pnpm type-check`) + Playwright smoke suite (`pnpm test:pw`) before `/gsd:verify-work`

### Wave 0 Gaps

All test files below MUST be created in Wave 0 (pre-implementation) so tests run first, fail (red), then pass as implementation lands:

- [ ] `packages/backend/src/services/__tests__/healingQuotaTracker.test.ts`
- [ ] `packages/backend/src/services/__tests__/healingService.test.ts`
- [ ] `packages/backend/src/services/__tests__/errorClass.test.ts`
- [ ] `packages/backend/src/services/__tests__/skillService.test.ts`
- [ ] `packages/backend/src/services/__tests__/scheduledTaskService.test.ts`
- [ ] `packages/backend/src/services/__tests__/customWorkbenchService.test.ts`
- [ ] `packages/backend/src/services/__tests__/forkMetadataService.test.ts`
- [ ] `packages/app/src/stores/skillStore.test.ts`
- [ ] `packages/app/src/stores/scheduleStore.test.ts`
- [ ] `packages/app/src/stores/customWorkbenchStore.test.ts`
- [ ] `packages/app/src/stores/healingStore.test.ts`
- [ ] `packages/app/src/stores/forkStore.test.ts`
- [ ] `packages/app/src/workbenches/settings/SkillsPanel.test.tsx`
- [ ] `packages/app/src/workbenches/settings/ScheduledTasksPanel.test.tsx`
- [ ] `packages/app/src/workbenches/settings/CustomWorkbenchesPanel.test.tsx`
- [ ] `packages/app/src/workbenches/chat/HealingApprovalCard.test.tsx`
- [ ] `packages/app/src/workbenches/chat/ForkBadge.test.tsx`
- [ ] `test/e2e/scheduled-task-smoke.spec.ts`
- [ ] `test/e2e/session-fork-smoke.spec.ts`

**Framework install:** Croner — `pnpm -F @afw/backend add croner`. All other test dependencies (vitest, playwright, @testing-library/react, happy-dom) already installed.

---

## Dependency & Blocker Matrix

This phase is built on Phases 6, 7, 8, and 9. All blockers have been resolved — here's the dependency state verified as of 2026-04-05:

| Phase 10 Subsystem | Depends On | Phase Status | Proof | Risk |
|--------------------|------------|--------------|-------|------|
| **Self-Healing Flows** (CUSTOM-01) | Phase 8 ApprovalService, Phase 8 ValidationLayer signals, Storage key-value API | ✅ Phase 8 VERIFIED 2026-04-03 | `approvalService.ts` exists at `packages/backend/src/services/`; `ViolationSignal` in shared types | Low |
| **Per-Workbench Skills** (CUSTOM-02) | Phase 6 SessionManager.sendMessage, Phase 9 Settings workbench | ✅ Phase 6 VERIFIED 2026-04-02; Phase 9 in progress but Settings page exists | `sessionManager.ts` has sendMessage; `SettingsPage.tsx` exists | Low |
| **Scheduled Tasks** (CUSTOM-03) | Storage key-value API, WebSocket event broadcast, optionally SessionManager for flow dispatch | ✅ All dependencies in Phases 1–8, VERIFIED | `storage/index.ts` line 186+ generic K/V ops; `hub.ts` exists for broadcast | Low — self-contained |
| **Custom Workbenches** (CUSTOM-04) | Phase 6 SessionManager, Phase 9 WORKBENCHES array, Phase 8 ApprovalService, entire workbench rendering pipeline | ⚠️ Phase 9 in progress (5 plans, 1 complete) | `types.ts` WORKBENCHES is static — needs widening | **Medium — widest cross-cutting change** |
| **Session Forking** (CUSTOM-05) | Phase 6 SessionManager.forkSession | ✅ Phase 6 VERIFIED, `forkSession` already implemented | `sessionManager.ts:321` `forkSession` wraps `sdkForkSession` | Low |

**STATE.md stale note:** The `.planning/STATE.md` file lists Phases 6 and 7 as "Not started / Pending" — this is stale. Both phases have VERIFICATION.md files with `status: passed`. Planner should not block on Phase 6/7 concerns.

**Phase 9 partial dependency:** Custom Workbenches (CUSTOM-04) depends on Phase 9's WORKBENCHES shape. If Phase 9 finalizes `WorkbenchMeta` with new fields (e.g., pipeline defaults), Phase 10's `CustomWorkbench` model must match. Coordinate: wait for Phase 9 plan 04-05 to land before finalizing CustomWorkbench shape, OR treat CustomWorkbench as a super-set that Phase 9 defaults conform to.

**Independent shipping order (recommended):**
1. **Session Forking** (CUSTOM-05) — lowest risk, backend already done, just UI
2. **Scheduled Tasks** (CUSTOM-03) — self-contained, new Croner dependency
3. **Self-Healing Flows** (CUSTOM-01) — needs ErrorClass classifier design
4. **Per-Workbench Skills** (CUSTOM-02) — needs invocation protocol decision
5. **Custom Workbenches** (CUSTOM-04) — type widening is the biggest change; ship last

---

## Project Constraints (from CLAUDE.md)

The following directives were extracted from `D:\ActionFlowsDashboard\CLAUDE.md` and `D:\ActionFlowsDashboard\.claude\CLAUDE.md`. All Phase 10 plans MUST comply:

**Tech Stack (preserve):**
- React 18 + TypeScript + Vite (frontend)
- Express + ws (backend)
- pnpm monorepo
- Electron 35.7.5 wrapper must continue to function

**Design System (enforced):**
- No raw CSS in agent output
- Component library (`packages/app/src/components/ui/`) is the only way agents build UI
- Radix primitives + Tailwind v4 + CVA variants
- `cn()` utility for class composition

**TypeScript (strict):**
- Strict mode enabled (`strict: true` + `noUncheckedIndexedAccess: true`)
- Branded types for all IDs (SessionId, ChainId, StepId, UserId)
- No `as any` bypasses
- All packages use ES modules (`"type": "module"`)
- Workspace imports via `@afw/*` aliases

**Naming Conventions (enforced):**
- Components: PascalCase `.tsx`
- Hooks: camelCase with `use` prefix
- Services: camelCase (e.g., `skillService.ts`)
- Routes: lowercase kebab-case (e.g., `scheduled-tasks.ts` — but existing routes use `camelCase.ts` like `approvals.ts`; follow existing pattern)
- Tests: `*.test.ts` or `*.spec.ts`
- Interfaces: PascalCase, Props suffixed with `Props`
- Constants: UPPER_SNAKE_CASE
- Env vars: `AFW_CONSTANT_NAME`

**Logging:**
- All logs include module prefix: `[ServiceName] message`
- Log levels: `console.log/error/warn/debug`

**GSD Workflow:**
- Do not make direct repo edits outside GSD workflow unless user explicitly requests bypass

**Claude Code Dependency:**
- Framework relies on Claude Code features (remote sessions, hooks, /btw, cron, streaming)
- Must work within Claude Code's API surface

---

## Sources

### Primary (HIGH confidence)

- **Agent SDK Sessions docs (`forkSession` API):** https://platform.claude.com/docs/en/agent-sdk/sessions (fetched 2026-04-05)
- **Croner homepage:** https://croner.56k.guru (fetched 2026-04-05) — API surface, isomorphic support, timezone, `nextRun()`
- **Croner GitHub:** https://github.com/Hexagon/croner — zero-dep, TypeScript-native
- **npm registry:** `npm view croner version` → 10.0.1 (published 2026-02-21); `npm view node-cron version` → 4.2.1 (2026-03-18); `npm view @anthropic-ai/claude-agent-sdk version` → 0.2.92
- **Existing repo code (verified in source):**
  - `packages/backend/src/services/sessionManager.ts` line 321: `forkSession` method already implemented
  - `packages/backend/src/services/approvalService.ts`: full approval lifecycle
  - `packages/backend/src/infrastructure/circuitBreaker.ts`: generic circuit breaker (rejected for D-02)
  - `packages/backend/src/storage/index.ts` lines 186–189: generic K/V storage API
  - `packages/backend/src/services/healingRecommendations.ts`: existing pattern for K/V iteration
  - `packages/app/src/lib/types.ts`: `WorkbenchId` union + `WORKBENCHES` array
  - `packages/app/src/stores/sessionStore.ts`, `validationStore.ts`, `flowStore.ts`: Zustand store patterns
- **Phase verification artifacts:**
  - `.planning/phases/06-agent-sessions-status/06-VERIFICATION.md`: Phase 6 PASSED
  - `.planning/phases/07-chat-panel/07-VERIFICATION.md`: Phase 7 PASSED
  - `.planning/phases/08-neural-validation-safety/`: Phase 8 complete (per roadmap)

### Secondary (MEDIUM confidence)

- **PkgPulse blog comparing schedulers:** https://www.pkgpulse.com/blog/node-cron-vs-node-schedule-vs-croner-task-scheduling-nodejs-2026 (verified with Croner official docs)
- **Zustand persist middleware docs:** https://zustand.docs.pmnd.rs/reference/middlewares/persist
- **BSWEN blog on Claude Code session forking:** https://docs.bswen.com/blog/2026-03-22-claude-code-session-forking/

### Tertiary (LOW confidence)

- None — all claims cross-verified against official docs or repo code.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Croner version verified via npm, API verified via official docs
- Architecture: HIGH — reuses patterns already proven in codebase (Storage K/V, ApprovalService, SessionManager.forkSession)
- Pitfalls: HIGH — most derived from reading actual Phase 1–9 code, not speculation
- Data models: MEDIUM — branded types proposed based on existing patterns but not locked with user

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stable domain, no fast-moving breakage expected; re-check Agent SDK version before implementation since it's on 0.2.x)

---

*Research for Phase 10: Customization & Automation*
*Consumes: 10-CONTEXT.md (D-01..D-14)*
*Produces: findings for downstream planner*
