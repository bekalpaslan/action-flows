import { z } from 'zod';

/**
 * WebSocket message schemas using Zod for runtime validation
 * Supports: subscribe, unsubscribe, input, ping
 */

const subscribeMessage = z.object({
  type: z.literal('subscribe'),
  sessionId: z.string().min(1).max(200),
});

const unsubscribeMessage = z.object({
  type: z.literal('unsubscribe'),
  sessionId: z.string().min(1).max(200),
});

const inputMessage = z.object({
  type: z.literal('input'),
  sessionId: z.string().min(1).max(200),
  payload: z.unknown(),
});

const pingMessage = z.object({
  type: z.literal('ping'),
});

// Capability protocol messages
const capabilityRegisterMessage = z.object({
  type: z.literal('capability:register'),
  capabilities: z.array(z.any()), // Capability[] validated at handler level
});

const capabilityUnregisterMessage = z.object({
  type: z.literal('capability:unregister'),
  capabilityIds: z.array(z.string()),
});

const capabilityResultMessage = z.object({
  type: z.literal('capability:result'),
  correlationId: z.string(),
  capabilityId: z.string(),
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

const capabilityErrorMessage = z.object({
  type: z.literal('capability:error'),
  correlationId: z.string(),
  capabilityId: z.string(),
  error: z.string(),
  code: z.string(),
});

/**
 * Discriminated union of all valid WebSocket message types
 */
export const wsMessageSchema = z.discriminatedUnion('type', [
  subscribeMessage,
  unsubscribeMessage,
  inputMessage,
  pingMessage,
  capabilityRegisterMessage,
  capabilityUnregisterMessage,
  capabilityResultMessage,
  capabilityErrorMessage,
]);

/**
 * Inferred type for validated WebSocket messages
 */
export type ValidatedWSMessage = z.infer<typeof wsMessageSchema>;
