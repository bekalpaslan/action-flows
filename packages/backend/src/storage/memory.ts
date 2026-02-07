import type { Session, Chain, CommandPayload, SessionId, ChainId, UserId, WorkspaceEvent } from '@afw/shared';

/**
 * In-memory storage for sessions, chains, events, commands, and input
 * This is a temporary storage solution. Will be replaced with Redis in Step 6.
 *
 * Memory bounds are enforced to prevent unbounded growth:
 * - Max 10K events per session (FIFO eviction)
 * - Max 100 chains per session (FIFO eviction)
 * - Max 1K total sessions (evict oldest completed sessions)
 * - Max 100 input items per session queue
 */

const MAX_EVENTS_PER_SESSION = 10_000;
const MAX_CHAINS_PER_SESSION = 100;
const MAX_SESSIONS = 1_000;
const MAX_INPUT_QUEUE_PER_SESSION = 100;
export interface MemoryStorage {
  // Session storage
  sessions: Map<SessionId, Session>;
  getSession(sessionId: SessionId): Session | undefined;
  setSession(session: Session): void;
  deleteSession(sessionId: SessionId): void;

  // User session tracking
  sessionsByUser: Map<UserId, Set<SessionId>>;
  getSessionsByUser(userId: UserId): SessionId[];
  getUsersWithActiveSessions(): UserId[];

  // Events storage
  events: Map<SessionId, WorkspaceEvent[]>;
  addEvent(sessionId: SessionId, event: WorkspaceEvent): void;
  getEvents(sessionId: SessionId): WorkspaceEvent[];
  getEventsSince(sessionId: SessionId, timestamp: string): WorkspaceEvent[];

  // Chains storage
  chains: Map<SessionId, Chain[]>;
  addChain(sessionId: SessionId, chain: Chain): void;
  getChains(sessionId: SessionId): Chain[];
  getChain(chainId: ChainId): Chain | undefined;

  // Commands queue per session
  commandsQueue: Map<SessionId, CommandPayload[]>;
  queueCommand(sessionId: SessionId, command: CommandPayload): void;
  getCommands(sessionId: SessionId): CommandPayload[];
  clearCommands(sessionId: SessionId): void;

  // Input queue per session
  inputQueue: Map<SessionId, unknown[]>;
  queueInput(sessionId: SessionId, input: unknown): void;
  getInput(sessionId: SessionId): unknown[];
  clearInput(sessionId: SessionId): void;

  // Connected WebSocket clients
  clients: Set<{ clientId: string; sessionId?: SessionId }>;
  addClient(clientId: string, sessionId?: SessionId): void;
  removeClient(clientId: string): void;
  getClientsForSession(sessionId: SessionId): string[];

  // Internal eviction method
  _evictOldestCompletedSession(): void;
}

