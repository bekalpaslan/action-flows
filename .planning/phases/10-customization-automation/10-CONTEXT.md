# Phase 10: Customization & Automation - Context

**Gathered:** 2026-04-04  
**Status:** Ready for planning

<domain>
## Phase Boundary

The system sustains itself through self-healing flows, and users extend it with custom workbenches, skills, and automation. Phase 10 delivers:

1. **Self-healing flows** — Automatic validate-signal-fix-re-validate cycles with circuit breaker
2. **Per-workbench skills** — Reusable commands scoped to individual workbenches
3. **Scheduled tasks UI** — Recurring automations with status, history, manual triggers
4. **Custom workbenches** — Users create new workbenches beyond the 7 defaults
5. **Session forking** — Branch conversations to explore alternatives

Success criteria depend on Phase 8 (Neural Validation & Safety) and Phase 9 (Workbenches & Flow Management).

</domain>

<decisions>
## Implementation Decisions

### Self-Healing Flows (D-01 through D-04)

**D-01: Failure Detection Scope**
- Circuit breaker counts **runtime/logic errors only** (actual code/functionality breakage)
- Contract violations (design system, output format) do NOT trigger healing attempts
- Rationale: Healing should focus on fixing broken logic, not style issues

**D-02: Circuit Breaker Quota**
- Track failures **per-workbench per-flow** with daily reset
- Each workbench-flow pair gets maximum 2 healing attempts per calendar day
- After 2 failed attempts in one day, flow stops attempting healing and reports "Circuit breaker active"
- Rationale: Prevents spam healing on broken flows; allows fresh attempts tomorrow

**D-03: User Visibility**
- Healing is **not automatic** — requires manual user approval
- When validation detects a runtime error: show approval checkpoint in chat
- User can approve healing or investigate manually
- Once approved, healing attempt happens (fix + re-validate)
- Rationale: Intentional healing over silent repairs; user stays in control

**D-04: Healing Outcomes**
- On success (after fix and re-validation): flow continues normally, logs success to learnings
- On failure (2 attempts exhausted or user declines): flow stops, user is notified
- Learnings update to prevent recurrence of same error class

### Skills: Reusable Workbench Commands (D-05 through D-06)

**D-05: Skills Creation Method**
- Users create skills via **UI form in Settings**
- Form fields: Name, Description, Trigger pattern, Action description
- No code editor required (v1 simplification)
- Rationale: Accessible to non-technical users; power users can extend via flows later

**D-06: Skills Scope & Reuse**
- Skills are scoped to a single workbench (cannot leak data across workbenches)
- Skills can call other skills within the same workbench
- Cross-workbench skill calls not allowed (scope isolation enforced)
- Rationale: Each workbench maintains its own context boundary

### Scheduled Tasks UI (D-07 through D-09)

**D-07: Schedule Format**
- Use **cron expressions** (standard 5-field cron syntax)
- Example: `0 9 * * 1-5` for weekday 9am
- Rationale: Powerful, standard, familiar to technical users

**D-08: Execution History**
- Retain **last 10 executions** per scheduled task
- Oldest runs automatically pruned when limit exceeded
- Users can see status (success/failure), timestamp, duration per run
- Rationale: Balances storage and visibility; enough to spot patterns

**D-09: Manual Triggers & Failure Handling**
- Users can **manually trigger scheduled tasks at any time** (Run Now button always available)
- On failure: **Log the error, notify user, do not auto-retry**
- Failed tasks do not block future scheduled runs
- Rationale: Manual intervention always available; failures don't cascade

### Custom Workbenches (D-10 through D-11)

**D-10: Creation & Configuration**
- Custom workbenches created via **full configuration UI**
- Users configure: name, personality, system prompt snippet, initial flows, layout preferences
- Not template-based (power users have full control from start)
- Rationale: Aligns with Phase 9's personality-driven workbench design

**D-11: Persistence & Interaction**
- Custom workbenches persist per-user/per-session like defaults
- Custom workbenches have their own session, pipeline, chat, flows (same structure as defaults)
- Users can edit workbench personality/config after creation (via Settings)
- Cannot modify the 7 default workbenches (can only create new ones)

### Session Forking (D-12 through D-14)

**D-12: Fork Point Visualization**
- Fork points shown with **simple badge indicator** in history
- Forked branches listed separately below the fork point (not nested tree)
- Example: "Main history... [Fork badge] Fork A, Fork B, Fork C" listed as tabs/separate views
- Rationale: Cleaner UI, avoids visual complexity of tree structure

