/**
 * Format 1.x: Chain Management Types
 * TypeScript interfaces for chain lifecycle formats
 */

import type { ModelString, StatusString } from '../../types.js';

/**
 * Format 1.1: Chain Compilation Table
 * When produced: Orchestrator compiles chain and presents for approval
 * ORCHESTRATOR.md reference: lines 315-334
 */
export interface ChainCompilationParsed {
  /** Chain title from "## Chain: {title}" */
  title: string | null;

  /** Human's original request from "**Request:** {text}" */
  request: string | null;

  /** Source (flow name | "Composed from: ..." | "Meta-task") */
  source: string | null;

  /** Parsed steps from markdown table */
  steps: ChainStepParsed[] | null;

  /** Execution mode (Sequential | Parallel: [...] | Single step) */
  executionMode: string | null;

  /** Step descriptions from "What each step does" section */
  stepDescriptions: StepDescription[] | null;

  /** Raw markdown text (always available for fallback rendering) */
  raw: string;

  /** Version of contract used to parse this */
  contractVersion: string;
}

export interface ChainStepParsed {
  stepNumber: number;
  action: string; // e.g., "analyze/"
  model: ModelString;
  keyInputs: string | null;
  waitsFor: string | null; // "--" or "#1,#2"
  status: StatusString;
}

export interface StepDescription {
  stepNumber: number;
  action: string;
  description: string;
}

/**
 * Format 1.2: Chain Execution Start
 * When produced: Orchestrator starts executing an approved chain
 * ORCHESTRATOR.md reference: lines 336-342
 */
export interface ChainExecutionStartParsed {
  /** Chain title from "## Executing: {title}" */
  title: string | null;

  /** Step number being spawned */
  stepNumber: number | null;

  /** Action type (e.g., "analyze/") */
  action: string | null;

  /** Model being used */
  model: ModelString | null;

  /** Optional Unix timestamp when chain execution started (milliseconds since epoch) */
  timestamp: number | null;

  /** Raw markdown text */
  raw: string;

  /** Contract version */
  contractVersion: string;
}

/**
 * Format 1.3: Chain Status Update
 * When produced: Chain status changes during execution
 */
export interface ChainStatusUpdateParsed {
  /** Chain title */
  title: string | null;

  /** Description of what changed */
  changes: string | null;

  /** Updated steps table */
  steps: ChainStepParsed[] | null;

  /** Raw markdown text */
  raw: string;

  /** Contract version */
  contractVersion: string;
}

/**
 * Format 1.4: Execution Complete Summary
 * When produced: Chain execution completes
 */
export interface ExecutionCompleteParsed {
  /** Chain title from "## Done: {title}" */
  title: string | null;

  /** Summary of completed steps */
  steps: CompletedStepSummary[] | null;

  /** Path to execution logs */
  logsPath: string | null;

  /** Learnings from execution */
  learnings: string | null;

  /** Optional: Total number of steps in the chain */
  totalSteps: number | null;

  /** Optional: Number of steps completed successfully */
  completedSteps: number | null;

  /** Optional: Number of steps that failed */
  failedSteps: number | null;

  /** Raw markdown text */
  raw: string;

  /** Contract version */
  contractVersion: string;
}

export interface CompletedStepSummary {
  stepNumber: number;
  action: string;
  status: StatusString | null;
  result: string | null;
}
