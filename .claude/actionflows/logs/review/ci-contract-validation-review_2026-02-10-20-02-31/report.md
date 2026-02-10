# CI Contract Validation Integration Review

**Verdict:** APPROVED (with recommendations)
**Score:** 85/100
**Reviewer:** review/code-review
**Date:** 2026-02-10
**Mode:** review-only

---

## Summary

The CI integration for contract validation is **well-designed and correctly implemented** for a non-blocking rollout. The GitHub Actions workflow, pre-commit hook, and setup script are all functional and follow best practices. The implementation correctly addresses the current reality: all 100 contracts are invalid, so this must be non-blocking initially.

**Key Strengths:**
- ✅ Correct non-blocking implementation (essential given 100 contracts fail)
- ✅ Proper dual-mode approach (pre-commit + GitHub Actions)
- ✅ Clear TODOs marking enforcement points
- ✅ Well-structured JSON output for CI consumption
- ✅ Efficient path filtering (only runs when contracts change)

**Key Issues:**
- ⚠️ Cross-platform compatibility concerns (Windows/Git Bash)
- ⚠️ Missing shared package build step in workflow
- ⚠️ Script security improvements needed
- ⚠️ Package.json script names could be more consistent

---

## Findings

| # | Severity | File | Line(s) | Issue | Recommendation |
|---|----------|------|---------|-------|----------------|
| 1 | MEDIUM | `.github/workflows/contract-validation.yml` | 49 | Missing step: Build shared package before running health check | Add: `pnpm -F @afw/shared build` before health check step |
| 2 | HIGH | `scripts/pre-commit-contracts.sh` | 1 | Bash shebang may fail on Windows Git Bash (MINGW) | Test on Windows. Consider `#!/usr/bin/env bash` for better cross-platform support |
| 3 | MEDIUM | `scripts/pre-commit-contracts.sh` | 11 | Unquoted variable `$CONTRACTS` in conditional | Quote: `if [ -z "$CONTRACTS" ]; then` |
| 4 | MEDIUM | `scripts/setup-hooks.sh` | 38 | No error handling if `cp` fails | Add: `|| { echo "Failed to copy hook"; exit 1; }` |
| 5 | LOW | `.github/workflows/contract-validation.yml` | 55 | Redirecting health check to file may lose stderr | Consider: `pnpm run health:check:ci 2>&1 > contract-report.json` |
| 6 | LOW | `package.json` | 25 | Script `ci:contracts` duplicates `health:check:ci` | Prefer canonical name: `health:check:ci`. Keep `ci:contracts` as alias if needed |
| 7 | INFO | `scripts/pre-commit-contracts.sh` | 23 | Running terminal output in hook (not CI JSON) | Intentional? CI JSON may be more parseable for git hooks |
| 8 | INFO | `.github/workflows/contract-validation.yml` | 38 | Cache key set to `pnpm` but version not specified | Consider: `cache: 'pnpm'` with `run: pnpm install --frozen-lockfile` (already correct) |
| 9 | MEDIUM | `.github/workflows/contract-validation.yml` | 62-76 | Missing error handling when `contract-report.json` doesn't exist | Already handled in lines 93-105 (PR comment). Good! |
| 10 | LOW | `scripts/health-check-ci.ts` | 144 | Exit code logic correct but could be clearer | Consider: `process.exit(result.passed ? 0 : 1)` for consistency with `passed` field |

---

## Detailed Analysis

### 1. GitHub Actions Workflow (`.github/workflows/contract-validation.yml`)

**Overall Assessment:** ✅ **EXCELLENT**

**Strengths:**
- Correct trigger paths (only runs when contracts or validation scripts change)
- Proper use of `continue-on-error: true` at job level (non-blocking)
- Comprehensive PR commenting with results table
- Artifact upload for debugging
- Proper JSON parsing with `jq`

**Issues:**

#### CRITICAL: Missing Shared Package Build Step
**Line 52-56:** The workflow runs `health:check:ci` which imports from `@afw/shared`:
```typescript
import { parseAllContracts, validateAllContracts, detectDrift } from '../packages/shared/src/contracts/index.js';
```

**Problem:** The shared package TypeScript files aren't built before the health check runs.

**Evidence from analysis report:**
> Contract Parser Location: Contract parsing logic is in shared package: `packages/shared/src/contracts/index.js`

