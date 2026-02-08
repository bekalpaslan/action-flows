/**
 * Format 6.x: Error & Status Types
 * TypeScript interfaces for error and routing formats
 */

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
 * Format 6.2: Department Routing Announcement
 * When produced: Orchestrator routes a request to a department
 * Note: Currently not produced by orchestrator (internal routing)
 */
export interface DepartmentRoutingParsed {
  /** Request brief */
  request: string | null;

  /** Department name */
  department: 'Framework' | 'Engineering' | 'QA' | 'Human' | null;

  /** Flow name or composition method */
  flow: string | null;

  /** List of actions in chain */
  actions: string[] | null;

  /** Explanation of routing choice */
  explanation: string | null;

  /** Raw text */
  raw: string;

  /** Contract version */
  contractVersion: string;
}
