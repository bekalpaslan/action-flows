# CI/CD Integration Inventory Analysis

**Aspect:** inventory + structure
**Scope:** CI/CD infrastructure, pre-commit hooks, GitHub Actions, contract health check integration points
**Date:** 2026-02-10
**Agent:** analyze/

---

## 1. Current CI/CD State

### GitHub Actions
**Status:** ❌ **NOT CONFIGURED**

- No `.github/workflows/` directory exists in project root
- No CI/CD automation configured
- No automated testing on PRs or commits
- No deployment pipelines

**Evidence:**
- Searched for `.github/` in project root: not found (only exists in node_modules)
- No workflow YAML files present

### Pre-Commit Hooks
**Status:** ❌ **NOT CONFIGURED**

- No pre-commit hook infrastructure installed
- `.git/hooks/` contains only sample files (all 16 files are `.sample` suffix)
- No active hooks present

**Evidence:**
```bash
$ ls -la .git/hooks/ | grep -v sample
# Output: Empty (only ./ and ../ directories)
```

### Git Hook Packages
**Status:** ❌ **NOT INSTALLED**

Checked for common git hook packages:
- ❌ `husky` - Not found in package.json
- ❌ `lint-staged` - Not found in package.json
- ❌ `simple-git-hooks` - Not found in package.json

**Evidence:**
```bash
$ grep -E "husky|lint-staged|simple-git-hooks" package.json
# No matches found
```

### CI-Related Scripts
**Status:** ✅ **AVAILABLE**

Root `package.json` includes CI-friendly scripts:

| Script | Purpose | Exit Codes |
|--------|---------|------------|
| `health:check` | Human-readable terminal output | 0 = pass, 1 = errors |
| `health:check:ci` | JSON output for CI/CD | 0 = pass, 1 = errors |
| `type-check` | TypeScript validation across all packages | Standard |
| `lint` | ESLint across all packages | Standard |
| `test` | Run all tests (Vitest) | Standard |
| `test:e2e` | End-to-end tests | Standard |

---

## 2. Hook Infrastructure Available

### Claude Code Hooks (Custom System)
**Status:** ✅ **FULLY IMPLEMENTED**

This project uses a **custom Claude Code hook system** (not Git hooks):

**Architecture:**
- Location: `packages/hooks/`
- Runtime: Node.js + TypeScript
- Build output: `packages/hooks/dist/`
- Configuration: `.claude/settings.json`

**Existing hooks:**
- `afw-session-start.ts` - SessionStart hook
- `afw-session-end.ts` - SessionEnd hook
- `afw-step-spawned.ts` - Step spawned tracking
- `afw-step-completed.ts` - Step completion events
- `afw-chain-parse.ts` - Chain parsing
- `afw-control-check.ts` - Control flow validation
- `afw-format-check.ts` - Output format validation
- `afw-output-capture.ts` - Output capture
- `afw-input-inject.ts` - Input injection

**Integration:** These hooks POST events to backend at `http://localhost:3001` during Claude Code execution.

**Limitation:** These are Claude Code lifecycle hooks, NOT Git hooks. They don't run on `git commit`.

### Standard Git Hooks
**Status:** ❌ **NOT AVAILABLE**

No git hook infrastructure exists. To implement pre-commit hooks, we need to:
1. Install a git hook package (husky, simple-git-hooks, or manual scripts)
2. Configure hook scripts
3. Add hook installation to `npm install` lifecycle

---

## 3. Contract Health Check CLI

### health:check (Terminal Output)
**Script:** `scripts/health-check.ts`
**Execution:** `pnpm run health:check`

**Output Format:**
- **Style:** ANSI colored terminal output
- **Symbols:** ✅ (pass), ❌ (fail), ⚠️ (warn)
- **Sections:**
  - Header with title banner
  - Contracts summary (total, valid, warnings, errors)
  - Validation results with color coding
  - Detailed error list (if any)
  - Detailed warning list (if any)
  - Drift detection (missing contracts)
  - Health check summary table
  - Overall status

**Exit Codes:**
- `0` - All contracts pass (no errors)
- `1` - Contract errors found

