import { Redis } from 'ioredis';
import type { Session, Chain, CommandPayload, SessionId, ChainId, WorkspaceEvent, SessionWindowConfig } from '@afw/shared';

/**
 * Redis storage adapter for sessions, chains, events, commands, and input
 * Enables multi-instance deployment with Pub/Sub support
 */
export interface RedisStorage {
  // Session storage
  getSession(sessionId: SessionId): Promise<Session | undefined>;
  setSession(session: Session): Promise<void>;
  deleteSession(sessionId: SessionId): Promise<void>;

  // Events storage
  addEvent(sessionId: SessionId, event: WorkspaceEvent): Promise<void>;
  getEvents(sessionId: SessionId): Promise<WorkspaceEvent[]>;
  getEventsSince(sessionId: SessionId, timestamp: string): Promise<WorkspaceEvent[]>;

  // Chains storage
  addChain(sessionId: SessionId, chain: Chain): Promise<void>;
  getChains(sessionId: SessionId): Promise<Chain[]>;
  getChain(chainId: ChainId): Promise<Chain | undefined>;

  // Commands queue per session
  queueCommand(sessionId: SessionId, command: CommandPayload): Promise<void>;
  getCommands(sessionId: SessionId): Promise<CommandPayload[]>;
  clearCommands(sessionId: SessionId): Promise<void>;

  // Input queue per session
  queueInput(sessionId: SessionId, input: unknown): Promise<void>;
  getInput(sessionId: SessionId): Promise<unknown[]>;
  clearInput(sessionId: SessionId): Promise<void>;

  // Connected WebSocket clients
  addClient(clientId: string, sessionId?: SessionId): void;
  removeClient(clientId: string): void;
  getClientsForSession(sessionId: SessionId): string[];

  // Session window storage
  followSession(sessionId: SessionId): Promise<void>;
  unfollowSession(sessionId: SessionId): Promise<void>;
  getFollowedSessions(): Promise<SessionId[]>;
  setSessionWindowConfig(sessionId: SessionId, config: SessionWindowConfig): Promise<void>;
  getSessionWindowConfig(sessionId: SessionId): Promise<SessionWindowConfig | undefined>;

  // Pub/Sub support
  subscribe(channel: string, callback: (message: string) => void): Promise<void>;
  publish(channel: string, message: string): Promise<void>;
  disconnect(): Promise<void>;
}

/**
 * Create a Redis storage instance
 */