**D-13: Merge Capability**
- Forks are **mergeable back** to parent branch with **conflict resolution**
- Users select how to resolve conflicts (theirs/parent/manual merge)
- Merged state updates session history to show merge commit
- Rationale: Users can explore alternatives and bring ideas back to main

**D-14: Fork Naming & Limits**
- **Required fork description** — user must provide intent when creating fork
- No hard limit on fork count (unlimited forks allowed per session)
- Rationale: Intentional branching (required description prevents throwaway forks); no artificial limits

### Claude's Discretion

- Exact styling/layout for scheduled tasks UI
- Exact conflict resolution algorithm for merges (as long as user has choices)
- Healing prompt refinement (how to guide agents to fix the detected error)
- Custom workbench layout options (beyond name/personality/context)
- Fork visualization beyond simple badge (explore better UX if needed during planning)

</decisions>

<specifics>
## Specific Ideas

- Self-healing should feel like a "suggestion + approval" system, not magic background fixes
- Skills should be discoverable/browsable within each workbench (future enhancement)
- Scheduled tasks should show next run time prominently
- Custom workbenches should be visually distinct from defaults (color indicator or icon)
- Forks are for exploration — encourage naming them descriptively (e.g., "Try aggressive refactor", "Conservative approach")

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning:**

### Self-Healing Flows
- `.planning/ROADMAP.md` § Phase 8: Neural Validation & Safety — defines validation layer, signals, approval gates
- `.planning/REQUIREMENTS.md` § CUSTOM-01 — self-healing flow requirement and acceptance criteria

### Skills & Custom Workbenches
- `.planning/phases/09-workbenches-flow-management/09-CONTEXT.md` — Phase 9 decisions on personality, shared components, flows
- `.planning/REQUIREMENTS.md` § CUSTOM-02 — per-workbench skills requirement
- `.planning/REQUIREMENTS.md` § CUSTOM-04 — custom workbench creation requirement

### Scheduled Tasks UI
- `.planning/REQUIREMENTS.md` § CUSTOM-03 — scheduled tasks requirement and acceptance criteria
- `packages/shared/src/` — Existing session event types and state management patterns

### Session Forking
- `.planning/REQUIREMENTS.md` § CUSTOM-05 — session forking requirement
- `.planning/phases/07-chat-panel/07-CONTEXT.md` — chat history structure and conversation design

### General
- `.planning/PROJECT.md` — Overall agentic OS vision, design system, and component library constraints
- `CLAUDE.md` — Project coding conventions, TypeScript patterns, component structure rules

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `sessionStore.ts` — Already tracks per-workbench session state; can extend for custom workbenches
- `flowStore.ts` — Handles flow loading and context querying; skills can follow similar pattern
- `ApprovalService` (Phase 8) — Existing approval/gate infrastructure can be reused for healing approval checkpoints
- `scheduleTask` CLI command — Existing cron infrastructure in Claude Code; UI wraps this
- `validationStore.ts` — Tracks violations; healing flow can query this to know what failed

### Established Patterns
- **Per-workbench isolation:** Phase 9 established workbench personality + context scoping — extend this for skills
- **Flow composition:** Phase 9's FlowComposer shows how users build flows — skills follow similar UX pattern
- **Store-based state:** All workbench state managed via Zustand stores (sessionStore, flowStore, validationStore) — maintain this pattern for custom workbenches and scheduled tasks
- **Chat integration:** All workbench updates surface in chat; healing approval checkpoint appears as a decision gate in chat

### Integration Points
- Custom workbenches register themselves in workbench roster (similar to how 7 defaults are seeded)
- Healing flows hook into existing validation layer (D-08 approval gate from Phase 8)
- Scheduled tasks trigger workflows via existing action dispatch system
- Session forking extends existing session history structure in sessionStore

</code_context>

<deferred>
## Deferred Ideas

- Skills browser/library view — suggested during discussion, deferred to Phase 11+ (cross-workbench skills discovery)
- Skills code editor — users can write JavaScript/prompt code for skills; Phase 11 (after UI form v1 proves concept)
- Scheduled task notifications to Slack/email — separate integration phase
- Fork visualization as interactive tree — explored if simple badge feels limiting during planning
- Conflict resolution UI (visual merge tool) — deferred; start with simple text choice (theirs/parent)
- Workbench templates — deferred; let users build from scratch or use defaults as reference
- Scheduled task retry policies — deferred; start with no retries (D-09), add backoff logic in Phase 11

</deferred>

---

*Phase: 10-customization-automation*  
*Context gathered: 2026-04-04*