**Example Output:**
```
========================================
  Contract Health Check Report
========================================

Contracts Found: 100
Components Found: 106

--- Validation Results ---

✅ 0 contracts valid
⚠️ 100 contracts with warnings
❌ 100 contracts with errors

Errors:
  ❌ AnimatedFlowEdge
     - [identity-file-path] filePath must be non-empty
     - [at-least-one-critical-health-check] Every contract must have at least one critical health check
     - [test-hooks-css-selectors] Test Hooks must have at least one CSS selector for targeting

--- Drift Detection ---

✅ 100 contracts for 106 components
⚠️ 28 components without contracts (legacy/deprecated)
  - AppSidebar\AppSidebar.tsx
  - AppSidebar\SidebarNavGroup.tsx
  ... and 23 more
✅ 0 orphaned contracts
✅ All contexts covered

--- Health Check Summary ---

| Metric | Count |
|--------|-------|
| Total contracts | 100 |
| Valid | 0 |
| Warnings | 100 |
| Errors | 100 |
| Coverage | 78% |
| Health Check IDs | 0 |

Overall: ❌ ERRORS FOUND (100 errors, 100 warnings)
```

### health:check:ci (JSON Output)
**Script:** `scripts/health-check-ci.ts`
**Execution:** `pnpm run health:check:ci`

**Output Format:** Structured JSON to stdout

**Schema:**
```typescript
interface CIHealthCheckResult {
  passed: boolean;                    // Overall pass/fail
  timestamp: string;                  // ISO 8601 timestamp
  summary: {
    totalContracts: number;
    validContracts: number;
    warningContracts: number;
    errorContracts: number;
    totalHealthChecks: number;
    componentCoverage: number;        // Percentage
  };
  details: {
    errors: ContractDetail[];
    warnings: ContractDetail[];
    valid: ContractDetail[];
  };
}

interface ContractDetail {
  filePath: string;                   // Absolute path to contract
  name: string;                       // Component name
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  healthChecks: number;
}

interface ValidationError {
  rule: string;                       // Validation rule ID
  message: string;                    // Human-readable message
  section?: string;                   // Optional section reference
}
```

**Exit Codes:**
- `0` - All contracts pass (`passed: true`, `errorContracts: 0`)
- `1` - Contract errors found (`passed: false`, `errorContracts > 0`)

**Example Output:**
```json
{
  "passed": false,
  "timestamp": "2026-02-10T18:53:28.275Z",
  "summary": {
    "totalContracts": 100,
    "validContracts": 0,
    "warningContracts": 0,
    "errorContracts": 100,
    "totalHealthChecks": 0,
    "componentCoverage": 78.13
  },
  "details": {
    "errors": [
      {
        "filePath": "D:\\ActionFlowsDashboard\\packages\\app\\src\\contracts\\components\\Canvas\\AnimatedFlowEdge.contract.md",
        "name": "Unknown",
        "valid": false,
        "errors": [
          {
            "rule": "identity-file-path",
            "message": "filePath must be non-empty",
            "section": "Identity"
          },
          {
            "rule": "at-least-one-critical-health-check",
            "message": "Every contract must have at least one critical health check",
            "section": "Health Checks"
          }
        ],
        "warnings": [
          {
            "rule": "no-placeholder-markers",
            "message": "Contract contains TODO/TBD markers in fields: propsContract.inputs[0].description"
          }
        ],
        "healthChecks": 0
      }
    ],
    "warnings": [],
    "valid": []
  }
}
```

### Contract Files in Scope

**Location:** `packages/app/src/contracts/`
**Count:** 100 contract files found

**Structure:**
```
packages/app/src/contracts/
├── TEMPLATE.contract.md
├── components/
│   ├── Canvas/
│   ├── ChatPanel/
│   ├── CodeEditor/
│   ├── Common/
│   ├── DiscussButton/
│   ├── FileExplorer/
│   ├── Harmony/
│   ├── IntelDossier/
│   ├── Layout/
│   ├── Registry/
│   ├── SessionPanel/
│   ├── SessionSidebar/
│   ├── Squad/
│   ├── StepInspection/
│   ├── Terminal/
│   ├── Testing/
│   └── Workbench/
└── contexts/
    ├── DiscussContext.contract.md
    ├── ThemeContext.contract.md
    ├── ToastContext.contract.md
    ├── VimNavigationContext.contract.md
    ├── WebSocketContext.contract.md
    └── WorkbenchContext.contract.md
```

