import { WebSocket } from 'ws';
import type { WorkspaceEvent } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import type { Socket } from 'net';
import * as crypto from 'crypto';
import { storage, isAsyncStorage } from '../storage/index.js';
import { handleWebSocket } from '../ws/handler.js';
import eventsRouter from '../routes/events.js';
import sessionsRouter from '../routes/sessions.js';
import commandsRouter from '../routes/commands.js';
import type { Server } from 'http';

let testServer: Server | null = null;
let testPort: number | null = null;
let testWss: WebSocketServer | null = null;
let wsConnectedClients: Set<any> = new Set();

/**
 * Start test server on random available port
 */
export async function createTestServer(): Promise<{
  apiUrl: string;
  wsUrl: string;
  port: number;
}> {
  // Find available port
  testPort = await getAvailablePort();

  // Create Express app
  const testApp = express();

  // Middleware
  testApp.use(cors({
    origin: '*',
    credentials: true,
  }));
  testApp.use(express.json());

  // Health check
  testApp.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API Routes
  testApp.use('/api/events', eventsRouter);
  testApp.use('/api/sessions', sessionsRouter);
  testApp.use('/api/commands', commandsRouter);

  // Create HTTP server
  testServer = createServer(testApp);

  // Create WebSocket server
  testWss = new WebSocketServer({ server: testServer });

  // Handle WebSocket upgrade
  testServer.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
    if (request.url === '/ws') {
      testWss!.handleUpgrade(request, socket, head, (ws) => {
        testWss!.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  // WebSocket connection handler
  testWss.on('connection', (ws, request) => {
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[Test WS] Client connected: ${clientId}`);

    wsConnectedClients.add(ws);

    handleWebSocket(ws, clientId, storage);

    ws.on('close', () => {
      console.log(`[Test WS] Client disconnected: ${clientId}`);
      wsConnectedClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error(`[Test WS] Error for client ${clientId}:`, error);
      wsConnectedClients.delete(ws);
    });
  });

  // Start server
  return new Promise((resolve, reject) => {
    testServer!.listen(testPort, async () => {
      const port = testPort!;
      const apiUrl = `http://localhost:${port}`;
      const wsUrl = `ws://localhost:${port}`;

      console.log(`[Test] Server started on port ${port}`);

      // Initialize Redis Pub/Sub if needed
      if (isAsyncStorage(storage) && storage.subscribe) {
        try {
          await storage.subscribe(`afw:events`, (message: string) => {
            try {
              const eventData = JSON.parse(message);
              console.log('[Test Redis] Received broadcast event:', eventData.sessionId);

              const broadcastMessage = JSON.stringify({
                type: 'event',
                sessionId: eventData.sessionId,
                payload: eventData.event,
              });

              wsConnectedClients.forEach((client) => {
                if (client.readyState === 1) {
                  client.send(broadcastMessage);
                }
              });
            } catch (error) {
              console.error('[Test Redis] Error processing pub/sub message:', error);
            }
          });
        } catch (error) {
          console.error('[Test] Error initializing pub/sub:', error);
        }
      }

      resolve({ apiUrl, wsUrl, port });
    });

    testServer!.on('error', reject);
  });
}

/**
 * Create WebSocket client connected to test server
 */
export async function createWebSocketClient(wsUrl: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      console.log('[Test] WebSocket client connected');
      resolve(ws);
    });

    ws.on('error', (error) => {
      console.error('[Test] WebSocket error:', error);
      reject(error);
    });

    // Timeout after 5 seconds
    setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
  });
}

/**
 * Create mock event with proper types
 */
