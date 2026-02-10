/**
 * Resilient Storage Wrapper
 *
 * Wraps primary storage (Redis) with circuit breaker protection.
 * Falls back to in-memory storage when the circuit is open.
 *
 * This prevents cascading failures when Redis is unavailable.
 */

import type { Storage } from './index.js';
import { storage as memoryStorage } from './memory.js';
import { CircuitBreaker } from '../infrastructure/circuitBreaker.js';
import { telemetry } from '../services/telemetry.js';
import type {
  Session,
  Chain,
  CommandPayload,
  SessionId,
  ChainId,
  WorkspaceEvent,
  UserId,
  SessionWindowConfig,
  Bookmark,
  FrequencyRecord,
  DetectedPattern,
  ProjectId,
  Timestamp,
  HarmonyCheck,
  HarmonyMetrics,
  HarmonyFilter,
  IntelDossier,
  DossierHistoryEntry,
  SuggestionEntry,
  ChatMessage,
  FreshnessMetadata,
  TelemetryEntry,
  TelemetryQueryFilter,
} from '@afw/shared';
import type { BookmarkFilter, PatternFilter } from './index.js';

/**
 * ResilientStorage wraps a primary storage implementation with circuit breaker protection
 */
export class ResilientStorage implements Storage {
  private circuitBreaker: CircuitBreaker<any>;
  private primaryStorage: Storage;
  private fallbackStorage: Storage;
  private usingFallback = false;

  constructor(primaryStorage: Storage, options?: { failureThreshold?: number; resetTimeout?: number }) {
    this.primaryStorage = primaryStorage;
    this.fallbackStorage = memoryStorage;

    this.circuitBreaker = new CircuitBreaker({
      name: 'storage',
      failureThreshold: options?.failureThreshold ?? 5,
      resetTimeout: options?.resetTimeout ?? 30000,
      onStateChange: (state) => {
        if (state === 'open') {
          this.usingFallback = true;
          telemetry.log('warn', 'resilientStorage', 'Falling back to in-memory storage (circuit OPEN)', {
            state,
          });
        } else if (state === 'closed') {
          this.usingFallback = false;
          telemetry.log('info', 'resilientStorage', 'Restored to primary storage (circuit CLOSED)', {
            state,
          });
        }
      },
    });

    telemetry.log('info', 'resilientStorage', 'ResilientStorage initialized with circuit breaker protection');
  }

  /**
   * Execute operation with circuit breaker protection
   */
  private async executeWithFallback<T>(
    operation: (storage: Storage) => T | Promise<T>,
    fallbackOperation?: (storage: Storage) => T | Promise<T>
  ): Promise<T> {
    return this.circuitBreaker.execute(
      () => Promise.resolve(operation(this.primaryStorage)),
      fallbackOperation
        ? () => Promise.resolve(fallbackOperation(this.fallbackStorage))
        : () => Promise.resolve(operation(this.fallbackStorage))
    );
  }

  // Session storage
  async getSession(sessionId: SessionId): Promise<Session | undefined> {
    return this.executeWithFallback((storage) => storage.getSession(sessionId));
  }

  async setSession(session: Session): Promise<void> {
    return this.executeWithFallback((storage) => storage.setSession(session));
  }

  async deleteSession(sessionId: SessionId): Promise<void> {
    return this.executeWithFallback((storage) => storage.deleteSession(sessionId));
  }

  // User session tracking
  getSessionsByUser(userId: UserId): SessionId[] {
    if (this.primaryStorage.getSessionsByUser && !this.usingFallback) {
      try {
        return this.primaryStorage.getSessionsByUser(userId);
      } catch {
        return this.fallbackStorage.getSessionsByUser?.(userId) ?? [];
      }
    }
    return this.fallbackStorage.getSessionsByUser?.(userId) ?? [];
  }

  getUsersWithActiveSessions(): UserId[] {
    if (this.primaryStorage.getUsersWithActiveSessions && !this.usingFallback) {
      try {
        return this.primaryStorage.getUsersWithActiveSessions();
      } catch {
        return this.fallbackStorage.getUsersWithActiveSessions?.() ?? [];
      }
    }
    return this.fallbackStorage.getUsersWithActiveSessions?.() ?? [];
  }

  // Events storage
  async addEvent(sessionId: SessionId, event: WorkspaceEvent): Promise<void> {
    return this.executeWithFallback((storage) => storage.addEvent(sessionId, event));
  }

  async getEvents(sessionId: SessionId): Promise<WorkspaceEvent[]> {
    return this.executeWithFallback((storage) => storage.getEvents(sessionId));
  }

  async getEventsSince(sessionId: SessionId, timestamp: string): Promise<WorkspaceEvent[]> {
    return this.executeWithFallback((storage) => storage.getEventsSince(sessionId, timestamp));
  }