**Current Status:**
- ✅ 100 contracts authored
- ❌ 0 contracts fully valid (all have validation errors)
- ⚠️ 100 contracts have warnings (TODO/TBD markers)
- 📊 78% component coverage (28 legacy components without contracts)

**Common validation errors:**
1. `identity-file-path` - Empty filePath in Identity section
2. `at-least-one-critical-health-check` - Missing critical health checks
3. `test-hooks-css-selectors` - Missing CSS selectors in Test Hooks
4. `no-placeholder-markers` - TODO/TBD markers in contract fields

---

## 4. Integration Implementation Recommendations

### Option A: Pre-Commit Hook (Recommended)

**Why:** Catches contract violations BEFORE they enter git history.

**Implementation Steps:**

1. **Install husky:**
   ```bash
   pnpm add -D husky
   pnpm exec husky init
   ```

2. **Create pre-commit hook:**
   ```bash
   # .husky/pre-commit
   #!/usr/bin/env sh
   . "$(dirname -- "$0")/_/husky.sh"

   # Only run if contract files changed
   if git diff --cached --name-only | grep -q "\.contract\.md$"; then
     echo "Contract files changed - running health check..."
     pnpm run health:check:ci
     exit $?
   fi
   ```

3. **Add prepare script to package.json:**
   ```json
   {
     "scripts": {
       "prepare": "husky || true"
     }
   }
   ```

**Pros:**
- ✅ Runs automatically on every commit
- ✅ Only runs when contract files change (fast)
- ✅ Prevents invalid contracts from entering git history
- ✅ Developer gets immediate feedback
- ✅ Uses existing `health:check:ci` script

**Cons:**
- ⚠️ Adds ~2-3 seconds to commit time when contracts change
- ⚠️ Currently ALL 100 contracts are invalid - would block ALL commits
- ⚠️ Need to fix contracts first OR add `--no-verify` escape hatch

### Option B: GitHub Actions (CI Pipeline)

**Why:** Automated validation on PRs, no local dev impact.

**Implementation Steps:**

1. **Create workflow file:**
   ```yaml
   # .github/workflows/contract-validation.yml
   name: Contract Validation

   on:
     pull_request:
       paths:
         - 'packages/app/src/contracts/**/*.contract.md'
         - 'packages/shared/src/contracts/**'
         - 'scripts/health-check*.ts'
     push:
       branches:
         - main
         - master

   jobs:
     validate-contracts:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'pnpm'

         - name: Install pnpm
           uses: pnpm/action-setup@v2
           with:
             version: 8

         - name: Install dependencies
           run: pnpm install --frozen-lockfile

         - name: Run contract health check
           run: pnpm run health:check:ci > contract-report.json

         - name: Upload contract report
           if: always()
           uses: actions/upload-artifact@v4
           with:
             name: contract-health-report
             path: contract-report.json

         - name: Comment PR with results
           if: github.event_name == 'pull_request' && failure()
           uses: actions/github-script@v7
           with:
             script: |
               const fs = require('fs');
               const report = JSON.parse(fs.readFileSync('contract-report.json', 'utf8'));
               const errorCount = report.summary.errorContracts;
               const warningCount = report.summary.warningContracts;

               const body = `## Contract Validation Failed ❌

               - **Errors:** ${errorCount} contracts
               - **Warnings:** ${warningCount} contracts
               - **Coverage:** ${report.summary.componentCoverage}%

               See the [contract health report](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}) for details.`;

               github.rest.issues.createComment({
                 issue_number: context.issue.number,
                 owner: context.repo.owner,
                 repo: context.repo.repo,
                 body: body
               });
   ```

2. **Add badge to README (optional):**
   ```markdown
   ![Contract Health](https://github.com/your-org/ActionFlowsDashboard/workflows/Contract%20Validation/badge.svg)
   ```

**Pros:**
- ✅ No impact on local development
- ✅ Automated validation on PRs
- ✅ PR comments with validation results
- ✅ Artifact upload for detailed reports
- ✅ Runs only when contract files change (efficient)

