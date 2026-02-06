import type { Session, Chain, CommandPayload } from '@afw/shared';
import { storage as memoryStorage } from './memory';
import { createRedisStorage } from './redis';

/**
 * Unified storage interface that can use either memory or Redis backend
 * Used by all storage operations in the application
 */
export interface Storage {
  // Session storage
  sessions?: Map<string, Session>; // Memory only
  getSession(sessionId: string): Session | undefined | Promise<Session | undefined>;
  setSession(session: Session): void | Promise<void>;
  deleteSession(sessionId: string): void | Promise<void>;

  // Events storage
  events?: Map<string, unknown[]>; // Memory only
  addEvent(sessionId: string, event: unknown): void | Promise<void>;
  getEvents(sessionId: string): unknown[] | Promise<unknown[]>;
  getEventsSince(sessionId: string, timestamp: string): unknown[] | Promise<unknown[]>;

  // Chains storage
  chains?: Map<string, Chain[]>; // Memory only
  addChain(sessionId: string, chain: Chain): void | Promise<void>;
  getChains(sessionId: string): Chain[] | Promise<Chain[]>;
  getChain(chainId: string): Chain | undefined | Promise<Chain | undefined>;

  // Commands queue per session
  commandsQueue?: Map<string, CommandPayload[]>; // Memory only
  queueCommand(sessionId: string, command: CommandPayload): void | Promise<void>;
  getCommands(sessionId: string): CommandPayload[] | Promise<CommandPayload[]>;
  clearCommands(sessionId: string): void | Promise<void>;

  // Input queue per session
  inputQueue?: Map<string, unknown[]>; // Memory only
  queueInput(sessionId: string, input: unknown): void | Promise<void>;
  getInput(sessionId: string): unknown[] | Promise<unknown[]>;
  clearInput(sessionId: string): void | Promise<void>;

  // Connected WebSocket clients
  clients?: Set<{ clientId: string; sessionId?: string }>; // Memory only
  addClient(clientId: string, sessionId?: string): void;
  removeClient(clientId: string): void;
  getClientsForSession(sessionId: string): string[];

  // Pub/Sub support (Redis only)
  subscribe?(channel: string, callback: (message: string) => void): Promise<void>;
  publish?(channel: string, message: string): Promise<void>;
  disconnect?(): Promise<void>;
}

/**
 * Create a storage instance based on environment configuration
 * Uses Redis if REDIS_URL is set, otherwise uses in-memory storage
 */
export function createStorage(): Storage {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    console.log('[Storage] Using Redis backend');
    return createRedisStorage(redisUrl, process.env.REDIS_PREFIX);
  }

  console.log('[Storage] Using in-memory backend');
  return memoryStorage;
}

/**
 * Default storage instance - use this everywhere in the app
 */
export const storage = createStorage();

/**
 * Helper to check if storage is async (Redis) or sync (Memory)
 */
export function isAsyncStorage(storageInstance: Storage): boolean {
  return !('sessions' in storageInstance);
}

export type { Storage };
