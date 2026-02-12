import type { Session, Chain, CommandPayload, SessionId, ChainId, UserId, WorkspaceEvent, SessionWindowConfig, Bookmark, FrequencyRecord, DetectedPattern, ProjectId, Timestamp, BookmarkCategory, PatternType, HarmonyCheck, HarmonyMetrics, HarmonyFilter, IntelDossier, DossierHistoryEntry, SuggestionEntry, ChatMessage, FreshnessMetadata, DurationMs, TelemetryEntry, TelemetryQueryFilter, ReminderDefinition, ReminderInstance, ErrorInstance, UniverseGraph, RegionNode, LightBridge, RegionId, EdgeId } from '@afw/shared';
import type { BookmarkFilter, PatternFilter } from './index.js';
import { brandedTypes, calculateFreshnessGrade, duration, sessionSchema, chainSchema, workspaceEventSchema, validateStorageData } from '@afw/shared';
import { lifecycleManager } from './lifecycleHooks.js';

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
const MAX_REMINDER_INSTANCES = 1_000;
const MAX_ERRORS_PER_SESSION = 500;
const MAX_REGIONS = 100;
const MAX_BRIDGES = 1_000;
const MAX_EVOLUTION_TICKS = 10_000;
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

  // Reminder storage
  reminderInstances: Map<string, ReminderInstance>;
  getReminderDefinitions(): ReminderDefinition[];
  getReminderInstances(sessionId: SessionId, chainId?: ChainId): ReminderInstance[];
  addReminderInstance(instance: ReminderInstance): void;
  markReminderAddressed(instanceId: string): boolean;
  markChainRemindersAddressed(chainId: ChainId): number;
  deleteReminderInstance(instanceId: string): boolean;

  // Error storage
  errors: Map<SessionId, ErrorInstance[]>;
  addError(error: ErrorInstance): void;
  getErrors(sessionId: SessionId, filter?: { chainId?: ChainId; dismissedOnly?: boolean }): ErrorInstance[];
  dismissError(errorId: string, dismissed: boolean): boolean;
  deleteError(errorId: string): boolean;
  deleteChainErrors(chainId: ChainId): number;

  // Activity-aware TTL extension
  sessionTtlExtensions: Map<string, { expiresAt: number; extensionCount: number }>;
  extendSessionTtl(sessionId: string, extensionMs: number): void;
  getSessionTtlInfo(sessionId: string): { remainingMs: number; extensionCount: number } | null;

  // Snapshot/Restore for persistence
  snapshot(): any;
  restore(snapshot: any): void;

  // Internal eviction method
  _evictOldestCompletedSession(): void;

  // Universe graph storage
  universeGraph: UniverseGraph | undefined;
  regions: Map<RegionId, RegionNode>;
  bridges: Map<EdgeId, LightBridge>;
  sessionRegionMappings: Map<SessionId, RegionId>;
  getUniverseGraph(): UniverseGraph | undefined;
  setUniverseGraph(graph: UniverseGraph): void;
  getRegion(regionId: RegionId): RegionNode | undefined;
  setRegion(region: RegionNode): void;
  deleteRegion(regionId: RegionId): void;
  listRegions(): RegionNode[];
  getBridge(edgeId: EdgeId): LightBridge | undefined;
  setBridge(bridge: LightBridge): void;
  deleteBridge(edgeId: EdgeId): void;
  listBridges(): LightBridge[];
  getSessionRegion(sessionId: SessionId): RegionId | undefined;
  setSessionRegion(sessionId: SessionId, regionId: RegionId): void;
  deleteSessionRegion(sessionId: SessionId): void;
}

