import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import type { Socket } from 'net';

import { storage, isAsyncStorage } from './storage/index.js';
import { handleWebSocket } from './ws/handler.js';
import { clientRegistry } from './ws/clientRegistry.js';
import { cleanupService } from './services/cleanup.js';
import { setBroadcastFunction, shutdownAllWatchers } from './services/fileWatcher.js';
import { claudeCliManager } from './services/claudeCliManager.js';
import { registryStorage } from './services/registryStorage.js';
import terminalRouter, { setBroadcastTerminalFunction } from './routes/terminal.js';
import eventsRouter from './routes/events.js';
import sessionsRouter from './routes/sessions.js';
import commandsRouter from './routes/commands.js';
import historyRouter from './routes/history.js';
import filesRouter from './routes/files.js';
import claudeCliRouter from './routes/claudeCli.js';
import sessionWindowsRouter from './routes/sessionWindows.js';
import projectsRouter from './routes/projects.js';
import discoveryRouter from './routes/discovery.js';
import usersRouter from './routes/users.js';
import toolbarRouter from './routes/toolbar.js';
import patternsRouter from './routes/patterns.js';
import registryRouter from './routes/registry.js';
import harmonyRouter from './routes/harmony.js';
import routingRouter from './routes/routing.js';
import type { SessionId, FileCreatedEvent, FileModifiedEvent, FileDeletedEvent, TerminalOutputEvent, WorkspaceEvent, RegistryChangedEvent } from '@afw/shared';
import { initializeHarmonyDetector, harmonyDetector } from './services/harmonyDetector.js';

// Middleware imports (Agent A)
import { authMiddleware } from './middleware/auth.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { globalErrorHandler } from './middleware/errorHandler.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Create Express app
const app = express();

// Middleware
// Configure CORS with whitelist (Agent A fix)
const ALLOWED_ORIGINS = (process.env.AFW_CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:3001').split(',');

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Electron, server-to-server, curl)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: Origin not allowed'));
    }
  },
  credentials: true,
}));

// Body size limit (Agent A fix)
app.use(express.json({ limit: '1mb' }));

// Apply authentication middleware (Agent A)
app.use(authMiddleware);

// Apply general rate limiting to all /api routes (Agent A)
app.use('/api', generalLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/events', eventsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/commands', commandsRouter);
app.use('/api/history', historyRouter);
app.use('/api/files', filesRouter);
app.use('/api/terminal', terminalRouter);
app.use('/api/claude-cli', claudeCliRouter);
app.use('/api/session-windows', sessionWindowsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/discovery', discoveryRouter);
app.use('/api/users', usersRouter);
app.use('/api/toolbar', toolbarRouter);
app.use('/api/patterns', patternsRouter);
// Note: patternsRouter also handles /bookmarks routes, registered at /api for cleaner URLs
app.use('/api', patternsRouter);
app.use('/api/registry', registryRouter);
app.use('/api/harmony', harmonyRouter);
app.use('/api/routing', routingRouter);

// Global error handler (must be after all routes) (Agent A)
app.use(globalErrorHandler);

// Create HTTP server
const server = createServer(app);

// Create WebSocket server with max payload limit (1MB) for security
const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024 });