**Cons:**
- ⚠️ Validation happens AFTER push (not preventive)
- ⚠️ Requires GitHub Actions setup
- ⚠️ Currently ALL 100 contracts invalid - every PR would fail
- ⚠️ Need to fix contracts OR mark validation as non-blocking initially

### Option C: Hybrid Approach (Best of Both)

**Why:** Pre-commit for fast feedback, CI for enforcement.

**Strategy:**
1. **Pre-commit hook** (soft validation, non-blocking):
   - Runs `health:check` (terminal output)
   - Shows warnings but doesn't block commit
   - Uses `exit 0` to allow commit even with errors
   - Educates developer about contract health

2. **GitHub Actions** (hard enforcement):
   - Runs `health:check:ci` (JSON output)
   - Blocks PR merge if errors found
   - Required status check for main/master branch
   - Generates detailed reports

**Implementation:**

```bash
# .husky/pre-commit (non-blocking)
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

if git diff --cached --name-only | grep -q "\.contract\.md$"; then
  echo "📋 Contract files changed - checking health..."
  pnpm run health:check || echo "⚠️  Contract errors found (not blocking commit)"
  echo "   → Fix before PR or CI will block merge"
fi

# Always exit 0 (non-blocking)
exit 0
```

**Pros:**
- ✅ Fast local feedback (non-blocking)
- ✅ Hard enforcement at PR level
- ✅ Developer awareness without friction
- ✅ CI as source of truth

**Cons:**
- ⚠️ More complex setup
- ⚠️ Requires both systems

---

## 5. Special Considerations

### Current Contract Health Status
**Critical Blocker:** All 100 contracts are currently invalid.

**Impact on CI Integration:**
- Pre-commit hooks would block every commit touching contracts
- GitHub Actions would fail every PR
- Need remediation strategy BEFORE enabling enforcement

**Remediation Options:**

1. **Fix-First Approach:**
   - Fix all 100 contracts before enabling CI
   - Timeline: Significant effort (100 contracts × multiple errors each)
   - Benefit: Clean enforcement from day one

2. **Gradual Enforcement:**
   - Enable CI in "warn" mode (exit 0 even with errors)
   - Track metrics over time
   - Gradually increase enforcement (e.g., require < 50 errors, then < 25, etc.)
   - Benefit: Immediate visibility without blocking development

3. **Baseline + Incremental:**
   - Snapshot current state as baseline (100 errors acceptable)
   - CI only fails if NEW errors introduced (error count increases)
   - Benefit: Prevents regression without requiring immediate fixes

### Contract Change Detection

**Efficient hook execution:**
```bash
# Only run if contract files changed
if git diff --cached --name-only | grep -q "\.contract\.md$"; then
  pnpm run health:check:ci
fi
```

**Why this matters:**
- Contracts located in: `packages/app/src/contracts/**/*.contract.md`
- Pattern: `**/*.contract.md`
- Avoids running validation on every commit (only when contracts change)

### Performance Benchmarks

**Health Check Execution Time:**
- Terminal output (`health:check`): ~2-3 seconds
- JSON output (`health:check:ci`): ~2-3 seconds
- Contract count: 100 contracts

**Impact:**
- Pre-commit: Adds 2-3 seconds when contracts change (acceptable)
- GitHub Actions: Runs in parallel, no developer wait time

### Integration with Existing Scripts

**Current Test Suite:**
```json
{
  "scripts": {
    "test": "pnpm -r test",           // Unit tests
    "test:e2e": "bash test/curl-commands.sh",  // E2E tests
    "test:pw": "playwright test",     // Playwright tests
    "health:check": "tsx scripts/health-check.ts",       // Contract health
    "health:check:ci": "tsx scripts/health-check-ci.ts"  // Contract health (CI)
  }
}
```

**CI Workflow Opportunity:**
Combine contract validation with existing test suite:

