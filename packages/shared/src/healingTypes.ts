/**
 * Healing System Types for Phase 10: Customization & Automation
 *
 * Types for autonomous error healing with quota management.
 * Agents detect errors, propose fixes, and heal with user approval.
 */

/** @internal Unique symbol for HealingAttemptId branding */
declare const HealingAttemptIdSymbol: unique symbol;
/** Unique identifier for a healing attempt */
export type HealingAttemptId = string & { readonly [HealingAttemptIdSymbol]: true };

/** Classification of errors that can trigger healing */
export type ErrorClass = 'runtime' | 'contract' | 'build' | 'test_failure';

/** Error classes that trigger autonomous healing (per D-01) */
export const HEALING_ERROR_CLASSES: readonly ErrorClass[] = ['runtime', 'build', 'test_failure'];

/** Maximum healing attempts per flow per day (per D-02) */
export const MAX_HEALING_ATTEMPTS_PER_DAY = 2;

/** Quota tracking for healing attempts per flow per day */
export interface HealingQuota {
  workbenchId: string;
  flowId: string;
  attemptsUsed: number;
  maxAttempts: number;
  date: string;
}

/** A single healing attempt with lifecycle tracking */
export interface HealingAttempt {
  id: HealingAttemptId;
  workbenchId: string;
  flowId: string;
  errorClass: ErrorClass;
  errorMessage: string;
  proposedFix: string;
  status: 'awaiting_approval' | 'approved' | 'declined' | 'succeeded' | 'failed' | 'expired';
  createdAt: string;
  resolvedAt?: string;
}
