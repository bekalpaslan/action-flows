# CI Integration Quick Start

## What Was Implemented

Contract validation CI with:
- ✅ GitHub Actions workflow (non-blocking)
- ✅ Pre-commit Git hooks (non-blocking)
- ✅ Simple setup script

## Setup (5 minutes)

### 1. Install Pre-Commit Hook
```bash
pnpm run setup:hooks
```

### 2. Test It
```bash
# Modify any contract
echo "\n<!-- test -->" >> packages/app/src/contracts/components/Canvas/AnimatedFlowEdge.contract.md

# Commit (hook will run)
git add packages/app/src/contracts/components/Canvas/AnimatedFlowEdge.contract.md
git commit -m "test: contract validation"

# Expected: Warning but commit succeeds
```

### 3. Push to GitHub
```bash
git push
# GitHub Actions will run on contract changes
# Check the Actions tab to see results
```

## Available Commands

```bash
# Manual validation (terminal output)
pnpm run health:check

# CI validation (JSON output)
pnpm run health:check:ci
pnpm run ci:contracts          # Alias

# Install hooks
pnpm run setup:hooks
```

## Current Status

- **Mode:** Non-blocking (warns but doesn't fail)
- **Reason:** All 100 contracts currently have validation errors
- **TODO:** Switch to blocking once contracts are fixed

## How to Bypass

```bash
# Skip pre-commit hook (emergency only)
git commit --no-verify

# Remove hook completely
rm .git/hooks/pre-commit
```

## Files Created

- `.github/workflows/contract-validation.yml` - GitHub Actions workflow
- `scripts/pre-commit-contracts.sh` - Git pre-commit hook
- `scripts/setup-hooks.sh` - Hook installer
- `package.json` - Updated with new scripts

## Migration to Blocking Mode

When contracts are fixed:

1. **GitHub Actions:** Remove `continue-on-error: true` from workflow
2. **Pre-commit hook:** Change `exit 0` to `exit $EXIT_CODE` in script
3. **Branch protection:** Add as required status check

See `implementation.md` for full details.
