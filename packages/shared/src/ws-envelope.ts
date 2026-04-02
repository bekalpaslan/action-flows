/**
 * WebSocket message envelope for channel-per-workbench multiplexing.
 * Every message (client-to-server and server-to-client) uses this format.
 */
export interface WSEnvelope {
  /** Channel = workbench ID (e.g., "work", "explore") or system channel */
  channel: string;
  /** Message type within the channel */
  type: string;
  /** Payload specific to the message type */
  payload?: unknown;
  /** Server-assigned ISO timestamp */
  ts?: string;
}

/** System channel for connection management, ping/pong, errors */
export const SYSTEM_CHANNEL = '_system';

/** Broadcast channel for messages to all connected clients */
export const BROADCAST_CHANNEL = '_all';

/** Known system message types */
export type SystemMessageType =
  | 'subscribe'
  | 'unsubscribe'
  | 'subscribed'
  | 'unsubscribed'
  | 'ping'
  | 'pong'
  | 'error';
