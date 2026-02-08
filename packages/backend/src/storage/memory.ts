import type { Session, Chain, CommandPayload, SessionId, ChainId, UserId, WorkspaceEvent, SessionWindowConfig, Bookmark, FrequencyRecord, DetectedPattern, ProjectId, Timestamp, BookmarkCategory, PatternType } from '@afw/shared';
import type { BookmarkFilter, PatternFilter } from './index.js';

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

  // Session window storage
  followedSessions: Set<SessionId>;
  sessionWindowConfigs: Map<SessionId, SessionWindowConfig>;
  followSession(sessionId: SessionId): void;
  unfollowSession(sessionId: SessionId): void;
  getFollowedSessions(): SessionId[];
  setSessionWindowConfig(sessionId: SessionId, config: SessionWindowConfig): void;
  getSessionWindowConfig(sessionId: SessionId): SessionWindowConfig | undefined;

  // Frequency tracking
  frequencies: Map<string, FrequencyRecord>;
  trackAction(actionType: string, projectId?: ProjectId, userId?: UserId): void;
  getFrequency(actionType: string, projectId?: ProjectId): FrequencyRecord | undefined;
  getTopActions(projectId: ProjectId, limit: number): FrequencyRecord[];

  // Bookmarks
  bookmarks: Map<string, Bookmark>;
  addBookmark(bookmark: Bookmark): void;
  getBookmarks(projectId: ProjectId, filter?: BookmarkFilter): Bookmark[];
  removeBookmark(bookmarkId: string): void;

  // Patterns (detected)
  patterns: Map<string, DetectedPattern>;
  addPattern(pattern: DetectedPattern): void;
  getPatterns(projectId: ProjectId, filter?: PatternFilter): DetectedPattern[];

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

  // Session windows
  followedSessions: new Set(),
  sessionWindowConfigs: new Map(),
  followSession(sessionId: SessionId) {
    this.followedSessions.add(sessionId);
  },
  unfollowSession(sessionId: SessionId) {
    // Only delete config if session was actually followed
    if (this.followedSessions.has(sessionId)) {
      this.followedSessions.delete(sessionId);
      this.sessionWindowConfigs.delete(sessionId);
    }
  },
  getFollowedSessions() {
    return Array.from(this.followedSessions);
  },
  setSessionWindowConfig(sessionId: SessionId, config: SessionWindowConfig) {
    this.sessionWindowConfigs.set(sessionId, config);
  },
  getSessionWindowConfig(sessionId: SessionId) {
    return this.sessionWindowConfigs.get(sessionId);
  },

  // Frequency tracking
  frequencies: new Map(),
  trackAction(actionType: string, projectId?: ProjectId, userId?: UserId) {
    const key = projectId ? `${projectId}:${actionType}` : actionType;
    const now = new Date().toISOString();
    const today = now.split('T')[0]; // ISO date string (YYYY-MM-DD)

    const record = this.frequencies.get(key);
    if (record) {
      // Update existing record
      record.count++;
      record.lastSeen = now as Timestamp;
      record.dailyCounts[today] = (record.dailyCounts[today] || 0) + 1;
    } else {
      // Create new record
      const newRecord: FrequencyRecord = {
        actionType,
        projectId,
        userId,
        count: 1,
        firstSeen: now as Timestamp,
        lastSeen: now as Timestamp,
        dailyCounts: { [today]: 1 },
      };
      this.frequencies.set(key, newRecord);
    }
  },

  getFrequency(actionType: string, projectId?: ProjectId) {
    const key = projectId ? `${projectId}:${actionType}` : actionType;
    return this.frequencies.get(key);
  },

  getTopActions(projectId: ProjectId, limit: number) {
    const results: FrequencyRecord[] = [];
    this.frequencies.forEach((record) => {
      if (record.projectId === projectId) {
        results.push(record);
      }
    });
    // Sort by count descending
    results.sort((a, b) => b.count - a.count);
    return results.slice(0, limit);
  },

  // Bookmarks
  bookmarks: new Map(),
  addBookmark(bookmark: Bookmark) {
    this.bookmarks.set(bookmark.id, bookmark);
  },

  getBookmarks(projectId: ProjectId, filter?: BookmarkFilter) {
    const results: Bookmark[] = [];
    this.bookmarks.forEach((bookmark) => {
      if (bookmark.projectId !== projectId) return;

      // Apply category filter
      if (filter?.category && bookmark.category !== filter.category) return;

      // Apply userId filter
      if (filter?.userId && bookmark.userId !== filter.userId) return;

      // Apply timestamp filter (since)
      if (filter?.since) {
        const bookmarkTime = new Date(bookmark.timestamp).getTime();
        const sinceTime = new Date(filter.since).getTime();
        if (bookmarkTime < sinceTime) return;
      }

      // Apply tags filter
      if (filter?.tags && filter.tags.length > 0) {
        const hasTag = filter.tags.some((tag) => bookmark.tags.includes(tag));
        if (!hasTag) return;
      }

      results.push(bookmark);
    });
    return results;
  },

  removeBookmark(bookmarkId: string) {
    this.bookmarks.delete(bookmarkId);
  },

  // Patterns (detected)
  patterns: new Map(),
  addPattern(pattern: DetectedPattern) {
    this.patterns.set(pattern.id, pattern);
  },

  getPatterns(projectId: ProjectId, filter?: PatternFilter) {
    const results: DetectedPattern[] = [];
    this.patterns.forEach((pattern) => {
      if (pattern.projectId !== projectId) return;

      // Apply pattern type filter
      if (filter?.patternType && pattern.patternType !== filter.patternType) return;

      // Apply confidence filter
      if (filter?.minConfidence !== undefined && pattern.confidence < filter.minConfidence) return;

      // Apply timestamp filter (since)
      if (filter?.since) {
        const patternTime = new Date(pattern.detectedAt).getTime();
        const sinceTime = new Date(filter.since).getTime();
        if (patternTime < sinceTime) return;
      }

      results.push(pattern);
    });
    return results;
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
