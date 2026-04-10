/**
 * Zod schemas for WebSocket envelope payload validation (CF-2).
 *
 * These schemas mirror the TypeScript interfaces in events.ts and
 * ws-envelope.ts. They are ADDITIVE — existing types are not modified.
 * Validation is opt-in: use `validateWSPayload` where you want runtime
 * safety; existing consumers that inline-cast continue to work unchanged.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Base schema
// ---------------------------------------------------------------------------

export const BaseEventSchema = z.object({
  type: z.string(),
  sessionId: z.string(),
  timestamp: z.string(),
  user: z.string().optional(),
  eventId: z.string().optional(),
  surfaceId: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Session lifecycle payloads
// ---------------------------------------------------------------------------

export const SessionStatusPayloadSchema = z.object({
  sessionId: z.string(),
  status: z.string(),
  updatedAt: z.string().optional(),
  summary: z.string().optional(),
});
export type SessionStatusPayload = z.infer<typeof SessionStatusPayloadSchema>;

export const SessionStartedPayloadSchema = BaseEventSchema.extend({
  type: z.literal('session:started'),
  cwd: z.string(),
  hostname: z.string().optional(),
  platform: z.string().optional(),
});
export type SessionStartedPayload = z.infer<typeof SessionStartedPayloadSchema>;

export const SessionEndedPayloadSchema = BaseEventSchema.extend({
  type: z.literal('session:ended'),
  duration: z.number().optional(),
  reason: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  totalStepsExecuted: z.number().optional(),
  totalChainsCompleted: z.number().optional(),
});
export type SessionEndedPayload = z.infer<typeof SessionEndedPayloadSchema>;

export const SessionUpdatedPayloadSchema = BaseEventSchema.extend({
  type: z.literal('session:updated'),
  status: z.string().optional(),
  summary: z.string().nullable().optional(),
  endReason: z.string().nullable().optional(),
});
export type SessionUpdatedPayload = z.infer<typeof SessionUpdatedPayloadSchema>;

// ---------------------------------------------------------------------------
// Chat message payloads
// ---------------------------------------------------------------------------

export const ChatMessagePayloadSchema = BaseEventSchema.extend({
  type: z.literal('chat:message'),
  message: z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    timestamp: z.string(),
    sessionId: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
});
export type ChatMessagePayload = z.infer<typeof ChatMessagePayloadSchema>;

export const ChatHistoryPayloadSchema = BaseEventSchema.extend({
  type: z.literal('chat:history'),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
      timestamp: z.string(),
      sessionId: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    })
  ),
});
export type ChatHistoryPayload = z.infer<typeof ChatHistoryPayloadSchema>;

// ---------------------------------------------------------------------------
// Chain event payloads
// ---------------------------------------------------------------------------

export const ChainStepSnapshotSchema = z.object({
  stepNumber: z.number(),
  action: z.string(),
  model: z.string().optional(),
  inputs: z.record(z.unknown()).optional(),
  waitsFor: z.array(z.number()).optional(),
  description: z.string().optional(),
});

export const ChainCompiledPayloadSchema = BaseEventSchema.extend({
  type: z.literal('chain:compiled'),
  chainId: z.string().optional(),
  title: z.string().nullable().optional(),
  steps: z.array(ChainStepSnapshotSchema).nullable().optional(),
  source: z.string().nullable().optional(),
  ref: z.string().nullable().optional(),
  totalSteps: z.number().nullable().optional(),
  executionMode: z.enum(['sequential', 'parallel', 'mixed']).optional(),
  estimatedDuration: z.number().optional(),
});
export type ChainCompiledPayload = z.infer<typeof ChainCompiledPayloadSchema>;

export const ChainStartedPayloadSchema = BaseEventSchema.extend({
  type: z.literal('chain:started'),
  chainId: z.string(),
  title: z.string().nullable().optional(),
  stepCount: z.number().nullable().optional(),
  currentStep: z.number().optional(),
});
export type ChainStartedPayload = z.infer<typeof ChainStartedPayloadSchema>;

export const ChainCompletedPayloadSchema = BaseEventSchema.extend({
  type: z.literal('chain:completed'),
  chainId: z.string(),
  duration: z.number(),
  title: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  successfulSteps: z.number().nullable().optional(),
  failedSteps: z.number().nullable().optional(),
  skippedSteps: z.number().nullable().optional(),
  summary: z.string().nullable().optional(),
  overallStatus: z.enum(['success', 'partial', 'failure']),
});
export type ChainCompletedPayload = z.infer<typeof ChainCompletedPayloadSchema>;

// ---------------------------------------------------------------------------
// Step event payloads
// ---------------------------------------------------------------------------

export const StepSpawnedPayloadSchema = BaseEventSchema.extend({
  type: z.literal('step:spawned'),
  stepNumber: z.number(),
  action: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  inputs: z.record(z.unknown()).nullable().optional(),
  description: z.string().nullable().optional(),
  waitsFor: z.array(z.number()).nullable().optional(),
  estimatedDuration: z.number().optional(),
  subagentType: z.string().optional(),
  parentStepId: z.string().nullable().optional(),
  depth: z.number().optional(),
});
export type StepSpawnedPayload = z.infer<typeof StepSpawnedPayloadSchema>;

export const StepStartedPayloadSchema = BaseEventSchema.extend({
  type: z.literal('step:started'),
  stepNumber: z.number(),
  action: z.string().nullable().optional(),
  agentName: z.string().nullable().optional(),
  startedAt: z.string(),
});
export type StepStartedPayload = z.infer<typeof StepStartedPayloadSchema>;

export const StepCompletedPayloadSchema = BaseEventSchema.extend({
  type: z.literal('step:completed'),
  stepNumber: z.number(),
  duration: z.number(),
  action: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  result: z.unknown().optional(),
  learning: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  succeeded: z.boolean(),
  outputLength: z.number().optional(),
  parentStepId: z.string().nullable().optional(),
  depth: z.number().optional(),
});
export type StepCompletedPayload = z.infer<typeof StepCompletedPayloadSchema>;

export const StepFailedPayloadSchema = BaseEventSchema.extend({
  type: z.literal('step:failed'),
  stepNumber: z.number(),
  action: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
  errorType: z.string().nullable().optional(),
  stackTrace: z.string().nullable().optional(),
  suggestion: z.string().nullable().optional(),
  isCritical: z.boolean(),
  isRetryable: z.boolean(),
});
export type StepFailedPayload = z.infer<typeof StepFailedPayloadSchema>;

// ---------------------------------------------------------------------------
// System / error payloads
// ---------------------------------------------------------------------------

export const ErrorOccurredPayloadSchema = BaseEventSchema.extend({
  type: z.literal('error:occurred'),
  error: z.string(),
  stepNumber: z.number().nullable().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).nullable().optional(),
  context: z.record(z.unknown()).nullable().optional(),
  suggestion: z.string().nullable().optional(),
  recoverable: z.boolean(),
  affectsChain: z.boolean(),
});
export type ErrorOccurredPayload = z.infer<typeof ErrorOccurredPayloadSchema>;

export const SystemErrorPayloadSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});
export type SystemErrorPayload = z.infer<typeof SystemErrorPayloadSchema>;

// ---------------------------------------------------------------------------
// WSEnvelope schema (the outer wrapper)
// ---------------------------------------------------------------------------

export const WSEnvelopeSchema = z.object({
  channel: z.string(),
  type: z.string(),
  payload: z.unknown().optional(),
  ts: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Discriminated union of all known payload schemas
// ---------------------------------------------------------------------------

/**
 * Map from envelope `type` to the Zod schema that validates its payload.
 * Only the most common/critical types are listed. Unknown types fall through
 * to `z.unknown()` in `validateWSPayload`.
 */
