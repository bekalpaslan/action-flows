import { Redis } from 'ioredis';
import type { Session, Chain, CommandPayload, SessionId, ChainId, WorkspaceEvent, SessionWindowConfig, Bookmark, FrequencyRecord, DetectedPattern, ProjectId, Timestamp, UserId, HarmonyCheck, HarmonyMetrics, HarmonyFilter, IntelDossier, DossierHistoryEntry, SuggestionEntry, ChatMessage } from '@afw/shared';
import type { BookmarkFilter, PatternFilter } from './index.js';
import { brandedTypes } from '@afw/shared';

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

  // Frequency tracking
  trackAction(actionType: string, projectId?: ProjectId, userId?: UserId): Promise<void>;
  getFrequency(actionType: string, projectId?: ProjectId): Promise<FrequencyRecord | undefined>;
  getTopActions(projectId: ProjectId, limit: number): Promise<FrequencyRecord[]>;

  // Bookmarks
  addBookmark(bookmark: Bookmark): Promise<void>;
  getBookmarks(projectId: ProjectId, filter?: BookmarkFilter): Promise<Bookmark[]>;
  removeBookmark(bookmarkId: string): Promise<void>;

  // Patterns (detected)
  addPattern(pattern: DetectedPattern): Promise<void>;
  getPatterns(projectId: ProjectId, filter?: PatternFilter): Promise<DetectedPattern[]>;

  // Harmony tracking
  addHarmonyCheck(check: HarmonyCheck): Promise<void>;
  getHarmonyChecks(target: SessionId | ProjectId, filter?: HarmonyFilter): Promise<HarmonyCheck[]>;
  getHarmonyMetrics(target: SessionId | ProjectId, targetType: 'session' | 'project'): Promise<HarmonyMetrics>;

  // Intel Dossier storage
  getDossier(id: string): Promise<IntelDossier | undefined>;
  setDossier(dossier: IntelDossier): Promise<void>;
  listDossiers(): Promise<IntelDossier[]>;
  deleteDossier(id: string): Promise<boolean>;
  appendDossierHistory(id: string, entry: DossierHistoryEntry): Promise<boolean>;

  // Widget Suggestions storage
  getSuggestion(id: string): Promise<SuggestionEntry | undefined>;
  listSuggestions(): Promise<SuggestionEntry[]>;
  addSuggestion(suggestion: SuggestionEntry): Promise<void>;
  deleteSuggestion(id: string): Promise<boolean>;
  incrementSuggestionFrequency(id: string): Promise<boolean>;

  // Chat history storage
  getChatHistory(sessionId: SessionId): Promise<ChatMessage[]>;
  addChatMessage(sessionId: SessionId, message: ChatMessage): Promise<void>;
  clearChatHistory(sessionId: SessionId): Promise<void>;

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

    // === Frequency Tracking ===
    async trackAction(actionType: string, projectId?: ProjectId, userId?: UserId) {
      try {
        const key = `${keyPrefix}freq:${projectId ? `${projectId}:` : ''}${actionType}`;
        const now = new Date().toISOString();
        const today = now.split('T')[0]; // ISO date string (YYYY-MM-DD)

        // Get existing record or create new one
        const existing = await redis.get(key);
        let record: FrequencyRecord;

        if (existing) {
          record = JSON.parse(existing) as FrequencyRecord;
          record.count++;
          record.lastSeen = now as Timestamp;
          record.dailyCounts[today] = (record.dailyCounts[today] || 0) + 1;
        } else {
          record = {
            actionType,
            projectId,
            userId,
            count: 1,
            firstSeen: now as Timestamp,
            lastSeen: now as Timestamp,
            dailyCounts: { [today]: 1 },
          };
        }

        // Store updated record with TTL (30 days)
        await redis.setex(key, 2592000, JSON.stringify(record));
      } catch (error) {
        console.error(`[Redis] Error tracking action ${actionType}:`, error);
      }
    },

    async getFrequency(actionType: string, projectId?: ProjectId) {
      try {
        const key = `${keyPrefix}freq:${projectId ? `${projectId}:` : ''}${actionType}`;
        const data = await redis.get(key);
        return data ? (JSON.parse(data) as FrequencyRecord) : undefined;
      } catch (error) {
        console.error(`[Redis] Error getting frequency for ${actionType}:`, error);
        return undefined;
      }
    },

    async getTopActions(projectId: ProjectId, limit: number) {
      try {
        // Get all frequency keys for this project
        // TODO: Consider using SCAN instead of KEYS for large datasets
        // KEYS is O(N) and can block Redis; SCAN is cursor-based and non-blocking
        const pattern = `${keyPrefix}freq:${projectId}:*`;
        const keys = await redis.keys(pattern);

        const results: FrequencyRecord[] = [];
        for (const key of keys) {
          const data = await redis.get(key);
          if (data) {
            results.push(JSON.parse(data) as FrequencyRecord);
          }
        }

        // Sort by count descending
        results.sort((a, b) => b.count - a.count);
        return results.slice(0, limit);
      } catch (error) {
        console.error(`[Redis] Error getting top actions for ${projectId}:`, error);
        return [];
      }
    },

    // === Bookmarks ===
    async addBookmark(bookmark: Bookmark) {
      try {
        const key = `${keyPrefix}bookmark:${bookmark.id}`;
        const projectKey = `${keyPrefix}bookmarks:${bookmark.projectId}`;
        // Store bookmark with 30 day TTL
        await redis.setex(key, 2592000, JSON.stringify(bookmark));
        // Add to project index
        await redis.sadd(projectKey, bookmark.id);
        await redis.expire(projectKey, 2592000);
      } catch (error) {
        console.error(`[Redis] Error adding bookmark ${bookmark.id}:`, error);
      }
    },

    async getBookmarks(projectId: ProjectId, filter?: BookmarkFilter) {
      try {
        const projectKey = `${keyPrefix}bookmarks:${projectId}`;
        const bookmarkIds = await redis.smembers(projectKey);

        const results: Bookmark[] = [];
        for (const id of bookmarkIds) {
          const key = `${keyPrefix}bookmark:${id}`;
          const data = await redis.get(key);
          if (data) {
            const bookmark = JSON.parse(data) as Bookmark;

            // Apply category filter
            if (filter?.category && bookmark.category !== filter.category) continue;

            // Apply userId filter
            if (filter?.userId && bookmark.userId !== filter.userId) continue;

            // Apply timestamp filter (since)
            if (filter?.since) {
              const bookmarkTime = new Date(bookmark.timestamp).getTime();
              const sinceTime = new Date(filter.since).getTime();
              if (bookmarkTime < sinceTime) continue;
            }

            // Apply tags filter
            if (filter?.tags && filter.tags.length > 0) {
              const hasTag = filter.tags.some((tag) => bookmark.tags.includes(tag));
              if (!hasTag) continue;
            }

            results.push(bookmark);
          }
        }
        return results;
      } catch (error) {
        console.error(`[Redis] Error getting bookmarks for ${projectId}:`, error);
        return [];
      }
    },

    async removeBookmark(bookmarkId: string) {
      try {
        const key = `${keyPrefix}bookmark:${bookmarkId}`;
        const data = await redis.get(key);
        if (data) {
          const bookmark = JSON.parse(data) as Bookmark;
          const projectKey = `${keyPrefix}bookmarks:${bookmark.projectId}`;
          await redis.srem(projectKey, bookmarkId);
        }
        await redis.del(key);
      } catch (error) {
        console.error(`[Redis] Error removing bookmark ${bookmarkId}:`, error);
      }
    },

    // === Patterns ===
    async addPattern(pattern: DetectedPattern) {
      try {
        const key = `${keyPrefix}pattern:${pattern.id}`;
        const projectKey = `${keyPrefix}patterns:${pattern.projectId}`;
        // Store pattern with 30 day TTL
        await redis.setex(key, 2592000, JSON.stringify(pattern));
        // Add to project index
        await redis.sadd(projectKey, pattern.id);
        await redis.expire(projectKey, 2592000);
      } catch (error) {
        console.error(`[Redis] Error adding pattern ${pattern.id}:`, error);
      }
    },

    async getPatterns(projectId: ProjectId, filter?: PatternFilter) {
      try {
        const projectKey = `${keyPrefix}patterns:${projectId}`;
        const patternIds = await redis.smembers(projectKey);

        const results: DetectedPattern[] = [];
        for (const id of patternIds) {
          const key = `${keyPrefix}pattern:${id}`;
          const data = await redis.get(key);
          if (data) {
            const pattern = JSON.parse(data) as DetectedPattern;

            // Apply pattern type filter
            if (filter?.patternType && pattern.patternType !== filter.patternType) continue;

            // Apply confidence filter
            if (filter?.minConfidence !== undefined && pattern.confidence < filter.minConfidence) continue;

            // Apply timestamp filter (since)
            if (filter?.since) {
              const patternTime = new Date(pattern.detectedAt).getTime();
              const sinceTime = new Date(filter.since).getTime();
              if (patternTime < sinceTime) continue;
            }

            results.push(pattern);
          }
        }
        return results;
      } catch (error) {
        console.error(`[Redis] Error getting patterns for ${projectId}:`, error);
        return [];
      }
    },

    // === Harmony Tracking ===
    async addHarmonyCheck(check: HarmonyCheck) {
      try {
        const key = `${keyPrefix}harmony:session:${check.sessionId}`;

        // Store check in Redis list (LPUSH to add to left, LTRIM to limit size)
        await redis.lpush(key, JSON.stringify(check));
        await redis.ltrim(key, 0, 99); // Keep only last 100 checks

        // Set TTL (7 days)
        await redis.expire(key, 7 * 24 * 60 * 60);

        // Also store by project if projectId is present
        if (check.projectId) {
          const projectKey = `${keyPrefix}harmony:project:${check.projectId}`;
          await redis.lpush(projectKey, JSON.stringify(check));
          await redis.ltrim(projectKey, 0, 199); // Keep more for project level
          await redis.expire(projectKey, 7 * 24 * 60 * 60);
        }
      } catch (error) {
        console.error(`[Redis] Error adding harmony check:`, error);
      }
    },

    async getHarmonyChecks(target: SessionId | ProjectId, filter?: HarmonyFilter) {
      try {
        // Determine key
        const isSession = target.toString().startsWith('sess') || target.toString().startsWith('session');
        const key = isSession
          ? `${keyPrefix}harmony:session:${target}`
          : `${keyPrefix}harmony:project:${target}`;

        // Get all checks from Redis list
        const raw = await redis.lrange(key, 0, -1);
        const checks: HarmonyCheck[] = raw.map(s => JSON.parse(s));

        // Apply filters
        let filtered = checks;

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
          filtered = filtered.slice(0, filter.limit);
        }

        return filtered;
      } catch (error) {
        console.error(`[Redis] Error getting harmony checks:`, error);
        return [];
      }
    },

    async getHarmonyMetrics(target: SessionId | ProjectId, targetType: 'session' | 'project') {
      try {
        const checks = await storage.getHarmonyChecks(target, {});

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
          .slice(0, 10);

        // Calculate format breakdown
        const formatBreakdown: Record<string, number> = {};
        for (const check of checks) {
          const format = check.parsedFormat || 'Unknown';
          formatBreakdown[format] = (formatBreakdown[format] || 0) + 1;
        }

        // Get last check timestamp (first in list since we LPUSH)
        const lastCheck = checks[0].timestamp;

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
      } catch (error) {
        console.error(`[Redis] Error getting harmony metrics:`, error);
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
    },

    // === Intel Dossier ===
    async getDossier(id: string) {
      try {
        const key = `${keyPrefix}dossiers:${id}`;
        const data = await redis.get(key);
        return data ? JSON.parse(data) as IntelDossier : undefined;
      } catch (error) {
        console.error(`[Redis] Error getting dossier ${id}:`, error);
        return undefined;
      }
    },

    async setDossier(dossier: IntelDossier) {
      try {
        const key = `${keyPrefix}dossiers:${dossier.id}`;
        await redis.set(key, JSON.stringify(dossier));
        // Add to set for listing
        await redis.sadd(`${keyPrefix}dossiers`, dossier.id);
      } catch (error) {
        console.error(`[Redis] Error setting dossier:`, error);
      }
    },

    async listDossiers() {
      try {
        const ids = await redis.smembers(`${keyPrefix}dossiers`);
        const dossiers: IntelDossier[] = [];
        for (const id of ids) {
          const dossier = await storage.getDossier(id);
          if (dossier) {
            dossiers.push(dossier);
          }
        }
        return dossiers;
      } catch (error) {
        console.error(`[Redis] Error listing dossiers:`, error);
        return [];
      }
    },

    async deleteDossier(id: string) {
      try {
        const key = `${keyPrefix}dossiers:${id}`;
        const result = await redis.del(key);
        await redis.srem(`${keyPrefix}dossiers`, id);
        return result > 0;
      } catch (error) {
        console.error(`[Redis] Error deleting dossier ${id}:`, error);
        return false;
      }
    },

    async appendDossierHistory(id: string, entry: DossierHistoryEntry) {
      try {
        const dossier = await storage.getDossier(id);
        if (!dossier) {
          return false;
        }

        dossier.history.push(entry);

        // Enforce max history limit (keep last 50)
        const MAX_HISTORY = 50;
        if (dossier.history.length > MAX_HISTORY) {
          dossier.history = dossier.history.slice(-MAX_HISTORY);
        }

        await storage.setDossier(dossier);
        return true;
      } catch (error) {
        console.error(`[Redis] Error appending dossier history:`, error);
        return false;
      }
    },

    // === Widget Suggestions ===
    async getSuggestion(id: string) {
      try {
        const key = `${keyPrefix}suggestions:${id}`;
        const data = await redis.get(key);
        return data ? JSON.parse(data) as SuggestionEntry : undefined;
      } catch (error) {
        console.error(`[Redis] Error getting suggestion ${id}:`, error);
        return undefined;
      }
    },

    async listSuggestions() {
      try {
        const ids = await redis.smembers(`${keyPrefix}suggestions`);
        const suggestions: SuggestionEntry[] = [];
        for (const id of ids) {
          const suggestion = await storage.getSuggestion(id);
          if (suggestion) {
            suggestions.push(suggestion);
          }
        }
        return suggestions;
      } catch (error) {
        console.error(`[Redis] Error listing suggestions:`, error);
        return [];
      }
    },

    async addSuggestion(suggestion: SuggestionEntry) {
      try {
        const key = `${keyPrefix}suggestions:${suggestion.id}`;
        await redis.set(key, JSON.stringify(suggestion));
        // Add to set for listing
        await redis.sadd(`${keyPrefix}suggestions`, suggestion.id);
      } catch (error) {
        console.error(`[Redis] Error adding suggestion:`, error);
      }
    },

    async deleteSuggestion(id: string) {
      try {
        const key = `${keyPrefix}suggestions:${id}`;
        const result = await redis.del(key);
        await redis.srem(`${keyPrefix}suggestions`, id);
        return result > 0;
      } catch (error) {
        console.error(`[Redis] Error deleting suggestion ${id}:`, error);
        return false;
      }
    },

    async incrementSuggestionFrequency(id: string) {
      try {
        const suggestion = await storage.getSuggestion(id);
        if (!suggestion) {
          return false;
        }
        suggestion.frequency++;
        await storage.addSuggestion(suggestion);
        return true;
      } catch (error) {
        console.error(`[Redis] Error incrementing suggestion frequency:`, error);
        return false;
      }
    },

    // === Chat History ===
    async getChatHistory(sessionId: SessionId) {
      try {
        const key = `${keyPrefix}chat:${sessionId}`;
        const messages = await redis.lrange(key, 0, -1);
        return messages.map((m: string) => JSON.parse(m) as ChatMessage);
      } catch (error) {
        console.error(`[Redis] Error getting chat history for ${sessionId}:`, error);
        return [];
      }
    },

    async addChatMessage(sessionId: SessionId, message: ChatMessage) {
      try {
        const key = `${keyPrefix}chat:${sessionId}`;
        await redis.rpush(key, JSON.stringify(message));
        // Keep only last 1000 messages per session
        await redis.ltrim(key, -1000, -1);
        // Set TTL (24 hours, same as sessions)
        await redis.expire(key, SESSION_TTL);
      } catch (error) {
        console.error(`[Redis] Error adding chat message for ${sessionId}:`, error);
      }
    },

    async clearChatHistory(sessionId: SessionId) {
      try {
        const key = `${keyPrefix}chat:${sessionId}`;
        await redis.del(key);
      } catch (error) {
        console.error(`[Redis] Error clearing chat history for ${sessionId}:`, error);
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
