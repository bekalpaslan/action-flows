# Phase 8: Neural Validation & Safety - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-03
**Phase:** 08-neural-validation-safety
**Areas discussed:** Hook validation strategy, /btw signal design, Checkpoint/rollback UX, Approval gates scope

---

## Hook Validation Strategy

### Detection Method

| Option | Description | Selected |
|--------|-------------|----------|
| Regex pattern matching | Fast, runs in PreToolUse. Catches raw hex, inline styles, non-library elements. Simple to maintain. | ✓ |
| AST parsing with PostCSS/Babel | Precise, catches everything. Heavier, slower (~500ms). Better as PostToolUse. | |
| Both layers | Regex in PreToolUse, AST in PostToolUse. Defense in depth. | |

**User's choice:** Regex pattern matching
**Notes:** Recommended for speed and simplicity

### Enforcement Action

| Option | Description | Selected |
|--------|-------------|----------|
| Block the edit | Hook returns non-zero exit code. Agent sees rejection reason. | ✓ |
| Allow but warn | Edit lands, /btw signal sent. Violations accumulate. | |
| Configurable per workbench | Some block, others warn. Autonomy levels control strictness. | |

**User's choice:** Block the edit

### Violation Patterns

| Option | Description | Selected |
|--------|-------------|----------|
| Strict: hex + inline styles + non-library HTML | Block raw hex, inline styles, AND raw HTML elements not from component library. | |
| Moderate: hex + inline styles only | Block raw colors and inline styles. Allow raw HTML elements. | ✓ |
| You decide | Claude picks strictness. | |

**User's choice:** Moderate: hex colors + inline styles only

### File Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Only .tsx and .css files | Focus on UI markup and styling. Fast, no false positives in logic files. | ✓ |
| All frontend files | Also catches .ts utility files. May produce false positives. | |
| You decide | Claude picks file scope. | |

**User's choice:** Only .tsx and .css files

---

## /btw Signal Design

### Delivery Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| WebSocket broadcast to active session | Backend emits violation event on workbench WS channel. Queues for inactive workbenches. | ✓ |
| Direct /btw CLI injection | Hook writes /btw file. Works without backend but undocumented path. | |
| Both paths with fallback | Try WS first, fall back to /btw file. More resilient but complex. | |

**User's choice:** WebSocket broadcast to active session

### Agent Response

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-fix immediately | Pause current work, fix violation, resume. Critical violations blocking. | ✓ |
| Notify user and wait | Surface violation in chat panel, wait for instruction. | |
| Auto-fix critical, notify for warning/info | Graduated response by severity. | |

**User's choice:** Auto-fix immediately

### Severity Levels

| Option | Description | Selected |
|--------|-------------|----------|
| Simple: critical/warning/info | Critical = blocked edit. Warning = allowed with issue. Info = style suggestion. | ✓ |
| You decide | Claude defines based on patterns. | |

**User's choice:** Simple model

---

## Checkpoint/Rollback UX

### Revert Mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| Git-based revert | Each checkpoint = commit hash. Revert creates new commit. Clean history. | ✓ |
| Snapshot restore | Restore from gzip snapshots. Faster but bypasses git history. | |
| You decide | Claude picks mechanism. | |

**User's choice:** Git-based revert

### UI Placement

| Option | Description | Selected |
|--------|-------------|----------|
| In the pipeline panel | Extend pipeline visualization with checkpoint markers. | ✓ |
| Dedicated panel/drawer | New collapsible panel with vertical timeline. | |
| In the status panel | Extend Agent Sessions panel. | |

**User's choice:** In the pipeline panel

### Checkpoint Frequency

| Option | Description | Selected |
|--------|-------------|----------|
| On every agent commit | Each git commit = checkpoint. One revert = one task. Maps to pipeline nodes. | ✓ |
| On task completion | Checkpoint after each task. Coarser granularity. | |
| You decide | Claude picks frequency. | |

**User's choice:** On every agent commit

---

## Approval Gates Scope

### High-Risk Actions

| Option | Description | Selected |
|--------|-------------|----------|
| Destructive file operations only | Delete files, remove dirs, force-push, drop tables. | ✓ |
| Destructive + cross-package edits | Also blocks multi-package edits. | |
| You decide | Claude determines high-risk list. | |

**User's choice:** Destructive file operations only

### Autonomy Levels

| Option | Description | Selected |
|--------|-------------|----------|
| 3 levels: full / supervised / restricted | Full = auto-approve all. Supervised = approve destructive. Restricted = approve all edits. | ✓ |
| 2 levels: autonomous / gated | Binary: free or everything gated. | |
| You decide | Claude picks autonomy model. | |

**User's choice:** 3 levels

### Gate UX

| Option | Description | Selected |
|--------|-------------|----------|
| Chat panel inline | Interactive card like AskUserQuestion. Approve/Deny in conversation. | ✓ |
| Modal dialog | Blocking overlay with action details. | |
| Toast notification | Non-blocking toast with action buttons. | |

**User's choice:** Chat panel inline

---

## Claude's Discretion

- Regex pattern implementation details
- WebSocket event schema for violations
- Checkpoint data model and storage
- Default autonomy assignments per workbench
- Gate timeout behavior

## Deferred Ideas

None — discussion stayed within phase scope.
