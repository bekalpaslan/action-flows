/**
 * Reminder Types
 * Type definitions for the Reminder prompt system
 * Supports contextual buttons at orchestrator approval gates
 */

import type { SessionId, ChainId, Timestamp } from './types.js';

/**
 * Reminder variant types
 * Determines what happens when the reminder button is clicked at an approval gate
 */
export type ReminderVariant =
  | 'double-check'      // Verify items before proceeding
  | 'remind-approve'    // Attach reminder + auto-approve chain
  | 'remind-restart'    // Attach reminder + trigger recompilation
  | 'remind-generic';   // Just store reminder (no chain action)

/**
 * Reminder definition (stored in registry as type: 'reminder')
 * Defines a reusable reminder that can be attached to any chain
 */
export interface ReminderDefinition {
  /** Unique identifier for this reminder definition */
  id: string;

  /** Display label (e.g., "Check Redis connection") */
  label: string;

  /** The full reminder text to attach to chain/session */
  reminderText: string;

  /** Which variant behavior this reminder triggers */
  variant: ReminderVariant;

  /** Optional icon identifier (e.g., 'bell', 'warning') */
  icon?: string;

  /** Specific items to double-check (for variant: 'double-check' only) */
  checkItems?: string[];
}

/**
 * Reminder instance (runtime association between reminder and chain)
 * Created when user clicks a reminder button at an approval gate
 */
export interface ReminderInstance {
  /** Unique ID for this instance */
  id: string;

  /** Which reminder definition was used (references RegistryEntry.id) */
  reminderId: string;

  /** Which session this reminder is for */
  sessionId: SessionId;

  /** Which chain this reminder is attached to (null for generic reminders) */
  chainId: ChainId | null;

  /** The reminder text (copied from definition at creation time) */
  reminderText: string;

  /** When this reminder was created */
  createdAt: Timestamp;

  /** Whether this reminder has been addressed/completed */
  addressed: boolean;

  /** Optional metadata (e.g., user notes, completion timestamp) */
  metadata?: Record<string, unknown>;
}