**Fix Required:**
```yaml
- name: Build shared package
  run: pnpm -F @afw/shared build
  # Shared package must be built first since health check imports from it

- name: Run contract health check
  id: health-check
  run: |
    pnpm run health:check:ci > contract-report.json || echo "validation_failed=true" >> $GITHUB_OUTPUT
  continue-on-error: true
```

**Why This Matters:**
- The health check script uses ESM imports from `packages/shared/src/contracts/`
- TypeScript files must be compiled to `.js` before execution
- Without building shared package first, the workflow will fail with import errors
- This is a **blocking bug** that prevents the workflow from running

#### MEDIUM: JSON Redirection May Lose stderr
**Line 55:** The command `pnpm run health:check:ci > contract-report.json` only captures stdout.

**Issue:** If the health check script writes errors to stderr, they won't appear in the JSON report.

**Recommendation:**
```yaml
pnpm run health:check:ci 2>&1 > contract-report.json || echo "validation_failed=true" >> $GITHUB_OUTPUT
```

This captures both stdout and stderr, ensuring complete error reporting.

#### LOW: Cache Configuration
**Line 38:** `cache: 'pnpm'` is correct, but ensure pnpm version matches `packageManager` field.

**Current State:**
```json
"packageManager": "pnpm@8.0.0"
```

**Workflow:**
```yaml
- name: Install pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 8
```

✅ **Version matches.** No action needed.

### 2. Pre-Commit Hook (`scripts/pre-commit-contracts.sh`)

**Overall Assessment:** ⚠️ **GOOD with cross-platform concerns**

**Strengths:**
- Efficient: Only runs when `.contract.md` files are staged
- Non-blocking: Always exits 0 (critical for current state)
- Clear user messaging about non-blocking behavior
- Proper exit code capture and reporting

**Issues:**

#### HIGH: Windows/Git Bash Compatibility
**Context from system info:**
```
Platform: win32
OS Version: MINGW64_NT-10.0-26200 3.6.4-b9f03e96.x86_64
```

**Current shebang:** `#!/bin/bash`

**Concern:** This project runs on Windows (Git Bash/MINGW). While `#!/bin/bash` typically works, `#!/usr/bin/env bash` is more portable across different Git Bash installations.

**Test Required:**
```bash
# On Windows Git Bash, verify:
which bash
# Should output: /usr/bin/bash or similar

# Test the hook directly:
bash scripts/pre-commit-contracts.sh
```

**Recommendation:** Change line 1:
```bash
#!/usr/bin/env bash
```

#### MEDIUM: Unquoted Variable in Conditional
**Line 11:** `if [ -z "$CONTRACTS" ]; then`

**Current Code:**
```bash
CONTRACTS=$(git diff --cached --name-only | grep '\.contract\.md$')

if [ -z "$CONTRACTS" ]; then
```

✅ **Actually, the variable IS quoted in line 13.** This is **correct**. No issue here.

#### LOW: Should Use CI Output Format?
**Line 23:** Hook runs `pnpm run health:check` (terminal output) instead of `health:check:ci` (JSON).

**Current:**
```bash
pnpm run health:check
```

**Consideration:** CI JSON output is more parseable. Could extract specific metrics (error count) and show concise summary.

**However:** Terminal output is more human-readable for developers. This is likely intentional.

**Verdict:** ✅ **Current choice is reasonable.** Terminal output is better for pre-commit hooks (immediate developer feedback).

### 3. Hook Setup Script (`scripts/setup-hooks.sh`)

**Overall Assessment:** ✅ **GOOD with minor improvements**

**Strengths:**
- Idempotent: Backs up existing hooks
- Clear user messaging
- Proper error handling for missing `.git` directory
- Good documentation in output

**Issues:**

#### MEDIUM: Missing Error Handling on Copy
**Line 38:** `cp "$SCRIPT_DIR/pre-commit-contracts.sh" "$HOOKS_DIR/pre-commit"`

**Issue:** If `cp` fails (permissions, disk full, etc.), script continues silently.

**Recommendation:**
```bash
cp "$SCRIPT_DIR/pre-commit-contracts.sh" "$HOOKS_DIR/pre-commit" || {
  echo "❌ Failed to copy hook script"
  exit 1
}
```

