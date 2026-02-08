/**
 * Format 2.x: Step Lifecycle Types
 * TypeScript interfaces for step execution formats
 */

/**
 * Format 2.1: Step Completion Announcement
 * When produced: After each step completes
 * ORCHESTRATOR.md reference: lines 344-348, 289
 */
export interface StepCompletionParsed {
  /** Step number that completed */
  stepNumber: number | null;

  /** Action type (e.g., "analyze/") */
  action: string | null;

  /** One-line result summary */
  result: string | null;

  /** Next step number or "Done" */
  nextStep: number | string | null;

  /** Raw text */
  raw: string;

  /** Contract version */
  contractVersion: string;
}

/**
 * Format 2.2: Dual Output (Action + Second Opinion)
 * When produced: Both action and second-opinion critique complete
 * ORCHESTRATOR.md reference: lines 207-230
 */
export interface DualOutputParsed {
  /** Original step number */
  stepNumber: number | null;

  /** Action type (e.g., "review/") */
  action: string | null;

  /** Original agent's result */
  originalResult: string | null;

  /** Second opinion model name */
  secondOpinionModel: string | null;

  /** Second opinion summary */
  secondOpinionSummary: string | null;

  /** Number of issues missed by original */
  missedIssues: number | null;

  /** Number of disagreements */
  disagreements: number | null;

  /** Notable finding */
  notable: string | null;

  /** Path to original log */
  originalLogPath: string | null;

  /** Path to critique log */
  critiqueLogPath: string | null;

  /** Next step number */
  nextStep: number | null;

  /** Raw text */
  raw: string;

  /** Contract version */
  contractVersion: string;
}

/**
 * Format 2.3: Second Opinion Skip
 * When produced: Second-opinion step is skipped
 * ORCHESTRATOR.md reference: lines 232-240
 */
export interface SecondOpinionSkipParsed {
  /** Original step number */
  stepNumber: number | null;

  /** Action type */
  action: string | null;

  /** Original result */
  result: string | null;

  /** Second opinion step number */
  secondOpinionStep: number | null;

  /** Reason for skip */
  skipReason: string | null;

  /** Next step number */
  nextStep: number | null;

  /** Raw text */
  raw: string;

  /** Contract version */
  contractVersion: string;
}
