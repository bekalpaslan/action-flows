# Technology Stack

**Analysis Date:** 2026-04-01

## Languages

**Primary:**
- TypeScript 5.3.3 - Entire codebase (backend, frontend, shared types)

**Secondary:**
- JavaScript (ES modules) - Scripts and build tooling
- HTML/CSS - Frontend markup and styling

## Runtime

**Environment:**
- Node.js (version not explicitly pinned, determined by system/CI)
- Electron 35.7.5 - Desktop application runtime

**Package Manager:**
- pnpm 10.29.3 - Primary monorepo package manager
- Lockfile: pnpm-lock.yaml (managed)

## Frameworks

**Core Backend:**
- Express 4.18.2 - HTTP server and REST API framework
- ws 8.14.2 - WebSocket server for real-time communication

**Core Frontend:**
- React 18.2.0 - UI component framework
- Vite 6.2.0 - Frontend build tool and dev server

**Visualization & UI:**
- ReactFlow 11.10.0 - Flow/graph visualization component
- D3 7.9.0 - Data-driven document manipulation and visualization
- Dagre 0.8.5 - Directed graph layout library
- Monaco Editor 0.45.0 - Code editor component
- xterm 5.3.0 - Terminal emulation in browser

**Build & Dev:**
- electron-builder 26.7.0 - Electron app packaging and distribution
- vite-plugin-electron 0.29.0 - Vite plugin for Electron development
- concurrently 9.2.1 - Run multiple processes in parallel

**Testing:**
- Vitest 4.0.0 - Unit test runner
- Playwright 1.58.2 - E2E testing framework
- @testing-library/react 14.1.2 - React component testing utilities
- jest-axe 10.0.0 - Accessibility testing
- Lighthouse 12.0.0 - Performance and accessibility auditing

**API Documentation:**
- swagger-jsdoc 6.2.8 - OpenAPI spec generation from JSDoc comments
- swagger-ui-express 5.0.1 - Swagger UI server integration

## Key Dependencies

**Critical:**
- @afw/shared (workspace:*) - Shared types, schemas, and utilities across packages
- zod 3.22.4 - Runtime schema validation (used in both backend and shared)
- @modelcontextprotocol/sdk 1.0.0 - MCP server implementation for tool integration

**Infrastructure & Utilities:**
- ioredis 5.3.0 - Redis client for optional persistent storage
- uuid 13.0.0 - UUID generation for session/chain/step IDs
- chokidar 3.5.3 - File system watcher for project monitoring
- cors 2.8.5 - CORS middleware for cross-origin requests
- compression 1.7.1 - gzip/brotli response compression
- express-rate-limit 7.1.0 - Rate limiting middleware for API protection
- node-fetch 3.3.2 - HTTP client for external service calls

**Frontend UI Libraries:**
- react-dom 18.2.0 - React DOM rendering
- react-markdown 10.1.0 - Markdown rendering in React
- react-window 1.8.10 - Virtualized list component for large data sets
- @xterm/addon-fit 0.11.0 - xterm terminal fit plugin
- @xterm/addon-search 0.16.0 - xterm search plugin
- rehype-raw 7.0.0 - HTML processing for markdown

**Performance & Monitoring:**
- web-vitals 5.1.0 - Core Web Vitals measurement
- @vitest/coverage-v8 4.0.18 - Code coverage reporting
- vite-bundle-visualizer 1.2.0 - Bundle analysis visualization
- terser 5.46.0 - JavaScript minification

**Accessibility:**
- @axe-core/react 4.11.1 - Automated accessibility testing
- eslint-plugin-jsx-a11y 6.8.0 - JSX accessibility linting

## Configuration

**Environment:**
- `.env.example` in `packages/backend/` documents required variables
- Environment variables control:
  - `PORT` - Backend server port (default 3001)
  - `REDIS_URL` - Redis connection string (optional, enables persistent storage)
  - `REDIS_PREFIX` - Redis key namespace (default: `afw:`)
  - `LOG_LEVEL` - Logging level (default: `info`)
  - `SLACK_NOTIFICATIONS_ENABLED` - Enable/disable Slack notifications via MCP (default: `false`)
  - `SLACK_DEFAULT_CHANNEL` - Default Slack channel (default: `#cityzen-dev`)
  - `AFW_CORS_ORIGINS` - CORS whitelist (comma-separated origins)
  - `AFW_SNAPSHOT_DIR` - Snapshot persistence directory for MemoryStorage
  - `AFW_DISABLE_CIRCUIT_BREAKER` - Disable circuit breaker protection (default: `false`)
  - `AFW_SERVE_FRONTEND` - Serve frontend static files (for Electron, default: `false`)
  - `AFW_FRONTEND_PATH` - Frontend static file path
  - `AFW_BACKEND_URL` - Backend URL for MCP server (default: `http://localhost:3001`)
  - `DOCKER` - Set to `true` when building in Docker containers (disables Electron)

**Build Configurations:**
- `tsconfig.json` (root) - TypeScript compiler settings (ES modules, target es2020)
- `packages/backend/tsconfig.json` - Backend-specific configuration
- `packages/app/tsconfig.json` - Frontend-specific configuration
- `packages/shared/tsconfig.json` - Shared types configuration
- `vite.config.ts` - Frontend build configuration (react plugin, electron plugin, proxy settings)
- `playwright.config.ts` - E2E test configuration
- `electron-builder.json` (in package.json) - Electron packaging and distribution settings

## Platform Requirements

**Development:**
- Node.js (any recent LTS)
- pnpm 10.29.3
- Git (for version control)
- Bash/Unix shell (Windows: Git Bash or WSL for `test/curl-commands.sh`)

**Production:**
- **Web Deployment:** Node.js runtime + Redis (optional, MemoryStorage used if Redis unavailable)
- **Desktop:** Electron 35.7.5 (included in desktop build)
- **Ports:** Backend 3001 (configurable), Frontend 5173 (dev only)

## Development Commands

```bash
pnpm install              # Install all dependencies
pnpm build                # Build all packages
pnpm dev                  # Run all dev servers (backend 3001, frontend 5173)
pnpm dev:backend          # Backend only (port 3001)
pnpm dev:app              # Frontend only (port 5173)
pnpm dev:electron         # Frontend + Electron desktop app
pnpm type-check           # TypeScript compilation check
pnpm lint                 # Linting (exact tool configured elsewhere)
pnpm test                 # Unit tests (Vitest)
pnpm test:watch           # Unit tests watch mode
pnpm test:pw              # Playwright E2E tests
pnpm test:pw:ui           # Playwright UI mode
pnpm test:pw:headed       # Playwright with visible browser
```

---

*Stack analysis: 2026-04-01*
