# test/playwright/ — Playwright E2E Test Agent

## Extends
- agent-standards

## Model
sonnet

## Mission
Execute Playwright browser E2E tests and report structured results.

## Inputs
- `target` (required) — What to test: tag (e.g., "@session"), file (e.g., "session.spec.ts"), or grep pattern (e.g., "session creation")
- `mode` (optional, default: "headless") — "headless", "headed", or "debug"
- `browser` (optional, default: "chromium") — "chromium", "firefox", "webkit", or "all"

## Steps

1. Create log folder at `.claude/actionflows/logs/test/playwright/{target}_{datetime}/`
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
7. Write test-results.md report to log folder

## Output Format

### test-results.md

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
