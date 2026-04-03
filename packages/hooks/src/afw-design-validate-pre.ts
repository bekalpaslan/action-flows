#!/usr/bin/env node
/**
 * ActionFlows Dashboard - Design System Validation (PreToolUse)
 *
 * Hook: PreToolUse (matcher: Write|Edit|MultiEdit)
 * Purpose: Block agent file edits that violate design system rules
 *
 * This hook fires BEFORE Write/Edit/MultiEdit tool calls and:
 * 1. Checks if the target file is a validated extension (.tsx, .css)
 * 2. Skips test files, config files, and design token definitions
 * 3. Runs CRITICAL_PATTERNS against the content being written
 * 4. Exits 2 (BLOCK) if violations found, exits 0 (ALLOW) otherwise
 *
 * Exit codes:
 * - 0: Allow tool call (no violations or non-validated file)
 * - 2: Block tool call (design system violation detected)
 *
 * Silent failure mode: any uncaught error exits 0 to avoid blocking agent work.
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  CRITICAL_PATTERNS,
  VALIDATED_EXTENSIONS,
  SKIP_PATTERNS,
} from './utils/design-rules.js';
import { reportViolation } from './utils/violation-reporter.js';

interface PreToolUseInput {
  tool_name: string;
  tool_input: {
    file_path?: string;
    content?: string;
    new_string?: string;
    edits?: Array<{ new_string: string }>;
  };
  session_id: string;
}

/**
 * Normalize a file path for cross-platform comparison.
 * Converts backslashes to forward slashes (Windows path fix).
 */
function normalizePath(filePath: string): string {
  return path.normalize(filePath).replace(/\\/g, '/');
}

/**
 * Extract the content to validate from the tool input.
 * Handles Write (content), Edit (new_string), and MultiEdit (edits[].new_string).
 */
function extractContent(toolName: string, toolInput: PreToolUseInput['tool_input']): string | null {
  if (toolName === 'Write' && toolInput.content) {
    return toolInput.content;
  }

  if (toolName === 'Edit' && toolInput.new_string) {
    return toolInput.new_string;
  }

  if (toolName === 'MultiEdit' && Array.isArray(toolInput.edits)) {
    const parts = toolInput.edits
      .map((edit) => edit.new_string)
      .filter(Boolean);
    return parts.length > 0 ? parts.join('\n') : null;
  }

  return null;
}

/**
 * Check if a file path should be skipped from validation.
 */
function shouldSkip(filePath: string): boolean {
  return SKIP_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(filePath);
  });
}

async function main(): Promise<void> {
  // Read hook input from stdin
  const inputData = fs.readFileSync(0, 'utf-8');
  const hookInput: PreToolUseInput = JSON.parse(inputData);

  const { tool_name, tool_input, session_id } = hookInput;

  // Get file path
  const rawPath = tool_input.file_path;
  if (!rawPath) {
    process.exit(0); // No file path -- allow
  }

  const normalizedPath = normalizePath(rawPath);

  // Check extension
  const ext = path.extname(normalizedPath);
  if (!VALIDATED_EXTENSIONS.includes(ext)) {
    process.exit(0); // Not a validated extension -- allow
  }

  // Check skip patterns
  if (shouldSkip(normalizedPath)) {
    process.exit(0); // Skip pattern matched -- allow
  }

  // Extract content to check
  const content = extractContent(tool_name, tool_input);
  if (!content) {
    process.exit(0); // No content to check -- allow
  }

  // Check critical patterns
  const violations: string[] = [];

  for (const rule of CRITICAL_PATTERNS) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(content)) {
      violations.push(`[${rule.rule}] ${rule.message}`);
    }
  }

  if (violations.length > 0) {
    // Write violation details to stderr (visible to agent)
    console.error(
      `Design System Violation (BLOCKED):\n` +
      violations.join('\n') +
      `\n\nFix: Use var(--color-*) tokens from design-tokens.css instead of raw values.` +
      `\nReference: packages/app/src/styles/theme.css`
    );

    // Fire-and-forget violation report to backend
    reportViolation(normalizedPath, violations, session_id, 'error');

    // Block the tool call
    process.exit(2);
  }

  // No violations -- allow
  process.exit(0);
}

// Silent failure = allow (never block on hook errors)
main().catch(() => process.exit(0));