  // Chains storage
  async addChain(sessionId: SessionId, chain: Chain): Promise<void> {
    return this.executeWithFallback((storage) => storage.addChain(sessionId, chain));
  }

  async getChains(sessionId: SessionId): Promise<Chain[]> {
    return this.executeWithFallback((storage) => storage.getChains(sessionId));
  }

  async getChain(chainId: ChainId): Promise<Chain | undefined> {
    return this.executeWithFallback((storage) => storage.getChain(chainId));
  }

  // Commands queue
  async queueCommand(sessionId: SessionId, command: CommandPayload): Promise<void> {
    return this.executeWithFallback((storage) => storage.queueCommand(sessionId, command));
  }

  async getCommands(sessionId: SessionId): Promise<CommandPayload[]> {
    return this.executeWithFallback((storage) => storage.getCommands(sessionId));
  }

  async clearCommands(sessionId: SessionId): Promise<void> {
    return this.executeWithFallback((storage) => storage.clearCommands(sessionId));
  }

  // Input queue
  async queueInput(sessionId: SessionId, input: unknown): Promise<void> {
    return this.executeWithFallback((storage) => storage.queueInput(sessionId, input));
  }

  async getInput(sessionId: SessionId): Promise<unknown[]> {
    return this.executeWithFallback((storage) => storage.getInput(sessionId));
  }

  async clearInput(sessionId: SessionId): Promise<void> {
    return this.executeWithFallback((storage) => storage.clearInput(sessionId));
  }

  // WebSocket clients (memory-only operations)
  addClient(clientId: string, sessionId?: SessionId): void {
    this.fallbackStorage.addClient(clientId, sessionId);
  }

  removeClient(clientId: string): void {
    this.fallbackStorage.removeClient(clientId);
  }

  getClientsForSession(sessionId: SessionId): string[] {
    return this.fallbackStorage.getClientsForSession(sessionId);
  }

  // Session window storage
  async followSession(sessionId: SessionId): Promise<void> {
    if (this.primaryStorage.followSession) {
      return this.executeWithFallback((storage) => storage.followSession?.(sessionId));
    }
  }

  async unfollowSession(sessionId: SessionId): Promise<void> {
    if (this.primaryStorage.unfollowSession) {
      return this.executeWithFallback((storage) => storage.unfollowSession?.(sessionId));
    }
  }

  async getFollowedSessions(): Promise<SessionId[]> {
    if (this.primaryStorage.getFollowedSessions) {
      return this.executeWithFallback((storage) => storage.getFollowedSessions?.() ?? Promise.resolve([]));
    }
    return [];
  }

  async setSessionWindowConfig(sessionId: SessionId, config: SessionWindowConfig): Promise<void> {
    if (this.primaryStorage.setSessionWindowConfig) {
      return this.executeWithFallback((storage) => storage.setSessionWindowConfig?.(sessionId, config));
    }
  }

  async getSessionWindowConfig(sessionId: SessionId): Promise<SessionWindowConfig | undefined> {
    if (this.primaryStorage.getSessionWindowConfig) {
      return this.executeWithFallback((storage) => storage.getSessionWindowConfig?.(sessionId));
    }
    return undefined;
  }

  // Frequency tracking
  async trackAction(actionType: string, projectId?: ProjectId, userId?: UserId): Promise<void> {
    return this.executeWithFallback((storage) => storage.trackAction(actionType, projectId, userId));
  }

  async getFrequency(actionType: string, projectId?: ProjectId): Promise<FrequencyRecord | undefined> {
    return this.executeWithFallback((storage) => storage.getFrequency(actionType, projectId));
  }

  async getTopActions(projectId: ProjectId, limit: number): Promise<FrequencyRecord[]> {
    return this.executeWithFallback((storage) => storage.getTopActions(projectId, limit));
  }

  // Bookmarks
  async addBookmark(bookmark: Bookmark): Promise<void> {
    return this.executeWithFallback((storage) => storage.addBookmark(bookmark));
  }

  async getBookmarks(projectId: ProjectId, filter?: BookmarkFilter): Promise<Bookmark[]> {
    return this.executeWithFallback((storage) => storage.getBookmarks(projectId, filter));
  }

  async removeBookmark(bookmarkId: string): Promise<void> {
    return this.executeWithFallback((storage) => storage.removeBookmark(bookmarkId));
  }

  // Patterns
  async addPattern(pattern: DetectedPattern): Promise<void> {
    return this.executeWithFallback((storage) => storage.addPattern(pattern));
  }

  async getPatterns(projectId: ProjectId, filter?: PatternFilter): Promise<DetectedPattern[]> {
    return this.executeWithFallback((storage) => storage.getPatterns(projectId, filter));
  }

  // Harmony tracking
  async addHarmonyCheck(check: HarmonyCheck): Promise<void> {
    return this.executeWithFallback((storage) => storage.addHarmonyCheck(check));
  }

