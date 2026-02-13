#!/usr/bin/env node
/**
 * Pre-commit Hook: Contract Drift Prevention
 *
 * Blocks commits that modify contract files without maintaining alignment.
 * Runs pnpm contract:validate when contract files are staged.
 *
 * Usage: Automatically triggered by Git pre-commit hook
 * Setup: pnpm run setup:hooks (or manual registration)
 */

import { execSync } from 'child_process';
import { relative } from 'path';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Contract file patterns to watch for changes
 */
const CONTRACT_PATTERNS = [
  '.claude/actionflows/CONTRACT.md',
  'packages/shared/src/contract/types/',
  'packages/shared/src/contract/validation/schemas.ts',
  'packages/shared/src/contract/parsers/',
  'packages/shared/src/contract/patterns/',
] as const;

// ============================================================================
// Git Integration
// ============================================================================

/**
 * Get list of staged files from Git
 */
function getStagedFiles(): string[] {
  try {
    const output = execSync('git diff --cached --name-only', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    return output
      .split('\n')
      .filter(Boolean)
      .map(file => file.trim());
  } catch (err) {
    console.error('[pre-commit-contract] Failed to get staged files:', err);
    return [];
  }
}

/**
 * Check if any staged files match contract patterns
 */
function hasContractChanges(stagedFiles: string[]): boolean {
  return stagedFiles.some(file =>
    CONTRACT_PATTERNS.some(pattern => file.includes(pattern))
  );
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Run contract validation script
 * @returns true if validation passed, false if failed
 */
function runValidation(): boolean {
  console.log('[pre-commit-contract] Contract files modified, running validation...\n');

  try {
    // Run validation (throws if exit code !== 0)
    execSync('pnpm run contract:validate', {
      stdio: 'inherit', // Show validation output
      encoding: 'utf8',
      cwd: process.cwd(),
    });

    return true;
  } catch (err) {
    // execSync throws on non-zero exit code
    return false;
  }
}

// ============================================================================
// Main
// ============================================================================

function main(): void {
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    console.log('[pre-commit-contract] No staged files detected');
    process.exit(0);
  }

  const hasContracts = hasContractChanges(stagedFiles);

  if (!hasContracts) {
    console.log('[pre-commit-contract] No contract files modified, skipping validation');
    process.exit(0);
  }

  // Show which contract files are being committed
  const contractFiles = stagedFiles.filter(file =>
    CONTRACT_PATTERNS.some(pattern => file.includes(pattern))
  );
  console.log('[pre-commit-contract] Contract files staged:');
  contractFiles.forEach(file => {
    console.log(`  - ${relative(process.cwd(), file)}`);
  });
  console.log();

  // Run validation
  const passed = runValidation();

  if (passed) {
    console.log('\n✅ Contract validation passed. Commit allowed.\n');
    process.exit(0);
  } else {
    console.error('\n❌ Contract validation failed. Commit blocked.\n');
    console.error('Fix the drift issues above and try again.\n');
    console.error('To bypass this check (NOT RECOMMENDED):');
    console.error('  git commit --no-verify\n');
    process.exit(1);
  }
}

// Entry point
main();
