# Learnings Registry

> Agent-surfaced learnings, logged by the orchestrator.

## Entries

### L001: Second-Opinion CLI fails on Windows when log folder doesn't exist
- **Date:** 2026-02-09
- **From:** second-opinion/ (haiku) during audit-and-fix/ chain
- **Issue:** CLI `--output` path targets a folder created by the agent via `create-log-folder`, but on Windows the CLI's `writeFile` throws ENOENT if the directory doesn't exist yet. Critique data survived in stderr but the report file was never written.
- **Root Cause:** The `create-log-folder` abstract action ran in the agent context, but the CLI is a separate Node process that doesn't inherit the agent's filesystem setup. The CLI assumes the output directory already exists.
- **Fix Options:**
  1. Add `mkdir -p` (or `fs.mkdir recursive`) inside the CLI before writing output
  2. Harden `create-log-folder` to verify directory exists before passing path to CLI
- **Status:** Open

### L002: Deferred Field Implementation Creates Silent Behavior Gaps
- **Date:** 2026-02-09
- **From:** analyze/ (sonnet) during "Custom Prompt Button post-delivery analysis" chain
- **Issue:** Conversion logic in `useCustomPromptButtons` hardcodes `contexts: ['general']` without documenting the deferral, making the gap invisible to future developers
- **Root Cause:** Types and backend schema were implemented for `contextPatterns`, but the hook silently hardcoded a fallback instead of gracefully handling the missing UI input
- **Fix:** When deferring UI for optional fields, add explicit `// TODO: Implement {field} conversion when UI is added` at each hardcoded fallback site
- **Status:** Open

### L003: Bundled Commits Obscure Feature Traceability
- **Date:** 2026-02-09
- **From:** analyze/ (sonnet) during "Custom Prompt Button post-delivery analysis" chain
- **Issue:** Commit title focused on infrastructure fix (`fix: WebSocket heartbeat keepalive`) instead of the primary feature (Custom Prompt Button), making the feature harder to discover in git history
- **Root Cause:** Multiple unrelated changes bundled into a single commit with wrong title emphasis
- **Fix:** Use `feat:` prefix for the primary feature as commit title. List infrastructure fixes as secondary bullets, or split into separate commits
- **Status:** Closed (lesson logged, no code fix needed)

### L004: Chrome MCP Profile Lock Blocks E2E Tests
- **Date:** 2026-02-10
- **From:** orchestrator during e2e-chrome-mcp/ chain execution
- **Issue:** Chrome DevTools MCP server fails with "browser already running" when another Chrome instance uses the same `chrome-devtools-mcp/chrome-profile` directory
- **Root Cause:** MCP server uses a single user data directory without isolation. Previous Claude Code sessions leave Chrome processes running
- **Fix:** Close all Chrome instances before running Chrome MCP tests. Consider `--isolated` flag or documenting prerequisite in test README
- **Status:** Closed (documented in test README)

### L005: Dashboard Chat Messages Are Frontend-Only State
- **Date:** 2026-02-10
- **From:** orchestrator during e2e-chrome-mcp/ test execution (Step 12)
- **Issue:** `GET /api/sessions/:id/chat` returns empty — user messages sent from the dashboard are stored in React state, not persisted to the backend chat API
- **Root Cause:** `POST /api/sessions/:id/input` queues input for the session but doesn't add it to the chat history endpoint. Chat display is managed by `useChatMessages` hook locally
- **Fix:** Not a bug — by design. E2E tests should verify message display in DOM, not backend chat API
- **Status:** Closed (test step marked `onFailure: 'continue'`)

### L006: New Sessions Appear in RECENT, Not ACTIVE
- **Date:** 2026-02-10
- **From:** orchestrator during e2e-chrome-mcp/ test execution (Step 6)
- **Issue:** Session created via `POST /api/sessions` gets status `pending`, which the sidebar sorts into "RECENT" section. Only `in_progress` sessions appear under "ACTIVE"
- **Root Cause:** Session status lifecycle: `pending` → `in_progress` (when chain starts). Dashboard sidebar groups by status, not creation time
- **Fix:** E2E assertions should check for either "ACTIVE" or "RECENT" section. Test updated accordingly
- **Status:** Closed (test assertion fixed)

### L007: Code Agent Selector Naming Drift
- **Date:** 2026-02-10
- **From:** review/ (sonnet) during e2e-chrome-mcp/ chain
- **Issue:** Code agent used `conversation-panel__input` and `conversation-panel__send-btn` instead of actual CSS classes `chat-panel__input-field` and `chat-panel__send-btn`
- **Root Cause:** Agent inferred selector names from component names rather than reading actual CSS. Analysis report had correct names but code agent deviated
- **Fix:** Corrected selectors in `chrome-mcp-utils.ts`. Future: include actual CSS class names explicitly in code agent spawn prompt inputs
- **Status:** Closed (selectors corrected)