export const storage: MemoryStorage = {
  // Sessions
  sessions: new Map(),
  getSession(sessionId: SessionId) {
    return this.sessions.get(sessionId);
  },
  setSession(session: Session) {
    // If at capacity and this is a new session, evict oldest completed
    if (!this.sessions.has(session.id) && this.sessions.size >= MAX_SESSIONS) {
      this._evictOldestCompletedSession();
    }
    this.sessions.set(session.id, session);
    // Track session by user
    if (session.user) {
      const userSessions = this.sessionsByUser.get(session.user) || new Set();
      userSessions.add(session.id);
      this.sessionsByUser.set(session.user, userSessions);
    }
  },
  deleteSession(sessionId: SessionId) {
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
  getSessionsByUser(userId: UserId) {
    const sessionSet = this.sessionsByUser.get(userId);
    return sessionSet ? Array.from(sessionSet) : [];
  },
  getUsersWithActiveSessions() {
    return Array.from(this.sessionsByUser.keys());
  },

  // Events
  events: new Map(),
  addEvent(sessionId: SessionId, event: WorkspaceEvent) {
    const events = this.events.get(sessionId) || [];
    events.push(event);
    // Evict oldest if over limit (FIFO)
    if (events.length > MAX_EVENTS_PER_SESSION) {
      events.splice(0, events.length - MAX_EVENTS_PER_SESSION);
    }
    this.events.set(sessionId, events);
  },
  getEvents(sessionId: SessionId) {
    return this.events.get(sessionId) || [];
  },
  getEventsSince(sessionId: SessionId, timestamp: string) {
    const events = this.events.get(sessionId) || [];
    // Filter events since timestamp
    // Events should have a timestamp field
    return events.filter((event: WorkspaceEvent) => {
      if (event?.timestamp && typeof event.timestamp === 'string') {
        return new Date(event.timestamp) >= new Date(timestamp);
      }
      return true; // Include if no timestamp for safety
    });
  },

  // Chains
  chains: new Map(),
  addChain(sessionId: SessionId, chain: Chain) {
    const chains = this.chains.get(sessionId) || [];
    chains.push(chain);
    // Evict oldest if over limit (FIFO)
    if (chains.length > MAX_CHAINS_PER_SESSION) {
      chains.splice(0, chains.length - MAX_CHAINS_PER_SESSION);
    }
    this.chains.set(sessionId, chains);
  },
  getChains(sessionId: SessionId) {
    return this.chains.get(sessionId) || [];
  },
  getChain(chainId: ChainId) {
    for (const chainArray of this.chains.values()) {
      const chain = chainArray.find((c) => c.id === chainId);
      if (chain) return chain;
    }
    return undefined;
  },

  // Commands
  commandsQueue: new Map(),
  queueCommand(sessionId: SessionId, command: CommandPayload) {
    const commands = this.commandsQueue.get(sessionId) || [];
    commands.push(command);
    this.commandsQueue.set(sessionId, commands);
  },
  getCommands(sessionId: SessionId) {
    const commands = this.commandsQueue.get(sessionId) || [];
    // Clear commands after fetching (they're polled)
    this.commandsQueue.set(sessionId, []);
    return commands;
  },
  clearCommands(sessionId: SessionId) {
    this.commandsQueue.delete(sessionId);
  },

  // Input
  inputQueue: new Map(),
  queueInput(sessionId: SessionId, input: unknown) {
    const inputs = this.inputQueue.get(sessionId) || [];
    // Silently drop if queue is full (graceful degradation)
    if (inputs.length >= MAX_INPUT_QUEUE_PER_SESSION) {
      return;
    }
    inputs.push(input);
    this.inputQueue.set(sessionId, inputs);
  },
  getInput(sessionId: SessionId) {
    const inputs = this.inputQueue.get(sessionId) || [];
    // Clear input after fetching (they're polled)
    this.inputQueue.set(sessionId, []);
    return inputs;
  },
  clearInput(sessionId: SessionId) {
    this.inputQueue.delete(sessionId);
  },

  // Clients
  clients: new Set(),
  addClient(clientId: string, sessionId?: SessionId) {
    this.clients.add({ clientId, sessionId });
  },
  removeClient(clientId: string) {
    this.clients.forEach((client) => {
      if (client.clientId === clientId) {
        this.clients.delete(client);
      }
    });
  },
  getClientsForSession(sessionId: SessionId) {
    const clients: string[] = [];
    this.clients.forEach((client) => {
      if (client.sessionId === sessionId) {
        clients.push(client.clientId);
      }
    });
    return clients;
  },

  /**
   * Evict the oldest completed or failed session when capacity is reached
   * This is called when the session limit is exceeded
   */
  _evictOldestCompletedSession() {
    let oldestId: SessionId | undefined;
    let oldestTime = Infinity;
    for (const [id, session] of this.sessions) {
      if ((session.status === 'completed' || session.status === 'failed') && session.startedAt) {
        const time = new Date(session.startedAt).getTime();
        if (time < oldestTime) {
          oldestTime = time;
          oldestId = id;
        }
      }
    }
    if (oldestId) {
      this.deleteSession(oldestId);
      this.events.delete(oldestId);
      this.chains.delete(oldestId);
      this.commandsQueue.delete(oldestId);
      this.inputQueue.delete(oldestId);
    }
  },
};
