import Redis from 'ioredis';
import type { Session, Chain, CommandPayload } from '@afw/shared';

/**
 * Redis storage adapter for sessions, chains, events, commands, and input
 * Enables multi-instance deployment with Pub/Sub support
 */
export interface RedisStorage {
  // Session storage
  getSession(sessionId: string): Promise<Session | undefined>;
  setSession(session: Session): Promise<void>;
  deleteSession(sessionId: string): Promise<void>;

  // Events storage
  addEvent(sessionId: string, event: unknown): Promise<void>;
  getEvents(sessionId: string): Promise<unknown[]>;
  getEventsSince(sessionId: string, timestamp: string): Promise<unknown[]>;

  // Chains storage
  addChain(sessionId: string, chain: Chain): Promise<void>;
  getChains(sessionId: string): Promise<Chain[]>;
  getChain(chainId: string): Promise<Chain | undefined>;

  // Commands queue per session
  queueCommand(sessionId: string, command: CommandPayload): Promise<void>;
  getCommands(sessionId: string): Promise<CommandPayload[]>;
  clearCommands(sessionId: string): Promise<void>;

  // Input queue per session
  queueInput(sessionId: string, input: unknown): Promise<void>;
  getInput(sessionId: string): Promise<unknown[]>;
  clearInput(sessionId: string): Promise<void>;

  // Connected WebSocket clients
  addClient(clientId: string, sessionId?: string): void;
  removeClient(clientId: string): void;
  getClientsForSession(sessionId: string): string[];

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
  const localClients = new Map<string, string | undefined>();

  // TTL for sessions (24 hours in seconds)
  const SESSION_TTL = 86400;
  const EVENT_TTL = 86400; // Same TTL as sessions

  const storage: RedisStorage = {
    // === Sessions ===
    async getSession(sessionId: string) {
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

    async deleteSession(sessionId: string) {
      try {
        const key = `${keyPrefix}sessions:${sessionId}`;
        await redis.del(key);
      } catch (error) {
        console.error(`[Redis] Error deleting session ${sessionId}:`, error);
      }
    },

    // === Events ===
    async addEvent(sessionId: string, event: unknown) {
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

    async getEvents(sessionId: string) {
      try {
        const key = `${keyPrefix}events:${sessionId}`;
        const events = await redis.lrange(key, 0, -1);
        return events.map((e) => JSON.parse(e));
      } catch (error) {
        console.error(`[Redis] Error getting events for session ${sessionId}:`, error);
        return [];
      }
    },

    async getEventsSince(sessionId: string, timestamp: string) {
      try {
        const key = `${keyPrefix}events:${sessionId}`;
        const events = await redis.lrange(key, 0, -1);
        const targetTime = new Date(timestamp).getTime();

        return events
          .map((e) => JSON.parse(e))
          .filter((event: any) => {
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
    async addChain(sessionId: string, chain: Chain) {
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

    async getChains(sessionId: string) {
      try {
        const key = `${keyPrefix}chains:${sessionId}`;
        const chains = await redis.lrange(key, 0, -1);
        return chains.map((c) => JSON.parse(c));
      } catch (error) {
        console.error(`[Redis] Error getting chains for session ${sessionId}:`, error);
        return [];
      }
    },

    async getChain(chainId: string) {
      try {
        const key = `${keyPrefix}chain:${chainId}`;
        const data = await redis.get(key);
        return data ? JSON.parse(data) : undefined;
      } catch (error) {
        console.error(`[Redis] Error getting chain ${chainId}:`, error);
        return undefined;
      }
    },

    // === Commands ===
    async queueCommand(sessionId: string, command: CommandPayload) {
      try {
        const key = `${keyPrefix}commands:${sessionId}`;
        await redis.rpush(key, JSON.stringify(command));
        await redis.expire(key, 300); // 5 minute TTL for command queue
      } catch (error) {
        console.error(`[Redis] Error queuing command for session ${sessionId}:`, error);
      }
    },

    async getCommands(sessionId: string) {
      try {
        const key = `${keyPrefix}commands:${sessionId}`;
        const commands = await redis.lrange(key, 0, -1);
        // Clear after fetching
        await redis.del(key);
        return commands.map((c) => JSON.parse(c));
      } catch (error) {
        console.error(`[Redis] Error getting commands for session ${sessionId}:`, error);
        return [];
      }
    },

    async clearCommands(sessionId: string) {
      try {
        const key = `${keyPrefix}commands:${sessionId}`;
        await redis.del(key);
      } catch (error) {
        console.error(`[Redis] Error clearing commands for session ${sessionId}:`, error);
      }
    },

    // === Input ===
    async queueInput(sessionId: string, input: unknown) {
      try {
        const key = `${keyPrefix}input:${sessionId}`;
        await redis.rpush(key, JSON.stringify(input));
        await redis.expire(key, 300); // 5 minute TTL for input queue
      } catch (error) {
        console.error(`[Redis] Error queuing input for session ${sessionId}:`, error);
      }
    },

    async getInput(sessionId: string) {
      try {
        const key = `${keyPrefix}input:${sessionId}`;
        const inputs = await redis.lrange(key, 0, -1);
        // Clear after fetching
        await redis.del(key);
        return inputs.map((i) => JSON.parse(i));
      } catch (error) {
        console.error(`[Redis] Error getting input for session ${sessionId}:`, error);
        return [];
      }
    },

    async clearInput(sessionId: string) {
      try {
        const key = `${keyPrefix}input:${sessionId}`;
        await redis.del(key);
      } catch (error) {
        console.error(`[Redis] Error clearing input for session ${sessionId}:`, error);
      }
    },

    // === Clients (in-memory per instance) ===
    addClient(clientId: string, sessionId?: string) {
      localClients.set(clientId, sessionId);
    },

    removeClient(clientId: string) {
      localClients.delete(clientId);
    },

    getClientsForSession(sessionId: string) {
      const clients: string[] = [];
      localClients.forEach((sessionIdValue, clientId) => {
        if (sessionIdValue === sessionId) {
          clients.push(clientId);
        }
      });
      return clients;
    },

    // === Pub/Sub ===
    async subscribe(channel: string, callback: (message: string) => void) {
      try {
        subClient.on('message', (subscribeChannel, message) => {
          if (subscribeChannel === channel) {
            callback(message);
          }
        });
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
