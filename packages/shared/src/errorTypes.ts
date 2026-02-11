/**
 * Error Announcement Types
 * Type definitions for the Error Announcement system (Format 6.1)
 * Supports real-time error notifications with recovery actions
 */

import type { SessionId, ChainId, StepNumber, Timestamp } from './types.js';

/**
 * Recovery action types for errors
 * Determines what action is taken when user selects recovery option
 */
export type ErrorRecoveryAction =
  | 'retry'     // Retry the failed step
  | 'skip'      // Skip the current step
  | 'cancel';   // Cancel the entire chain

/**
 * Error severity levels
 */
export type ErrorSeverity =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

/**
 * Error instance (runtime error announcement)
 * Created when an agent fails or unexpected error occurs
 */
export interface ErrorInstance {
  /** Unique ID for this error instance */
  id: string;

  /** Error title/heading */
  title: string;

  /** Error message (description) */
  message: string;

  /** What was being attempted when error occurred */
  context: string;

  /** Stack trace or additional technical details (optional) */
  stackTrace?: string | null;

  /** Severity level */
  severity: ErrorSeverity;

  /** Step where error occurred (if applicable) */
  stepNumber?: StepNumber | null;

  /** Action that was executing (e.g., "code/backend/") */
  action?: string | null;

  /** Which session this error is for */
  sessionId: SessionId;

  /** Which chain this error occurred in (optional) */
  chainId?: ChainId | null;

  /** When this error occurred */
  createdAt: Timestamp;

  /** Available recovery options for user */
  recoveryOptions: ErrorRecoveryAction[];

  /** Whether this error has been dismissed by user */
  dismissed: boolean;

  /** Optional metadata (e.g., error code, related logs) */
  metadata?: Record<string, unknown>;
}

/**
 * Error announcement options for API creation
 */
export interface CreateErrorInput {
  title: string;
  message: string;
  context: string;
  stackTrace?: string | null;
  severity?: ErrorSeverity;
  stepNumber?: StepNumber | null;
  action?: string | null;
  sessionId: SessionId;
  chainId?: ChainId | null;
  recoveryOptions?: ErrorRecoveryAction[];
  metadata?: Record<string, unknown>;
}
