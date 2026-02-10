#!/usr/bin/env bash
# Setup Git hooks for ActionFlows Dashboard
#
# This script installs pre-commit hooks that validate contract files before commits.

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"
SCRIPT_DIR="$PROJECT_ROOT/scripts"

echo ""
echo "==================================="
echo "  Git Hooks Setup"
echo "==================================="
echo ""

# Check if .git directory exists
if [ ! -d "$PROJECT_ROOT/.git" ]; then
  echo "❌ Error: .git directory not found"
  echo "   This doesn't appear to be a git repository."
  exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Install pre-commit hook
echo "📝 Installing pre-commit hook..."

if [ -f "$HOOKS_DIR/pre-commit" ]; then
  echo "⚠️  Existing pre-commit hook found"
  echo "   Creating backup: pre-commit.backup"
  mv "$HOOKS_DIR/pre-commit" "$HOOKS_DIR/pre-commit.backup"
fi

# Copy the hook script
cp "$SCRIPT_DIR/pre-commit-contracts.sh" "$HOOKS_DIR/pre-commit"

# Make it executable
chmod +x "$HOOKS_DIR/pre-commit"

echo "✅ Pre-commit hook installed successfully!"
echo ""
echo "==================================="
echo "  Setup Complete"
echo "==================================="
echo ""
echo "The pre-commit hook will now run automatically when you commit."
echo ""
echo "Hook behavior:"
echo "  • Checks if any .contract.md files are staged"
echo "  • Runs contract validation if contracts changed"
echo "  • Warns about errors but does NOT block commits (for now)"
echo ""
echo "Commands:"
echo "  • Run validation manually: pnpm run health:check"
echo "  • Skip hook on commit:     git commit --no-verify"
echo "  • Remove hook:             rm .git/hooks/pre-commit"
echo ""