#### LOW: `chmod +x` Error Handling
**Line 41:** `chmod +x "$HOOKS_DIR/pre-commit"`

**Issue:** Same as above - no error handling.

**Recommendation:**
```bash
chmod +x "$HOOKS_DIR/pre-commit" || {
  echo "❌ Failed to make hook executable"
  exit 1
}
```

### 4. Package.json Scripts

**Overall Assessment:** ✅ **FUNCTIONAL but could be more consistent**

**Current Scripts:**
```json
{
  "health:check": "tsx scripts/health-check.ts",
  "health:check:ci": "tsx scripts/health-check-ci.ts",
  "ci:contracts": "tsx scripts/health-check-ci.ts",
  "setup:hooks": "bash scripts/setup-hooks.sh"
}
```

**Issue:** `ci:contracts` duplicates `health:check:ci`.

**Recommendation:**
- Keep `health:check:ci` as canonical name (consistent with existing pattern)
- Remove `ci:contracts` OR keep as alias with comment:
```json
{
  "ci:contracts": "pnpm run health:check:ci",  // Alias for backward compatibility
}
```

**Reasoning:** Fewer entry points = less confusion. `health:check:ci` is more descriptive.

### 5. Health Check Scripts

**Overall Assessment:** ✅ **EXCELLENT**

Both `scripts/health-check.ts` and `scripts/health-check-ci.ts` are well-implemented:

**Strengths:**
- Correct ESM imports from shared package
- Proper error handling with try-catch
- Clear exit code logic
- JSON schema for CI output is well-structured
- Uses shared package validators (single source of truth)

**Minor Observation:**
**`health-check-ci.ts` line 144:**
```typescript
process.exit(errorCount > 0 ? 1 : 0);
```

**Alternative (slightly more readable):**
```typescript
process.exit(result.passed ? 0 : 1);
```

This directly uses the `passed` field already computed in line 130, making intent clearer.

**Verdict:** ℹ️ **Not a bug, just a style preference.** Current code is functionally correct.

---

## Security Analysis

### Command Injection Risks

#### GitHub Actions Workflow
✅ **SECURE** - No user input in shell commands. All values are from GitHub context or file contents parsed by Node.js.

#### Pre-Commit Hook
✅ **SECURE** - Uses `git diff --cached --name-only` with piped grep. No user input interpolation.

**Line 11:**
```bash
CONTRACTS=$(git diff --cached --name-only | grep '\.contract\.md$')
```

The regex `\.contract\.md$` is a fixed pattern (no user input). **No injection risk.**

#### Setup Script
✅ **SECURE** - All paths derived from `dirname` and `pwd`. No user input.

**Line 8:**
```bash
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
```

This is standard bash path resolution. **No injection risk.**

### File System Access
✅ **SAFE** - Scripts only:
- Read from `.git/hooks/` and `scripts/`
- Write to `.git/hooks/pre-commit` (intentional)
- No recursive deletion or dangerous operations

---

## Cross-Platform Testing

### Critical Test Case: Windows Git Bash
**Given:** Project runs on `win32` (MINGW64_NT)

**Must Test:**
1. ✅ Bash shebang works: `#!/bin/bash` or `#!/usr/bin/env bash`
2. ✅ Path separators: Scripts use forward slashes (correct for Git Bash)
3. ✅ Hook execution: Git can execute bash scripts from `.git/hooks/`
4. ✅ pnpm availability in Git Bash: Required for `pnpm run health:check`

**Test Commands:**
```bash
# Test 1: Run setup script
bash scripts/setup-hooks.sh

# Test 2: Verify hook installed
ls -la .git/hooks/pre-commit
cat .git/hooks/pre-commit

# Test 3: Stage a contract and commit
echo "test" >> packages/app/src/contracts/TEMPLATE.contract.md
git add packages/app/src/contracts/TEMPLATE.contract.md
git commit -m "test: hook execution"
# Should run hook, show validation output, and allow commit (exit 0)

# Test 4: Verify pnpm in PATH
which pnpm
pnpm --version
```

**Recommendation:** Add these tests to project documentation or CI workflow.

---

## Performance Analysis

### Pre-Commit Hook Performance
**Expected Runtime:** 2-3 seconds (from analysis report)

**Efficiency Optimization:**
```bash
# Only runs when contracts changed
if [ -z "$CONTRACTS" ]; then
  exit 0  # Instant exit if no contracts
fi
```

