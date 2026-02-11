import type { Session, Chain, CommandPayload, SessionId, ChainId, WorkspaceEvent, UserId, SessionWindowConfig, Bookmark, FrequencyRecord, DetectedPattern, ProjectId, Timestamp, BookmarkCategory, PatternType, HarmonyCheck, HarmonyMetrics, HarmonyFilter, IntelDossier, DossierHistoryEntry, SuggestionEntry, ChatMessage, FreshnessMetadata, TelemetryEntry, TelemetryQueryFilter, ReminderDefinition, ReminderInstance, ErrorInstance, UniverseGraph, RegionNode, LightBridge, RegionId, EdgeId } from '@afw/shared';
import { storage as memoryStorage } from './memory.js';
import { createRedisStorage } from './redis.js';

/**
 * Filter options for bookmarks queries
 */
export interface BookmarkFilter {
  category?: BookmarkCategory;
  since?: Timestamp;
  userId?: UserId;
  tags?: string[];
}

/**
 * Filter options for pattern queries
 */
export interface PatternFilter {
  patternType?: PatternType;
  minConfidence?: number;
  since?: Timestamp;
}

/**
 * Unified storage interface that can use either memory or Redis backend
 * Used by all storage operations in the application
 */
export interface Storage {
  // Session storage
  sessions?: Map<SessionId, Session>; // Memory only
  getSession(sessionId: SessionId): Session | undefined | Promise<Session | undefined>;
  setSession(session: Session): void | Promise<void>;
  deleteSession(sessionId: SessionId): void | Promise<void>;

  // User session tracking (Memory only)
  sessionsByUser?: Map<UserId, Set<SessionId>>; // Memory only
  getSessionsByUser?(userId: UserId): SessionId[];
  getUsersWithActiveSessions?(): UserId[];

  // Events storage
  events?: Map<SessionId, WorkspaceEvent[]>; // Memory only
  addEvent(sessionId: SessionId, event: WorkspaceEvent): void | Promise<void>;
  getEvents(sessionId: SessionId): WorkspaceEvent[] | Promise<WorkspaceEvent[]>;
  getEventsSince(sessionId: SessionId, timestamp: string): WorkspaceEvent[] | Promise<WorkspaceEvent[]>;

  // Chains storage
  chains?: Map<SessionId, Chain[]>; // Memory only
  addChain(sessionId: SessionId, chain: Chain): void | Promise<void>;
  getChains(sessionId: SessionId): Chain[] | Promise<Chain[]>;
  getChain(chainId: ChainId): Chain | undefined | Promise<Chain | undefined>;

  // Commands queue per session
  commandsQueue?: Map<SessionId, CommandPayload[]>; // Memory only
  queueCommand(sessionId: SessionId, command: CommandPayload): void | Promise<void>;
  getCommands(sessionId: SessionId): CommandPayload[] | Promise<CommandPayload[]>;
  clearCommands(sessionId: SessionId): void | Promise<void>;

  // Input queue per session
  inputQueue?: Map<SessionId, unknown[]>; // Memory only
  queueInput(sessionId: SessionId, input: unknown): void | Promise<void>;
  getInput(sessionId: SessionId): unknown[] | Promise<unknown[]>;
  clearInput(sessionId: SessionId): void | Promise<void>;

  // Connected WebSocket clients
  clients?: Set<{ clientId: string; sessionId?: SessionId }>; // Memory only
  addClient(clientId: string, sessionId?: SessionId): void;
  removeClient(clientId: string): void;
  getClientsForSession(sessionId: SessionId): string[];

  // Session window storage
  followedSessions?: Set<SessionId>; // Memory only
  sessionWindowConfigs?: Map<SessionId, SessionWindowConfig>; // Memory only
  followSession?(sessionId: SessionId): void | Promise<void>;
  unfollowSession?(sessionId: SessionId): void | Promise<void>;
  getFollowedSessions?(): SessionId[] | Promise<SessionId[]>;
  setSessionWindowConfig?(sessionId: SessionId, config: SessionWindowConfig): void | Promise<void>;
  getSessionWindowConfig?(sessionId: SessionId): SessionWindowConfig | undefined | Promise<SessionWindowConfig | undefined>;

  // Frequency tracking
  trackAction(actionType: string, projectId?: ProjectId, userId?: UserId): void | Promise<void>;
  getFrequency(actionType: string, projectId?: ProjectId): FrequencyRecord | undefined | Promise<FrequencyRecord | undefined>;
  getTopActions(projectId: ProjectId, limit: number): FrequencyRecord[] | Promise<FrequencyRecord[]>;

  // Bookmarks
  addBookmark(bookmark: Bookmark): void | Promise<void>;
  getBookmarks(projectId: ProjectId, filter?: BookmarkFilter): Bookmark[] | Promise<Bookmark[]>;
  removeBookmark(bookmarkId: string): void | Promise<void>;

  // Patterns (detected)
  addPattern(pattern: DetectedPattern): void | Promise<void>;
  getPatterns(projectId: ProjectId, filter?: PatternFilter): DetectedPattern[] | Promise<DetectedPattern[]>;

