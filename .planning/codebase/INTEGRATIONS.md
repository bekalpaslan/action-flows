# External Integrations

**Analysis Date:** 2026-04-01

## APIs & External Services

**MCP (Model Context Protocol):**
- Service: Model Context Protocol 1.0
- Purpose: Enables orchestrator agents to call tools and interact with external systems
- SDK: @modelcontextprotocol/sdk 1.0.0
- Implementation: `packages/mcp-server/src/index.ts`
- Tools Exposed:
  - `check_commands` - Poll for pending control commands (pause, resume, cancel, retry)
  - `ack_command` - Acknowledge command processing and update dashboard

**Slack Integration:**
- Service: Slack (via MCP integration)
- Purpose: Post notifications for chain completions, reviews, deployments, test failures
- Environment:
  - `SLACK_NOTIFICATIONS_ENABLED` (default: false)
  - `SLACK_DEFAULT_CHANNEL` (default: #cityzen-dev)
- Implementation: `packages/backend/src/services/slackNotifier.ts`
- Routes: `packages/backend/src/routes/surfaces/slack.ts`
- Architecture: Backend formats notification data via HTTP API; orchestrator uses Slack MCP tools to post

**Figma Integration:**
- Service: Figma design links management
- Purpose: Store and manage links to Figma design files
- Implementation: `packages/backend/src/routes/figma.ts`
- Storage: In-memory (production would use Redis/database)
- API Methods:
  - GET `/api/figma/links` - List stored Figma links
  - POST `/api/figma/links` - Create new link
  - PUT `/api/figma/links/{linkId}` - Update link
  - DELETE `/api/figma/links/{linkId}` - Delete link
- Features: URL parsing, file key/node ID extraction

## Data Storage

**Databases:**
- Type/Provider: Dual-mode storage system
  - **Development/Default:** MemoryStorage (in-process)
  - **Production:** Redis 5.3.0 (optional, enables persistence and multi-instance deployment)
- Connection:
  - `REDIS_URL` environment variable (e.g., `redis://localhost:6379`)
  - `REDIS_PREFIX` for key namespacing (default: `afw:`)
- Client: ioredis 5.3.0
- Implementation: `packages/backend/src/storage/index.ts` (unified interface)
  - `packages/backend/src/storage/memory.ts` - In-memory backend
  - `packages/backend/src/storage/redis.ts` - Redis backend with Pub/Sub support

**Data Stored:**
- Sessions (SessionId → Session object)
- Chains (ChainId → Chain object)
- Events (SessionId → WorkspaceEvent[])
- Commands queue (SessionId → CommandPayload[])
- Input queue (SessionId → unknown[])
- WebSocket client tracking
- Session windows and configurations
- Bookmarks and detected patterns
- Harmony checks and metrics
- Intel Dossiers
- Widget suggestions
- Chat history
- Telemetry entries
- Reminders and error instances

**File Storage:**
- Local filesystem only (no cloud storage integration)
- Snapshot persistence: `.actionflows-snapshot/` directory (or `AFW_SNAPSHOT_DIR` env var)
- Project files: Monitored via chokidar file watcher

**Caching:**
- Redis (when enabled) - Serves as both storage and cache
- MemoryStorage maps - In-process caching (dev mode)
- No dedicated caching layer for production

## Authentication & Identity

**Auth Provider:**
- Type: Custom implementation
- Implementation: `packages/backend/src/middleware/auth.js` (middleware)
- Routes: `packages/backend/src/routes/auth.ts`
- Approach:
  - Branded types for SessionId, UserId, ChainId
  - User session tracking via sessionsByUser map
  - Ensured admin user creation on startup
  - No OAuth/third-party auth configured

**User Management:**
- Service: `packages/backend/src/services/userService.ts`
- Features: Admin user creation, user session tracking

## Monitoring & Observability

**Error Tracking:**
- Service: Not detected (errors routed through general handler)
- Implementation: `packages/backend/src/middleware/errorHandler.js`
- Routes: `packages/backend/src/routes/errors.ts`
- Features: Global error handler, error instance tracking in storage

**Logging:**
- Approach: Console-based (console.log throughout codebase)
- Level Control: `LOG_LEVEL` environment variable (default: `info`)
- Structured Logging: No structured logging library detected

**Health Monitoring:**
- Endpoint: GET `/health` - Returns status, timestamp, uptime
- Services: Health score calculation, harmony detector, gate validator
- Implementation: `packages/backend/src/services/healthScoreCalculator.ts`

**Analytics:**
- Routes: `packages/backend/src/routes/analytics.ts`
- Telemetry: Telemetry entries stored in Redis/memory
- Tracking: Action frequency, pattern detection, usage metrics

## CI/CD & Deployment

**Hosting:**
- Web: Self-hosted Node.js (port 3001)
- Desktop: Electron with electron-builder packaging
- Build Targets: Windows (NSIS + portable), macOS (DMG + ZIP), Linux (AppImage + deb + rpm)

**CI Pipeline:**
- Not detected in source code
- Test commands available:
  - `pnpm test` - Unit tests (Vitest)
  - `pnpm test:pw` - E2E tests (Playwright)
  - `health:check` - Custom health check script
  - `ci:contracts` - Contract validation
  - `contracts:validate` - Schema validation

**Build Outputs:**
- Backend: TypeScript → JavaScript in `dist/` directory
- Frontend: Vite build output in `dist/` directory
- Electron: Packaged binaries in `release/` directory

## Environment Configuration

**Required env vars:**
- `REDIS_URL` (optional, enables Redis; defaults to MemoryStorage)
- `PORT` (optional, default: 3001)

**Optional env vars:**
- `REDIS_PREFIX` (default: `afw:`)
- `LOG_LEVEL` (default: `info`)
- `SLACK_NOTIFICATIONS_ENABLED` (default: false)
- `SLACK_DEFAULT_CHANNEL` (default: #cityzen-dev)
- `AFW_CORS_ORIGINS` (comma-separated, default: localhost ports + 3001)
- `AFW_SNAPSHOT_DIR` (default: `.actionflows-snapshot`)
- `AFW_DISABLE_CIRCUIT_BREAKER` (default: false)
- `AFW_SERVE_FRONTEND` (default: false, for Electron)
- `AFW_BACKEND_URL` (default: http://localhost:3001, for MCP server)
- `DOCKER` (set to `true` when running in Docker)

**Secrets location:**
- Not managed by application (no vault integration)
- Environment variables pass secrets at runtime
- No credential files committed to repo

## Webhooks & Callbacks

**Incoming:**
- Not detected (no webhook receivers implemented)

**Outgoing:**
- Slack notifications (formatted via SlackNotifier, posted via MCP tools)
- File system monitoring (chokidar watchers broadcast file events)

## Rate Limiting & Security

**Rate Limiting:**
- Middleware: express-rate-limit 7.1.0
- Implementation: `packages/backend/src/middleware/rateLimit.ts`
- Configuration: IP-based rate limiting on `/api` routes

**Security Headers:**
- `X-Content-Type-Options: nosniff` - Added to all responses
- CORS validation with configurable origin whitelist
- Request body size limit: 1MB

**Circuit Breaker:**
- Implementation: `packages/backend/src/storage/resilientStorage.ts`
- Purpose: Protect storage operations from cascading failures
- Status: Enabled by default (disable with `AFW_DISABLE_CIRCUIT_BREAKER=true`)

## External Tool Integrations

**File Monitoring:**
- Service: chokidar 3.5.3
- Purpose: Watch project filesystem for changes
- Implementation: `packages/backend/src/services/fileWatcher.ts`
- Events: File created, modified, deleted broadcast via WebSocket

**Terminal Integration:**
- Service: Built-in with xterm 5.3.0 for frontend
- Routes: `packages/backend/src/routes/terminal.ts`
- Features: Terminal output streaming via WebSocket

**Claude CLI Integration:**
- Service: claude (system CLI)
- Purpose: Launch orchestrator sessions with custom MCP configs
- Implementation: `packages/backend/src/services/claudeCliManager.ts`
- Routes: `packages/backend/src/routes/claudeCli.ts`

---

*Integration audit: 2026-04-01*