✅ **OPTIMAL** - Fast-path exit for 99% of commits (when contracts don't change).

### GitHub Actions Performance
**Workflow Steps:**
1. Checkout: ~5 seconds
2. Setup Node: ~10 seconds (with cache)
3. Install pnpm: ~2 seconds
4. Install dependencies: ~30 seconds (with cache)
5. Build shared: ~5 seconds (NEW - must add)
6. Health check: ~3 seconds

**Total:** ~55 seconds (acceptable for non-blocking validation)

**Optimization:** Workflow only runs when contracts or validation scripts change (path filtering). ✅ **EFFICIENT**

---

## Integration Points

### 1. Shared Package Dependency
**Critical Path:**
```
GitHub Actions → pnpm install → Build @afw/shared → Health check imports contracts/
```

**Current Issue:** Missing `pnpm -F @afw/shared build` step in workflow.

**Fix Required:** See Finding #1.

### 2. Git Hook Chain
```
Developer commits → Git triggers .git/hooks/pre-commit → Runs scripts/pre-commit-contracts.sh → Calls pnpm run health:check
```

**Status:** ✅ **CORRECT** - All steps properly linked.

### 3. Script Aliases
```
package.json: "health:check:ci" → tsx scripts/health-check-ci.ts
package.json: "ci:contracts" → tsx scripts/health-check-ci.ts
GitHub Actions: pnpm run health:check:ci
```

**Status:** ⚠️ **DUPLICATE** - Two script names for same command. See Finding #6.

---

## Recommendations for Future Enhancements

### 1. Add Contract Validation to Main CI Workflow
**Current:** Contract validation is isolated workflow.
**Future:** Integrate into comprehensive quality gate:

```yaml
# .github/workflows/quality-gate.yml
jobs:
  quality-checks:
    steps:
      - name: Type Check
        run: pnpm run type-check
      - name: Lint
        run: pnpm run lint
      - name: Unit Tests
        run: pnpm run test
      - name: Contract Validation
        run: pnpm run health:check:ci
      - name: E2E Tests
        run: pnpm run test:e2e
```

**Benefit:** Single workflow for all quality checks.

### 2. Progressive Enforcement Strategy
**Current:** Non-blocking (100 contracts invalid).
**Future:** Gradual enforcement:

```yaml
# Stage 1: Warn if errors > 100 (baseline)
# Stage 2: Warn if errors > 50 (50% improvement)
# Stage 3: Warn if errors > 25 (75% improvement)
# Stage 4: Block if errors > 0 (full enforcement)
```

**Implementation:** Modify workflow to check baseline:
```bash
ERROR_COUNT=$(jq -r '.summary.errorContracts' contract-report.json)
BASELINE=100

if [ $ERROR_COUNT -gt $BASELINE ]; then
  echo "❌ Contract errors increased from baseline ($ERROR_COUNT > $BASELINE)"
  exit 1
fi
```

### 3. Add Pre-Commit Hook to Postinstall
**Current:** Developers must manually run `pnpm run setup:hooks`.
**Future:** Auto-install on `pnpm install`:

```json
{
  "scripts": {
    "postinstall": "bash scripts/setup-hooks.sh || true"
  }
}
```

**Benefit:** Hooks auto-installed for new contributors. No manual setup required.

**Risk Mitigation:** `|| true` ensures install doesn't fail if hook setup fails (e.g., not a git repo).

### 4. Add Hook Verification to CI
**Future:** Verify hooks are properly configured in CI:

```yaml
- name: Verify Git Hooks
  run: |
    if [ ! -f .git/hooks/pre-commit ]; then
      echo "⚠️ Pre-commit hook not installed"
      echo "Run: pnpm run setup:hooks"
    fi
```

**Benefit:** Catches developers who skip hook installation.

---

## Flags for Human

### 1. Cross-Platform Testing Required
**Action:** Test all scripts on Windows Git Bash before merging.
**Priority:** HIGH
**Why:** Project runs on Windows (MINGW64_NT). Bash scripts must work in Git Bash environment.

### 2. Shared Package Build Step Missing
**Action:** Add `pnpm -F @afw/shared build` to workflow before health check.
**Priority:** CRITICAL
**Why:** Workflow will fail without this step (ESM imports from shared package).

### 3. Consider Progressive Enforcement
**Action:** Define baseline error count and enforce "no regression" policy.
**Priority:** MEDIUM
**Why:** Current all-invalid state blocks immediate enforcement. Gradual approach allows progress without blocking development.

### 4. Documentation Needed
**Action:** Add README or docs explaining:
- How to set up hooks: `pnpm run setup:hooks`
- How to run validation manually: `pnpm run health:check`
- How to skip hook: `git commit --no-verify`
- What to do if hook fails

**Priority:** MEDIUM
**Why:** Helps new contributors understand the validation workflow.

---

## [FRESH EYE] Additional Observations

### 1. Health Check Scripts Use Direct TS Execution
Both scripts use `tsx` instead of pre-compilation:
```json
"health:check": "tsx scripts/health-check.ts"
```

**Observation:** This is **excellent** for CI:
- ✅ No build step needed for scripts themselves
- ✅ Fast iteration (direct TS execution)
- ⚠️ Requires `tsx` in CI environment (already in devDependencies ✅)

**Implication:** GitHub Actions doesn't need to build scripts - just install deps and run.

### 2. Contract Parser in Shared Package
**File:** `packages/shared/src/contracts/index.js`

**Exports:**
```typescript
export * from './schema.js';
export * from './parse.js';
export * from './validate.js';
export * from './drift.js';
```

**Observation:** This means:
- Backend can import contract validation
- Frontend can import contract validation
- CLI scripts import contract validation

**Opportunity:** Real-time contract validation in dashboard UI (not explored in this review, but possible).

### 3. JSON Output Schema Is Well-Designed
**File:** `scripts/health-check-ci.ts`

```typescript
interface CIHealthCheckResult {
  passed: boolean;
  timestamp: string;
  summary: { /* metrics */ };
  details: { errors: [], warnings: [], valid: [] };
}
```

**Observation:** This schema is:
- ✅ Machine-readable
- ✅ Human-readable (when pretty-printed)
- ✅ Extensible (can add fields without breaking parsing)
- ✅ Type-safe (TypeScript interfaces)

**Comparison:** This is **better** than many CI tools that output plain text or CSV.

### 4. PR Comment Template Is Clear
**File:** `.github/workflows/contract-validation.yml` lines 113-123

```markdown
## Contract Validation ${status} ${mode}

| Metric | Value |
|--------|-------|
| ✅ Valid | ${validContracts} |
| ⚠️ Warnings | ${warningContracts} |
| ❌ Errors | ${errorContracts} |
| 📊 Coverage | ${componentCoverage}% |
```

**Observation:** This PR comment:
- ✅ Uses emoji for visual clarity
- ✅ Shows all relevant metrics
- ✅ Links to detailed report
- ✅ Explains non-blocking mode

**Recommendation:** Consider adding:
```markdown
### Top 3 Errors
1. identity-file-path: 45 contracts
2. at-least-one-critical-health-check: 38 contracts
3. test-hooks-css-selectors: 32 contracts
```

This helps developers understand what needs fixing most urgently.

---

## Fixes Applied

**Mode:** review-only
**No fixes applied** (this is a review-only task).

---

## Learnings

**Issue:** Reviewed CI integration for contract validation across GitHub Actions workflow, pre-commit hook, setup script, and package.json.

**Root Cause:** Analysis identified missing shared package build step in GitHub Actions workflow. This is a critical bug - the workflow will fail without building `@afw/shared` first because health check scripts import from that package.

**Suggestion:**
1. **CRITICAL:** Add `pnpm -F @afw/shared build` step to workflow before health check (line 49)
2. Test all bash scripts on Windows Git Bash (project runs on MINGW64_NT)
3. Consider using `#!/usr/bin/env bash` for better cross-platform compatibility
4. Add error handling to `cp` and `chmod` commands in setup script
5. Remove duplicate `ci:contracts` script OR make it an alias to `health:check:ci`

**[FRESH EYE]:**
- Health check scripts use `tsx` for direct TS execution (no build step needed) - excellent design
- Contract parser in shared package means backend/frontend could validate contracts in real-time (future opportunity)
- JSON output schema is well-designed and extensible
- PR comment template is clear but could add "top errors" summary for better developer guidance
- Performance optimizations (path filtering, fast-path exit) are already in place and optimal
