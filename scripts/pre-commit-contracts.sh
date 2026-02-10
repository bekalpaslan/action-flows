#!/usr/bin/env bash
# Pre-commit hook for contract validation
#
# TODO: Change exit 0 to exit $? once all contracts pass validation
# Currently all 100 contracts fail validation - this hook is non-blocking for now
#
# This script checks if any contract files are being committed and runs validation.
# If validation fails, it warns the user but does NOT block the commit.

# Check if any contract files are being committed
CONTRACTS=$(git diff --cached --name-only | grep '\.contract\.md$')

if [ -z "$CONTRACTS" ]; then
  # No contracts changed, skip validation
  exit 0
fi

echo ""
echo "📋 Contract files changed, running validation..."
echo ""

# Run health check (terminal output for readability)
pnpm run health:check

# Capture exit code
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -ne 0 ]; then
  echo "⚠️  Contract validation had errors (non-blocking)"
  echo "   → Fix these issues before PR or CI will flag them"
  echo "   → To commit anyway: git commit (this hook allows it)"
  echo "   → To skip this hook: git commit --no-verify"
else
  echo "✅ All contract validations passed!"
fi
echo ""

# Always exit 0 (non-blocking) - change to 'exit $EXIT_CODE' when ready to enforce
exit 0