const PAYLOAD_SCHEMA_MAP = {
  'session:started': SessionStartedPayloadSchema,
  'session:ended': SessionEndedPayloadSchema,
  'session:updated': SessionUpdatedPayloadSchema,
  'chat:message': ChatMessagePayloadSchema,
  'chat:history': ChatHistoryPayloadSchema,
  'chain:compiled': ChainCompiledPayloadSchema,
  'chain:started': ChainStartedPayloadSchema,
  'chain:completed': ChainCompletedPayloadSchema,
  'step:spawned': StepSpawnedPayloadSchema,
  'step:started': StepStartedPayloadSchema,
  'step:completed': StepCompletedPayloadSchema,
  'step:failed': StepFailedPayloadSchema,
  'error:occurred': ErrorOccurredPayloadSchema,
  error: SystemErrorPayloadSchema,
} as const;

export type KnownPayloadType = keyof typeof PAYLOAD_SCHEMA_MAP;

// ---------------------------------------------------------------------------
// Validation helper
// ---------------------------------------------------------------------------

export interface WSPayloadValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Validate a raw WebSocket envelope payload against the known schema for its
 * `type`. Returns a result object — never throws.
 *
 * Usage:
 * ```ts
 * const result = validateWSPayload('chat:message', rawPayload);
 * if (result.success) {
 *   // result.data is typed as ChatMessagePayload
 * }
 * ```
 *
 * For unknown types the payload is returned as-is with `success: true`.
 */
export function validateWSPayload<K extends KnownPayloadType>(
  type: K,
  payload: unknown
): WSPayloadValidationResult<z.infer<(typeof PAYLOAD_SCHEMA_MAP)[K]>>;

export function validateWSPayload(
  type: string,
  payload: unknown
): WSPayloadValidationResult<unknown>;

export function validateWSPayload(
  type: string,
  payload: unknown
): WSPayloadValidationResult<unknown> {
  const schema = PAYLOAD_SCHEMA_MAP[type as KnownPayloadType];
  if (!schema) {
    // Unknown type — pass through without validation
    return { success: true, data: payload };
  }

  const result = schema.safeParse(payload);
  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.errors.map(
      (e) => `${e.path.join('.')}: ${e.message}`
    ),
  };
}

/**
 * Validate the outer WSEnvelope wrapper (channel, type, ts fields).
 * Does NOT validate the payload — use `validateWSPayload` for that.
 */
export function validateWSEnvelope(
  raw: unknown
): WSPayloadValidationResult<{ channel: string; type: string; payload?: unknown; ts?: string }> {
  const result = WSEnvelopeSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map(
      (e) => `${e.path.join('.')}: ${e.message}`
    ),
  };
}
