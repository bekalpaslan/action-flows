import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import type { Socket } from 'net';

import { storage, isAsyncStorage } from './storage';
import { handleWebSocket } from './ws/handler';
import eventsRouter from './routes/events';
import sessionsRouter from './routes/sessions';
import commandsRouter from './routes/commands';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for Electron app
  credentials: true,
}));
app.use(express.json());

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

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Store connected WebSocket clients for Redis pub/sub broadcasting
const wsConnectedClients = new Set<any>();

// Handle WebSocket upgrade
server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
  if (request.url === '/ws') {
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

  wsConnectedClients.add(ws);

  handleWebSocket(ws, clientId, storage);

  ws.on('close', () => {
    console.log(`[WS] Client disconnected: ${clientId}`);
    wsConnectedClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error(`[WS] Error for client ${clientId}:`, error);
    wsConnectedClients.delete(ws);
  });
});

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

          wsConnectedClients.forEach((client) => {
            if (client.readyState === 1) { // 1 = OPEN
              client.send(broadcastMessage);
            }
          });
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
if (import.meta.url === `file://${process.argv[1]}`) {
  server.listen(PORT, async () => {
    // Initialize Redis Pub/Sub after server starts
    await initializeRedisPubSub();

    console.log(`
╔════════════════════════════════════════════╗
║   ActionFlows Backend Server Running      ║
║   API: http://localhost:${PORT}             ║
║   WS:  ws://localhost:${PORT}/ws           ║
║   Storage: ${isAsyncStorage(storage) ? 'Redis' : 'Memory'}             ║
╚════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  async function gracefulShutdown() {
    console.log('[Server] Shutting down gracefully...');

    // Close WebSocket connections
    wsConnectedClients.forEach((client) => {
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