export function createRedisStorage(redisUrl?: string, prefix?: string): RedisStorage {
  const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379';
  const keyPrefix = prefix || process.env.REDIS_PREFIX || 'afw:';

  // Redis clients for regular operations and pub/sub
  const redis = new Redis(url);
  const pubClient = new Redis(url);
  const subClient = new Redis(url);

  // In-memory client registry (not persisted, for current instance only)
  const localClients = new Map<string, SessionId | undefined>();

  // Track subscription handlers for cleanup on disconnect
  const subscriptionHandlers = new Map<string, (channel: string, message: string) => void>();

  // TTL for sessions (24 hours in seconds)
  const SESSION_TTL = 86400;
  const EVENT_TTL = 86400; // Same TTL as sessions

  const storage: RedisStorage = {
    // === Sessions ===
    async getSession(sessionId: SessionId) {
      try {
        const key = `${keyPrefix}sessions:${sessionId}`;
        const data = await redis.get(key);
        return data ? JSON.parse(data) : undefined;
      } catch (error) {
        console.error(`[Redis] Error getting session ${sessionId}:`, error);
        return undefined;
      }
    },

    async setSession(session: Session) {
      try {
        const key = `${keyPrefix}sessions:${session.id}`;
        await redis.setex(key, SESSION_TTL, JSON.stringify(session));
      } catch (error) {
        console.error(`[Redis] Error setting session ${session.id}:`, error);
      }
    },

    async deleteSession(sessionId: SessionId) {
      try {
        const key = `${keyPrefix}sessions:${sessionId}`;
        await redis.del(key);
      } catch (error) {
        console.error(`[Redis] Error deleting session ${sessionId}:`, error);
      }
    },

    // === Events ===
    async addEvent(sessionId: SessionId, event: WorkspaceEvent) {
      try {
        const key = `${keyPrefix}events:${sessionId}`;
        const eventData = JSON.stringify(event);

        // Push to Redis list
        await redis.rpush(key, eventData);
        await redis.expire(key, EVENT_TTL);

        // Publish to Pub/Sub channel for multi-instance broadcasting
        await pubClient.publish(`${keyPrefix}events`, JSON.stringify({
          sessionId,
          event,
          timestamp: new Date().toISOString(),
        }));
      } catch (error) {
        console.error(`[Redis] Error adding event for session ${sessionId}:`, error);
      }
    },

    async getEvents(sessionId: SessionId) {
      try {
        const key = `${keyPrefix}events:${sessionId}`;
        const events = await redis.lrange(key, 0, -1);
        return events.map((e: string) => JSON.parse(e) as WorkspaceEvent);
      } catch (error) {
        console.error(`[Redis] Error getting events for session ${sessionId}:`, error);
        return [];
      }
    },

    async getEventsSince(sessionId: SessionId, timestamp: string) {
      try {
        const key = `${keyPrefix}events:${sessionId}`;
        const events = await redis.lrange(key, 0, -1);
        const targetTime = new Date(timestamp).getTime();

        return events
          .map((e: string) => JSON.parse(e) as WorkspaceEvent)
          .filter((event: WorkspaceEvent) => {
            if (event?.timestamp && typeof event.timestamp === 'string') {
              return new Date(event.timestamp).getTime() >= targetTime;
            }
            return true; // Include if no timestamp for safety
          });
      } catch (error) {
        console.error(`[Redis] Error getting events since ${timestamp} for session ${sessionId}:`, error);
        return [];
      }
    },

    // === Chains ===
    async addChain(sessionId: SessionId, chain: Chain) {
      try {
        const key = `${keyPrefix}chains:${sessionId}`;
        await redis.rpush(key, JSON.stringify(chain));
        await redis.expire(key, EVENT_TTL);

        // Also store chain by ID for fast lookup
        const chainKey = `${keyPrefix}chain:${chain.id}`;
        await redis.setex(chainKey, EVENT_TTL, JSON.stringify(chain));
      } catch (error) {
        console.error(`[Redis] Error adding chain for session ${sessionId}:`, error);
      }
    },

    async getChains(sessionId: SessionId) {
      try {
        const key = `${keyPrefix}chains:${sessionId}`;
        const chains = await redis.lrange(key, 0, -1);
        return chains.map((c: string) => JSON.parse(c) as Chain);
      } catch (error) {
        console.error(`[Redis] Error getting chains for session ${sessionId}:`, error);
        return [];
      }
    },

    async getChain(chainId: ChainId) {
      try {
        const key = `${keyPrefix}chain:${chainId}`;
        const data = await redis.get(key);
        return data ? (JSON.parse(data) as Chain) : undefined;
      } catch (error) {
        console.error(`[Redis] Error getting chain ${chainId}:`, error);
        return undefined;
      }
    },

    // === Commands ===
    async queueCommand(sessionId: SessionId, command: CommandPayload) {
      try {
        const key = `${keyPrefix}commands:${sessionId}`;
        await redis.rpush(key, JSON.stringify(command));
        await redis.expire(key, 300); // 5 minute TTL for command queue
      } catch (error) {
        console.error(`[Redis] Error queuing command for session ${sessionId}:`, error);
      }
    },

    async getCommands(sessionId: SessionId) {
      try {
        const key = `${keyPrefix}commands:${sessionId}`;
        const commands = await redis.lrange(key, 0, -1);
        // Clear after fetching
        await redis.del(key);
        return commands.map((c: string) => JSON.parse(c) as CommandPayload);
      } catch (error) {
        console.error(`[Redis] Error getting commands for session ${sessionId}:`, error);
        return [];
      }
    },

    async clearCommands(sessionId: SessionId) {
      try {
        const key = `${keyPrefix}commands:${sessionId}`;
        await redis.del(key);
      } catch (error) {
        console.error(`[Redis] Error clearing commands for session ${sessionId}:`, error);
      }
    },

    // === Input ===
    async queueInput(sessionId: SessionId, input: unknown) {
      try {
        const key = `${keyPrefix}input:${sessionId}`;
        await redis.rpush(key, JSON.stringify(input));
        await redis.expire(key, 300); // 5 minute TTL for input queue
      } catch (error) {
        console.error(`[Redis] Error queuing input for session ${sessionId}:`, error);
      }
    },

    async getInput(sessionId: SessionId) {
      try {
        const key = `${keyPrefix}input:${sessionId}`;
        const inputs = await redis.lrange(key, 0, -1);
        // Clear after fetching
        await redis.del(key);
        return inputs.map((i: string) => JSON.parse(i) as unknown);
      } catch (error) {
        console.error(`[Redis] Error getting input for session ${sessionId}:`, error);
        return [];
      }
    },

    async clearInput(sessionId: SessionId) {
      try {
        const key = `${keyPrefix}input:${sessionId}`;
        await redis.del(key);
      } catch (error) {
        console.error(`[Redis] Error clearing input for session ${sessionId}:`, error);
      }
    },

    // === Clients (in-memory per instance) ===
    addClient(clientId: string, sessionId?: SessionId) {
      localClients.set(clientId, sessionId);
    },

    removeClient(clientId: string) {
      localClients.delete(clientId);
    },

    getClientsForSession(sessionId: SessionId) {
      const clients: string[] = [];
      localClients.forEach((sessionIdValue, clientId) => {
        if (sessionIdValue === sessionId) {
          clients.push(clientId);
        }
      });
      return clients;
    },

    // === Session Windows ===
    async followSession(sessionId: SessionId) {
      try {
        const key = `${keyPrefix}followed`;
        await redis.sadd(key, sessionId);
      } catch (error) {
        console.error(`[Redis] Error following session ${sessionId}:`, error);
      }
    },

    async unfollowSession(sessionId: SessionId) {
      try {
        const key = `${keyPrefix}followed`;
        const removed = await redis.srem(key, sessionId);
        // Only delete config if session was actually in the followed set
        if (removed > 0) {
          const configKey = `${keyPrefix}sw-config:${sessionId}`;
          await redis.del(configKey);
        }
      } catch (error) {
        console.error(`[Redis] Error unfollowing session ${sessionId}:`, error);
      }
    },

    async getFollowedSessions() {
      try {
        const key = `${keyPrefix}followed`;
        const sessions = await redis.smembers(key);
        return sessions as SessionId[];
      } catch (error) {
        console.error('[Redis] Error getting followed sessions:', error);
        return [];
      }
    },

    async setSessionWindowConfig(sessionId: SessionId, config: SessionWindowConfig) {
      try {
        const key = `${keyPrefix}sw-config:${sessionId}`;
        await redis.setex(key, SESSION_TTL, JSON.stringify(config));
      } catch (error) {
        console.error(`[Redis] Error setting session window config for ${sessionId}:`, error);
      }
    },

    async getSessionWindowConfig(sessionId: SessionId) {
      try {
        const key = `${keyPrefix}sw-config:${sessionId}`;
        const data = await redis.get(key);
        return data ? JSON.parse(data) as SessionWindowConfig : undefined;
      } catch (error) {
        console.error(`[Redis] Error getting session window config for ${sessionId}:`, error);
        return undefined;
      }
    },

    // === Pub/Sub ===
    async subscribe(channel: string, callback: (message: string) => void) {
      try {
        const handler = (subscribeChannel: string, message: string) => {
          if (subscribeChannel === channel) {
            callback(message);
          }
        };
        subscriptionHandlers.set(channel, handler);
        subClient.on('message', handler);
        await subClient.subscribe(channel);
        console.log(`[Redis] Subscribed to channel: ${channel}`);
      } catch (error) {
        console.error(`[Redis] Error subscribing to channel ${channel}:`, error);
      }
    },

    async publish(channel: string, message: string) {
      try {
        await pubClient.publish(channel, message);
      } catch (error) {
        console.error(`[Redis] Error publishing to channel ${channel}:`, error);
      }
    },

    async disconnect() {
      try {
        // Remove all subscription listeners before quitting
        for (const [, handler] of subscriptionHandlers) {
          subClient.removeListener('message', handler);
        }
        subscriptionHandlers.clear();

        await redis.quit();
        await pubClient.quit();
        await subClient.quit();
        console.log('[Redis] Disconnected');
      } catch (error) {
        console.error('[Redis] Error disconnecting:', error);
      }
    },
  };

  return storage;
}
