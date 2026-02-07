import type { WebSocket } from 'ws';
import type { SessionId } from '@afw/shared';

/**
 * Client information tracked in the registry
 */
export interface ClientInfo {
  ws: WebSocket;
  clientId: string;
  subscribedSessionIds: Set<SessionId>;
  connectedAt: number;
  lastMessageAt: number;
  messageCount: number; // For rate limiting
  messageWindowStart: number; // For rate limiting window
  apiKey?: string; // Store the API key used at handshake for per-message validation
  userId?: string; // Store userId for session ownership checks
}

const MAX_MESSAGES_PER_SECOND = 50;
const RATE_LIMIT_WINDOW_MS = 1000;

/**
 * Subscription-aware WebSocket client registry
 * Replaces the flat Set<any> with a Map<WebSocket, ClientInfo> that tracks:
 * - Per-client subscription state (which sessions each client is subscribed to)
 * - Authentication status
 * - Rate limiting metrics
 */
class ClientRegistry {
  private clients = new Map<WebSocket, ClientInfo>();

  /**
   * Register a new WebSocket client with optional API key and userId for security validation
   */
  register(ws: WebSocket, clientId: string, apiKey?: string, userId?: string): boolean {
    // Check if we would exceed max clients
    if (this.clients.size >= 1000) {
      return false; // Reject: at max capacity
    }

    this.clients.set(ws, {
      ws,
      clientId,
      subscribedSessionIds: new Set(),
      connectedAt: Date.now(),
      lastMessageAt: Date.now(),
      messageCount: 0,
      messageWindowStart: Date.now(),
      apiKey,
      userId,
    });
    return true;
  }

  /**
   * Unregister a WebSocket client
   */
  unregister(ws: WebSocket): void {
    this.clients.delete(ws);
  }

  /**
   * Subscribe a client to a session
   */
  subscribe(ws: WebSocket, sessionId: SessionId): boolean {
    const client = this.clients.get(ws);
    if (!client) return false;
    client.subscribedSessionIds.add(sessionId);
    return true;
  }

  /**
   * Unsubscribe a client from a session
   */
  unsubscribe(ws: WebSocket, sessionId: SessionId): boolean {
    const client = this.clients.get(ws);
    if (!client) return false;
    client.subscribedSessionIds.delete(sessionId);
    return true;
  }

  /**
   * Validate API key for per-message authentication
   * Returns true if the API key is still valid, false if it should be rejected
   */
  validateApiKey(ws: WebSocket, currentApiKey?: string): boolean {
    const client = this.clients.get(ws);
    if (!client) return false; // Not registered = reject

    // If an API key was set at handshake, it must still match current env value
    if (client.apiKey) {
      // If the stored key doesn't match the current env key, reject (key rotation)
      if (client.apiKey !== currentApiKey) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if a client is rate-limited
   * Returns true if the client has exceeded the rate limit
   */
  checkRateLimit(ws: WebSocket): boolean {
    const client = this.clients.get(ws);
    if (!client) return true; // Not registered = reject

    const now = Date.now();
    if (now - client.messageWindowStart > RATE_LIMIT_WINDOW_MS) {
      // Reset window
      client.messageWindowStart = now;
      client.messageCount = 1;
      return false; // Not rate-limited
    }

    client.messageCount++;
    client.lastMessageAt = now;
    return client.messageCount > MAX_MESSAGES_PER_SECOND;
  }

  /**
   * Get all WebSockets subscribed to a specific session
   */
  getSubscribersForSession(sessionId: SessionId): WebSocket[] {
    const subscribers: WebSocket[] = [];
    for (const [ws, info] of this.clients) {
      if (info.subscribedSessionIds.has(sessionId) && ws.readyState === 1) {
        subscribers.push(ws);
      }
    }
    return subscribers;
  }

  /**
   * Broadcast a message to all clients subscribed to a session
   */
  broadcastToSession(sessionId: SessionId, message: string): void {
    for (const [ws, info] of this.clients) {
      if (info.subscribedSessionIds.has(sessionId) && ws.readyState === 1) {
        ws.send(message);
      }
    }
  }

  /**
   * Broadcast a message to ALL connected clients (use sparingly)
   */
  broadcastToAll(message: string): void {
    for (const [ws] of this.clients) {
      if (ws.readyState === 1) {
        ws.send(message);
      }
    }
  }

  /**
   * Get all connected WebSocket instances (for graceful shutdown)
   */
  getAllClients(): WebSocket[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Get the total number of connected clients
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get client info for a specific WebSocket
   */
  getClientInfo(ws: WebSocket): ClientInfo | undefined {
    return this.clients.get(ws);
  }
}

export const clientRegistry = new ClientRegistry();
