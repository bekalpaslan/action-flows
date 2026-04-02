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

// Channel multiplexing messages (Phase 2: per-workbench channels)
const channelSubscribeMessage = z.object({
  type: z.literal('channel:subscribe'),
  channel: z.string().min(1).max(100),
});

const channelUnsubscribeMessage = z.object({
  type: z.literal('channel:unsubscribe'),
  channel: z.string().min(1).max(100),
});

// Session lifecycle messages (Phase 6: Agent SDK sessions)
const sessionStartMessage = z.object({
  type: z.literal('session:start'),
  channel: z.string().min(1).max(100),
  payload: z.object({ workbenchId: z.string().min(1) }),
});

const sessionStopMessage = z.object({
  type: z.literal('session:stop'),
  channel: z.string().min(1).max(100),
  payload: z.object({ workbenchId: z.string().min(1) }),
});

const sessionSwitchMessage = z.object({
  type: z.literal('session:switch'),
  channel: z.string().min(1).max(100),
  payload: z.object({
    newWorkbenchId: z.string().min(1),
    previousWorkbenchId: z.string().min(1),
  }),
});

const sessionHistoryMessage = z.object({
  type: z.literal('session:history'),
  channel: z.string().min(1).max(100),
  payload: z.object({ workbenchId: z.string().min(1) }),
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
  channelSubscribeMessage,
  channelUnsubscribeMessage,
  sessionStartMessage,
  sessionStopMessage,
  sessionSwitchMessage,
  sessionHistoryMessage,
]);

/**
 * Inferred type for validated WebSocket messages
 */
export type ValidatedWSMessage = z.infer<typeof wsMessageSchema>;
