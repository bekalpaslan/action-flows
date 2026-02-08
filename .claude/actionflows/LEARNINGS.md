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
