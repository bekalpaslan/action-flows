# ActionFlows Dashboard — Project Configuration

> Single source of truth for project-specific values. Referenced by CLAUDE.md and injected into agent prompts by the orchestrator.

---

## Project

- **Name:** ActionFlows Dashboard
- **Tagline:** A living universe for human-orchestrator-agent collaboration
- **Description:**
  - **For Coders:** A new IDE paradigm where the orchestrator (brain) coordinates agents (hands) to reshape your codebase (physics). The orchestrator can rewrite the laws of the universe. You express intention; the brain figures out how to modify the code. This is collaborative intelligence.
  - **For Regular Users:** A natural language interface to software creation. Express what you want; the universe figures out how to build it. The orchestrator reshapes the code (physics) according to your will. No coding required.
  - **For Everyone:** A journey through a living software universe that grows with you. Unlock new flows, discover agent patterns, and watch the system evolve alongside your needs. This is software as adventure.
  - **Open Source Template:** This is the creator's proven template universe — a production-ready starting point with defaults learned from real usage. Users have **full sovereignty over all five layers** (including platform code) to modify the physics, reshape the philosophy, rewrite the orchestration model, and evolve the universe to match their workflow. No asterisks. (MIT License — see LICENSE file)
- **Repository:** ActionFlows Dashboard monorepo (pnpm workspaces)
- **Working Directory:** D:/ActionFlowsDashboard

---

## Notification

- **Status:** Disabled. Notifications stripped from all actions. Re-enable by adding a `notify/` action and extending agents.

---

## Tech Stack

### Backend
- **Language:** TypeScript 5.3
- **Framework:** Express 4.18
- **WebSocket:** ws 8.14.2
- **Storage:** MemoryStorage (dev) / Redis via ioredis 5.3 (prod)
- **Validation:** Zod 3.22
- **Rate Limiting:** express-rate-limit 7.1
- **File Watching:** chokidar 3.5
- **Testing:** Vitest 1.0
- **Package:** packages/backend/
- **Entry:** packages/backend/src/index.ts

### Frontend
- **Language:** TypeScript 5.4
- **Framework:** React 18.2
- **Build Tool:** Vite 5
- **Desktop:** Electron 28
- **Visualization:** ReactFlow 11.10
- **Code Editor:** Monaco Editor 0.45
- **Terminal:** xterm 5.3
- **Package:** packages/app/
- **Entry:** packages/app/src/main.tsx

### Shared
- **Language:** TypeScript 5.3
- **Types:** Branded strings (SessionId, ChainId, StepId, UserId), discriminated unions
- **Module System:** ES modules
- **Package:** packages/shared/
- **Entry:** packages/shared/src/index.ts

### MCP Server
- **Protocol:** Model Context Protocol 1.0
- **SDK:** @modelcontextprotocol/sdk 1.0
- **Package:** packages/mcp-server/
- **Entry:** packages/mcp-server/src/index.ts

### Hooks
- **Purpose:** Claude Code hook scripts
- **Package:** packages/hooks/

---

## Architecture

### Component Paths
- **Backend routes:** packages/backend/src/routes/
- **Backend services:** packages/backend/src/services/
- **Backend storage:** packages/backend/src/storage/
- **Backend WebSocket:** packages/backend/src/ws/
- **Backend middleware:** packages/backend/src/middleware/
- **Backend schemas:** packages/backend/src/schemas/
- **Backend tests:** packages/backend/src/__tests__/
- **Frontend components:** packages/app/src/components/
- **Frontend hooks:** packages/app/src/hooks/
- **Frontend contexts:** packages/app/src/contexts/
- **Electron main:** packages/app/electron/main.ts
- **Shared types:** packages/shared/src/
- **E2E tests:** test/e2e/

### Ports
- **Backend API:** 3001 (configurable via PORT env var)
- **Vite dev server:** 5173
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
- **Branch format:** feature/*, fix/*, refactor/*
