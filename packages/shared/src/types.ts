/**
 * Base Types and Branded Strings
 * Provides type-safe identifiers and common types used across the system
 */

/**
 * Branded string types for type-safe identifiers
 * These prevent accidental mixing of different ID types
 * Uses nominal typing with unique symbols for compile-time safety
 */

/** @internal Unique symbol for SessionId branding */
declare const SessionIdSymbol: unique symbol;
/** Unique identifier for a session */
export type SessionId = string & { readonly [SessionIdSymbol]: true };

/** @internal Unique symbol for ChainId branding */
declare const ChainIdSymbol: unique symbol;
/** Unique identifier for a chain */
export type ChainId = string & { readonly [ChainIdSymbol]: true };

/** @internal Unique symbol for StepId branding */
declare const StepIdSymbol: unique symbol;
/** Unique identifier for a step (composite: chainId + stepNumber) */
export type StepId = string & { readonly [StepIdSymbol]: true };

/** @internal Unique symbol for StepNumber branding */
declare const StepNumberSymbol: unique symbol;
/** Step number within a chain (1-indexed) */
export type StepNumber = number & { readonly [StepNumberSymbol]: true };

/** @internal Unique symbol for UserId branding */
declare const UserIdSymbol: unique symbol;
/** Unique identifier for a user/operator */
export type UserId = string & { readonly [UserIdSymbol]: true };

/** @internal Unique symbol for Timestamp branding */
declare const TimestampSymbol: unique symbol;
/** ISO 8601 timestamp string */
export type Timestamp = string & { readonly [TimestampSymbol]: true };

/** @internal Unique symbol for RegionId branding */
declare const RegionIdSymbol: unique symbol;
/** Unique identifier for a region (star on the cosmic map) */
export type RegionId = string & { readonly [RegionIdSymbol]: true };

/** @internal Unique symbol for EdgeId branding */
declare const EdgeIdSymbol: unique symbol;
/** Unique identifier for a light bridge (edge connecting regions) */
export type EdgeId = string & { readonly [EdgeIdSymbol]: true };

/**
 * Type guard and assertion functions for branded types
 * These provide runtime validation with proper nominal typing
 */

/** Assert a string is a valid SessionId */
export function assertSessionId(value: string): asserts value is SessionId {
  if (!value || value.trim().length === 0) {
    throw new Error('SessionId cannot be empty');
  }
}

/** Convert string to SessionId with validation */
export function toSessionId(value: string): SessionId {
  assertSessionId(value);
  return value as SessionId;
}

/** Assert a string is a valid ChainId */
export function assertChainId(value: string): asserts value is ChainId {
  if (!value || value.trim().length === 0) {
    throw new Error('ChainId cannot be empty');
  }
}

/** Convert string to ChainId with validation */
export function toChainId(value: string): ChainId {
  assertChainId(value);
  return value as ChainId;
}

/** Assert a string is a valid StepId */
export function assertStepId(value: string): asserts value is StepId {
  if (!value || value.trim().length === 0) {
    throw new Error('StepId cannot be empty');
  }
}

/** Convert string to StepId with validation */
export function toStepId(value: string): StepId {
  assertStepId(value);
  return value as StepId;
}

/** Assert a number is a valid StepNumber */
export function assertStepNumber(value: number): asserts value is StepNumber {
  if (!Number.isFinite(value) || value < 1) {
    throw new Error('StepNumber must be a positive integer >= 1');
  }
}

/** Convert number to StepNumber with validation */
export function toStepNumber(value: number): StepNumber {
  assertStepNumber(value);
  return value as StepNumber;
}

/** Assert a string is a valid UserId */
export function assertUserId(value: string): asserts value is UserId {
  if (!value || value.trim().length === 0) {
    throw new Error('UserId cannot be empty');
  }
}

/** Convert string to UserId with validation */
export function toUserId(value: string): UserId {
  assertUserId(value);
  return value as UserId;
}

/** Assert a value is a valid Timestamp */
export function assertTimestamp(value: string | Date): asserts value is Timestamp | Date {
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      throw new Error('Timestamp: invalid Date');
    }
  } else if (!value || value.trim().length === 0) {
    throw new Error('Timestamp cannot be empty');
  }
}

/** Convert string or Date to Timestamp with validation */
export function toTimestamp(value: string | Date): Timestamp {
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
}

/** Get current timestamp as Timestamp */
export function currentTimestamp(): Timestamp {
  return new Date().toISOString() as Timestamp;
}

/** Assert a string is a valid RegionId */
export function assertRegionId(value: string): asserts value is RegionId {
  if (!value || value.trim().length === 0) {
    throw new Error('RegionId cannot be empty');
  }
}

/** Convert string to RegionId with validation */
export function toRegionId(value: string): RegionId {
  assertRegionId(value);
  return value as RegionId;
}

/** Assert a string is a valid EdgeId */
export function assertEdgeId(value: string): asserts value is EdgeId {
  if (!value || value.trim().length === 0) {
    throw new Error('EdgeId cannot be empty');
  }
}

/** Convert string to EdgeId with validation */
export function toEdgeId(value: string): EdgeId {
  assertEdgeId(value);
  return value as EdgeId;
}

/**
 * @deprecated Use individual toXxx functions instead (e.g., toSessionId, toChainId)
 * Legacy factory object for backward compatibility during migration
 */
