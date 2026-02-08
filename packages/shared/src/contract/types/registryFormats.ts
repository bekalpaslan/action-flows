/**
 * Format 4.x: Registry & Metadata Types
 * TypeScript interfaces for registry update formats
 */

/**
 * Format 4.1: Registry Update
 * When produced: Orchestrator directly edits a registry file
 * ORCHESTRATOR.md reference: lines 393-401
 */
export interface RegistryUpdateParsed {
  /** Brief title of the update */
  title: string | null;

  /** Registry file (INDEX.md | FLOWS.md | ACTIONS.md | LEARNINGS.md) */
  file: string | null;

  /** Action performed */
  action: 'added' | 'removed' | 'updated' | null;

  /** The line content */
  line: string | null;

  /** Raw text */
  raw: string;

  /** Contract version */
  contractVersion: string;
}

/**
 * Format 4.2: INDEX.md Entry
 * When produced: After each chain execution completes
 */
export interface IndexEntryParsed {
  /** Execution date (YYYY-MM-DD) */
  date: string | null;

  /** Brief description of work */
  description: string | null;

  /** Action sequence signature (e.g., "code×8 → review → commit") */
  pattern: string | null;

  /** Outcome summary with metrics */
  outcome: string | null;

  /** Success status */
  success: boolean | null;

  /** Metrics string (e.g., "18 files, APPROVED 92%") */
  metrics: string | null;

  /** Git commit hash (7 chars) */
  commitHash: string | null;

  /** Raw text */
  raw: string;

  /** Contract version */
  contractVersion: string;
}

/**
 * Format 4.3: LEARNINGS.md Entry
 * When produced: After learning surface approved by human
 */
export interface LearningEntryParsed {
  /** Action type (e.g., "Review", "Code") */
  actionType: string | null;

  /** Issue title */
  issueTitle: string | null;

  /** When this happens */
  context: string | null;

  /** What goes wrong */
  problem: string | null;

  /** Why it fails */
  rootCause: string | null;

  /** How to prevent */
  solution: string | null;

  /** Date (YYYY-MM-DD) */
  date: string | null;

  /** Source (e.g., "review/ in FRD & SRD Documentation chain") */
  source: string | null;

  /** Raw text */
  raw: string;

  /** Contract version */
  contractVersion: string;
}
