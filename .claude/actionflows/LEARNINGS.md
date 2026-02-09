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