export function createMockEvent<T extends WorkspaceEvent>(
  type: T['type'],
  overrides?: Partial<T> & Record<string, unknown>
): T {
  const now = new Date().toISOString();
  const sessionId = overrides?.sessionId || brandedTypes.sessionId(`session-${Date.now()}`);

  const baseEvent: WorkspaceEvent = {
    type,
    sessionId,
    timestamp: brandedTypes.timestamp(now),
    id: crypto.randomUUID(),
    ...overrides,
  } as any;

  // Add type-specific defaults
  if (type === 'step:spawned') {
    const event: any = {
      ...baseEvent,
      stepNumber: overrides?.stepNumber || 1,
      action: overrides?.action || 'test-action',
    };
    return event as T;
  }

  if (type === 'step:completed') {
    const event: any = {
      ...baseEvent,
      stepNumber: overrides?.stepNumber || 1,
      duration: overrides?.duration || 1000,
      succeeded: overrides?.succeeded ?? true,
    };
    return event as T;
  }

  if (type === 'step:failed') {
    const event: any = {
      ...baseEvent,
      stepNumber: overrides?.stepNumber || 1,
      error: overrides?.error || 'Test error',
      isCritical: overrides?.isCritical ?? false,
      isRetryable: overrides?.isRetryable ?? true,
    };
    return event as T;
  }

  if (type === 'session:started') {
    const event: any = {
      ...baseEvent,
      cwd: overrides?.cwd || '/test/workspace',
      hostname: overrides?.hostname || 'test-host',
      platform: overrides?.platform || 'darwin',
    };
    return event as T;
  }

  if (type === 'session:ended') {
    const event: any = {
      ...baseEvent,
      duration: overrides?.duration || 5000,
      reason: overrides?.reason || 'completed',
    };
    return event as T;
  }

  if (type === 'chain:started') {
    const event: any = {
      ...baseEvent,
      chainId: overrides?.chainId || `chain-${Date.now()}`,
      title: overrides?.title || 'Test Chain',
      currentStep: overrides?.currentStep || 1,
    };
    return event as T;
  }

  if (type === 'chain:completed') {
    const event: any = {
      ...baseEvent,
      chainId: overrides?.chainId || `chain-${Date.now()}`,
      duration: overrides?.duration || 5000,
      overallStatus: overrides?.overallStatus || 'success',
    };
    return event as T;
  }

  if (type === 'interaction:awaiting-input') {
    const event: any = {
      ...baseEvent,
      question: overrides?.question || 'What is your answer?',
      allowCustomInput: overrides?.allowCustomInput ?? true,
    };
    return event as T;
  }

  if (type === 'interaction:input-received') {
    const event: any = {
      ...baseEvent,
      input: overrides?.input || 'user response',
      source: overrides?.source || 'api',
      acknowledgedAt: brandedTypes.timestamp(now),
    };
    return event as T;
  }

  if (type === 'file:created') {
    const event: any = {
      ...baseEvent,
      path: overrides?.path || '/test/file.txt',
    };
    return event as T;
  }

  if (type === 'file:modified') {
    const event: any = {
      ...baseEvent,
      path: overrides?.path || '/test/file.txt',
    };
    return event as T;
  }

  if (type === 'file:deleted') {
    const event: any = {
      ...baseEvent,
      path: overrides?.path || '/test/file.txt',
    };
    return event as T;
  }

  if (type === 'error:occurred') {
    const event: any = {
      ...baseEvent,
      error: overrides?.error || 'Test error',
      recoverable: overrides?.recoverable ?? true,
      affectsChain: overrides?.affectsChain ?? false,
    };
    return event as T;
  }

  if (type === 'warning:occurred') {
    const event: any = {
      ...baseEvent,
      warning: overrides?.warning || 'Test warning',
      acknowledged: overrides?.acknowledged ?? false,
    };
    return event as T;
  }

  return baseEvent as T;
}

/**
 * Clean up test resources
 */
export async function cleanup(): Promise<void> {
  return new Promise(async (resolve) => {
    try {
      // Close WebSocket connections
      wsConnectedClients.forEach((client) => {
        client.close();
      });
      wsConnectedClients.clear();

      // Disconnect from Redis if using it
      if (isAsyncStorage(storage) && storage.disconnect) {
        try {
          await storage.disconnect();
        } catch (error) {
          console.error('[Test] Error disconnecting storage:', error);
        }
      }

      if (testServer) {
        testServer.close(() => {
          testServer = null;
          testPort = null;
          testWss = null;
          console.log('[Test] Server shut down');
          resolve();
        });
      } else {
        resolve();
      }
    } catch (error) {
      console.error('[Test] Error during cleanup:', error);
      resolve();
    }
  });
}

/**
 * Find available port
 */
async function getAvailablePort(): Promise<number> {
  return new Promise((resolve) => {
    const server = require('net').createServer();
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

/**
 * Wait for condition
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
}

/**
 * Wait for WebSocket message
 */
export async function waitForMessage(
  ws: WebSocket,
  predicate?: (msg: any) => boolean,
  timeout = 5000
): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Timeout waiting for WebSocket message'));
    }, timeout);

    const handler = (data: any) => {
      try {
        const msg = JSON.parse(data.toString());
        if (!predicate || predicate(msg)) {
          clearTimeout(timer);
          ws.removeListener('message', handler);
          resolve(msg);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.on('message', handler);
  });
}