  async getHarmonyChecks(
    target: SessionId | ProjectId,
    filter?: HarmonyFilter
  ): Promise<HarmonyCheck[]> {
    return this.executeWithFallback((storage) => storage.getHarmonyChecks(target, filter));
  }

  async getHarmonyMetrics(
    target: SessionId | ProjectId,
    targetType: 'session' | 'project'
  ): Promise<HarmonyMetrics> {
    return this.executeWithFallback((storage) => storage.getHarmonyMetrics(target, targetType));
  }

  // Chat history
  async getChatHistory(sessionId: SessionId): Promise<ChatMessage[]> {
    return this.executeWithFallback((storage) => storage.getChatHistory(sessionId));
  }

  async addChatMessage(sessionId: SessionId, message: ChatMessage): Promise<void> {
    return this.executeWithFallback((storage) => storage.addChatMessage(sessionId, message));
  }

  async clearChatHistory(sessionId: SessionId): Promise<void> {
    return this.executeWithFallback((storage) => storage.clearChatHistory(sessionId));
  }

  // Pub/Sub (Redis-only, best-effort)
  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    if (this.primaryStorage.subscribe) {
      try {
        return await this.primaryStorage.subscribe(channel, callback);
      } catch (error) {
        telemetry.log('warn', 'resilientStorage', 'Failed to subscribe to Redis pub/sub, continuing without it', {
          channel,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  async publish(channel: string, message: string): Promise<void> {
    if (this.primaryStorage.publish) {
      try {
        return await this.primaryStorage.publish(channel, message);
      } catch (error) {
        telemetry.log('warn', 'resilientStorage', 'Failed to publish to Redis pub/sub', {
          channel,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.primaryStorage.disconnect) {
      try {
        return await this.primaryStorage.disconnect();
      } catch (error) {
        telemetry.log('error', 'resilientStorage', 'Error disconnecting from primary storage', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  // Intel Dossier storage
  async getDossier(id: string): Promise<IntelDossier | undefined> {
    return this.executeWithFallback((storage) => storage.getDossier(id));
  }

  async setDossier(dossier: IntelDossier): Promise<void> {
    return this.executeWithFallback((storage) => storage.setDossier(dossier));
  }

  async listDossiers(): Promise<IntelDossier[]> {
    return this.executeWithFallback((storage) => storage.listDossiers());
  }

  async deleteDossier(id: string): Promise<boolean> {
    return this.executeWithFallback((storage) => storage.deleteDossier(id));
  }

  async appendDossierHistory(id: string, entry: DossierHistoryEntry): Promise<boolean> {
    return this.executeWithFallback((storage) => storage.appendDossierHistory(id, entry));
  }

  // Widget Suggestions storage
  async getSuggestion(id: string): Promise<SuggestionEntry | undefined> {
    return this.executeWithFallback((storage) => storage.getSuggestion(id));
  }

  async listSuggestions(): Promise<SuggestionEntry[]> {
    return this.executeWithFallback((storage) => storage.listSuggestions());
  }

  async addSuggestion(suggestion: SuggestionEntry): Promise<void> {
    return this.executeWithFallback((storage) => storage.addSuggestion(suggestion));
  }

  async deleteSuggestion(id: string): Promise<boolean> {
    return this.executeWithFallback((storage) => storage.deleteSuggestion(id));
  }

  async incrementSuggestionFrequency(id: string): Promise<boolean> {
    return this.executeWithFallback((storage) => storage.incrementSuggestionFrequency(id));
  }

  // Freshness tracking
  async getFreshness(
    resourceType: 'session' | 'chain' | 'events',
    resourceId: string
  ): Promise<FreshnessMetadata | null> {
    return this.executeWithFallback((storage) => storage.getFreshness(resourceType, resourceId));
  }

  async getStaleResources(
    resourceType: 'session' | 'chain' | 'events',
    staleThresholdMs: number
  ): Promise<string[]> {
    return this.executeWithFallback((storage) => storage.getStaleResources(resourceType, staleThresholdMs));
  }

  // Telemetry storage
  async addTelemetryEntry(entry: TelemetryEntry): Promise<void> {
    return this.executeWithFallback((storage) => storage.addTelemetryEntry(entry));
  }

  async queryTelemetry(filter: TelemetryQueryFilter): Promise<TelemetryEntry[]> {
    return this.executeWithFallback((storage) => storage.queryTelemetry(filter));
  }

  async getTelemetryStats(): Promise<{
    totalEntries: number;
    errorCount: number;
    bySource: Record<string, number>;
    byLevel: Record<string, number>;
  }> {
    return this.executeWithFallback((storage) => storage.getTelemetryStats());
  }

  /**
   * Get circuit breaker stats for monitoring
   */
  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats();
  }

  /**
   * Check if currently using fallback storage
   */
  isUsingFallback(): boolean {
    return this.usingFallback;
  }

  /**
   * Manually reset the circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }
}
