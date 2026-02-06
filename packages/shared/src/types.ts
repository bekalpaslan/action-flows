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

/** Unique identifier for a chain */
export type ChainId = string & { readonly __brand: 'ChainId' };

/** Unique identifier for a step (composite: chainId + stepNumber) */
export type StepId = string & { readonly __brand: 'StepId' };

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
  sessionId: (value: string): SessionId => {
    if (!value || value.trim().length === 0) {
      throw new Error('SessionId cannot be empty');
    }
    return value as SessionId;
  },
  chainId: (value: string): ChainId => {
    if (!value || value.trim().length === 0) {
      throw new Error('ChainId cannot be empty');
    }
    return value as ChainId;
  },
  stepId: (value: string): StepId => {
    if (!value || value.trim().length === 0) {
      throw new Error('StepId cannot be empty');
    }
    return value as StepId;
  },
  stepNumber: (value: number): StepNumber => {
    if (!Number.isFinite(value) || value < 1) {
      throw new Error('StepNumber must be a positive integer >= 1');
    }
    return value as StepNumber;
  },
  userId: (value: string): UserId => {
    if (!value || value.trim().length === 0) {
      throw new Error('UserId cannot be empty');
    }
    return value as UserId;
  },
  timestamp: (value: string | Date): Timestamp => {
    if (value instanceof Date) {
      if (isNaN(value.getTime())) {
        throw new Error('Timestamp: invalid Date');
      }
      return value.toISOString() as Timestamp;
    }
    if (!value || value.trim().length === 0) {
      throw new Error('Timestamp cannot be empty');
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
