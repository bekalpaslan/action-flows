/**
 * Format 6.x: Error & Status Types
 * TypeScript interfaces for error and routing formats
 */

import type { WorkbenchId } from '../../workbenchTypes.js';

/**
 * Format 6.1: Error Announcement
 * When produced: When an agent fails or unexpected error occurs
 */
export interface ErrorAnnouncementParsed {
  /** Error title */
  title: string | null;

  /** Step number where error occurred */
  stepNumber: number | null;

  /** Action type */
  action: string | null;

  /** Error message */
  message: string | null;

  /** What was being attempted */
  context: string | null;

  /** Stack trace or additional details */
  stackTrace: string | null;

  /** Recovery options */
  recoveryOptions: string[] | null;

  /** Raw text */
  raw: string;

  /** Contract version */
  contractVersion: string;
}

/**
 * Format 6.2: Context Routing Announcement
 * When produced: Orchestrator routes a request to a workbench context
 */
export interface ContextRoutingParsed {
  /** Request brief */
  request: string | null;

  /** Workbench context routed to */
  context: WorkbenchId | null;

  /** Confidence score (0.0-1.0) */
  confidence: number | null;

  /** Flow name or composition method */
  flow: string | null;

  /** List of actions in chain */
  actions: string[] | null;

  /** Whether disambiguation was needed */
  disambiguated: boolean;

  /** Raw text */
  raw: string;

  /** Contract version */
  contractVersion: string;
}