export const storage: MemoryStorage = {
  // Sessions
  sessions: new Map(),
  getSession(sessionId: SessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    // Validate session on retrieval for data integrity
    const validated = validateStorageData(session, sessionSchema, `getSession(${sessionId})`);
    return validated as Session | undefined || session;
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

    // Lifecycle hook: mark session as active
    try {
      lifecycleManager.transitionPhase('session', session.id, 'active', 'updated');
    } catch {
      // Ignore if lifecycle manager not available
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
    // Cascade delete all related data
    this.events.delete(sessionId);
    this.chains.delete(sessionId);
    this.commandsQueue.delete(sessionId);
    this.inputQueue.delete(sessionId);
    this.harmonyChecks.delete(sessionId);
    this.chatHistory.delete(sessionId);

    // Lifecycle hook: remove session from tracking
    try {
      lifecycleManager.removeResource('session', sessionId);
    } catch {
      // Ignore if lifecycle manager not available
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
    // Validate event on ingestion for data integrity
    const validated = validateStorageData(event, workspaceEventSchema, `addEvent(${sessionId})`);
    if (!validated) {
      console.warn(`[Storage] Dropping invalid event for session ${sessionId}:`, event);
      return;
    }

    const events = this.events.get(sessionId) || [];
    events.push(validated as WorkspaceEvent);
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
      if (chain) {
        // Validate chain on retrieval for data integrity
        const validated = validateStorageData(chain, chainSchema, `getChain(${chainId})`);
        return validated as Chain | undefined || chain;
      }
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
      // Lifecycle hook: notify pre-eviction
      try {
        lifecycleManager.notifyPreEviction('session', oldestId);
      } catch {
        // Ignore if lifecycle manager not available
      }

      // Use deleteSession which now handles cascade cleanup
      this.deleteSession(oldestId);

      // Lifecycle hook: mark as evicted
      try {
        lifecycleManager.transitionPhase('session', oldestId, 'evicted', 'fifo-eviction');
      } catch {
        // Ignore if lifecycle manager not available
      }
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

  // Reminder storage
  reminderInstances: new Map<string, ReminderInstance>(),

  getReminderDefinitions(): ReminderDefinition[] {
    // Fetch from registry entries with type: 'reminder'
    // Note: Registry entries are stored in registryStorage service
    // This is a placeholder that would normally query the registry
    // The actual implementation will be via the registry API
    return [];
  },

  getReminderInstances(sessionId: SessionId, chainId?: ChainId): ReminderInstance[] {
    const instances = Array.from(this.reminderInstances.values());
    return instances.filter(i => {
      if (i.sessionId !== sessionId) return false;
      if (chainId && i.chainId !== chainId) return false;
      return true;
    });
  },

  addReminderInstance(instance: ReminderInstance): void {
    // FIFO eviction at MAX_REMINDER_INSTANCES
    if (!this.reminderInstances.has(instance.id) && this.reminderInstances.size >= MAX_REMINDER_INSTANCES) {
      // Evict oldest instance
      const oldestId = Array.from(this.reminderInstances.keys())[0];
      if (oldestId) {
        this.reminderInstances.delete(oldestId);
      }
    }
    this.reminderInstances.set(instance.id, instance);
  },

  markReminderAddressed(instanceId: string): boolean {
    const instance = this.reminderInstances.get(instanceId);
    if (!instance) return false;
    instance.addressed = true;
    instance.metadata = {
      ...instance.metadata,
      addressedAt: new Date().toISOString(),
    };
    return true;
  },

  markChainRemindersAddressed(chainId: ChainId): number {
    let count = 0;
    for (const instance of this.reminderInstances.values()) {
      if (instance.chainId === chainId && !instance.addressed) {
        instance.addressed = true;
        instance.metadata = {
          ...instance.metadata,
          addressedAt: new Date().toISOString(),
        };
        count++;
      }
    }
    return count;
  },

  deleteReminderInstance(instanceId: string): boolean {
    return this.reminderInstances.delete(instanceId);
  },

  // Error storage
  errors: new Map<SessionId, ErrorInstance[]>(),

  addError(error: ErrorInstance): void {
    if (!this.errors.has(error.sessionId)) {
      this.errors.set(error.sessionId, []);
    }

    const sessionErrors = this.errors.get(error.sessionId)!;

    // FIFO eviction at MAX_ERRORS_PER_SESSION
    if (sessionErrors.length >= MAX_ERRORS_PER_SESSION) {
      sessionErrors.shift();
    }

    sessionErrors.push(error);
  },

  getErrors(sessionId: SessionId, filter?: { chainId?: ChainId; dismissedOnly?: boolean }): ErrorInstance[] {
    const sessionErrors = this.errors.get(sessionId) || [];

    return sessionErrors.filter(error => {
      if (filter?.chainId && error.chainId !== filter.chainId) return false;
      if (filter?.dismissedOnly && !error.dismissed) return false;
      return true;
    });
  },

  dismissError(errorId: string, dismissed: boolean): boolean {
    for (const sessionErrors of this.errors.values()) {
      const error = sessionErrors.find(e => e.id === errorId);
      if (error) {
        error.dismissed = dismissed;
        return true;
      }
    }
    return false;
  },

  deleteError(errorId: string): boolean {
    for (const sessionErrors of this.errors.values()) {
      const index = sessionErrors.findIndex(e => e.id === errorId);
      if (index !== -1) {
        sessionErrors.splice(index, 1);
        return true;
      }
    }
    return false;
  },

  deleteChainErrors(chainId: ChainId): number {
    let count = 0;
    for (const sessionErrors of this.errors.values()) {
      const beforeLength = sessionErrors.length;
      const filtered = sessionErrors.filter(e => e.chainId !== chainId);
      count += beforeLength - filtered.length;
      if (count > 0) {
        // Replace the array with filtered version
        sessionErrors.splice(0, sessionErrors.length, ...filtered);
      }
    }
    return count;
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

  // Universe graph storage
  universeGraph: undefined as UniverseGraph | undefined,
  regions: new Map<RegionId, RegionNode>(),
  bridges: new Map<EdgeId, LightBridge>(),
  sessionRegionMappings: new Map<SessionId, RegionId>(),

  getUniverseGraph() {
    return this.universeGraph;
  },

  setUniverseGraph(graph: UniverseGraph) {
    this.universeGraph = graph;
  },

  getRegion(regionId: RegionId) {
    return this.regions.get(regionId);
  },

  setRegion(region: RegionNode) {
    // Evict oldest region if at capacity (FIFO)
    if (this.regions.size >= MAX_REGIONS && !this.regions.has(region.id)) {
      const firstKey = this.regions.keys().next().value;
      if (firstKey) this.regions.delete(firstKey);
    }
    this.regions.set(region.id, region);
  },

  deleteRegion(regionId: RegionId) {
    this.regions.delete(regionId);
  },

  listRegions() {
    return Array.from(this.regions.values());
  },

  getBridge(edgeId: EdgeId) {
    return this.bridges.get(edgeId);
  },

  setBridge(bridge: LightBridge) {
    // Evict oldest bridge if at capacity (FIFO)
    if (this.bridges.size >= MAX_BRIDGES && !this.bridges.has(bridge.id)) {
      const firstKey = this.bridges.keys().next().value;
      if (firstKey) this.bridges.delete(firstKey);
    }
    this.bridges.set(bridge.id, bridge);
  },

  deleteBridge(edgeId: EdgeId) {
    this.bridges.delete(edgeId);
  },

  listBridges() {
    return Array.from(this.bridges.values());
  },

  getSessionRegion(sessionId: SessionId) {
    return this.sessionRegionMappings.get(sessionId);
  },

  setSessionRegion(sessionId: SessionId, regionId: RegionId) {
    this.sessionRegionMappings.set(sessionId, regionId);
  },

  deleteSessionRegion(sessionId: SessionId) {
    this.sessionRegionMappings.delete(sessionId);
  },

  // Snapshot/Restore methods for persistence
  snapshot() {
    const crypto = require('crypto');

    // Convert all Maps to serializable structures
    const data = {
      sessions: Array.from(this.sessions.entries()).map(([id, session]) => session),
      events: Object.fromEntries(
        Array.from(this.events.entries()).map(([sessionId, events]) => [sessionId, events])
      ),
      chains: Object.fromEntries(
        Array.from(this.chains.entries()).map(([sessionId, chains]) => [sessionId, chains])
      ),
      chatHistory: Object.fromEntries(
        Array.from(this.chatHistory.entries()).map(([sessionId, messages]) => [sessionId, messages])
      ),
      sessionsByUser: Object.fromEntries(
        Array.from(this.sessionsByUser.entries()).map(([userId, sessionIds]) => [userId, Array.from(sessionIds)])
      ),
      commandsQueue: Object.fromEntries(
        Array.from(this.commandsQueue.entries()).map(([sessionId, commands]) => [sessionId, commands])
      ),
      inputQueue: Object.fromEntries(
        Array.from(this.inputQueue.entries()).map(([sessionId, inputs]) => [sessionId, inputs])
      ),
      followedSessions: Array.from(this.followedSessions),
      sessionWindowConfigs: Object.fromEntries(
        Array.from(this.sessionWindowConfigs.entries()).map(([sessionId, config]) => [sessionId, config])
      ),
      frequencies: Object.fromEntries(
        Array.from(this.frequencies.entries()).map(([key, record]) => [key, record])
      ),
      bookmarks: Object.fromEntries(
        Array.from(this.bookmarks.entries()).map(([id, bookmark]) => [id, bookmark])
      ),
      patterns: Object.fromEntries(
        Array.from(this.patterns.entries()).map(([id, pattern]) => [id, pattern])
      ),
      harmonyChecks: Object.fromEntries(
        Array.from(this.harmonyChecks.entries()).map(([sessionId, checks]) => [sessionId, checks])
      ),
      harmonyChecksByProject: Object.fromEntries(
        Array.from(this.harmonyChecksByProject.entries()).map(([projectId, checks]) => [projectId, checks])
      ),
      dossiers: Object.fromEntries(
        Array.from(this.dossiers.entries()).map(([id, dossier]) => [id, dossier])
      ),
      suggestions: Object.fromEntries(
        Array.from(this.suggestions.entries()).map(([id, suggestion]) => [id, suggestion])
      ),
      telemetryEntries: this.telemetryEntries,
      reminderInstances: Object.fromEntries(
        Array.from(this.reminderInstances.entries()).map(([id, instance]) => [id, instance])
      ),
      sessionTtlExtensions: Object.fromEntries(
        Array.from(this.sessionTtlExtensions.entries()).map(([sessionId, ttlInfo]) => [sessionId, ttlInfo])
      ),
      resourceFreshness: Object.fromEntries(
        Array.from(this.resourceFreshness.entries()).map(([key, timestamp]) => [key, timestamp])
      ),
      universeGraph: this.universeGraph,
      regions: Object.fromEntries(
        Array.from(this.regions.entries()).map(([id, region]) => [id, region])
      ),
      bridges: Object.fromEntries(
        Array.from(this.bridges.entries()).map(([id, bridge]) => [id, bridge])
      ),
      sessionRegionMappings: Object.fromEntries(
        Array.from(this.sessionRegionMappings.entries()).map(([sessionId, regionId]) => [sessionId, regionId])
      ),
    };

    const timestamp = new Date().toISOString();
    const serialized = JSON.stringify(data);
    const checksum = crypto.createHash('md5').update(serialized).digest('hex');

    return {
      version: 1,
      timestamp,
      checksum,
      data,
    };
  },

  restore(snapshot: any) {
    // Validate snapshot version
    if (snapshot.version !== 1) {
      console.warn(`[MemoryStorage] Unsupported snapshot version: ${snapshot.version}. Skipping restore.`);
      return;
    }

    // Validate checksum
    const crypto = require('crypto');
    const serialized = JSON.stringify(snapshot.data);
    const computedChecksum = crypto.createHash('md5').update(serialized).digest('hex');
    if (computedChecksum !== snapshot.checksum) {
      console.warn(`[MemoryStorage] Checksum mismatch. Expected ${snapshot.checksum}, got ${computedChecksum}. Skipping restore.`);
      return;
    }

    console.log(`[MemoryStorage] Restoring snapshot from ${snapshot.timestamp}...`);

    try {
      const data = snapshot.data;

      // Clear existing data
      this.sessions.clear();
      this.events.clear();
      this.chains.clear();
      this.chatHistory.clear();
      this.sessionsByUser.clear();
      this.commandsQueue.clear();
      this.inputQueue.clear();
      this.followedSessions.clear();
      this.sessionWindowConfigs.clear();
      this.frequencies.clear();
      this.bookmarks.clear();
      this.patterns.clear();
      this.harmonyChecks.clear();
      this.harmonyChecksByProject.clear();
      this.dossiers.clear();
      this.suggestions.clear();
      this.telemetryEntries = [];
      this.reminderInstances.clear();
      this.sessionTtlExtensions.clear();

      // Restore sessions
      if (data.sessions && Array.isArray(data.sessions)) {
        for (const session of data.sessions) {
          this.sessions.set(session.id, session);
        }
        console.log(`[MemoryStorage] Restored ${data.sessions.length} sessions`);
      }

      // Restore events
      if (data.events && typeof data.events === 'object') {
        for (const [sessionId, events] of Object.entries(data.events)) {
          if (Array.isArray(events)) {
            this.events.set(sessionId as SessionId, events);
          }
        }
        console.log(`[MemoryStorage] Restored events for ${Object.keys(data.events).length} sessions`);
      }

      // Restore chains
      if (data.chains && typeof data.chains === 'object') {
        for (const [sessionId, chains] of Object.entries(data.chains)) {
          if (Array.isArray(chains)) {
            this.chains.set(sessionId as SessionId, chains);
          }
        }
        console.log(`[MemoryStorage] Restored chains for ${Object.keys(data.chains).length} sessions`);
      }

      // Restore chat history
      if (data.chatHistory && typeof data.chatHistory === 'object') {
        for (const [sessionId, messages] of Object.entries(data.chatHistory)) {
          if (Array.isArray(messages)) {
            this.chatHistory.set(sessionId as SessionId, messages);
          }
        }
        console.log(`[MemoryStorage] Restored chat history for ${Object.keys(data.chatHistory).length} sessions`);
      }

      // Restore sessionsByUser
      if (data.sessionsByUser && typeof data.sessionsByUser === 'object') {
        for (const [userId, sessionIds] of Object.entries(data.sessionsByUser)) {
          if (Array.isArray(sessionIds)) {
            this.sessionsByUser.set(userId as UserId, new Set(sessionIds as SessionId[]));
          }
        }
        console.log(`[MemoryStorage] Restored user sessions for ${Object.keys(data.sessionsByUser).length} users`);
      }

      // Restore commandsQueue
      if (data.commandsQueue && typeof data.commandsQueue === 'object') {
        for (const [sessionId, commands] of Object.entries(data.commandsQueue)) {
          if (Array.isArray(commands)) {
            this.commandsQueue.set(sessionId as SessionId, commands);
          }
        }
      }

      // Restore inputQueue
      if (data.inputQueue && typeof data.inputQueue === 'object') {
        for (const [sessionId, inputs] of Object.entries(data.inputQueue)) {
          if (Array.isArray(inputs)) {
            this.inputQueue.set(sessionId as SessionId, inputs);
          }
        }
      }

      // Restore followedSessions
      if (data.followedSessions && Array.isArray(data.followedSessions)) {
        this.followedSessions = new Set(data.followedSessions as SessionId[]);
      }

      // Restore sessionWindowConfigs
      if (data.sessionWindowConfigs && typeof data.sessionWindowConfigs === 'object') {
        for (const [sessionId, config] of Object.entries(data.sessionWindowConfigs)) {
          this.sessionWindowConfigs.set(sessionId as SessionId, config as SessionWindowConfig);
        }
      }

      // Restore frequencies
      if (data.frequencies && typeof data.frequencies === 'object') {
        for (const [key, record] of Object.entries(data.frequencies)) {
          this.frequencies.set(key, record as FrequencyRecord);
        }
      }

      // Restore bookmarks
      if (data.bookmarks && typeof data.bookmarks === 'object') {
        for (const [id, bookmark] of Object.entries(data.bookmarks)) {
          this.bookmarks.set(id, bookmark as Bookmark);
        }
      }

      // Restore patterns
      if (data.patterns && typeof data.patterns === 'object') {
        for (const [id, pattern] of Object.entries(data.patterns)) {
          this.patterns.set(id, pattern as DetectedPattern);
        }
      }

      // Restore harmonyChecks
      if (data.harmonyChecks && typeof data.harmonyChecks === 'object') {
        for (const [sessionId, checks] of Object.entries(data.harmonyChecks)) {
          if (Array.isArray(checks)) {
            this.harmonyChecks.set(sessionId as SessionId, checks);
          }
        }
      }

      // Restore harmonyChecksByProject
      if (data.harmonyChecksByProject && typeof data.harmonyChecksByProject === 'object') {
        for (const [projectId, checks] of Object.entries(data.harmonyChecksByProject)) {
          if (Array.isArray(checks)) {
            this.harmonyChecksByProject.set(projectId as ProjectId, checks);
          }
        }
      }

      // Restore dossiers
      if (data.dossiers && typeof data.dossiers === 'object') {
        for (const [id, dossier] of Object.entries(data.dossiers)) {
          this.dossiers.set(id, dossier as IntelDossier);
        }
      }

      // Restore suggestions
      if (data.suggestions && typeof data.suggestions === 'object') {
        for (const [id, suggestion] of Object.entries(data.suggestions)) {
          this.suggestions.set(id, suggestion as SuggestionEntry);
        }
      }

      // Restore telemetry
      if (data.telemetryEntries && Array.isArray(data.telemetryEntries)) {
        this.telemetryEntries = data.telemetryEntries;
      }

      // Restore reminderInstances
      if (data.reminderInstances && typeof data.reminderInstances === 'object') {
        for (const [id, instance] of Object.entries(data.reminderInstances)) {
          this.reminderInstances.set(id, instance as ReminderInstance);
        }
      }

      // Restore sessionTtlExtensions
      if (data.sessionTtlExtensions && typeof data.sessionTtlExtensions === 'object') {
        for (const [sessionId, ttlInfo] of Object.entries(data.sessionTtlExtensions)) {
          this.sessionTtlExtensions.set(sessionId, ttlInfo as { expiresAt: number; extensionCount: number });
        }
      }

      // Restore resourceFreshness
      if (data.resourceFreshness && typeof data.resourceFreshness === 'object') {
        for (const [key, timestamp] of Object.entries(data.resourceFreshness)) {
          this.resourceFreshness.set(key, timestamp as Timestamp);
        }
      }

      // Restore universe graph
      if (data.universeGraph) {
        this.universeGraph = data.universeGraph as UniverseGraph;
      }

      // Restore regions
      if (data.regions && typeof data.regions === 'object') {
        for (const [id, region] of Object.entries(data.regions)) {
          this.regions.set(id as RegionId, region as RegionNode);
        }
        console.log(`[MemoryStorage] Restored ${Object.keys(data.regions).length} regions`);
      }

      // Restore bridges
      if (data.bridges && typeof data.bridges === 'object') {
        for (const [id, bridge] of Object.entries(data.bridges)) {
          this.bridges.set(id as EdgeId, bridge as LightBridge);
        }
        console.log(`[MemoryStorage] Restored ${Object.keys(data.bridges).length} bridges`);
      }

      // Restore session-region mappings
      if (data.sessionRegionMappings && typeof data.sessionRegionMappings === 'object') {
        for (const [sessionId, regionId] of Object.entries(data.sessionRegionMappings)) {
          this.sessionRegionMappings.set(sessionId as SessionId, regionId as RegionId);
        }
      }

      console.log(`[MemoryStorage] Snapshot restore complete`);
    } catch (error) {
      console.error(`[MemoryStorage] Error restoring snapshot:`, error);
      throw error;
    }
  },
};
