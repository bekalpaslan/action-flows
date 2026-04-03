# Phase 8: Neural Validation & Safety - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Agents cannot bypass the design system. PreToolUse hooks validate every file edit against design token patterns and block violations before they land. PostToolUse hooks audit compliance. Violation signals reach agents via WebSocket. A checkpoint/rollback timeline in the pipeline panel enables one-click revert of agent commits. Human-in-the-loop approval gates block destructive operations with configurable autonomy levels per workbench.

</domain>

<decisions>
## Implementation Decisions

### Hook Validation Strategy
- **D-01:** Use regex pattern matching in PreToolUse hooks for violation detection (not AST parsing). Fast, simple to maintain.
- **D-02:** Block edits that violate design system rules. Hook returns non-zero exit code; Claude Code prevents the file write from landing. Agent sees rejection reason and must fix.
- **D-03:** Moderate strictness: block raw hex colors (#fff, rgb()), inline style= attributes. Allow raw HTML elements (component library preferred but not enforced for elements).
- **D-04:** Only validate .tsx and .css files. Pure .ts logic files are exempt to avoid false positives.

### /btw Signal Design
- **D-05:** Violation signals delivered via WebSocket broadcast to the active workbench session. Backend emits violation event on the workbench's WS channel. Violations for inactive workbenches queue until session starts.
- **D-06:** Agents auto-fix critical violations immediately. Pause current work, fix, resume. Critical violations are blocking.
- **D-07:** Severity levels: Critical = blocked edit (raw hex/inline style in PreToolUse). Warning = allowed edit with issue (non-token color in PostToolUse). Info = style suggestion (could use better token).

### Checkpoint/Rollback UX
- **D-08:** Git-based revert. Each checkpoint is a git commit hash. Revert creates a new commit that undoes changes back to that point. Clean history, no data loss.
- **D-09:** Checkpoint timeline lives in the pipeline panel. Extend existing pipeline visualization with checkpoint markers. Each node shows a revert button.
- **D-10:** Checkpoints created on every agent commit. Natural granularity — one revert = one task. Maps to pipeline step nodes.

### Approval Gates
- **D-11:** Block destructive file operations only: deleting files, removing directories, git force-push, dropping database tables. Normal edits, creates, test runs are allowed.
- **D-12:** 3 autonomy levels: Full (auto-approve everything — Settings), Supervised (approve destructive only — Work, Explore), Restricted (approve all edits — Review for auditing).
- **D-13:** Approval requests appear as interactive cards in the chat panel (same pattern as AskUserQuestion from Phase 7). Approve/Deny buttons inline in conversation context.

### Claude's Discretion
- Implementation details of regex patterns for violation detection
- WebSocket event schema for violation signals
- Checkpoint data model and storage
- Default autonomy level assignments per workbench
- Gate timeout behavior (auto-deny vs auto-approve after N seconds)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Hook Infrastructure
- `packages/hooks/src/` — All 14 existing hook scripts (patterns to follow)
- `.claude/settings.json` — Hook registration format (event types, matchers, commands)

### Design System
- `packages/app/src/components/ui/manifest.ts` — Component library manifest (source of truth for allowed components)
- `packages/app/src/styles/design-tokens.css` — Design token definitions (allowed color values)

### Backend Services
- `packages/backend/src/services/gateCheckpoint.ts` — Gate validation infrastructure (7 gates, trust boundaries)
- `packages/backend/src/services/agentIntegrityService.ts` — Agent integrity checksums (SHA-256)
- `packages/backend/src/services/snapshotService.ts` — Existing snapshot infrastructure

### Pipeline Visualization (checkpoint integration point)
- `packages/app/src/workbenches/pipeline/` — Pipeline components for checkpoint timeline extension

### Chat Panel (approval gate integration point)
- `packages/app/src/workbenches/chat/AskUserRenderer.tsx` — Interactive card pattern for approval gates
- `packages/app/src/lib/chat-types.ts` — Message type definitions to extend for approval requests

### Phase 6 Context (session management)
- `.planning/phases/06-agent-sessions-status/06-CONTEXT.md` — Session infrastructure decisions, /btw integration notes

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **14 hook scripts** in packages/hooks/src/ — established patterns for PreToolUse/PostToolUse/Stop hooks
- **GateCheckpoint service** — 7-gate validation with trust boundaries, ready for new validation gates
- **AgentIntegrityService** — SHA-256 checksums, violation event broadcasting
- **SnapshotService** — Periodic snapshots with gzip compression, rotation strategy
- **AskUserRenderer** — Interactive question cards (Phase 7) — reuse for approval gate UI
- **StatusDot + Badge** — Severity indicators for violation display
- **Pipeline step nodes** — Extend with checkpoint markers

### Established Patterns
- Hook registration: `.claude/settings.json` with event type + matcher + command path
- WebSocket channels: `_system` for broadcast, per-workbench channels for targeted delivery
- Zustand stores: Module-level singletons with Map<WorkbenchId, State> for per-workbench isolation
- Design tokens: CSS custom properties in design-tokens.css, Tailwind v4 @theme integration

### Integration Points
- **PreToolUse hook** → new script in packages/hooks/src/, register in settings.json
- **PostToolUse hook** → new script in packages/hooks/src/, register in settings.json
- **Violation events** → broadcast via wsClient on _system channel, subscribe in workbench agent
- **Checkpoint markers** → extend pipeline store and pipeline node components
- **Approval gates** → new message type in chat-types.ts, render via AskUserRenderer pattern

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the decisions above.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-neural-validation-safety*
*Context gathered: 2026-04-03*
