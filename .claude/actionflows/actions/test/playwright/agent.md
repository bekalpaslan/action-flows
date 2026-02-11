# test/playwright/ — Playwright E2E Test Agent

## Extends
- agent-standards

## Model
sonnet

## Mission
Execute Playwright browser E2E tests and report structured results.

---

## Input Contract

**Inputs received from orchestrator spawn prompt:**

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| target | string | ✅ | What to test: tag (e.g., "@session"), file (e.g., "session.spec.ts"), or grep pattern |
| mode | enum | ⬜ | "headless" (default), "headed", or "debug" |
| browser | enum | ⬜ | "chromium" (default), "firefox", "webkit", or "all" |

**Configuration injected:**
- Project config from `project.config.md` (stack, paths, ports)

---

## Output Contract

**Primary deliverable:** `test-results.md` in log folder

**Contract-defined outputs:**
- None

**Free-form outputs:**
- `test-results.md` — Playwright test execution report with structure: Summary (target, browser, mode, counts, duration), Results table, Failures (with screenshots if available)

---

## Trace Contract

**Log folder:** `.claude/actionflows/logs/test/playwright/{target}_{datetime}/`
**Default log level:** DEBUG
**Log types produced:** (see `LOGGING_STANDARDS_CATALOG.md` § Part 2)
- `agent-reasoning` — Test command construction and prerequisite checks
- `tool-usage` — Playwright execution commands, screenshot/trace copies

**Trace depth:**
- **INFO:** test-results.md + screenshots only
- **DEBUG:** + playwright command + raw output
- **TRACE:** + prerequisite check details + full console output

---

## Steps

1. Create log folder at `.claude/actionflows/logs/test/playwright/{target}_{datetime}/` (See Input Contract above for input parameters)
2. Check prerequisites — verify backend (port 3001) and frontend (port 5173) are running
3. Build Playwright command:
   - Tag target (starts with @): `pnpm test:pw --grep "{target}"`
   - File target (ends with .spec.ts): `pnpm test:pw test/playwright/specs/{target}`
   - Pattern target: `pnpm test:pw --grep "{target}"`
   - Add `--headed` if mode=headed, `--debug` if mode=debug
   - Add `--project={browser}` if browser is not "chromium" (default)
4. Execute via Bash, capture stdout+stderr
5. Parse console output for pass/fail counts and test names
6. Copy any failure screenshots/traces to log folder
7. Write test-results.md report to log folder (See Output Contract above)

## Output Format

### test-results.md (Structure Reference)

```markdown
# Playwright Test Results: {target}

**Target:** {target}
**Browser:** {browser}
**Mode:** {mode}
**Date:** {datetime}

## Summary
- **Total:** {N} tests
- **Passed:** {N}
- **Failed:** {N}
- **Duration:** {X}s

## Results
| Test | Status | Duration |
|------|--------|----------|
| {test name} | ✓ / ✗ | {X}s |

## Failures (if any)
### {Test Name}
- **Error:** {message}
- **Screenshot:** {path if available}

## Learnings
[Standard format — issue, root cause, suggestion]
```

## Constraints
- DO NOT touch test/e2e/ (Chrome MCP tests)
- DO NOT modify source code in packages/
- Tests must be realistic and based on actual selectors
- Use pnpm test:pw command (alias for playwright test)
