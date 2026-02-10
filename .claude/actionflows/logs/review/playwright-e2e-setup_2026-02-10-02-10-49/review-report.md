# Review Report: Playwright E2E testing setup

## Verdict: NEEDS_CHANGES
## Score: 70%

## Summary

The Playwright E2E setup provides a solid foundation with proper configuration for monorepo development, correct webServer startup sequence, and good CI/CD awareness. However, there are critical issues with test reliability: hardcoded CSS selectors that don't match actual component classes, brittle test patterns, missing fixture setup, and incomplete .gitignore entries for Playwright caches. These must be fixed before the tests are considered reliable.

## Findings

| # | File | Line | Severity | Description | Suggestion |
|---|------|------|----------|-------------|------------|
| 1 | test/playwright/example.spec.ts | 20 | critical | CSS selector `.workbench-layout` exists (verified in CSS), but test assumes it's directly queryable without waiting for component hierarchy to render. Test may intermittently fail if component doesn't mount immediately. | Add `page.waitForSelector()` or use more reliable selectors via data-testid attributes. Better: move to fixture-based setup with explicit initialization. |
| 2 | test/playwright/example.spec.ts | 28 | critical | CSS selector `.session-panel-layout` exists in CSS but test assumes it renders in all routes. SessionPanel is conditional based on workbench tab—test will fail if panel isn't active. | Check that SessionPanel is visible in the active workbench view before asserting. Add conditional logic or use explicit route navigation (e.g., `page.goto('/work')` if panel requires specific workbench). |
| 3 | playwright.config.ts | 78-97 | high | webServer configuration starts both backend and frontend in sequence. Frontend dev server starts on port 5173 via `pnpm dev:app`, but this depends on pnpm installing deps first. No validation that pnpm is installed or that workspaces are linked. | Add pre-flight check: verify pnpm is installed and root package.json exists. Consider: should webServer also run `pnpm install` first, or document that `pnpm install` must run before `pnpm test:pw`? |
| 4 | playwright.config.ts | 82 | medium | Backend health endpoint check uses `/health` but includes auth middleware. If auth is required by default, health check will fail. Verify: does authMiddleware skip `/health`? | Review `packages/backend/src/middleware/auth.js` to confirm `/health` is in the skip list, or add explicit documentation that health checks must be unauthenticated. |
| 5 | playwright.config.ts | 26 | medium | Workers setting: `process.env.CI ? 1 : undefined` means local runs use unlimited parallel workers, but backend/frontend may not handle concurrent connections well. Risk of race conditions and connection pool exhaustion during local testing. | Consider limiting workers to 4 on local machines for stability. E.g., `process.env.CI ? 1 : 4` |
| 6 | .gitignore | 28 | high | Entry `/playwright/.cache/` is incorrect path. Playwright caches are in `.playwright/` (dot-prefix). Current entry won't exclude the actual cache directory, risking accidental commits. | Change `/playwright/.cache/` to `.playwright/` or use `**/.playwright/` for robustness. |
| 7 | test/playwright/example.spec.ts | 55-59 | medium | Backend health test makes direct HTTP call to `http://localhost:3001/health` hardcoded. If PORT env var is set on backend, this hardcoded URL will fail silently. Test should read PORT from context or environment. | Use `process.env.BACKEND_PORT || 3001` in test, or inject via Playwright config. Alternatively, expose backend port in Playwright config's webServer. |
| 8 | test/playwright/example.spec.ts | 36-40 | medium | Console error listener added but not cleaned up. Listener persists across tests if test.describe is reused. In parallel tests, may capture errors from unrelated tests. | Add `page.off('console')` cleanup in test teardown, or use `page.once()` instead of `page.on()`. |
| 9 | package.json | 19-22 | low | Script naming: `test:pw` vs `test:e2e` inconsistency. Root uses `test:e2e` for curl commands (E2E_TEST_GUIDE.md), but Playwright uses `test:pw`. Confusing for team. | Decide on naming convention. Recommend: `test:e2e` for all E2E tests (curl, Playwright), `test:unit` for Vitest. Create a docs entry explaining which is which. |
| 10 | playwright.config.ts | 40-46 | low | Video and screenshot config: `retain-on-failure` generates large artifacts (2-3MB per test). Without artifact cleanup, report folder grows quickly. CI disk usage not limited. | Consider: `record: 'retain-on-failure'` for video (expensive), but `screenshot: 'only-on-failure'` is good. Add docs about artifact retention policy and disk space requirements for CI. |

## Fixes Applied

None (mode: review-only). All findings require human judgment or design decision.

## Flags for Human

| Issue | Why Human Needed |
|-------|-----------------|
| CSS selectors correctness | Verified `.workbench-layout` and `.session-panel-layout` exist in CSS, but test assumes they render synchronously. Need to verify actual component mount timing and whether tests should wait for specific state before assertion. |
| SessionPanel conditional rendering | SessionPanel only renders in certain workbench tabs. Must decide: should tests explicitly navigate to a workbench that includes the panel, or should we add data-testid attributes for more reliable selection? |
| Test naming convention | `test:pw` vs `test:e2e` naming split. Team decision needed: should Playwright replace curl-based E2E? Should both coexist under same test:e2e command? |
| Parallel worker limit | Local testing with unlimited workers may cause flakiness. Recommend team discussion: acceptable trade-off between test speed and stability? |
| Auth middleware health check | Must confirm: does authMiddleware skip `/health` endpoint? If not, Playwright config health check will hang. Quick code review of `packages/backend/src/middleware/auth.js` needed. |

---

## Recommendations for Next Steps

1. **Immediate (Critical):** Fix CSS selector assumptions—add explicit waits or use data-testid attributes for stable test selection.
2. **High Priority:** Correct .gitignore path for Playwright cache; confirm auth middleware allows `/health` bypass.
3. **Design Decision:** Resolve `test:pw` vs `test:e2e` naming; document relationship to curl-based E2E tests.
4. **Documentation:** Add Playwright quickstart guide to project docs with: setup prerequisites, how to run locally/CI, artifact disk space expectations, troubleshooting auth/backend health issues.

---

## Learnings

**Issue:** Test selectors relied on CSS class names existing, but didn't account for conditional rendering or timing of mount. CSS classes were verified to exist, but test reliability depends on component lifecycle sequencing, not just DOM presence.

**Root Cause:** Tests written with happy-path assumptions (component always renders, always mounts immediately). No explicit synchronization with component initialization or workbench state transitions.

**Suggestion:** Adopt data-testid pattern for all E2E test targets (not CSS classes). Use explicit route navigation or workbench state checks before assertions. Document component lifecycle expectations in test fixtures. Consider a test helper that waits for workbench readiness before running smoke tests.

[FRESH EYE] The `.gitignore` path error is a common mistake—`/playwright/.cache/` won't match `.playwright/` (dot-prefix). This will cause cache artifacts to be accidentally committed to git. Additionally, the hardcoded backend health check URL in `playwright.config.ts` will fail if a team member overrides `PORT` env var, making local test setup brittle. These are low-visibility failure modes that appear to work but break in edge cases.
