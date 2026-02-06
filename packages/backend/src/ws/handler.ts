import type { WebSocket } from 'ws';
import type { WorkspaceEvent, SessionId } from '@afw/shared';
import type { Storage } from '../storage';

/**
 * WebSocket message format for client->server
 */
interface WSMessage {
  type: 'subscribe' | 'unsubscribe' | 'input' | 'ping';
  sessionId?: string;
  payload?: unknown;
}

/**
 * WebSocket message format for server->client
 */
interface WSBroadcast {
  type: 'event' | 'command' | 'pong' | 'subscription_confirmed';
  sessionId?: string;
  payload?: unknown;
  clientId?: string;
}

/**
 * Handle WebSocket connection
 */
export function handleWebSocket(
  ws: WebSocket,
  clientId: string,
  storage: Storage
): void {
  let subscribedSessionId: string | undefined;

  // Send connection confirmation
  const confirmation: WSBroadcast = {
    type: 'subscription_confirmed',
    payload: { clientId, message: 'Connected to ActionFlows backend' },
  };
  ws.send(JSON.stringify(confirmation));

  // Handle incoming messages
  ws.on('message', async (data: Buffer) => {
    try {
      const message: WSMessage = JSON.parse(data.toString('utf-8'));

      switch (message.type) {
        case 'subscribe':
          if (message.sessionId) {
            subscribedSessionId = message.sessionId;
            storage.addClient(clientId, message.sessionId as SessionId);

            const confirmSubscription: WSBroadcast = {
              type: 'subscription_confirmed',
              sessionId: message.sessionId,
              payload: { message: `Subscribed to session ${message.sessionId}` },
            };
            ws.send(JSON.stringify(confirmSubscription));
            console.log(`[WS] Client ${clientId} subscribed to session ${message.sessionId}`);
          }
          break;

        case 'unsubscribe':
          if (message.sessionId) {
            storage.removeClient(clientId);
            subscribedSessionId = undefined;
            console.log(`[WS] Client ${clientId} unsubscribed from session ${message.sessionId}`);
          }
          break;

        case 'input':
          if (message.sessionId && message.payload) {
            await Promise.resolve(storage.queueInput(message.sessionId as SessionId, message.payload));
            console.log(`[WS] Input received for session ${message.sessionId}:`, message.payload);
          }
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', clientId }));
          break;

        default:
          console.warn(`[WS] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('[WS] Error parsing message:', error);
      ws.send(JSON.stringify({ type: 'error', payload: 'Invalid message format' }));
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    storage.removeClient(clientId);
    console.log(`[WS] Client ${clientId} connection closed`);
  });
}

/**
 * Broadcast event to all connected clients (for a specific session or all)
 */
export function broadcastEvent(
  clients: WebSocket[],
  event: WorkspaceEvent,
  sessionId?: string
): void {
  const broadcast: WSBroadcast = {
    type: 'event',
    sessionId,
    payload: event,
  };

  const message = JSON.stringify(broadcast);
  clients.forEach((client) => {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(message);
    }
  });
}

/**
 * Send command to specific client
 */
export function sendCommandToClient(
  ws: WebSocket,
  commandPayload: unknown,
  sessionId?: string
): void {
  const message: WSBroadcast = {
    type: 'command',
    sessionId,
    payload: commandPayload,
  };

  if (ws.readyState === 1) { // 1 = OPEN
    ws.send(JSON.stringify(message));
  }
}

/**
 * Check if a client is connected
 */
export function isClientConnected(ws: WebSocket): boolean {
  return ws.readyState === 1; // 1 = OPEN
}