  // Harmony tracking
  addHarmonyCheck(check: HarmonyCheck): void | Promise<void>;
  getHarmonyChecks(
    target: SessionId | ProjectId,
    filter?: HarmonyFilter
  ): HarmonyCheck[] | Promise<HarmonyCheck[]>;
  getHarmonyMetrics(
    target: SessionId | ProjectId,
    targetType: 'session' | 'project'
  ): HarmonyMetrics | Promise<HarmonyMetrics>;

  // Chat history storage
  chatHistory?: Map<SessionId, ChatMessage[]>; // Memory only
  getChatHistory(sessionId: SessionId): ChatMessage[] | Promise<ChatMessage[]>;
  addChatMessage(sessionId: SessionId, message: ChatMessage): void | Promise<void>;
  clearChatHistory(sessionId: SessionId): void | Promise<void>;

  // Pub/Sub support (Redis only)
  subscribe?(channel: string, callback: (message: string) => void): Promise<void>;
  publish?(channel: string, message: string): Promise<void>;
  disconnect?(): Promise<void>;

  // Intel Dossier storage
  getDossier(id: string): IntelDossier | undefined | Promise<IntelDossier | undefined>;
  setDossier(dossier: IntelDossier): void | Promise<void>;
  listDossiers(): IntelDossier[] | Promise<IntelDossier[]>;
  deleteDossier(id: string): boolean | Promise<boolean>;
  appendDossierHistory(id: string, entry: DossierHistoryEntry): boolean | Promise<boolean>;

  // Widget Suggestions storage
  getSuggestion(id: string): SuggestionEntry | undefined | Promise<SuggestionEntry | undefined>;
  listSuggestions(): SuggestionEntry[] | Promise<SuggestionEntry[]>;
  addSuggestion(suggestion: SuggestionEntry): void | Promise<void>;
  deleteSuggestion(id: string): boolean | Promise<boolean>;
  incrementSuggestionFrequency(id: string): boolean | Promise<boolean>;

  // Freshness tracking
  getFreshness(resourceType: 'session' | 'chain' | 'events', resourceId: string): FreshnessMetadata | null | Promise<FreshnessMetadata | null>;
  getStaleResources(resourceType: 'session' | 'chain' | 'events', staleThresholdMs: number): string[] | Promise<string[]>;

  // Telemetry storage
  telemetryEntries?: TelemetryEntry[]; // Memory only
  addTelemetryEntry(entry: TelemetryEntry): void | Promise<void>;
  queryTelemetry(filter: TelemetryQueryFilter): TelemetryEntry[] | Promise<TelemetryEntry[]>;
  getTelemetryStats(): { totalEntries: number; errorCount: number; bySource: Record<string, number>; byLevel: Record<string, number> } | Promise<{ totalEntries: number; errorCount: number; bySource: Record<string, number>; byLevel: Record<string, number> }>;

  // Reminder storage
  getReminderDefinitions(): ReminderDefinition[] | Promise<ReminderDefinition[]>;
  getReminderInstances(sessionId: SessionId, chainId?: ChainId): ReminderInstance[] | Promise<ReminderInstance[]>;
  addReminderInstance(instance: ReminderInstance): void | Promise<void>;
  markReminderAddressed(instanceId: string): boolean | Promise<boolean>;
  markChainRemindersAddressed(chainId: ChainId): number | Promise<number>;
  deleteReminderInstance(instanceId: string): boolean | Promise<boolean>;

  // Error storage
  addError(error: ErrorInstance): void | Promise<void>;
  getErrors(sessionId: SessionId, filter?: { chainId?: ChainId; dismissedOnly?: boolean }): ErrorInstance[] | Promise<ErrorInstance[]>;
  dismissError(errorId: string, dismissed: boolean): boolean | Promise<boolean>;
  deleteError(errorId: string): boolean | Promise<boolean>;
  deleteChainErrors(chainId: ChainId): number | Promise<number>;

  // Activity-aware TTL extension
  extendSessionTtl?(sessionId: string, extensionMs: number): Promise<void> | void;
  getSessionTtlInfo?(sessionId: string): Promise<{ remainingMs: number; extensionCount: number } | null> | { remainingMs: number; extensionCount: number } | null;

  // Snapshot/Restore for persistence (Memory storage only)
  snapshot?(): any;
  restore?(snapshot: any): void;

  // Universe graph storage
  getUniverseGraph(): UniverseGraph | undefined | Promise<UniverseGraph | undefined>;
  setUniverseGraph(graph: UniverseGraph): void | Promise<void>;

  // Region storage
  getRegion(regionId: RegionId): RegionNode | undefined | Promise<RegionNode | undefined>;
  setRegion(region: RegionNode): void | Promise<void>;
  deleteRegion(regionId: RegionId): void | Promise<void>;
  listRegions(): RegionNode[] | Promise<RegionNode[]>;

  // Light bridge storage
  getBridge(edgeId: EdgeId): LightBridge | undefined | Promise<LightBridge | undefined>;
  setBridge(bridge: LightBridge): void | Promise<void>;
  deleteBridge(edgeId: EdgeId): void | Promise<void>;
  listBridges(): LightBridge[] | Promise<LightBridge[]>;

  // Session-to-Region mapping
  getSessionRegion(sessionId: SessionId): RegionId | undefined | Promise<RegionId | undefined>;
  setSessionRegion(sessionId: SessionId, regionId: RegionId): void | Promise<void>;
  deleteSessionRegion(sessionId: SessionId): void | Promise<void>;
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