```yaml
# Run all validations together
jobs:
  quality-checks:
    runs-on: ubuntu-latest
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

---

## 6. Recommendations Summary

### Immediate Actions (High Priority)

1. **Fix Contract Validation Errors** (Prerequisite for CI)
   - All 100 contracts currently invalid
   - Common errors: empty filePath, missing health checks, missing CSS selectors
   - Timeline: 1-2 days of focused work OR batch script automation

2. **Set Up GitHub Actions** (Recommended First Step)
   - Create `.github/workflows/contract-validation.yml`
   - Start in "warn" mode (non-blocking) to gather metrics
   - Add PR comment integration for visibility
   - Timeline: 1-2 hours setup

3. **Install Husky for Pre-Commit Hooks** (After contracts fixed)
   - Install: `pnpm add -D husky`
   - Initialize: `pnpm exec husky init`
   - Create non-blocking pre-commit hook first
   - Timeline: 30 minutes setup

### Near-Term Actions (Medium Priority)

4. **Combine with Existing Test Suite**
   - Integrate contract validation into quality gate
   - Run alongside `type-check`, `lint`, `test`
   - Timeline: 1 hour

5. **Enable Blocking Mode** (After contracts validated)
   - Switch pre-commit hook to blocking (exit 1 on errors)
   - Make GitHub Action a required status check
   - Timeline: Configuration change (5 minutes)

### Long-Term Actions (Low Priority)

6. **Add Contract Coverage Reports**
   - Generate coverage reports in CI
   - Track coverage percentage over time
   - Set coverage targets (e.g., 80% → 90% → 95%)
   - Timeline: 2-3 hours for implementation

7. **Contract Linting in IDE**
   - VSCode extension for real-time validation
   - Pre-save hooks for instant feedback
   - Timeline: Future enhancement

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Fix all 100 contract validation errors
- [ ] Set up GitHub Actions workflow (non-blocking)
- [ ] Add contract validation to CI pipeline
- [ ] Monitor metrics for 1 week

### Phase 2: Local Integration (Week 2)
- [ ] Install husky
- [ ] Create non-blocking pre-commit hook
- [ ] Add `prepare` script to package.json
- [ ] Developer documentation for contract validation

### Phase 3: Enforcement (Week 3)
- [ ] Enable blocking mode in GitHub Actions
- [ ] Make contract validation a required status check
- [ ] Update pre-commit hook to blocking mode
- [ ] Team communication about enforcement

### Phase 4: Optimization (Week 4)
- [ ] Add coverage tracking
- [ ] Generate coverage reports in CI
- [ ] Add PR comment automation
- [ ] Performance optimization (caching, parallel runs)

---

## 8. [FRESH EYE] Additional Observations

### Unused Test Infrastructure
Found Playwright installed (`@playwright/test` in devDependencies) with scripts:
- `test:pw`, `test:pw:ui`, `test:pw:headed`, `test:pw:report`
- Could integrate contract validation into Playwright workflows
- Opportunity: Run contract tests alongside E2E tests

### TypeScript Build System
Both health check scripts use `tsx` for execution:
- `tsx scripts/health-check.ts`
- `tsx scripts/health-check-ci.ts`

This means:
- ✅ No build step needed (direct TS execution)
- ✅ Fast iteration (no compile wait)
- ⚠️ Requires `tsx` in CI environment (already in devDependencies)

### Contract Parser Location
Contract parsing logic is in shared package:
```typescript
// packages/shared/src/contracts/index.js
export * from './schema.js';
export * from './parse.js';
export * from './validate.js';
export * from './drift.js';
```

**Implication:** Backend also has access to contract validation.
**Opportunity:** Real-time contract validation in dashboard UI (not just CLI).

---

## Learnings

**Issue:** Analyzed CI/CD infrastructure for contract health check integration.

**Root Cause:** Project has NO existing CI/CD infrastructure:
- No GitHub Actions workflows
- No pre-commit hooks (git hooks empty)
- No hook packages installed (no husky, lint-staged)
- Health check scripts exist but not integrated into any automation

**Suggestion:**
1. Start with GitHub Actions (non-blocking) to gather metrics without impacting development
2. Fix all 100 contract validation errors BEFORE enabling blocking mode
3. Add pre-commit hooks AFTER contracts are valid (avoid blocking every commit)
4. Consider "gradual enforcement" strategy: warn first, then block incrementally

**[FRESH EYE]:**
- Found 100 authored contracts but ALL have validation errors (blocker for CI)
- Discovered Playwright test infrastructure that could integrate with contract validation
- Contract parser in shared package means backend could validate contracts in real-time (UI opportunity)
- `tsx` direct execution means no build step needed for CI (simpler workflow)