export const brandedTypes = {
  sessionId: toSessionId,
  chainId: toChainId,
  stepId: toStepId,
  stepNumber: toStepNumber,
  userId: toUserId,
  timestamp: toTimestamp,
  currentTimestamp: currentTimestamp,
  regionId: toRegionId,
  edgeId: toEdgeId,
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

export type StatusString = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

/**
 * Model identifiers
 */
export enum Model {
  HAIKU = 'haiku',
  SONNET = 'sonnet',
  OPUS = 'opus',
}

export type ModelString = 'haiku' | 'sonnet' | 'opus';

/**
 * Source types for chains and events
 */
export enum ChainSource {
  FLOW = 'flow',
  COMPOSED = 'composed',
  META_TASK = 'meta-task',
}

export type ChainSourceString = 'flow' | 'composed' | 'meta-task';

/**
 * Duration in milliseconds
 */
/** @internal Unique symbol for DurationMs branding */
declare const DurationMsSymbol: unique symbol;
export type DurationMs = number & { readonly [DurationMsSymbol]: true };

/** Convert number to DurationMs */
export function toDurationMs(value: number): DurationMs {
  return value as DurationMs;
}

/** Convert seconds to DurationMs */
export function secondsToDurationMs(seconds: number): DurationMs {
  return (seconds * 1000) as DurationMs;
}

/** Convert minutes to DurationMs */
export function minutesToDurationMs(minutes: number): DurationMs {
  return (minutes * 60 * 1000) as DurationMs;
}

/**
 * @deprecated Use toDurationMs, secondsToDurationMs, or minutesToDurationMs instead
 * Legacy duration object for backward compatibility during migration
 */
export const duration = {
  ms: toDurationMs,
  fromSeconds: secondsToDurationMs,
  fromMinutes: minutesToDurationMs,
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

export type SessionStateString = 'idle' | 'awaiting_input' | 'receiving_input' | 'active';

/**
 * Input prompt types
 */
export enum PromptType {
  BINARY = 'binary',
  TEXT = 'text',
  CHAIN_APPROVAL = 'chain_approval',
}

export type PromptTypeString = 'binary' | 'text' | 'chain_approval';

/**
 * Freshness grades for temporal data aging
 */
export type FreshnessGrade = 'fresh' | 'recent' | 'aging' | 'stale';

/**
 * Freshness metadata for tracking data age and staleness
 */
export interface FreshnessMetadata {
  lastModifiedAt: Timestamp;
  lastAccessedAt: Timestamp;
  freshnessGrade: FreshnessGrade;
  ageMs: DurationMs;
}

/**
 * Freshness thresholds in milliseconds
 */
export const FRESHNESS_THRESHOLDS = {
  FRESH: 60_000, // < 1 minute
  RECENT: 1_800_000, // < 30 minutes
  AGING: 7_200_000, // < 2 hours
  // > 2 hours = stale
} as const;

/**
 * Calculate freshness grade based on last modified timestamp
 */
export function calculateFreshnessGrade(lastModifiedAt: Timestamp): FreshnessGrade {
  const now = Date.now();
  const modifiedTime = new Date(lastModifiedAt).getTime();
  const ageMs = now - modifiedTime;

  if (ageMs < FRESHNESS_THRESHOLDS.FRESH) {
    return 'fresh';
  } else if (ageMs < FRESHNESS_THRESHOLDS.RECENT) {
    return 'recent';
  } else if (ageMs < FRESHNESS_THRESHOLDS.AGING) {
    return 'aging';
  } else {
    return 'stale';
  }
}

/**
 * Telemetry system types
 */

/** Telemetry severity levels */
export type TelemetryLevel = 'debug' | 'info' | 'warn' | 'error';

/** Telemetry entry representing a single log event */
export interface TelemetryEntry {
  id: string;
  level: TelemetryLevel;
  source: string; // e.g., 'fileWatcher', 'clientRegistry', 'claudeCliManager'
  message: string;
  metadata?: Record<string, unknown>;
  sessionId?: SessionId;
  timestamp: Timestamp;
}

/** Filter options for querying telemetry entries */
export interface TelemetryQueryFilter {
  level?: TelemetryLevel;
  source?: string;
  sessionId?: SessionId;
  fromTimestamp?: Timestamp;
  toTimestamp?: Timestamp;
  limit?: number;
}

/**
 * Circuit Breaker types
 */

/** Circuit breaker states */
export type CircuitState = 'closed' | 'open' | 'half-open';

/** Circuit breaker statistics for monitoring */
export interface CircuitBreakerStats {
  name: string;
  state: CircuitState;
  failureCount: number;
  lastFailureTime: Timestamp | null;
  totalTrips: number;
}

/**
 * Lifecycle types
 */

/** Lifecycle phase for resource state tracking */
export type LifecyclePhase = 'active' | 'idle' | 'expiring' | 'evicted';

/** Lifecycle transition event */
export interface LifecycleEvent {
  type: 'lifecycle:transition';
  resourceType: 'session' | 'chain' | 'event';
  resourceId: string;
  fromPhase: LifecyclePhase;
  toPhase: LifecyclePhase;
  reason: string;
  timestamp: Timestamp;
}

/** Lifecycle policy configuration for resource types */
export interface LifecyclePolicy {
  resourceType: 'session' | 'chain' | 'event';
  idleThresholdMs: number;       // Time before marking as idle (default: 30 min)
  expiringThresholdMs: number;   // Time before marking as expiring (default: 2 hours)
  evictionStrategy: 'lru' | 'fifo' | 'ttl';
}
