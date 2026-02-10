# STOP — Session-Start Protocol

**Before responding to ANY human message**, read `.claude/actionflows/ORCHESTRATOR.md` and execute the session-start protocol.

Spawned subagents: ignore this — follow your agent.md instructions instead.

---

# ActionFlows Dashboard — Project Context

**See `actionflows/project.config.md` for detailed project-specific values.**

---

## Project

- **Name:** ActionFlows Dashboard
- **Tagline:** A living universe for human-orchestrator-agent collaboration
- **Description:**
  - **For Coders:** A new IDE paradigm where the orchestrator (brain) coordinates agents (hands) to reshape your codebase (physics). The orchestrator can rewrite the laws of the universe. You express intention; the brain figures out how to modify the code. This is collaborative intelligence.
  - **For Regular Users:** A natural language interface to software creation. Express what you want; the universe figures out how to build it. The orchestrator reshapes the code (physics) according to your will. No coding required.
  - **For Everyone:** A journey through a living software universe that grows with you. Unlock new flows, discover agent patterns, and watch the system evolve alongside your needs. This is software as adventure.
  - **Proof of Concept:** This is the creator's template universe—a proven starting point with defaults learned from real usage. Users have full sovereignty to modify the physics, reshape the philosophy, and evolve the universe to match their workflow.
- **Repository:** ActionFlows Dashboard monorepo (pnpm workspaces)

---

## Tech Stack

### Backend
- **Framework:** Express 4.18 + TypeScript
- **WebSocket:** ws 8.14.2
- **Storage:** MemoryStorage (dev) / Redis 5.3 (prod)
- **Package:** packages/backend/
- **Entry:** packages/backend/src/index.ts

### Frontend
- **Framework:** React 18.2 + TypeScript + Vite 5
- **Desktop:** Electron 28
- **Visualization:** ReactFlow 11.10
- **Package:** packages/app/
- **Entry:** packages/app/src/main.tsx

### Shared
- **Types:** Branded strings, discriminated unions, ES modules
- **Package:** packages/shared/
- **Entry:** packages/shared/src/index.ts

### MCP Server
- **Protocol:** Model Context Protocol 1.0
- **Package:** packages/mcp-server/
- **Entry:** packages/mcp-server/src/index.ts

### Hooks
- **Purpose:** Claude Code hook scripts
- **Package:** packages/hooks/

---

## Architecture

### Paths
- **Backend routes:** packages/backend/src/routes/
- **Backend storage:** packages/backend/src/storage/
- **Backend WebSocket:** packages/backend/src/ws/
- **Frontend components:** packages/app/src/components/
- **Frontend hooks:** packages/app/src/hooks/
- **Frontend contexts:** packages/app/src/contexts/
- **Shared types:** packages/shared/src/
- **Tests:** packages/backend/src/__tests__/
- **E2E specs:** test/e2e/
- **System Architecture:** See `.claude/actionflows/docs/LIVING_SYSTEM.md` for the 7-layer living system architecture

### Ports
- **Backend:** 3001 (configurable via PORT env var)
- **Vite dev:** 5173
- **Electron:** Desktop app (no port)

---

## Domain Concepts

- **Session:** A user's orchestration session (branded SessionId)
- **Chain:** A sequence of steps within a session (branded ChainId)
- **Step:** An individual action within a chain (branded StepId)
- **User:** The human operating the session (branded UserId)
- **Command:** Control instruction (pause, resume, cancel, retry, skip)
- **Event:** State change broadcast via WebSocket

---

## Development Commands

```bash
pnpm install              # Install all dependencies
pnpm build                # Build all packages
pnpm dev                  # Run all dev servers
pnpm dev:backend          # Backend only (port 3001)
pnpm dev:app              # Frontend only (port 5173)
pnpm type-check           # TypeScript check across all packages
pnpm lint                 # Run linter
pnpm test                 # Run tests (Vitest)
pnpm test:e2e             # Run E2E tests
```

---

## Git Conventions

- **Commit style:** Conventional commits (feat:, fix:, refactor:, docs:, test:, chore:)
- **Co-author:** Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
- **Current branch:** master
- **Main branch:** main (PR target)
- **Working directory:** D:/ActionFlowsDashboard

