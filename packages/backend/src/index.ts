import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import type { Socket } from 'net';

import { storage as baseStorage, isAsyncStorage } from './storage/index.js';
import { ResilientStorage } from './storage/resilientStorage.js';
import { handleWebSocket } from './ws/handler.js';
import { clientRegistry } from './ws/clientRegistry.js';
import { cleanupService } from './services/cleanup.js';
import { setBroadcastFunction, shutdownAllWatchers } from './services/fileWatcher.js';
import { claudeCliManager } from './services/claudeCliManager.js';
import { registryStorage } from './services/registryStorage.js';
import { SnapshotService } from './services/snapshotService.js';
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
import contractsRouter from './routes/contracts.js';
import dossiersRouter, { setBroadcastDossierFunction } from './routes/dossiers.js';
import suggestionsRouter from './routes/suggestions.js';
import telemetryRouter from './routes/telemetry.js';
import lifecycleRouter from './routes/lifecycle.js';
import remindersRouter from './routes/reminders.js';
import errorsRouter from './routes/errors.js';
import universeRouter from './routes/universe.js';
import type { SessionId, FileCreatedEvent, FileModifiedEvent, FileDeletedEvent, TerminalOutputEvent, WorkspaceEvent, RegistryChangedEvent } from '@afw/shared';
import { initializeHarmonyDetector, harmonyDetector } from './services/harmonyDetector.js';
import { lifecycleManager } from './services/lifecycleManager.js';
import { initDiscoveryService } from './services/discoveryService.js';

// Middleware imports (Agent A)
import { authMiddleware } from './middleware/auth.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { globalErrorHandler } from './middleware/errorHandler.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Wrap storage with circuit breaker protection (enabled by default, can be disabled with AFW_DISABLE_CIRCUIT_BREAKER=true)
const storage = process.env.AFW_DISABLE_CIRCUIT_BREAKER === 'true'
  ? baseStorage
  : new ResilientStorage(baseStorage);

// Initialize snapshot service for MemoryStorage persistence
// AFW_SNAPSHOT_DIR lets Electron set a stable path (e.g. %APPDATA%/ActionFlows Workspace/snapshots/)
const snapshotService = new SnapshotService(storage, {
  snapshotDir: process.env.AFW_SNAPSHOT_DIR || '.actionflows-snapshot',
});

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
app.use('/api/dossiers', dossiersRouter);
app.use('/api/suggestions', suggestionsRouter);
app.use('/api/telemetry', telemetryRouter);
app.use('/api/lifecycle', lifecycleRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/errors', errorsRouter);
app.use('/api/universe', universeRouter);
// Note: patternsRouter also handles /bookmarks routes, registered at /api for cleaner URLs
// IMPORTANT: Must come AFTER specific /api/* routes since it has /:projectId catch-all
app.use('/api', patternsRouter);
app.use('/api/registry', registryRouter);
app.use('/api/harmony', harmonyRouter);
app.use('/api/routing', routingRouter);
app.use('/api/contracts', contractsRouter);

// Serve frontend static files in production (Electron desktop app)
// Gated behind AFW_SERVE_FRONTEND=true — no effect during normal dev workflow
if (process.env.AFW_SERVE_FRONTEND === 'true') {
  const frontendPath = process.env.AFW_FRONTEND_PATH || path.join(__dirname, '../../../app/dist');
  app.use(express.static(frontendPath));

  // SPA fallback — must come after all /api routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Global error handler (must be after all routes) (Agent A)
app.use(globalErrorHandler);

// Create HTTP server
const server = createServer(app);

// Create WebSocket server with max payload limit (1MB) for security
const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024 });

// Server-side heartbeat interval to keep connections alive
let heartbeatInterval: NodeJS.Timeout | null = null;
const HEARTBEAT_INTERVAL_MS = 20000; // 20 seconds

function startServerHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  heartbeatInterval = setInterval(() => {
    const heartbeatMessage = JSON.stringify({ type: 'pong' });
    const clients = clientRegistry.getAllClients();

    clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(heartbeatMessage);
      }
    });
  }, HEARTBEAT_INTERVAL_MS);

  console.log('[WS] Server heartbeat started (20s interval)');
}

function stopServerHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log('[WS] Server heartbeat stopped');
  }
}

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

// Broadcast dossier events to all WebSocket clients (global, not session-specific)
function broadcastDossierEvent(
  eventType: 'dossier:created' | 'dossier:updated' | 'dossier:deleted' | 'dossier:analyzing' | 'dossier:analyzed',
  dossierId: string,
  data?: any
) {
  const message = JSON.stringify({
    type: eventType,
    dossierId,
    data,
  });

  // Broadcast to all connected clients since dossiers are global
  clientRegistry.getAllClients().forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(message);
    }
  });
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
const isMainModule = (() => {
  try {
    const self = new URL(import.meta.url).pathname.toLowerCase();
    const entry = new URL(`file:///${process.argv[1]?.replace(/\\/g, '/')}`).pathname.toLowerCase();
    return self === entry;
  } catch {
    return false;
  }
})();
if (isMainModule) {
  server.listen(PORT, async () => {
    // Initialize Redis Pub/Sub after server starts
    await initializeRedisPubSub();

    // Load snapshot and start snapshot service for MemoryStorage (only for non-Redis)
    if (storage.snapshot) {
      await snapshotService.loadLatestSnapshot();
      snapshotService.start();
    }

    // Initialize file watcher broadcast function
    setBroadcastFunction(broadcastFileEvent);

    // Initialize terminal broadcast function
    setBroadcastTerminalFunction(broadcastTerminalEvent);

    // Initialize Claude CLI broadcast function
    claudeCliManager.setBroadcastFunction(broadcastClaudeCliEvent);

    // Initialize registry broadcast function for real-time registry updates
    registryStorage.setBroadcastFunction(broadcastRegistryEvent);

    // Initialize dossier broadcast function
    setBroadcastDossierFunction(broadcastDossierEvent);

    // Initialize registry storage
    await registryStorage.initialize();

    // Initialize harmony detector
    initializeHarmonyDetector(storage);
    harmonyDetector.setBroadcastFunction(broadcastHarmonyEvent);

    // Initialize discovery service (Phase 3 - Living Universe)
    initDiscoveryService(storage);
    console.log('[Discovery] Service initialized for Living Universe Phase 3');

    // Start cleanup service
    cleanupService.start();

    // Start lifecycle manager checking
    lifecycleManager.startChecking();

    // Start server-side WebSocket heartbeat
    startServerHeartbeat();

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

    // Save snapshot for MemoryStorage before shutdown
    if (storage.snapshot) {
      try {
        await snapshotService.saveSnapshot();
        snapshotService.stop();
      } catch (error) {
        console.error('[Snapshot] Error saving snapshot on shutdown:', error);
      }
    }

    // Stop server heartbeat
    stopServerHeartbeat();

    // Stop cleanup service
    cleanupService.stop();

    // Stop lifecycle manager checking
    lifecycleManager.stopChecking();

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

  // IPC shutdown handler for Electron production deployment
  // On Windows, process.kill() calls TerminateProcess() immediately without
  // triggering Node.js signal handlers. IPC is the only reliable way to do
  // graceful shutdown when spawned as a child process from Electron.
  process.on('message', (msg: any) => {
    if (msg && msg.type === 'shutdown') {
      console.log('[Server] Received IPC shutdown message');
      gracefulShutdown();
    }
  });
}

export { app, server, wss, storage };
