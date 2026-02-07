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

/**
 * Discriminated union of all valid WebSocket message types
 */
export const wsMessageSchema = z.discriminatedUnion('type', [
  subscribeMessage,
  unsubscribeMessage,
  inputMessage,
  pingMessage,
]);

/**
 * Inferred type for validated WebSocket messages
 */
export type ValidatedWSMessage = z.infer<typeof wsMessageSchema>;
