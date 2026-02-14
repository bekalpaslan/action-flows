import express from 'express';
import cors from 'cors';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import type { Socket } from 'net';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';

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
import storyRouter from './routes/story.js';
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
import healingRecommendationsRouter from './routes/healingRecommendations.js';
import routingRouter from './routes/routing.js';
import contractsRouter from './routes/contracts.js';
import agentValidatorRouter from './routes/agentValidator.js';
import dossiersRouter, { setBroadcastDossierFunction } from './routes/dossiers.js';
import suggestionsRouter from './routes/suggestions.js';
import telemetryRouter from './routes/telemetry.js';
import lifecycleRouter from './routes/lifecycle.js';
import remindersRouter from './routes/reminders.js';
import errorsRouter from './routes/errors.js';
import universeRouter from './routes/universe.js';
import flowsRouter from './routes/flows.js';
import analyticsRouter from './routes/analytics.js';
import capabilitiesRouter from './routes/capabilities.js';
import createPersonalitiesRouter from './routes/personalities.js';
import { createPersonalityParser } from './services/personalityParser.js';
import preferencesRouter from './routes/preferences.js';
import artifactsRouter from './routes/artifacts.js';
import surfacesRouter from './routes/surfaces.js';
import slackRouter from './routes/surfaces/slack.js';
import type { SessionId, FileCreatedEvent, FileModifiedEvent, FileDeletedEvent, TerminalOutputEvent, WorkspaceEvent, RegistryChangedEvent } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { initializeHarmonyDetector, harmonyDetector } from './services/harmonyDetector.js';
import { initializeAgentValidator } from './services/agentValidator.js';
import { lifecycleManager } from './services/lifecycleManager.js';
import { initDiscoveryService } from './services/discoveryService.js';
import { initSparkBroadcaster, getSparkBroadcaster } from './services/sparkBroadcaster.js';
import { initGateValidator, getGateValidator } from './services/gateValidator.js';
import { initGateCheckpoint, getGateCheckpoint } from './services/gateCheckpoint.js';
import { initConversationWatcher, getConversationWatcher } from './services/conversationWatcher.js';
import { initBridgeStrengthService } from './services/bridgeStrengthService.js';
import { initHealingRecommendationEngine, getHealingRecommendationEngine } from './services/healingRecommendations.js';
import { initHealthScoreCalculator } from './services/healthScoreCalculator.js';
import createHarmonyHealthRouter from './routes/harmonyHealth.js';
import authRouter from './routes/auth.js';
import { ensureAdminExists } from './services/userService.js';

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

// Initialize health score calculator
const healthScoreCalculator = initHealthScoreCalculator(storage);

// Initialize personality parser (Phase 1 - Agent Personalities)
const personalityParser = createPersonalityParser();

// Create Express app
const app = express();

// Middleware
// Configure CORS with whitelist (Agent A fix)
const ALLOWED_ORIGINS = (process.env.AFW_CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:3001').split(',');

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Electron, server-to-server, curl, file://)
    if (!origin || origin === 'null' || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: Origin not allowed'));
    }
  },
  credentials: true,
}));

// Body size limit (Agent A fix)
app.use(express.json({ limit: '1mb' }));

// Enable gzip/brotli compression for responses > 1KB
// Compression threshold: 1KB, level: 6 (balanced), brotli enabled
app.use(compression({
  level: 6, // Balanced compression (0-11, default 6)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't accept compression
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Default filter
    return compression.filter(req, res);
  },
}));

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

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

// Swagger API Documentation
// Serve OpenAPI spec as JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'ActionFlows Dashboard API',
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
  },
}));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/story', storyRouter);
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
app.use('/api/harmony', createHarmonyHealthRouter(healthScoreCalculator));
app.use('/api/harmony/recommendations', healingRecommendationsRouter);
app.use('/api/harmony', harmonyRouter);
app.use('/api/routing', routingRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/agent-validator', agentValidatorRouter);
app.use('/api/flows', flowsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/capabilities', capabilitiesRouter);
app.use('/api/personalities', createPersonalitiesRouter(personalityParser));
app.use('/api/preferences', preferencesRouter);
app.use('/api/artifacts', artifactsRouter);
app.use('/api/surfaces', surfacesRouter);
app.use('/api/surfaces/slack', slackRouter);

// Note: surfaceManager is a singleton and auto-initializes on first import
console.log('[SurfaceManager] ✅ Singleton auto-initialized on import');

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
const IDLE_THRESHOLD_MS = 10000; // Only send heartbeat to clients idle > 10s

function startServerHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  heartbeatInterval = setInterval(() => {
    const heartbeatMessage = JSON.stringify({ type: 'pong' });
    const clients = clientRegistry.getAllClients();
    const now = Date.now();

    // Only send heartbeat to idle clients (optimization: reduce bandwidth)
    // Active clients already receive frequent messages from the app
    clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        const clientInfo = clientRegistry.getClientInfo(client);
        if (clientInfo) {
          const timeSinceLastMessage = now - clientInfo.lastMessageAt;
          // Only send to clients idle for more than threshold
          if (timeSinceLastMessage > IDLE_THRESHOLD_MS) {
            client.send(heartbeatMessage);
          }
        } else {
          // Fallback: send heartbeat if no tracking info
          client.send(heartbeatMessage);
        }
      }
    });
  }, HEARTBEAT_INTERVAL_MS);

  console.log('[WS] Server heartbeat started (20s interval, only to idle clients)');
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

