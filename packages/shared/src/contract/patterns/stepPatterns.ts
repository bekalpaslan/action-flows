/**
 * Regex patterns for detecting step formats
 * Used by harmony detection and message routing
 */

/**
 * Format 2.1: Step Completion Announcement
 */
export const StepCompletionPatterns = {
  prefix: /^>> Step (\d+) complete: ([a-z\-_/]+) -- (.+)\. Continuing to Step ((\d+)|Done)\.\.\.$/m,
} as const;

/**
 * Format 2.2: Dual Output (Action + Second Opinion)
 */
export const DualOutputPatterns = {
  stepComplete: /^>> Step (\d+) complete: ([a-z\-_/]+) -- (.+)\.$/m,
  secondOpinionComplete: /^>> Step (\d+) complete: second-opinion\/ -- (.+)\.$/m,
  heading: /^### Dual Output: ([a-z\-_/]+) \+ Second Opinion$/m,
  originalLabel: /^\*\*Original \(([a-z\-_/]+)\):\*\*$/m,
  originalContent: /^(.+)$/m,
  secondOpinionLabel: /^\*\*Second Opinion \((.+) via Ollama\):\*\*$/m,
  secondOpinionSummary: /^(.+)$/m,
  missedIssues: /^- Missed issues: (\d+)$/m,
  disagreements: /^- Disagreements: (\d+)$/m,
  notable: /^- Notable: (.+)$/m,
  reportsLabel: /^\*\*Full reports:\*\*$/m,
  originalReport: /^- Original: `(.+)`$/m,
  critiqueReport: /^- Critique: `(.+)`$/m,
  continuing: /^Continuing to Step (\d+)\.\.\.$/m,
} as const;

/**
 * Format 2.3: Second Opinion Skip
 */
export const SecondOpinionSkipPatterns = {
  stepComplete: /^>> Step (\d+) complete: ([a-z\-_/]+) -- (.+)\.$/m,
  skipped: /^>> Step (\d+) complete: second-opinion\/ -- SKIPPED \((.+)\)\.$/m,
  continuing: /^Continuing to Step (\d+)\.\.\.$/m,
} as const;

export const StepPatterns = {
  stepCompletion: StepCompletionPatterns,
  dualOutput: DualOutputPatterns,
  secondOpinionSkip: SecondOpinionSkipPatterns,
} as const;
