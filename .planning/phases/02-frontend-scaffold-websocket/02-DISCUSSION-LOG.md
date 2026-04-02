# Phase 2: Frontend Scaffold & WebSocket - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 02-frontend-scaffold-websocket
**Areas discussed:** Rebuild strategy, Salvageable code, WebSocket design

---

## Rebuild Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Clean parallel build | Create src/workbenches/ alongside src/components/. Feature flag switches. | |
| Hard cutover | Remove cosmic components, build from scratch. No fallback. | ✓ |
| You decide | Claude picks | |

**User's choice:** Hard cutover
**Notes:** User wants a clean break — no maintaining two UIs.

---

## Cosmic Component Fate

| Option | Description | Selected |
|--------|-------------|----------|
| Delete all cosmic code | Remove src/components/ entirely. Git history preserves. | ✓ |
| Archive to src/_legacy/ | Move to _legacy folder for reference. | |
| You decide | Claude audits | |

**User's choice:** Delete all cosmic code
**Notes:** Full clean slate.

---

## Salvageable Code

| Option | Description | Selected |
|--------|-------------|----------|
| Keep reusable hooks | Move domain-agnostic hooks to src/hooks/. Delete cosmic ones. | |
| Start fresh | Delete all hooks and contexts. Rebuild as needed. | ✓ |
| You decide | Claude audits each | |

**User's choice:** Start fresh
**Notes:** All 58 hooks and 15 contexts deleted. Rebuilt from scratch as workbench features need them.

---

## WebSocket Multiplexing Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Channel-per-workbench | Single connection, messages tagged with workbenchId. | ✓ |
| Topic-based pubsub | Single connection, messages tagged with topic. More flexible. | |
| You decide | Claude picks | |

**User's choice:** Channel-per-workbench
**Notes:** Clean separation, easy to filter per workbench.

---

## WebSocket Backend Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Keep backend ws | Add channel routing on top of existing handler. | |
| Rebuild both sides | New WebSocket hub with proper channel management. | ✓ |
| You decide | Claude assesses | |

**User's choice:** Rebuild both sides
**Notes:** Clean contract between frontend and backend.

---

## Claude's Discretion

- Directory structure within src/workbenches/
- WebSocket message envelope format
- Electron main process changes
- State management approach for the shell

## Deferred Ideas

None
