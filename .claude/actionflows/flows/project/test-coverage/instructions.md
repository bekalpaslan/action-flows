# Test Coverage Flow

> Analyze test coverage and optionally address gaps.

---

## When to Use

- Check current coverage state
- Before releases or major changes
- When requested by human

---

## Required Inputs From Human

| Input | Description | Default |
|-------|-------------|---------|
| scope | What to analyze | "all" |
| threshold | Target coverage % (optional) | none (report only) |
| autofix | Generate tests for gaps? | false |
| metrics | What to measure | "lines" |

---

## Behavior

This flow adapts based on inputs:

| If threshold is... | And autofix is... | Then... |
|-------------------|-------------------|---------|
| not set | - | Report coverage only |
| set | false | Report + warn if below |
| set | true | Report + generate tests if below |

---

## Action Sequence

### Step 1: Run Coverage Analysis

**Action:** `test/`
**Model:** haiku

**Spawn:**
```
Read your definition in .claude/actionflows/actions/test/agent.md

Input:
- scope: {scope}
- type: coverage
- context: Report pass/fail counts, coverage %, and uncovered areas
```

---

### Step 2: Evaluate (if threshold provided)

**Action:** `analyze/`
**Model:** haiku
**Condition:** threshold is set

**Spawn:**
```
Read your definition in .claude/actionflows/actions/analyze/agent.md

Input:
- aspect: coverage-gap
- scope: {Step 1 result}
- context: threshold={threshold}, list gaps sorted by file with line numbers
```

---

### Step 3: Generate Tests (if requested)

**Action:** `code/`
**Model:** sonnet
**Condition:** autofix=true AND below threshold

**Spawn:**
```
Read your definition in .claude/actionflows/actions/code/agent.md

Input:
- task: Generate test stubs for uncovered code
- context: gaps from Step 2
- component: backend or frontend per gap location
```

---

### Step 4: Report

**Action:** Inline (no agent needed)

Output summary:
- Current coverage %
- Gaps found (if any)
- Tests generated (if any)
- Pass/fail vs threshold (if set)

---

## Example Usage

```
# Just check coverage
/test-coverage

# Check with threshold (warn only)
/test-coverage threshold=80

# Check and auto-generate tests
/test-coverage threshold=80 autofix=true

# Specific package
/test-coverage scope=packages/backend threshold=70
```

---

## Chains With

- → `code-and-review/` (if tests need review)
- ← Manual trigger only (no auto-gates unless user configures)
