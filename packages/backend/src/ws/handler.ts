import type { WebSocket } from 'ws';
import type { WorkspaceEvent, SessionId } from '@afw/shared';
import type { Storage } from '../storage/index.js';
import { clientRegistry } from './clientRegistry.js';
import { wsMessageSchema, type ValidatedWSMessage } from '../schemas/ws.js';
import { claudeCliManager } from '../services/claudeCliManager.js';

/**
 * WebSocket message format for server->client
 */
interface WSBroadcast {
  type: 'event' | 'command' | 'pong' | 'subscription_confirmed' | 'error';
  sessionId?: string;
  payload?: unknown;
  clientId?: string;
  details?: unknown;
}

/**
 * Handle WebSocket connection
 */
export function handleWebSocket(
  ws: WebSocket,
  clientId: string,
  storage: Storage
): void {
  // Send connection confirmation
  const confirmation: WSBroadcast = {
    type: 'subscription_confirmed',
    payload: { clientId, message: 'Connected to ActionFlows backend' },
  };
  ws.send(JSON.stringify(confirmation));

  // Handle incoming messages
  ws.on('message', async (data: Buffer) => {
    // Per-message API key validation (Fix 1: Security)
    const currentApiKey = process.env.AFW_API_KEY;
    if (!clientRegistry.validateApiKey(ws, currentApiKey)) {
      ws.send(JSON.stringify({ type: 'error', payload: 'Authentication failed - API key invalid or rotated' }));
      ws.close(1008, 'Authentication failed');
      return;
    }

    // Rate limit check
    if (clientRegistry.checkRateLimit(ws)) {
      ws.send(JSON.stringify({ type: 'error', payload: 'Rate limit exceeded' }));
      return;
    }

    try {
      const raw = JSON.parse(data.toString('utf-8'));
      const result = wsMessageSchema.safeParse(raw);

      if (!result.success) {
        ws.send(JSON.stringify({
          type: 'error',
          payload: 'Invalid message format',
          details: result.error.issues.map((i) => i.message),
        }));
        return;
      }

      const message = result.data as ValidatedWSMessage;

      switch (message.type) {
        case 'subscribe': {
          // Fix 2: Validate session ownership before subscribing
          const session = await Promise.resolve(storage.getSession(message.sessionId as SessionId));
          if (!session) {
            ws.send(JSON.stringify({
              type: 'error',
              payload: 'Session not found',
              sessionId: message.sessionId,
            }));
            break;
          }

          // If session has a user requirement, check that client's userId matches
          const clientInfo = clientRegistry.getClientInfo(ws);
          if (session.user && clientInfo?.userId && clientInfo.userId !== session.user) {
            console.warn(`[WS] Access denied: client ${clientId} attempted to subscribe to session ${message.sessionId} owned by ${session.user}`);
            ws.send(JSON.stringify({
              type: 'error',
              payload: 'Access denied: session belongs to another user',
              sessionId: message.sessionId,
            }));
            break;
          }

          clientRegistry.subscribe(ws, message.sessionId as SessionId);
          storage.addClient(clientId, message.sessionId as SessionId);

          const confirmSubscription: WSBroadcast = {
            type: 'subscription_confirmed',
            sessionId: message.sessionId,
            payload: { message: `Subscribed to session ${message.sessionId}` },
          };
          ws.send(JSON.stringify(confirmSubscription));
          console.log(`[WS] Client ${clientId} subscribed to session ${message.sessionId}`);
          break;
        }

        case 'unsubscribe':
          clientRegistry.unsubscribe(ws, message.sessionId as SessionId);
          storage.removeClient(clientId);
          console.log(`[WS] Client ${clientId} unsubscribed from session ${message.sessionId}`);
          break;

        case 'input':
          if (message.payload) {
            // Try to pipe input directly to running CLI session
            try {
              const cliSession = claudeCliManager.getSession(message.sessionId as SessionId);
              if (cliSession && cliSession.isRunning()) {
                // Pipe input directly to Claude CLI stdin
                cliSession.sendInput(String(message.payload));
                console.log(`[WS] Input piped to CLI session ${message.sessionId}`);
              } else {
                // Fallback: queue input for later processing
                await Promise.resolve(storage.queueInput(message.sessionId as SessionId, message.payload));
                console.log(`[WS] Input queued for session ${message.sessionId} (no active CLI session)`);
              }
            } catch (error) {
              console.error(`[WS] Error piping input to CLI session ${message.sessionId}:`, error);
              // Fallback: queue input on error
              await Promise.resolve(storage.queueInput(message.sessionId as SessionId, message.payload));
              console.log(`[WS] Input queued for session ${message.sessionId} (piping failed)`);
            }
          }
          break;

        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', clientId }));
          break;

        default:
          // TypeScript ensures this is unreachable, but kept for safety
          console.warn(`[WS] Unknown message type received`);
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        ws.send(JSON.stringify({ type: 'error', payload: 'Invalid JSON' }));
      } else {
        console.error('[WS] Error processing message:', error);
        ws.send(JSON.stringify({ type: 'error', payload: 'Message processing error' }));
      }
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    clientRegistry.unregister(ws);
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
