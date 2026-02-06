/**
 * Base Types and Branded Strings
 * Provides type-safe identifiers and common types used across the system
 */

/**
 * Branded string types for type-safe identifiers
 * These prevent accidental mixing of different ID types
 */

/** Unique identifier for a session */
export type SessionId = string & { readonly __brand: 'SessionId' };

/** Step number within a chain (1-indexed) */
export type StepNumber = number & { readonly __brand: 'StepNumber' };

/** Unique identifier for a user/operator */
export type UserId = string & { readonly __brand: 'UserId' };

/** ISO 8601 timestamp string */
export type Timestamp = string & { readonly __brand: 'Timestamp' };

/**
 * Factory functions for creating branded types
 */
export const brandedTypes = {
  sessionId: (value: string): SessionId => value as SessionId,
  stepNumber: (value: number): StepNumber => value as StepNumber,
  userId: (value: string): UserId => value as UserId,
  timestamp: (value: string | Date): Timestamp => {
    if (value instanceof Date) {
      return value.toISOString() as Timestamp;
    }
    return value as Timestamp;
  },
  currentTimestamp: (): Timestamp => new Date().toISOString() as Timestamp,
};

/**
 * Status enum for sessions, chains, and steps
 */
export enum Status {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

export type StatusString = keyof typeof Status | 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped' | 'mixed';

/**
 * Model identifiers
 */
export enum Model {
  HAIKU = 'haiku',
  SONNET = 'sonnet',
  OPUS = 'opus',
}

export type ModelString = keyof typeof Model | 'haiku' | 'sonnet' | 'opus';

/**
 * Source types for chains and events
 */
export enum ChainSource {
  FLOW = 'flow',
  COMPOSED = 'composed',
  META_TASK = 'meta-task',
}

export type ChainSourceString = keyof typeof ChainSource | 'flow' | 'composed' | 'meta-task';

/**
 * Duration in milliseconds
 */
export type DurationMs = number & { readonly __brand: 'DurationMs' };

export const duration = {
  ms: (value: number): DurationMs => value as DurationMs,
  fromSeconds: (seconds: number): DurationMs => (seconds * 1000) as DurationMs,
  fromMinutes: (minutes: number): DurationMs => (minutes * 60 * 1000) as DurationMs,
};

/**
 * Session interaction state for conversation interface
 */
export enum SessionState {
  IDLE = 'idle',
  AWAITING_INPUT = 'awaiting_input',
  RECEIVING_INPUT = 'receiving_input',
  ACTIVE = 'active',
}

export type SessionStateString = keyof typeof SessionState | 'idle' | 'awaiting_input' | 'receiving_input' | 'active';

/**
 * Input prompt types
 */
export enum PromptType {
  BINARY = 'binary',
  TEXT = 'text',
  CHAIN_APPROVAL = 'chain_approval',
}

export type PromptTypeString = keyof typeof PromptType | 'binary' | 'text' | 'chain_approval';
