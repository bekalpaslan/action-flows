#!/usr/bin/env node
/**
 * ActionFlows Dashboard - Format Check Hook
 *
 * Hook: Stop
 * Purpose: Enforce orchestrator output format and warn on violations
 *
 * This hook fires when Claude finishes responding (Stop event). It:
 * 1. Checks orchestrator output for format compliance
 * 2. Detects violations:
 *    - Missing chain headers (## Chain:)
 *    - Missing step numbers in chain table
 *    - Missing required table columns (Action, Model, Key Inputs, Waits For, Status)
 *    - Missing execution mode declaration
 * 3. Returns systemMessage with warnings if violations found
 * 4. Returns nothing if format is compliant
 *
 * This is NON-BLOCKING - warnings inform the orchestrator but execution continues.
 */

import * as fs from 'fs';

// Configuration
const ENABLED = process.env.AFW_FORMAT_CHECK_ENABLED !== 'false'; // Enabled by default

interface StopHookInput {
  message: {
    role: string;
    content: string;
  };
  session_id: string;
  transcript_path?: string;
}

interface HookResponse {
  systemMessage?: string;
}

/**
 * Checks if message contains a chain compilation
 */
function isChainCompilation(content: string): boolean {
  return /##\s*Chain:/i.test(content);
}

/**
 * Validates chain header format
 * Should have: ## Chain: {Brief Title}
 */
function validateChainHeader(content: string): string | null {
  const headerMatch = content.match(/##\s*Chain:\s*(.+?)(?:\n|$)/i);

  if (!headerMatch) {
    return 'Missing chain header. Expected: ## Chain: {Brief Title}';
  }

  const title = headerMatch[1].trim();
  if (!title || title.length === 0) {
    return 'Chain header has no title. Expected: ## Chain: {Brief Title}';
  }

  return null; // Valid
}

/**
 * Validates chain metadata section
 * Should have: **Request:**, **Source:**, **Type:**, **Ref:**
 */
function validateChainMetadata(content: string): string[] {
  const violations: string[] = [];

  const requiredFields = [
    { name: 'Request', pattern: /\*\*Request:\*\*/i },
    { name: 'Source', pattern: /\*\*Source:\*\*/i },
    { name: 'Type', pattern: /\*\*Type:\*\*/i },
    { name: 'Ref', pattern: /\*\*Ref:\*\*/i },
  ];

  for (const field of requiredFields) {
    if (!field.pattern.test(content)) {
      violations.push(`Missing chain metadata field: **${field.name}:**`);
    }
  }

  return violations;
}

/**
 * Validates chain table format
 * Should have: | # | Action | Model | Key Inputs | Waits For | Status |
 */
function validateChainTable(content: string): string[] {
  const violations: string[] = [];

  // Look for markdown table
  const tableRegex = /\|[^\n]+\|(?:\n\|[^\n]+\|)+/g;
  const tables = content.match(tableRegex);

  if (!tables || tables.length === 0) {
    violations.push('Missing chain table with steps');
    return violations;
  }

  const table = tables[0];

  // Check for required columns
  const requiredColumns = ['#', 'Action', 'Model', 'Key Inputs', 'Waits For', 'Status'];
  for (const col of requiredColumns) {
    if (!table.includes(col)) {
      violations.push(`Missing required column in chain table: "${col}"`);
    }
  }

  // Check for step numbers (should have rows like "| 1 |" or "| 2 |")
  const stepRows = table.match(/\|\s*(\d+)\s*\|/g);
  if (!stepRows || stepRows.length === 0) {
    violations.push('No steps found in chain table (missing step numbers)');
  }

  return violations;
}

/**
 * Validates execution mode declaration
 * Should have: **Execution:** {Sequential | Parallel: [X,Y] → [Z] | Single step}
 */
function validateExecutionMode(content: string): string | null {
  const executionPattern = /\*\*Execution:\*\*\s*.+/i;

  if (!executionPattern.test(content)) {
    return 'Missing execution mode declaration. Expected: **Execution:** {Sequential | Parallel | Single step}';
  }

  return null; // Valid
}

/**
 * Main format check
 */
function checkFormat(content: string): string[] {
  const violations: string[] = [];

  // Only check if this is a chain compilation
  if (!isChainCompilation(content)) {
    return []; // Not a chain - no format check needed
  }

  // Validate chain header
  const headerViolation = validateChainHeader(content);
  if (headerViolation) {
    violations.push(headerViolation);
  }

  // Validate chain metadata
  const metadataViolations = validateChainMetadata(content);
  violations.push(...metadataViolations);

  // Validate chain table
  const tableViolations = validateChainTable(content);
  violations.push(...tableViolations);

  // Validate execution mode
  const executionViolation = validateExecutionMode(content);
  if (executionViolation) {
    violations.push(executionViolation);
  }

  return violations;
}

async function main() {
  if (!ENABLED) {
    process.exit(0); // Silently pass through when disabled
  }

  try {
    // Read hook input from stdin
    const inputData = fs.readFileSync(0, 'utf-8');
    const hookInput: StopHookInput = JSON.parse(inputData);

    const content = hookInput.message?.content || '';

    // Check format
    const violations = checkFormat(content);

    if (violations.length === 0) {
      // No violations - exit cleanly without systemMessage
      process.exit(0);
    }

    // Build warning message
    const warningMessage = [
      '⚠️ **Format Violations Detected**',
      '',
      'The following format issues were found in your chain compilation:',
      '',
      ...violations.map(v => `- ${v}`),
      '',
      'Please review the Response Format Standard in .claude/actionflows/CLAUDE.md',
    ].join('\n');

    const response: HookResponse = {
      systemMessage: warningMessage,
    };

    // Output warning as systemMessage
    console.log(JSON.stringify(response));

    // Exit with code 0 (non-blocking - execution continues)
    process.exit(0);
  } catch (error) {
    // Silent failure - log error but exit cleanly
    console.error('Format check hook error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(0);
  }
}

main();
