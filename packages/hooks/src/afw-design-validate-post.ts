#!/usr/bin/env node
/**
 * ActionFlows Dashboard - Design System Compliance Audit (PostToolUse)
 *
 * Hook: PostToolUse (matcher: Write|Edit|MultiEdit)
 * Purpose: Audit design system compliance AFTER file writes and surface warnings
 *
 * This hook fires AFTER Write/Edit/MultiEdit tool calls and:
 * 1. Checks if the target file is a validated extension (.tsx, .css)
 * 2. Skips test files, config files, and design token definitions
 * 3. Runs WARNING_PATTERNS and CRITICAL_PATTERNS (defense-in-depth) against content
 * 4. Outputs additionalContext via hookSpecificOutput for agent visibility
 * 5. Always exits 0 (PostToolUse does not block, only advises)
 *
 * Exit codes:
 * - 0: Always (PostToolUse hooks are advisory only)
 */

import * as fs from 'fs';
import * as path from 'path';

import {
  CRITICAL_PATTERNS,
  WARNING_PATTERNS,
  VALIDATED_EXTENSIONS,
  SKIP_PATTERNS,
} from './utils/design-rules.js';
import { reportViolation } from './utils/violation-reporter.js';

interface PostToolUseInput {
  tool_name: string;
  tool_input: {
    file_path?: string;
    content?: string;
    new_string?: string;
    edits?: Array<{ new_string: string }>;
  };
  tool_result: {
    system?: string;
    error?: string;
    output?: string;
  };
  session_id: string;
}

/**
 * Normalize a file path for cross-platform comparison.
 */
function normalizePath(filePath: string): string {
  return path.normalize(filePath).replace(/\\/g, '/');
}

/**
 * Extract the content to validate from the tool input.
 */
function extractContent(toolName: string, toolInput: PostToolUseInput['tool_input']): string | null {
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
  const hookInput: PostToolUseInput = JSON.parse(inputData);

  const { tool_name, tool_input, session_id } = hookInput;

  // Get file path
  const rawPath = tool_input.file_path;
  if (!rawPath) {
    process.exit(0);
  }

  const normalizedPath = normalizePath(rawPath);

  // Check extension
  const ext = path.extname(normalizedPath);
  if (!VALIDATED_EXTENSIONS.includes(ext)) {
    process.exit(0);
  }

  // Check skip patterns
  if (shouldSkip(normalizedPath)) {
    process.exit(0);
  }

  // Extract content to check
  const content = extractContent(tool_name, tool_input);
  if (!content) {
    process.exit(0);
  }

  // Check warning patterns
  const warnings: string[] = [];

  for (const rule of WARNING_PATTERNS) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(content)) {
      warnings.push(`[${rule.rule}] ${rule.message}`);
    }
  }

  // Defense-in-depth: also check critical patterns at warning level
  // In case PreToolUse was bypassed or missed something
  for (const rule of CRITICAL_PATTERNS) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(content)) {
      warnings.push(`[${rule.rule}] (post-write audit) ${rule.message}`);
    }
  }

  if (warnings.length > 0) {
    // Output via hookSpecificOutput.additionalContext for agent visibility (NEURAL-06)
    const output = {
      hookSpecificOutput: {
        additionalContext: `Design System Compliance Warning:\n${warnings.join('\n')}\n\nConsider using var(--color-*) design tokens instead of raw values.`,
      },
    };

    // Write JSON to stdout (Claude reads hookSpecificOutput from stdout)
    console.log(JSON.stringify(output));

    // Fire-and-forget violation report to backend
    reportViolation(normalizedPath, warnings, session_id, 'warning');
  }

  // PostToolUse always exits 0 (advisory only)
  process.exit(0);
}

// Silent failure
main().catch(() => process.exit(0));