// Handle WebSocket upgrade
server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
  if (request.url?.startsWith('/ws')) {
    // Check API key authentication if configured
    const apiKey = process.env.AFW_API_KEY;
    if (apiKey) {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const providedKey = url.searchParams.get('apiKey')
        || request.headers.authorization?.replace('Bearer ', '');
      if (providedKey !== apiKey) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// WebSocket connection handler
wss.on('connection', (ws, request) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[WS] Client connected: ${clientId}`);

  // Extract API key from handshake for per-message validation (Fix 1 & 4)
  const apiKey = process.env.AFW_API_KEY;
  const url = new URL((request.url || '/ws'), `http://${request.headers.host || 'localhost'}`);
  const providedApiKey = url.searchParams.get('apiKey') || (request.headers.authorization?.replace('Bearer ', '') ?? undefined);

  // Try to register the client (will fail if at max capacity - Fix 4)
  const registered = clientRegistry.register(ws, clientId, providedApiKey || apiKey, undefined);
  if (!registered) {
    console.warn(`[WS] Client rejected: max connections reached`);
    ws.send(JSON.stringify({ type: 'error', payload: 'Server at maximum capacity' }));
    ws.close(1008, 'Server at max capacity');
    return;
  }

  handleWebSocket(ws, clientId, storage);

  ws.on('close', () => {
    console.log(`[WS] Client disconnected: ${clientId}`);
    clientRegistry.unregister(ws);
  });

  ws.on('error', (error) => {
    console.error(`[WS] Error for client ${clientId}:`, error.message);
    clientRegistry.unregister(ws);
  });
});

// Broadcast file change events to WebSocket clients subscribed to this session
function broadcastFileEvent(
  sessionId: SessionId,
  event: FileCreatedEvent | FileModifiedEvent | FileDeletedEvent
) {
  const message = JSON.stringify({
    type: 'event',
    sessionId,
    payload: event,
  });

  clientRegistry.broadcastToSession(sessionId, message);
}

// Broadcast terminal output events to WebSocket clients subscribed to this session
function broadcastTerminalEvent(
  sessionId: SessionId,
  event: TerminalOutputEvent
) {
  const message = JSON.stringify({
    type: 'event',
    sessionId,
    payload: event,
  });

  clientRegistry.broadcastToSession(sessionId, message);
}

// Broadcast Claude CLI events to WebSocket clients subscribed to this session
function broadcastClaudeCliEvent(
  sessionId: SessionId,
  event: WorkspaceEvent
) {
  const message = JSON.stringify({
    type: 'event',
    sessionId,
    payload: event,
  });

  clientRegistry.broadcastToSession(sessionId, message);
}

// Broadcast registry change events to all WebSocket clients (system-level, not session-specific)
function broadcastRegistryEvent(event: RegistryChangedEvent) {
  const message = JSON.stringify({
    type: 'registry-event',
    payload: event,
  });

  // Broadcast to all connected clients since registry changes affect everyone
  clientRegistry.getAllClients().forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
}

// Broadcast harmony events to WebSocket clients subscribed to this session
function broadcastHarmonyEvent(
  sessionId: SessionId,
  event: WorkspaceEvent
) {
  const message = JSON.stringify({
    type: 'event',
    sessionId,
    payload: event,
  });

  clientRegistry.broadcastToSession(sessionId, message);
}

// Initialize Redis Pub/Sub if using Redis storage
async function initializeRedisPubSub() {
  if (isAsyncStorage(storage) && storage.subscribe) {
    try {
      console.log('[Redis] Setting up pub/sub for event broadcasting...');

      // Subscribe to Redis pub/sub channel for events
      await storage.subscribe(`afw:events`, (message: string) => {
        try {
          const eventData = JSON.parse(message);
          console.log('[Redis] Received broadcast event:', eventData.sessionId);

          // Broadcast to all connected WebSocket clients subscribed to this session
          const broadcastMessage = JSON.stringify({
            type: 'event',
            sessionId: eventData.sessionId,
            payload: eventData.event,
          });

          const eventSessionId = eventData.sessionId as SessionId;
          clientRegistry.broadcastToSession(eventSessionId, broadcastMessage);
        } catch (error) {
          console.error('[Redis] Error processing pub/sub message:', error);
        }
      });

      console.log('[Redis] Pub/sub initialized for event broadcasting');
    } catch (error) {
      console.error('[Redis] Error initializing pub/sub:', error);
    }
  }
}

// Only start server if this is the main module (not when imported for testing)
const isMainModule = import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url === new URL(`file:///${process.argv[1]?.replace(/\\/g, '/')}`).href;
if (isMainModule) {
  server.listen(PORT, async () => {
    // Initialize Redis Pub/Sub after server starts
    await initializeRedisPubSub();

    // Initialize file watcher broadcast function
    setBroadcastFunction(broadcastFileEvent);

    // Initialize terminal broadcast function
    setBroadcastTerminalFunction(broadcastTerminalEvent);

    // Initialize Claude CLI broadcast function
    claudeCliManager.setBroadcastFunction(broadcastClaudeCliEvent);

    // Initialize registry broadcast function for real-time registry updates
    registryStorage.setBroadcastFunction(broadcastRegistryEvent);

    // Initialize registry storage
    await registryStorage.initialize();

    // Initialize harmony detector
    initializeHarmonyDetector(storage);
    harmonyDetector.setBroadcastFunction(broadcastHarmonyEvent);

    // Start cleanup service
    cleanupService.start();

    console.log(`
╔════════════════════════════════════════════╗
║   ActionFlows Backend Server Running      ║
║   API: http://localhost:${PORT}             ║
║   WS:  ws://localhost:${PORT}/ws           ║
║   Storage: ${isAsyncStorage(storage) ? 'Redis' : 'Memory'}             ║
║   Cleanup: Daily (7-day retention)        ║
║   File Watcher: Active                    ║
╚════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  async function gracefulShutdown() {
    console.log('[Server] Shutting down gracefully...');

    // Stop cleanup service
    cleanupService.stop();

    // Shutdown file watchers
    await shutdownAllWatchers();

    // Stop all Claude CLI sessions
    claudeCliManager.stopAllSessions();

    // Close WebSocket connections
    clientRegistry.getAllClients().forEach((client) => {
      client.close();
    });

    // Disconnect from Redis if using it
    if (isAsyncStorage(storage) && storage.disconnect) {
      try {
        await storage.disconnect();
      } catch (error) {
        console.error('[Redis] Error disconnecting:', error);
      }
    }

    server.close(() => {
      console.log('[Server] Server closed');
      process.exit(0);
    });
  }

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

export { app, server, wss, storage };
