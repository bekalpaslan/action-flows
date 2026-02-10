import type { Session, Chain, CommandPayload, SessionId, ChainId, UserId, WorkspaceEvent, SessionWindowConfig, Bookmark, FrequencyRecord, DetectedPattern, ProjectId, Timestamp, BookmarkCategory, PatternType, HarmonyCheck, HarmonyMetrics, HarmonyFilter, IntelDossier, DossierHistoryEntry, SuggestionEntry, ChatMessage, FreshnessMetadata, DurationMs, TelemetryEntry, TelemetryQueryFilter } from '@afw/shared';
import type { BookmarkFilter, PatternFilter } from './index.js';
import { brandedTypes, calculateFreshnessGrade, duration } from '@afw/shared';

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
const MAX_DOSSIERS = 100;
const MAX_DOSSIER_HISTORY = 50;
const MAX_SUGGESTIONS = 500;
const MAX_CHAT_MESSAGES_PER_SESSION = 1_000;
const MAX_TELEMETRY_ENTRIES = 10_000;
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

  // Harmony tracking
  harmonyChecks: Map<SessionId, HarmonyCheck[]>;
  harmonyChecksByProject: Map<ProjectId, HarmonyCheck[]>;
  addHarmonyCheck(check: HarmonyCheck): void;
  getHarmonyChecks(target: SessionId | ProjectId, filter?: HarmonyFilter): HarmonyCheck[];
  getHarmonyMetrics(target: SessionId | ProjectId, targetType: 'session' | 'project'): HarmonyMetrics;

  // Intel Dossier storage
  dossiers: Map<string, IntelDossier>;
  getDossier(id: string): IntelDossier | undefined;
  setDossier(dossier: IntelDossier): void;
  listDossiers(): IntelDossier[];
  deleteDossier(id: string): boolean;
  appendDossierHistory(id: string, entry: DossierHistoryEntry): boolean;

  // Widget Suggestions storage
  suggestions: Map<string, SuggestionEntry>;
  getSuggestion(id: string): SuggestionEntry | undefined;
  listSuggestions(): SuggestionEntry[];
  addSuggestion(suggestion: SuggestionEntry): void;
  deleteSuggestion(id: string): boolean;
  incrementSuggestionFrequency(id: string): boolean;

  // Chat history storage
  chatHistory: Map<SessionId, ChatMessage[]>;
  getChatHistory(sessionId: SessionId): ChatMessage[];
  addChatMessage(sessionId: SessionId, message: ChatMessage): void;
  clearChatHistory(sessionId: SessionId): void;

  // Freshness tracking
  resourceFreshness: Map<string, Timestamp>;
  getFreshness(resourceType: 'session' | 'chain' | 'events', resourceId: string): FreshnessMetadata | null;
  getStaleResources(resourceType: 'session' | 'chain' | 'events', staleThresholdMs: number): string[];
  _updateFreshness(resourceType: 'session' | 'chain' | 'events', resourceId: string): void;

  // Telemetry storage
  telemetryEntries: TelemetryEntry[];
  addTelemetryEntry(entry: TelemetryEntry): void;
  queryTelemetry(filter: TelemetryQueryFilter): TelemetryEntry[];
  getTelemetryStats(): { totalEntries: number; errorCount: number; bySource: Record<string, number>; byLevel: Record<string, number> };

  // Activity-aware TTL extension
  sessionTtlExtensions: Map<string, { expiresAt: number; extensionCount: number }>;
  extendSessionTtl(sessionId: string, extensionMs: number): void;
  getSessionTtlInfo(sessionId: string): { remainingMs: number; extensionCount: number } | null;

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
    // Update freshness
    this._updateFreshness('session', session.id);
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
    // Cascade delete all related data
    this.events.delete(sessionId);
    this.chains.delete(sessionId);
    this.commandsQueue.delete(sessionId);
    this.inputQueue.delete(sessionId);
    this.harmonyChecks.delete(sessionId);
    this.chatHistory.delete(sessionId);
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
    // Update freshness
    this._updateFreshness('events', sessionId);
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
    // Update freshness for both chain and its session
    this._updateFreshness('chain', chain.id);
    this._updateFreshness('session', sessionId);
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

  // Harmony tracking
  harmonyChecks: new Map(),
  harmonyChecksByProject: new Map(),

  addHarmonyCheck(check: HarmonyCheck) {
    // Add to session checks
    const sessionChecks = this.harmonyChecks.get(check.sessionId) || [];
    sessionChecks.push(check);
    this.harmonyChecks.set(check.sessionId, sessionChecks);

    // Add to project checks if projectId is present
    if (check.projectId) {
      const projectChecks = this.harmonyChecksByProject.get(check.projectId) || [];
      projectChecks.push(check);
      this.harmonyChecksByProject.set(check.projectId, projectChecks);
    }

    // Limit storage per session (keep last 100 checks)
    if (sessionChecks.length > 100) {
      sessionChecks.shift(); // Remove oldest
    }
  },

  getHarmonyChecks(target: SessionId | ProjectId, filter?: HarmonyFilter) {
    // Determine if target is session or project (check if it starts with 'sess_' or 'proj_')
    const isSession = target.toString().startsWith('sess') || target.toString().startsWith('session');
    const checks = isSession
      ? this.harmonyChecks.get(target as SessionId) || []
      : this.harmonyChecksByProject.get(target as ProjectId) || [];

    // Apply filters
    let filtered = [...checks]; // Create a copy

    if (filter?.result) {
      filtered = filtered.filter(c => c.result === filter.result);
    }

    if (filter?.formatType) {
      filtered = filtered.filter(c => c.parsedFormat === filter.formatType);
    }

    if (filter?.since) {
      filtered = filtered.filter(c => c.timestamp >= filter.since!);
    }

    if (filter?.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  },

  getHarmonyMetrics(target: SessionId | ProjectId, targetType: 'session' | 'project') {
    const checks = this.getHarmonyChecks(target, {});

    if (checks.length === 0) {
      return {
        totalChecks: 0,
        validCount: 0,
        degradedCount: 0,
        violationCount: 0,
        harmonyPercentage: 100,
        recentViolations: [],
        formatBreakdown: {},
        lastCheck: brandedTypes.currentTimestamp(),
      };
    }

    // Calculate counts
    const validCount = checks.filter(c => c.result === 'valid').length;
    const degradedCount = checks.filter(c => c.result === 'degraded').length;
    const violationCount = checks.filter(c => c.result === 'violation').length;

    // Calculate harmony percentage
    const harmonyPercentage = ((validCount + degradedCount) / checks.length) * 100;

    // Get recent violations
    const recentViolations = checks
      .filter(c => c.result === 'violation')
      .slice(-10);

    // Calculate format breakdown
    const formatBreakdown: Record<string, number> = {};
    for (const check of checks) {
      const format = check.parsedFormat || 'Unknown';
      formatBreakdown[format] = (formatBreakdown[format] || 0) + 1;
    }

    // Get last check timestamp
    const lastCheck = checks[checks.length - 1].timestamp;

    return {
      totalChecks: checks.length,
      validCount,
      degradedCount,
      violationCount,
      harmonyPercentage,
      recentViolations,
      formatBreakdown,
      lastCheck,
    };
  },

  // Chat history storage
  chatHistory: new Map(),

  getChatHistory(sessionId: SessionId) {
    return this.chatHistory.get(sessionId) || [];
  },

  addChatMessage(sessionId: SessionId, message: ChatMessage) {
    const messages = this.chatHistory.get(sessionId) || [];
    messages.push(message);
    // Evict oldest if over limit (FIFO)
    if (messages.length > MAX_CHAT_MESSAGES_PER_SESSION) {
      messages.splice(0, messages.length - MAX_CHAT_MESSAGES_PER_SESSION);
    }
    this.chatHistory.set(sessionId, messages);
    // Update freshness
    this._updateFreshness('session', sessionId);
  },

  clearChatHistory(sessionId: SessionId) {
    this.chatHistory.delete(sessionId);
  },

  // Freshness tracking
  resourceFreshness: new Map(),

  _updateFreshness(resourceType: 'session' | 'chain' | 'events', resourceId: string) {
    const key = `${resourceType}:${resourceId}`;
    const now = brandedTypes.currentTimestamp();
    this.resourceFreshness.set(key, now);
  },

  getFreshness(resourceType: 'session' | 'chain' | 'events', resourceId: string): FreshnessMetadata | null {
    const key = `${resourceType}:${resourceId}`;
    const lastModifiedAt = this.resourceFreshness.get(key);

    if (!lastModifiedAt) {
      return null;
    }

    const now = Date.now();
    const modifiedTime = new Date(lastModifiedAt).getTime();
    const ageMs = duration.ms(now - modifiedTime);
    const freshnessGrade = calculateFreshnessGrade(lastModifiedAt);

    return {
      lastModifiedAt,
      lastAccessedAt: brandedTypes.currentTimestamp(),
      freshnessGrade,
      ageMs,
    };
  },

  getStaleResources(resourceType: 'session' | 'chain' | 'events', staleThresholdMs: number): string[] {
    const staleResources: string[] = [];
    const now = Date.now();
    const prefix = `${resourceType}:`;

    for (const [key, timestamp] of this.resourceFreshness.entries()) {
      if (key.startsWith(prefix)) {
        const modifiedTime = new Date(timestamp).getTime();
        const ageMs = now - modifiedTime;

        if (ageMs > staleThresholdMs) {
          // Extract resource ID from key (remove prefix)
          const resourceId = key.substring(prefix.length);
          staleResources.push(resourceId);
        }
      }
    }

    return staleResources;
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
      // Use deleteSession which now handles cascade cleanup
      this.deleteSession(oldestId);
    }
  },

  // Intel Dossier storage
  dossiers: new Map(),

  getDossier(id: string) {
    return this.dossiers.get(id);
  },

  setDossier(dossier: IntelDossier) {
    // Enforce max dossiers limit
    if (!this.dossiers.has(dossier.id) && this.dossiers.size >= MAX_DOSSIERS) {
      // Evict oldest dossier by createdAt
      let oldestId: string | undefined;
      let oldestTime = Infinity;
      for (const [id, d] of this.dossiers) {
        const time = new Date(d.createdAt).getTime();
        if (time < oldestTime) {
          oldestTime = time;
          oldestId = id;
        }
      }
      if (oldestId) {
        this.dossiers.delete(oldestId);
      }
    }
    this.dossiers.set(dossier.id, dossier);
  },

  listDossiers() {
    return Array.from(this.dossiers.values());
  },

  deleteDossier(id: string) {
    return this.dossiers.delete(id);
  },

  appendDossierHistory(id: string, entry: DossierHistoryEntry) {
    const dossier = this.dossiers.get(id);
    if (!dossier) {
      return false;
    }

    dossier.history.push(entry);

    // Enforce max history limit (FIFO eviction)
    if (dossier.history.length > MAX_DOSSIER_HISTORY) {
      dossier.history.splice(0, dossier.history.length - MAX_DOSSIER_HISTORY);
    }

    return true;
  },

  // Widget Suggestions storage
  suggestions: new Map(),

  getSuggestion(id: string) {
    return this.suggestions.get(id);
  },

  listSuggestions() {
    return Array.from(this.suggestions.values());
  },

  addSuggestion(suggestion: SuggestionEntry) {
    // Enforce max suggestions limit
    if (!this.suggestions.has(suggestion.id) && this.suggestions.size >= MAX_SUGGESTIONS) {
      // Evict least frequent suggestion (lowest frequency, oldest timestamp as tiebreaker)
      let evictId: string | undefined;
      let minFrequency = Infinity;
      let oldestTime = Infinity;

      for (const [id, s] of this.suggestions) {
        if (s.frequency < minFrequency || (s.frequency === minFrequency && new Date(s.timestamp).getTime() < oldestTime)) {
          minFrequency = s.frequency;
          oldestTime = new Date(s.timestamp).getTime();
          evictId = id;
        }
      }

      if (evictId) {
        this.suggestions.delete(evictId);
      }
    }
    this.suggestions.set(suggestion.id, suggestion);
  },

  deleteSuggestion(id: string) {
    return this.suggestions.delete(id);
  },

  incrementSuggestionFrequency(id: string) {
    const suggestion = this.suggestions.get(id);
    if (!suggestion) {
      return false;
    }
    suggestion.frequency++;
    return true;
  },

  // Telemetry storage
  telemetryEntries: [],
  addTelemetryEntry(entry: TelemetryEntry) {
    this.telemetryEntries.push(entry);
    // FIFO eviction at MAX_TELEMETRY_ENTRIES
    if (this.telemetryEntries.length > MAX_TELEMETRY_ENTRIES) {
      this.telemetryEntries.shift();
    }
  },

  queryTelemetry(filter: TelemetryQueryFilter = {}) {
    let results = this.telemetryEntries;

    // Filter by level
    if (filter.level) {
      results = results.filter(e => e.level === filter.level);
    }

    // Filter by source
    if (filter.source) {
      results = results.filter(e => e.source === filter.source);
    }

    // Filter by sessionId
    if (filter.sessionId) {
      results = results.filter(e => e.sessionId === filter.sessionId);
    }

    // Filter by time range
    if (filter.fromTimestamp) {
      const fromTime = new Date(filter.fromTimestamp).getTime();
      results = results.filter(e => new Date(e.timestamp).getTime() >= fromTime);
    }

    if (filter.toTimestamp) {
      const toTime = new Date(filter.toTimestamp).getTime();
      results = results.filter(e => new Date(e.timestamp).getTime() <= toTime);
    }

    // Apply limit (most recent first)
    if (filter.limit && filter.limit > 0) {
      results = results.slice(-filter.limit);
    }

    return results;
  },

  getTelemetryStats() {
    const bySource: Record<string, number> = {};
    const byLevel: Record<string, number> = {};
    let errorCount = 0;

    for (const entry of this.telemetryEntries) {
      // Count by source
      bySource[entry.source] = (bySource[entry.source] || 0) + 1;

      // Count by level
      byLevel[entry.level] = (byLevel[entry.level] || 0) + 1;

      // Count errors
      if (entry.level === 'error') {
        errorCount++;
      }
    }

    return {
      totalEntries: this.telemetryEntries.length,
      errorCount,
      bySource,
      byLevel,
    };
  },

  // Activity-aware TTL extension
  sessionTtlExtensions: new Map(),

  extendSessionTtl(sessionId: string, extensionMs: number) {
    const now = Date.now();
    const existing = this.sessionTtlExtensions.get(sessionId);

    if (existing) {
      // Extend existing TTL
      existing.expiresAt = now + extensionMs;
      existing.extensionCount += 1;
    } else {
      // Initialize TTL tracking (24h initial + extension)
      const initialTtl = 24 * 60 * 60 * 1000; // 24 hours
      this.sessionTtlExtensions.set(sessionId, {
        expiresAt: now + initialTtl + extensionMs,
        extensionCount: 1,
      });
    }
  },

  getSessionTtlInfo(sessionId: string) {
    const now = Date.now();
    const ttlInfo = this.sessionTtlExtensions.get(sessionId);

    if (!ttlInfo) {
      // No TTL info tracked - return default (assume fresh session)
      return {
        remainingMs: 24 * 60 * 60 * 1000, // 24 hours default
        extensionCount: 0,
      };
    }

    const remainingMs = Math.max(0, ttlInfo.expiresAt - now);
    return {
      remainingMs,
      extensionCount: ttlInfo.extensionCount,
    };
  },
};
