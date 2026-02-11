/**
 * Regex patterns for detecting chain formats
 * Used by harmony detection and message routing
 */

/**
 * Format 1.1: Chain Compilation Table
 */
export const ChainCompilationPatterns = {
  heading: /^## Chain: (.+)$/m,
  request: /^\*\*Request:\*\* (.+)$/m,
  source: /^\*\*Source:\*\* (.+)$/m,
  tableHeader: /^\| # \| Action \| Model \| Key Inputs \| Waits For \| Status \|$/m,
  tableRow: /^\| (\d+) \| ([a-z\-_/]+) \| (haiku|sonnet|opus) \| ([^|]+) \| (--|#\d+(?:,#\d+)*) \| (Pending|Done|Awaiting) \|$/m,
  execution: /^\*\*Execution:\*\* (.+)$/m,
  stepDescription: /^(\d+)\. \*\*([a-z\-_/]+)\*\* -- (.+)$/m,
  approvalPrompt: /^Execute\?$/m,
} as const;

/**
 * Format 1.2: Chain Execution Start
 */
export const ChainExecutionStartPatterns = {
  heading: /^## Executing: (.+)$/m,
  spawning: /^Spawning Step (\d+): ([a-z\-_/]+) \((haiku|sonnet|opus)\)\.\.\.$/m,
} as const;

/**
 * Format 1.3: Chain Status Update
 */
export const ChainStatusUpdatePatterns = {
  heading: /^## Chain Status: (.+)$/m,
  changes: /^\*\*Changes:\*\* (.+)$/m,
  tableHeader: /^\| # \| Action \| Model \| Key Inputs \| Waits For \| Status \|$/m,
} as const;

/**
 * Format 1.4: Execution Complete Summary
 */
export const ExecutionCompletePatterns = {
  heading: /^## Done: (.+)$/m,
  tableHeader: /^\| # \| Action \| Status \| Result \|$/m,
  tableRow: /^\| (\d+) \| ([a-z\-_/]+) \| (Done|Failed|Skipped) \| (.+) \|$/m,
  logs: /^\*\*Logs:\*\* `(.+)`$/m,
  learnings: /^\*\*Learnings:\*\* (.+)$/m,
} as const;

export const ChainPatterns = {
  chainCompilation: ChainCompilationPatterns,
  chainExecutionStart: ChainExecutionStartPatterns,
  chainStatusUpdate: ChainStatusUpdatePatterns,
  executionComplete: ExecutionCompletePatterns,
} as const;