// Broadcast spark traveling events to WebSocket clients subscribed to this session (Phase 4)
function broadcastSparkEvent(event: any) {
  const message = JSON.stringify({
    type: 'event',
    sessionId: event.sessionId,
    payload: event,
  });

  clientRegistry.broadcastToSession(event.sessionId, message);
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
    // Initialize default admin user
    try {
      await ensureAdminExists();
    } catch (error) {
      console.error('[Init] Failed to initialize admin user:', error);
    }

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

    // Initialize personality parser (Phase 1 - Agent Personalities)
    try {
      await personalityParser.parseAll();
      console.log('[PersonalityParser] ✅ Service initialized successfully for Agent Personalities Phase 1');
    } catch (error) {
      console.error('[PersonalityParser] ❌ Failed to initialize PersonalityParser:', error);
      // Don't crash the server, but log the error
    }

    // Initialize harmony detector
    initializeHarmonyDetector(storage);
    harmonyDetector.setBroadcastFunction(broadcastHarmonyEvent);

    // Initialize agent validator (Component 3 - Agent Behavior Validation)
    try {
      initializeAgentValidator(storage);
      console.log('[AgentValidator] ✅ Service initialized successfully for agent behavior validation');
    } catch (error) {
      console.error('[AgentValidator] ❌ Failed to initialize AgentValidator:', error);
      // Don't crash the server, but log the error
    }

    // Initialize discovery service (Phase 3 - Living Universe)
    try {
      initDiscoveryService(storage);
      console.log('[Discovery] ✅ Service initialized successfully for Living Universe Phase 3');
    } catch (error) {
      console.error('[Discovery] ❌ Failed to initialize DiscoveryService:', error);
      // Don't crash the server, but log the error
      // Discovery endpoints will return 503 if service unavailable
    }

    // Initialize spark broadcaster (Phase 4 - Chain Execution Visualization)
    try {
      const sparkBroadcaster = initSparkBroadcaster();

      // Wire spark events to WebSocket broadcast
      sparkBroadcaster.on('spark:traveling', broadcastSparkEvent);

      console.log('[SparkBroadcaster] ✅ Service initialized successfully for Living Universe Phase 4');
    } catch (error) {
      console.error('[SparkBroadcaster] ❌ Failed to initialize SparkBroadcaster:', error);
    }

    // Initialize gate validator (Phase 4 - Batch E: Gate Checkpoint Validation)
    try {
      const gateValidator = initGateValidator();

      // Wire gate validation events to WebSocket broadcast
      gateValidator.on('gate:updated', (event: any) => {
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(event));
          }
        });
      });

      console.log('[GateValidator] ✅ Service initialized successfully for Living Universe Phase 4 Batch E');
    } catch (error) {
      console.error('[GateValidator] ❌ Failed to initialize GateValidator:', error);
    }

    // Initialize bridge strength tracker (Phase 4 - Batch F: Bridge Strength + Background Indicators)
    try {
      initBridgeStrengthService();
      console.log('[BridgeStrengthService] ✅ Service initialized successfully for Living Universe Phase 4 Batch F');
    } catch (error) {
      console.error('[BridgeStrengthService] ❌ Failed to initialize BridgeStrengthService:', error);
    }

    // Initialize gate checkpoint service (Component 2 - Auditable Verification System)
    try {
      const gateCheckpoint = initGateCheckpoint(storage);

      // Wire gate checkpoint events to WebSocket broadcast + health calculator
      gateCheckpoint.on('gate:checkpoint', (trace: any) => {
        // Feed into health score calculator's in-memory buffer
        healthScoreCalculator.ingestTrace(trace);

        // Broadcast to all connected clients
        const message = JSON.stringify({
          type: 'chain:gate_updated',
          payload: trace,
        });

        clientRegistry.getAllClients().forEach((client) => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
          }
        });
      });

      console.log('[GateCheckpoint] ✅ Service initialized successfully for Auditable Verification System Component 2');
    } catch (error) {
      console.error('[GateCheckpoint] ❌ Failed to initialize GateCheckpoint:', error);
    }

    // Initialize ConversationWatcher (Gate validation for Claude Code sessions)
    try {
      // Resolve monorepo root: walk up from cwd until we find packages/
      let monorepoRoot = process.cwd();
      while (!fs.existsSync(path.join(monorepoRoot, 'packages'))) {
        const parent = path.dirname(monorepoRoot);
        if (parent === monorepoRoot) break; // filesystem root
        monorepoRoot = parent;
      }
      initConversationWatcher(storage, monorepoRoot);
      console.log('[ConversationWatcher] ✅ Service initialized successfully for JSONL log monitoring');
    } catch (error) {
      console.error('[ConversationWatcher] ❌ Failed to initialize ConversationWatcher:', error);
    }

    // Initialize healing recommendation engine (Component 7 - Healing Recommendation Engine)
    let healingEngine: ReturnType<typeof initHealingRecommendationEngine> | null = null;
    try {
      healingEngine = initHealingRecommendationEngine(storage);

      // Wire healing recommendation events to WebSocket broadcast
      healingEngine.on('harmony:recommendation_ready', (data: any) => {
        const message = JSON.stringify({
          type: 'harmony:recommendation_ready',
          payload: data,
        });

        clientRegistry.getAllClients().forEach((client) => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
          }
        });
      });

      healingEngine.on('recommendation:status_changed', (data: any) => {
        const message = JSON.stringify({
          type: 'recommendation:status_changed',
          payload: data,
        });

        clientRegistry.getAllClients().forEach((client) => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
          }
        });
      });

      console.log('[HealingRecommendations] ✅ Service initialized successfully for Auditable Verification System Component 7');
    } catch (error) {
      console.error('[HealingRecommendations] ❌ Failed to initialize HealingRecommendationEngine:', error);
    }

    // Initialize health score calculator WebSocket events (Component 6 - Health Score Aggregation)
    try {
      // Wire health score events to WebSocket broadcast
      healthScoreCalculator.on('health:updated', (healthScore: any) => {
        const message = JSON.stringify({
          type: 'harmony:health_updated',
          payload: healthScore,
        });

        clientRegistry.getAllClients().forEach((client) => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
          }
        });
      });

      healthScoreCalculator.on('harmony:threshold_exceeded', (data: any) => {
        const message = JSON.stringify({
          type: 'harmony:threshold_exceeded',
          payload: data,
        });

        clientRegistry.getAllClients().forEach((client) => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(message);
          }
        });

        // Trigger healing recommendation analysis when threshold exceeded
        if (healingEngine) {
          // Use 'project' as target type for system-wide violations
          const projectId = 'default-project' as any;  // ProjectId
          healingEngine.analyzeAndRecommend(projectId, 'project').catch((error: any) => {
            console.error('[HealingRecommendations] ❌ Failed to analyze threshold violations:', error);
          });
        }
      });

      console.log('[HealthScore] ✅ Event broadcasting wired successfully for Auditable Verification System Component 6');
    } catch (error) {
      console.error('[HealthScore] ❌ Failed to wire health score events:', error);
    }

    // Start cleanup service
    cleanupService.start();

    // Start lifecycle manager checking
    lifecycleManager.startChecking();

    // Start server-side WebSocket heartbeat
    startServerHeartbeat();

    // Start conversation watcher (non-blocking)
    if (process.env.AFW_ENABLE_CONVERSATION_WATCHER !== 'false') {
      const conversationWatcher = getConversationWatcher();
      if (conversationWatcher) {
        conversationWatcher.start().catch((error) => {
          console.warn('[ConversationWatcher] ⚠️  Failed to start (graceful degradation):', error instanceof Error ? error.message : String(error));
        });
      }
    }

    // Initialize default universe graph if not exists
    try {
      const universeGraph = await Promise.resolve(storage.getUniverseGraph());
      if (!universeGraph) {
        const now = new Date().toISOString();
        const defaultUniverseGraph = {
          metadata: {
            version: '1.0.0',
            createdAt: now,
            lastModifiedAt: now,
          },
          regions: [],
          bridges: [],
        };
        await Promise.resolve(storage.setUniverseGraph(defaultUniverseGraph));
        console.log('[Init] ✅ Default universe graph initialized');
      }
    } catch (error) {
      console.error('[Init] ❌ Failed to initialize default universe graph:', error);
    }

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

    // Shutdown spark broadcaster (Phase 4)
    try {
      const sparkBroadcaster = getSparkBroadcaster();
      sparkBroadcaster.shutdown();
    } catch (error) {
      console.warn('[SparkBroadcaster] Not initialized or already shut down');
    }

    // Shutdown HealingRecommendationEngine
    try {
      const healingEngine = getHealingRecommendationEngine();
      healingEngine.shutdown();
    } catch (error) {
      console.warn('[HealingRecommendations] Not initialized or already shut down');
    }

    // Shutdown GateCheckpoint
    try {
      const gateCheckpoint = getGateCheckpoint();
      gateCheckpoint.shutdown();
    } catch (error) {
      console.warn('[GateCheckpoint] Not initialized or already shut down');
    }

    // Stop conversation watcher
    try {
      const conversationWatcher = getConversationWatcher();
      if (conversationWatcher) {
        await conversationWatcher.stop();
      }
    } catch (error) {
      console.warn('[ConversationWatcher] Error stopping:', error);
    }

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
