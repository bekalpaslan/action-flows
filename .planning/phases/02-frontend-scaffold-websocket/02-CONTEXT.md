# Phase 2: Frontend Scaffold & WebSocket - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the cosmic-themed frontend with a clean workbench shell architecture. Rebuild the WebSocket layer as a single multiplexed connection with channel-per-workbench routing. The app should render a workbench shell (not the old cosmic map), with `pnpm dev` and `pnpm build` producing working Vite dev server and Electron app. Backend services, shared types, and the actionflows framework are preserved.

</domain>

<decisions>
## Implementation Decisions

### Rebuild Strategy
- **D-01:** Hard cutover — no feature flags, no maintaining two UIs. Remove cosmic code entirely, build new workbench shell from scratch.
- **D-02:** Delete all cosmic components — remove existing `src/components/` entirely. Create new `src/workbenches/` directory structure. Git history preserves old code if needed.
- **D-03:** Start fresh on hooks and contexts — delete all 58 hooks and 15 contexts. Rebuild only what's needed as workbench features require them. No carryover from cosmic codebase.

### WebSocket Architecture
- **D-04:** Channel-per-workbench multiplexing — single WebSocket connection, messages tagged with `workbenchId`. Each workbench subscribes to its channel. Clean separation, easy to filter.
- **D-05:** Rebuild both frontend and backend WebSocket — new WebSocket hub on backend with proper channel management. Clean contract between frontend and backend. Existing ws handler replaced.

### Claude's Discretion
- Directory structure within `src/workbenches/` — how to organize the shell, shared layouts, per-workbench pages
- WebSocket message envelope format (JSON structure, channel naming, subscription protocol)
- Which Electron main process changes are needed (if any) for the new frontend
- How to handle the 177 pre-existing frontend TS errors (they disappear with the delete, but new code must compile clean)
- State management approach for the shell (React context vs zustand — research will inform this)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Architecture
- `.planning/codebase/ARCHITECTURE.md` — Current monorepo architecture, layered backend, WebSocket patterns
- `.planning/codebase/STRUCTURE.md` — Current directory layout and key locations
- `.planning/codebase/STACK.md` — Current tech stack (React 18, Vite 5, Electron 28, ws 8.14)

### Project Research
- `.planning/research/ARCHITECTURE.md` — Recommended architecture for the agentic OS
- `.planning/research/STACK.md` — Recommended additions (zustand, react-resizable-panels, etc.)
- `.planning/research/PITFALLS.md` — P5 (big-bang rewrite trap), P6 (WebSocket proliferation)

### Backend WebSocket (being rebuilt)
- `packages/backend/src/ws/` — Current WebSocket handler (to be replaced)
- `packages/backend/src/index.ts` — Express + ws server setup

### Electron
- `packages/app/electron/main.ts` — Electron main process (must still work after rebuild)
- `packages/app/vite.config.ts` — Vite build configuration

### Shared Types
- `packages/shared/src/events.ts` — WorkspaceEvent types (WebSocket message types)
- `packages/shared/src/index.ts` — Shared type exports

</canonical_refs>

<code_context>
## Existing Code Insights

### What Gets Deleted (frontend)
- `packages/app/src/components/` — 60+ cosmic-themed components (CosmicMap, Stars, ChainDAG, etc.)
- `packages/app/src/hooks/` — 58 hooks (all cosmic-specific or to be rebuilt)
- `packages/app/src/contexts/` — 15 contexts (all to be rebuilt)
- This resolves the 177 pre-existing frontend TS errors

### What Gets Rebuilt (frontend)
- New `src/workbenches/` — clean workbench shell with 7 placeholder pages
- New WebSocket hook — single multiplexed connection
- Minimal app shell — sidebar placeholder + workspace + chat placeholder
- New contexts as needed (likely: WebSocket, Workbench, Auth)

### What Gets Rebuilt (backend)
- `packages/backend/src/ws/` — new WebSocket hub with channel-per-workbench routing
- Message envelope with workbenchId tagging

### What Stays
- Backend services, routes, storage, middleware (all preserved from Phase 1)
- Shared types package (extended with new WebSocket message types if needed)
- Electron main process (with minimal changes for new frontend)
- Actionflows framework (`.claude/actionflows/`)
- Build configuration (vite.config.ts, tsconfig files — may need minor updates)

### Integration Points
- `packages/app/src/main.tsx` — entry point, needs new app shell
- `packages/app/electron/main.ts` — must load new frontend
- `packages/backend/src/index.ts` — ws server setup changes for new hub

</code_context>

<specifics>
## Specific Ideas

No specific UI references — the workbench shell is a structural scaffold. Design system (Phase 3) and layout (Phase 4) will add visual identity. This phase produces a working but minimal shell.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-frontend-scaffold-websocket*
*Context gathered: 2026-04-02*
