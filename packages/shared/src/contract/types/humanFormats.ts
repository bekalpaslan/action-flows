/**
 * Format 3.x: Human Interaction Types
 * TypeScript interfaces for human interaction formats
 */

import type { ModelString } from '../../types.js';

/**
 * Format 3.1: Human Gate Presentation
 * When produced: At predefined gates requiring human approval
 * Note: No standardized format beyond "HUMAN GATE" marker
 */
export interface HumanGateParsed {
  /** Step number of the gate */
  stepNumber: number | null;

  /** Free-form content (no guaranteed structure) */
  content: string | null;

  /** Approval prompt question */
  prompt: string | null;

  /** Raw text */
  raw: string;

  /** Contract version */
  contractVersion: string;
}

/**
 * Format 3.2: Learning Surface Presentation
 * When produced: Agent reports learnings in completion message
 * ORCHESTRATOR.md reference: lines 379-391
 */
export interface LearningSurfaceParsed {
  /** Action type that produced learning */
  fromAction: string | null;

  /** Model that produced learning */
  fromModel: ModelString | null;

  /** What happened (the issue) */
  issue: string | null;

  /** Why it happened */
  rootCause: string | null;

  /** Orchestrator's proposed solution */
  suggestedFix: string | null;

  /** Raw text */
  raw: string;

  /** Contract version */
  contractVersion: string;
}

/**
 * Format 3.3: Session-Start Protocol Acknowledgment
 * When produced: At start of orchestrator session
 * ORCHESTRATOR.md reference: lines 8-24
 * Note: Currently not produced by orchestrator (internal read)
 */
export interface SessionStartProtocolParsed {
  /** Project name */
  projectName: string | null;

  /** Number of departments */
  departmentCount: number | null;

  /** List of department names */
  departments: string[] | null;

  /** Number of flows */
  flowCount: number | null;

  /** Number of actions */
  actionCount: number | null;

  /** Past execution count from INDEX.md */
  pastExecutionCount: number | null;

  /** Raw text */
  raw: string;

  /** Contract version */
  contractVersion: string;
}
