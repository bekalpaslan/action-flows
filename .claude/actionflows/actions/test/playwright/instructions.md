# Playwright Action

> Execute Playwright E2E tests and report results.

---

## Requires Input: YES

---

## Extends

This agent is **explicitly instructed** to execute:
- `_abstract/agent-standards` — Core behavioral principles
- `_abstract/create-log-folder` → Creates `.claude/actionflows/logs/test/playwright/{target}_{datetime}/`

---

## Inputs

| Input | Required | Description | Default |
|-------|----------|-------------|---------|
| target | YES | What to test — tag (e.g., "@session"), file (e.g., "session.spec.ts"), or grep pattern | — |
| mode | NO | Execution mode: "headless" (default), "headed" (visual), or "debug" (interactive) | headless |
| browser | NO | Browser engine: "chromium" (default), "firefox", "webkit", or "all" | chromium |
| coverage | NO | Capture code coverage metrics | false |
| context | NO | What was changed — helps identify relevant failures | none |

---

## Model

**sonnet** — Comprehensive test analysis and reporting.

---

## How Orchestrator Spawns This

1. Collect inputs:
   - `target`: From human request (tag, filename, or grep pattern)
   - `mode`: From human preference or default to "headless"
   - `browser`: From human preference or default to "chromium"

2. Spawn:

```
Read your definition in .claude/actionflows/actions/test/playwright/agent.md

Input:
- target: @dashboard
- mode: headed
- browser: chromium
```

---

## Gate

Playwright tests executed successfully. Test results reported in log folder regardless of pass/fail outcome.

---

## Example Scenarios

### Run tests for a specific tag
```
target: @auth
mode: headless
browser: chromium
```

### Run a specific test file with visual feedback
```
target: cosmic-map-navigation.spec.ts
mode: headed
browser: chromium
```

### Test across all browsers
```
target: cosmic-map
mode: headless
browser: all
```

### Debug a failing test interactively
```
target: session.spec.ts
mode: debug
browser: chromium
```

---

## Command Examples

Generated commands follow these patterns:

| Scenario | Command |
|----------|---------|
| Tag-based (default) | `pnpm test:pw --grep "@session"` |
| File-based | `pnpm test:pw test/playwright/specs/session.spec.ts` |
| With mode | `pnpm test:pw --grep "@session" --headed` or `--debug` |
| Multi-browser | `pnpm test:pw --grep "@session" --project=firefox --project=webkit` |

---

## Prerequisites

Before executing Playwright tests:

1. **Backend running** on port 3001
2. **Frontend running** on port 5173
3. **Playwright installed** and configured in project

If prerequisites are missing, test execution will fail with clear error messages.

---

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
- **Trace:** {path if available}

## Learnings
[Standard format — issue, root cause, suggestion]
```

---

## Notes

- **DO NOT** touch test/e2e/ (those are Chrome MCP integration tests, not Playwright)
- **DO NOT** modify source code in packages/ — this is a test execution action, not development
- Tests must match actual CSS selectors and UI structure
- Use kebab-case for test file names
- Tag tests with @context (e.g., @session, @dashboard, @auth) for easy filtering
