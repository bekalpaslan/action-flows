import type { Session, Chain, CommandPayload } from '@afw/shared';
import { brandedTypes } from '@afw/shared';

/**
 * In-memory storage for sessions, chains, events, commands, and input
 * This is a temporary storage solution. Will be replaced with Redis in Step 6.
 */
export interface MemoryStorage {
  // Session storage
  sessions: Map<string, Session>;
  getSession(sessionId: string): Session | undefined;
  setSession(session: Session): void;
  deleteSession(sessionId: string): void;

  // User session tracking
  sessionsByUser: Map<string, Set<string>>;
  getSessionsByUser(userId: string): string[];
  getUsersWithActiveSessions(): string[];

  // Events storage
  events: Map<string, unknown[]>;
  addEvent(sessionId: string, event: unknown): void;
  getEvents(sessionId: string): unknown[];
  getEventsSince(sessionId: string, timestamp: string): unknown[];

  // Chains storage
  chains: Map<string, Chain[]>;
  addChain(sessionId: string, chain: Chain): void;
  getChains(sessionId: string): Chain[];
  getChain(chainId: string): Chain | undefined;

  // Commands queue per session
  commandsQueue: Map<string, CommandPayload[]>;
  queueCommand(sessionId: string, command: CommandPayload): void;
  getCommands(sessionId: string): CommandPayload[];
  clearCommands(sessionId: string): void;

  // Input queue per session
  inputQueue: Map<string, unknown[]>;
  queueInput(sessionId: string, input: unknown): void;
  getInput(sessionId: string): unknown[];
  clearInput(sessionId: string): void;

  // Connected WebSocket clients
  clients: Set<{ clientId: string; sessionId?: string }>;
  addClient(clientId: string, sessionId?: string): void;
  removeClient(clientId: string): void;
  getClientsForSession(sessionId: string): string[];
}

export const storage: MemoryStorage = {
  // Sessions
  sessions: new Map(),
  getSession(sessionId: string) {
    return this.sessions.get(sessionId);
  },
  setSession(session: Session) {
    this.sessions.set(session.id, session);
    // Track session by user
    if (session.user) {
      const userSessions = this.sessionsByUser.get(session.user) || new Set();
      userSessions.add(session.id);
      this.sessionsByUser.set(session.user, userSessions);
    }
  },
  deleteSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    this.sessions.delete(sessionId);
    // Remove from user tracking
    if (session?.user) {
      const userSessions = this.sessionsByUser.get(session.user);
      if (userSessions) {
        userSessions.delete(sessionId);
        if (userSessions.size === 0) {
          this.sessionsByUser.delete(session.user);
        }
      }
    }
  },

  // User session tracking
  sessionsByUser: new Map(),
  getSessionsByUser(userId: string) {
    const sessionSet = this.sessionsByUser.get(userId);
    return sessionSet ? Array.from(sessionSet) : [];
  },
  getUsersWithActiveSessions() {
    return Array.from(this.sessionsByUser.keys());
  },

  // Events
  events: new Map(),
  addEvent(sessionId: string, event: unknown) {
    const events = this.events.get(sessionId) || [];
    events.push(event);
    this.events.set(sessionId, events);
  },
  getEvents(sessionId: string) {
    return this.events.get(sessionId) || [];
  },
  getEventsSince(sessionId: string, timestamp: string) {
    const events = this.events.get(sessionId) || [];
    // Filter events since timestamp
    // Events should have a timestamp field
    return events.filter((event: any) => {
      if (event?.timestamp && typeof event.timestamp === 'string') {
        return new Date(event.timestamp) >= new Date(timestamp);
      }
      return true; // Include if no timestamp for safety
    });
  },

  // Chains
  chains: new Map(),
  addChain(sessionId: string, chain: Chain) {
    const chains = this.chains.get(sessionId) || [];
    chains.push(chain);
    this.chains.set(sessionId, chains);
  },
  getChains(sessionId: string) {
    return this.chains.get(sessionId) || [];
  },
  getChain(chainId: string) {
    for (const chainArray of this.chains.values()) {
      const chain = chainArray.find((c) => c.id === chainId);
      if (chain) return chain;
    }
    return undefined;
  },

  // Commands
  commandsQueue: new Map(),
  queueCommand(sessionId: string, command: CommandPayload) {
    const commands = this.commandsQueue.get(sessionId) || [];
    commands.push(command);
    this.commandsQueue.set(sessionId, commands);
  },
  getCommands(sessionId: string) {
    const commands = this.commandsQueue.get(sessionId) || [];
    // Clear commands after fetching (they're polled)
    this.commandsQueue.set(sessionId, []);
    return commands;
  },
  clearCommands(sessionId: string) {
    this.commandsQueue.delete(sessionId);
  },

  // Input
  inputQueue: new Map(),
  queueInput(sessionId: string, input: unknown) {
    const inputs = this.inputQueue.get(sessionId) || [];
    inputs.push(input);
    this.inputQueue.set(sessionId, inputs);
  },
  getInput(sessionId: string) {
    const inputs = this.inputQueue.get(sessionId) || [];
    // Clear input after fetching (they're polled)
    this.inputQueue.set(sessionId, []);
    return inputs;
  },
  clearInput(sessionId: string) {
    this.inputQueue.delete(sessionId);
  },

  // Clients
  clients: new Set(),
  addClient(clientId: string, sessionId?: string) {
    this.clients.add({ clientId, sessionId });
  },
  removeClient(clientId: string) {
    this.clients.forEach((client) => {
      if (client.clientId === clientId) {
        this.clients.delete(client);
      }
    });
  },
  getClientsForSession(sessionId: string) {
    const clients: string[] = [];
    this.clients.forEach((client) => {
      if (client.sessionId === sessionId) {
        clients.push(client.clientId);
      }
    });
    return clients;
  },
};
