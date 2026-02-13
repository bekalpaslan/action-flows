import type { WebSocket } from 'ws';
import type { WorkspaceEvent, SessionId, ChatMessageEvent, ChatHistoryEvent, Timestamp, ChatMessage } from '@afw/shared';
import type { Storage } from '../storage/index.js';
import { clientRegistry } from './clientRegistry.js';
import { wsMessageSchema, type ValidatedWSMessage } from '../schemas/ws.js';
import { workspaceEventSchema, validateStorageData } from '@afw/shared';
import { claudeCliManager } from '../services/claudeCliManager.js';
import { activityTracker } from '../services/activityTracker.js';
import { capabilityRegistry } from '../services/capabilityRegistry.js';
import { toCapabilityId } from '@afw/shared';

/**
 * WebSocket message format for server->client
 */
interface WSBroadcast {
  type: 'event' | 'command' | 'pong' | 'subscription_confirmed' | 'error';
  sessionId?: string;
  payload?: unknown;
  clientId?: string;
  details?: unknown;
  /** Correlation ID for request/response patterns (capability invocation) */
  correlationId?: string;
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

          // Send chat history for reconnect/replay
          try {
            const chatHistory = await Promise.resolve(
              storage.getChatHistory(message.sessionId as SessionId)
            );
            if (chatHistory && chatHistory.length > 0) {
              const historyEvent: ChatHistoryEvent = {
                type: 'chat:history',
                sessionId: message.sessionId as SessionId,
                messages: chatHistory,
                timestamp: new Date().toISOString() as Timestamp,
              };
              const historyBroadcast: WSBroadcast = {
                type: 'event',
                sessionId: message.sessionId,
                payload: historyEvent,
              };
              ws.send(JSON.stringify(historyBroadcast));
              console.log(`[WS] Sent chat history (${chatHistory.length} messages) to client ${clientId}`);
            }
          } catch (historyErr) {
            console.error(`[WS] Error sending chat history:`, historyErr);
          }
          break;
        }

        case 'unsubscribe':
          clientRegistry.unsubscribe(ws, message.sessionId as SessionId);
          storage.removeClient(clientId);
          console.log(`[WS] Client ${clientId} unsubscribed from session ${message.sessionId}`);
          break;

        case 'input':
          if (message.payload) {
            const inputSessionId = message.sessionId as SessionId;
            const inputText = String(message.payload);

            // Track activity for TTL extension
            activityTracker.trackActivity(inputSessionId, 'input');

            // Capture user message for chat history
            try {
              const userAggregator = claudeCliManager.getAggregator(inputSessionId);
              if (userAggregator) {
                // Use aggregator to create and emit a user ChatMessage
                userAggregator.createUserMessage(inputText);
              } else {
                // No aggregator — store directly as a ChatMessage
                const userMsg: ChatMessage = {
                  id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`,
                  sessionId: inputSessionId,
                  role: 'user',
                  content: inputText,
                  timestamp: new Date().toISOString() as Timestamp,
                  messageType: 'text',
                };
                await Promise.resolve(storage.addChatMessage(inputSessionId, userMsg));
                // Broadcast user message event
                const chatEvent: ChatMessageEvent = {
                  type: 'chat:message',
                  sessionId: inputSessionId,
                  message: userMsg,
                  timestamp: userMsg.timestamp,
                };
                const chatBroadcast: WSBroadcast = {
                  type: 'event',
                  sessionId: message.sessionId,
                  payload: chatEvent,
                };
                clientRegistry.broadcastToSession(inputSessionId, JSON.stringify(chatBroadcast));
              }
            } catch (userMsgErr) {
              console.error(`[WS] Error capturing user message:`, userMsgErr);
            }

            // Try to pipe input directly to running CLI session
            try {
              const cliSession = claudeCliManager.getSession(inputSessionId);
              if (cliSession && cliSession.isRunning()) {
                // Pipe input directly to Claude CLI stdin
                cliSession.sendInput(inputText);
                console.log(`[WS] Input piped to CLI session ${message.sessionId}`);
              } else {
                // Fallback: queue input for later processing
                await Promise.resolve(storage.queueInput(inputSessionId, message.payload));
                console.log(`[WS] Input queued for session ${message.sessionId} (no active CLI session)`);
              }
            } catch (error) {
              console.error(`[WS] Error piping input to CLI session ${message.sessionId}:`, error);
              // Fallback: queue input on error
              await Promise.resolve(storage.queueInput(inputSessionId, message.payload));
              console.log(`[WS] Input queued for session ${message.sessionId} (piping failed)`);
            }
          }
          break;

        case 'capability:register': {
          // Register capabilities from this client
          const rawMessage = message as any;
          if (rawMessage.capabilities && Array.isArray(rawMessage.capabilities)) {
            capabilityRegistry.register(rawMessage.capabilities, clientId);
            ws.send(JSON.stringify({
              type: 'capability:registered',
              payload: { count: rawMessage.capabilities.length },
            }));
            console.log(`[WS] Client ${clientId} registered ${rawMessage.capabilities.length} capabilities`);
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              payload: 'Invalid capability registration - capabilities array required',
            }));
          }
          break;
        }

        case 'capability:unregister': {
          // Unregister specific capabilities
          const rawMessage = message as any;
          if (rawMessage.capabilityIds && Array.isArray(rawMessage.capabilityIds)) {
            const capIds = rawMessage.capabilityIds.map((id: string) => toCapabilityId(id));
            capabilityRegistry.unregister(capIds);
            ws.send(JSON.stringify({
              type: 'capability:unregistered',
              payload: { count: capIds.length },
            }));
            console.log(`[WS] Client ${clientId} unregistered ${capIds.length} capabilities`);
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              payload: 'Invalid capability unregistration - capabilityIds array required',
            }));
          }
          break;
        }

        case 'capability:result': {
          // Handle capability invocation result from client
          const rawMessage = message as any;
          if (rawMessage.correlationId) {
            capabilityRegistry.handleResult(rawMessage.correlationId, {
              capabilityId: rawMessage.capabilityId,
              success: rawMessage.success ?? true,
              data: rawMessage.data,
              error: rawMessage.error,
              correlationId: rawMessage.correlationId,
            });
            console.log(`[WS] Received capability result from client ${clientId} - correlation: ${rawMessage.correlationId}`);
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              payload: 'Invalid capability result - correlationId required',
            }));
          }
          break;
        }

        case 'capability:error': {
          // Handle capability invocation error from client
          const rawMessage = message as any;
          if (rawMessage.correlationId && rawMessage.error) {
            capabilityRegistry.handleError(
              rawMessage.correlationId,
              rawMessage.error,
              rawMessage.code || 'unknown'
            );
            console.log(`[WS] Received capability error from client ${clientId} - correlation: ${rawMessage.correlationId}`);
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              payload: 'Invalid capability error - correlationId and error required',
            }));
          }
          break;
        }

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
    // Unregister any capabilities provided by this client
    capabilityRegistry.unregisterByClient(clientId);

    clientRegistry.unregister(ws);
    storage.removeClient(clientId);
    console.log(`[WS] Client ${clientId} connection closed`);
  });
}

/**
 * Broadcast event to all connected clients (for a specific session or all)
 * Validates event structure before broadcasting to prevent malformed data
 */
export function broadcastEvent(
  clients: WebSocket[],
  event: WorkspaceEvent,
  sessionId?: string
): void {
  // Validate event structure before broadcasting
  const validatedEvent = validateStorageData(
    event,
    workspaceEventSchema,
    `broadcast event type=${(event as any).type}`
  );

  if (!validatedEvent) {
    console.error('[WS] Failed to validate event for broadcast, skipping');
    return;
  }

  const broadcast: WSBroadcast = {
    type: 'event',
    sessionId,
    payload: validatedEvent,
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
