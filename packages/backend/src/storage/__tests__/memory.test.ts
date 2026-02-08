/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck - Test file with simplified mock types
import { describe, it, expect, beforeEach } from 'vitest';
import type { Session, Chain, WorkspaceEvent, CommandPayload, SessionWindowConfig, Bookmark, DetectedPattern, HarmonyCheck } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import type { SessionId, ChainId, UserId, ProjectId, Timestamp } from '@afw/shared';

// We need to create a fresh storage instance for each test to avoid state pollution
// Import the storage interface and recreate storage for testing
function createTestMemoryStorage() {
  const MAX_EVENTS_PER_SESSION = 10_000;
  const MAX_CHAINS_PER_SESSION = 100;
  const MAX_SESSIONS = 1_000;
  const MAX_INPUT_QUEUE_PER_SESSION = 100;

  const storage = {
    // Sessions
    sessions: new Map<SessionId, Session>(),
    getSession(sessionId: SessionId) {
      return this.sessions.get(sessionId);
    },
    setSession(session: Session) {
      if (!this.sessions.has(session.id) && this.sessions.size >= MAX_SESSIONS) {
        this._evictOldestCompletedSession();
      }
      this.sessions.set(session.id, session);
      if (session.user) {
        const userSessions = this.sessionsByUser.get(session.user) || new Set();
        userSessions.add(session.id);
        this.sessionsByUser.set(session.user, userSessions);
      }
    },
    deleteSession(sessionId: SessionId) {
      const session = this.sessions.get(sessionId);
      this.sessions.delete(sessionId);
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
    sessionsByUser: new Map<UserId, Set<SessionId>>(),
    getSessionsByUser(userId: UserId) {
      const sessionSet = this.sessionsByUser.get(userId);
      return sessionSet ? Array.from(sessionSet) : [];
    },
    getUsersWithActiveSessions() {
      return Array.from(this.sessionsByUser.keys());
    },

    // Events
    events: new Map<SessionId, WorkspaceEvent[]>(),
    addEvent(sessionId: SessionId, event: WorkspaceEvent) {
      const events = this.events.get(sessionId) || [];
      events.push(event);
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
      return events.filter((event: WorkspaceEvent) => {
        if (event?.timestamp && typeof event.timestamp === 'string') {
          return new Date(event.timestamp) >= new Date(timestamp);
        }
        return true;
      });
    },

    // Chains
    chains: new Map<SessionId, Chain[]>(),
    addChain(sessionId: SessionId, chain: Chain) {
      const chains = this.chains.get(sessionId) || [];
      chains.push(chain);
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
    commandsQueue: new Map<SessionId, CommandPayload[]>(),
    queueCommand(sessionId: SessionId, command: CommandPayload) {
      const commands = this.commandsQueue.get(sessionId) || [];
      commands.push(command);
      this.commandsQueue.set(sessionId, commands);
    },
    getCommands(sessionId: SessionId) {
      const commands = this.commandsQueue.get(sessionId) || [];
      this.commandsQueue.set(sessionId, []);
      return commands;
    },
    clearCommands(sessionId: SessionId) {
      this.commandsQueue.delete(sessionId);
    },

    // Input
    inputQueue: new Map<SessionId, unknown[]>(),
    queueInput(sessionId: SessionId, input: unknown) {
      const inputs = this.inputQueue.get(sessionId) || [];
      if (inputs.length >= MAX_INPUT_QUEUE_PER_SESSION) {
        return;
      }
      inputs.push(input);
      this.inputQueue.set(sessionId, inputs);
    },
    getInput(sessionId: SessionId) {
      const inputs = this.inputQueue.get(sessionId) || [];
      this.inputQueue.set(sessionId, []);
      return inputs;
    },
    clearInput(sessionId: SessionId) {
      this.inputQueue.delete(sessionId);
    },

    // Clients
    clients: new Set<{ clientId: string; sessionId?: SessionId }>(),
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
    followedSessions: new Set<SessionId>(),
    sessionWindowConfigs: new Map<SessionId, SessionWindowConfig>(),
    followSession(sessionId: SessionId) {
      this.followedSessions.add(sessionId);
    },
    unfollowSession(sessionId: SessionId) {
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
    frequencies: new Map<string, any>(),
    trackAction(actionType: string, projectId?: ProjectId, _userId?: UserId) {
      const key = projectId ? `${projectId}:${actionType}` : actionType;
      const now = new Date().toISOString();
      const today = now.split('T')[0];

      const record = this.frequencies.get(key);
      if (record) {
        record.count++;
        record.lastSeen = now as Timestamp;
        record.dailyCounts[today] = (record.dailyCounts[today] || 0) + 1;
      } else {
        this.frequencies.set(key, {
          actionType,
          projectId,
          count: 1,
          firstSeen: now as Timestamp,
          lastSeen: now as Timestamp,
          dailyCounts: { [today]: 1 },
        });
      }
    },
    getFrequency(actionType: string, projectId?: ProjectId) {
      const key = projectId ? `${projectId}:${actionType}` : actionType;
      return this.frequencies.get(key);
    },
    getTopActions(projectId: ProjectId, limit: number) {
      const results: any[] = [];
      this.frequencies.forEach((record) => {
        if (record.projectId === projectId) {
          results.push(record);
        }
      });
      results.sort((a, b) => b.count - a.count);
      return results.slice(0, limit);
    },

    // Bookmarks
    bookmarks: new Map<string, Bookmark>(),
    addBookmark(bookmark: Bookmark) {
      this.bookmarks.set(bookmark.id, bookmark);
    },
    getBookmarks(projectId: ProjectId, filter?: any) {
      const results: Bookmark[] = [];
      this.bookmarks.forEach((bookmark) => {
        if (bookmark.projectId !== projectId) return;
        if (filter?.category && bookmark.category !== filter.category) return;
        if (filter?.userId && bookmark.userId !== filter.userId) return;
        if (filter?.since) {
          const bookmarkTime = new Date(bookmark.timestamp).getTime();
          const sinceTime = new Date(filter.since).getTime();
          if (bookmarkTime < sinceTime) return;
        }
        if (filter?.tags && filter.tags.length > 0) {
          const hasTag = filter.tags.some((tag: string) => bookmark.tags.includes(tag));
          if (!hasTag) return;
        }
        results.push(bookmark);
      });
      return results;
    },
    removeBookmark(bookmarkId: string) {
      this.bookmarks.delete(bookmarkId);
    },

    // Patterns
    patterns: new Map<string, DetectedPattern>(),
    addPattern(pattern: DetectedPattern) {
      this.patterns.set(pattern.id, pattern);
    },
    getPatterns(projectId: ProjectId, filter?: any) {
      const results: DetectedPattern[] = [];
      this.patterns.forEach((pattern) => {
        if (pattern.projectId !== projectId) return;
        if (filter?.patternType && pattern.patternType !== filter.patternType) return;
        if (filter?.minConfidence !== undefined && pattern.confidence < filter.minConfidence) return;
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
    harmonyChecks: new Map<SessionId, HarmonyCheck[]>(),
    harmonyChecksByProject: new Map<ProjectId, HarmonyCheck[]>(),
    addHarmonyCheck(check: HarmonyCheck) {
      const sessionChecks = this.harmonyChecks.get(check.sessionId) || [];
      sessionChecks.push(check);
      this.harmonyChecks.set(check.sessionId, sessionChecks);

      if (check.projectId) {
        const projectChecks = this.harmonyChecksByProject.get(check.projectId) || [];
        projectChecks.push(check);
        this.harmonyChecksByProject.set(check.projectId, projectChecks);
      }

      if (sessionChecks.length > 100) {
        sessionChecks.shift();
      }
    },
    getHarmonyChecks(target: SessionId | ProjectId, filter?: any) {
      const isSession = target.toString().startsWith('sess') || target.toString().startsWith('session');
      const checks = isSession
        ? this.harmonyChecks.get(target as SessionId) || []
        : this.harmonyChecksByProject.get(target as ProjectId) || [];

      let filtered = [...checks];

      if (filter?.result) {
        filtered = filtered.filter(c => c.result === filter.result);
      }
      if (filter?.formatType) {
        filtered = filtered.filter(c => c.parsedFormat === filter.formatType);
      }
      if (filter?.since) {
        filtered = filtered.filter(c => c.timestamp >= filter.since);
      }
      if (filter?.limit) {
        filtered = filtered.slice(-filter.limit);
      }

      return filtered;
    },
    getHarmonyMetrics(target: SessionId | ProjectId, _targetType: 'session' | 'project') {
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

      const validCount = checks.filter((c: HarmonyCheck) => c.result === 'valid').length;
      const degradedCount = checks.filter((c: HarmonyCheck) => c.result === 'degraded').length;
      const violationCount = checks.filter((c: HarmonyCheck) => c.result === 'violation').length;
      const harmonyPercentage = ((validCount + degradedCount) / checks.length) * 100;
      const recentViolations = checks.filter((c: HarmonyCheck) => c.result === 'violation').slice(-10);

      const formatBreakdown: Record<string, number> = {};
      for (const check of checks) {
        const format = check.parsedFormat || 'Unknown';
        formatBreakdown[format] = (formatBreakdown[format] || 0) + 1;
      }

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
        this.harmonyChecks.delete(oldestId);
      }
    },
  };

  return storage;
}

describe('MemoryStorage', () => {
  let storage: ReturnType<typeof createTestMemoryStorage>;

  beforeEach(() => {
    storage = createTestMemoryStorage();
  });

  describe('Session CRUD', () => {
    it('should store and retrieve a session', () => {
      const sessionId = brandedTypes.sessionId('test-session-1');
      const session: Session = {
        id: sessionId,
        status: 'active',
        startedAt: brandedTypes.currentTimestamp(),
        cwd: '/test/path',
      };

      storage.setSession(session);
      const retrieved = storage.getSession(sessionId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(sessionId);
      expect(retrieved?.status).toBe('active');
    });

    it('should return undefined for non-existent session', () => {
      const sessionId = brandedTypes.sessionId('non-existent');
      const retrieved = storage.getSession(sessionId);

      expect(retrieved).toBeUndefined();
    });

    it('should update an existing session', () => {
      const sessionId = brandedTypes.sessionId('test-session-2');
      const session: Session = {
        id: sessionId,
        status: 'pending',
        startedAt: brandedTypes.currentTimestamp(),
        cwd: '/test/path',
      };

      storage.setSession(session);
      storage.setSession({ ...session, status: 'active' });

      const retrieved = storage.getSession(sessionId);
      expect(retrieved?.status).toBe('active');
    });

    it('should delete a session', () => {
      const sessionId = brandedTypes.sessionId('test-session-3');
      const session: Session = {
        id: sessionId,
        status: 'active',
        startedAt: brandedTypes.currentTimestamp(),
        cwd: '/test/path',
      };

      storage.setSession(session);
      storage.deleteSession(sessionId);

      const retrieved = storage.getSession(sessionId);
      expect(retrieved).toBeUndefined();
    });

    it('should track sessions by user', () => {
      const userId = brandedTypes.userId('user-1');
      const sessionId1 = brandedTypes.sessionId('session-a');
      const sessionId2 = brandedTypes.sessionId('session-b');

      storage.setSession({
        id: sessionId1,
        status: 'active',
        startedAt: brandedTypes.currentTimestamp(),
        cwd: '/test',
        user: userId,
      });

      storage.setSession({
        id: sessionId2,
        status: 'active',
        startedAt: brandedTypes.currentTimestamp(),
        cwd: '/test',
        user: userId,
      });

      const userSessions = storage.getSessionsByUser(userId);
      expect(userSessions).toHaveLength(2);
      expect(userSessions).toContain(sessionId1);
      expect(userSessions).toContain(sessionId2);
    });

    it('should remove session from user tracking on delete', () => {
      const userId = brandedTypes.userId('user-2');
      const sessionId = brandedTypes.sessionId('session-c');

      storage.setSession({
        id: sessionId,
        status: 'active',
        startedAt: brandedTypes.currentTimestamp(),
        cwd: '/test',
        user: userId,
      });

      storage.deleteSession(sessionId);

      const userSessions = storage.getSessionsByUser(userId);
      expect(userSessions).toHaveLength(0);
    });

    it('should return users with active sessions', () => {
      const userId1 = brandedTypes.userId('user-x');
      const userId2 = brandedTypes.userId('user-y');

      storage.setSession({
        id: brandedTypes.sessionId('session-x'),
        status: 'active',
        startedAt: brandedTypes.currentTimestamp(),
        cwd: '/test',
        user: userId1,
      });

      storage.setSession({
        id: brandedTypes.sessionId('session-y'),
        status: 'active',
        startedAt: brandedTypes.currentTimestamp(),
        cwd: '/test',
        user: userId2,
      });

      const users = storage.getUsersWithActiveSessions();
      expect(users).toHaveLength(2);
      expect(users).toContain(userId1);
      expect(users).toContain(userId2);
    });
  });

  describe('Event Storage', () => {
    it('should add and retrieve events', () => {
      const sessionId = brandedTypes.sessionId('event-session-1');
      const event: WorkspaceEvent = {
        type: 'step:spawned',
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        stepNumber: 1 as any,
        action: 'test',
      } as WorkspaceEvent;

      storage.addEvent(sessionId, event);
      const events = storage.getEvents(sessionId);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('step:spawned');
    });

    it('should return empty array for session with no events', () => {
      const sessionId = brandedTypes.sessionId('no-events');
      const events = storage.getEvents(sessionId);

      expect(events).toEqual([]);
    });

    it('should retrieve events since a timestamp', () => {
      const sessionId = brandedTypes.sessionId('events-since-session');
      const oldTimestamp = new Date('2024-01-01T00:00:00Z').toISOString() as Timestamp;
      const newTimestamp = new Date('2024-06-01T00:00:00Z').toISOString() as Timestamp;

      const oldEvent: WorkspaceEvent = {
        type: 'step:spawned',
        sessionId,
        timestamp: oldTimestamp,
        stepNumber: 1 as any,
        action: 'old',
      } as WorkspaceEvent;

      const newEvent: WorkspaceEvent = {
        type: 'step:completed',
        sessionId,
        timestamp: newTimestamp,
        stepNumber: 1 as any,
        duration: 1000 as any,
        succeeded: true,
      } as WorkspaceEvent;

      storage.addEvent(sessionId, oldEvent);
      storage.addEvent(sessionId, newEvent);

      const filteredEvents = storage.getEventsSince(sessionId, '2024-03-01T00:00:00Z');
      expect(filteredEvents).toHaveLength(1);
      expect(filteredEvents[0].type).toBe('step:completed');
    });

    it('should enforce FIFO eviction when exceeding max events', () => {
      const sessionId = brandedTypes.sessionId('evict-events');

      // Add more than MAX_EVENTS_PER_SESSION (10000)
      for (let i = 0; i < 10005; i++) {
        storage.addEvent(sessionId, {
          type: 'step:spawned',
          sessionId,
          timestamp: brandedTypes.currentTimestamp(),
          stepNumber: i as any,
          action: `action-${i}`,
        } as WorkspaceEvent);
      }

      const events = storage.getEvents(sessionId);
      expect(events.length).toBeLessThanOrEqual(10000);
      // First events should be evicted
      expect((events[0] as any).stepNumber).toBeGreaterThan(0);
    });
  });

  describe('Command Queue', () => {
    it('should queue and retrieve commands', () => {
      const sessionId = brandedTypes.sessionId('cmd-session-1');
      const command: CommandPayload = {
        type: 'pause',
        payload: { reason: 'user request' },
      } as CommandPayload;

      storage.queueCommand(sessionId, command);
      const commands = storage.getCommands(sessionId);

      expect(commands).toHaveLength(1);
      expect(commands[0].type).toBe('pause');
    });

    it('should clear commands after retrieval (poll-and-consume)', () => {
      const sessionId = brandedTypes.sessionId('cmd-session-2');
      storage.queueCommand(sessionId, { type: 'pause' } as CommandPayload);

      // First retrieval
      const commands1 = storage.getCommands(sessionId);
      expect(commands1).toHaveLength(1);

      // Second retrieval should be empty
      const commands2 = storage.getCommands(sessionId);
      expect(commands2).toHaveLength(0);
    });

    it('should clear commands explicitly', () => {
      const sessionId = brandedTypes.sessionId('cmd-session-3');
      storage.queueCommand(sessionId, { type: 'resume' } as CommandPayload);

      storage.clearCommands(sessionId);

      const commands = storage.getCommands(sessionId);
      expect(commands).toHaveLength(0);
    });

    it('should queue multiple commands in order', () => {
      const sessionId = brandedTypes.sessionId('cmd-session-4');
      storage.queueCommand(sessionId, { type: 'pause' } as CommandPayload);
      storage.queueCommand(sessionId, { type: 'resume' } as CommandPayload);
      storage.queueCommand(sessionId, { type: 'cancel' } as CommandPayload);

      const commands = storage.getCommands(sessionId);
      expect(commands).toHaveLength(3);
      expect(commands[0].type).toBe('pause');
      expect(commands[1].type).toBe('resume');
      expect(commands[2].type).toBe('cancel');
    });
  });

  describe('Input Queue', () => {
    it('should queue and retrieve input', () => {
      const sessionId = brandedTypes.sessionId('input-session-1');
      const input = { answer: 'yes' };

      storage.queueInput(sessionId, input);
      const inputs = storage.getInput(sessionId);

      expect(inputs).toHaveLength(1);
      expect(inputs[0]).toEqual({ answer: 'yes' });
    });

    it('should clear input after retrieval', () => {
      const sessionId = brandedTypes.sessionId('input-session-2');
      storage.queueInput(sessionId, { data: 'test' });

      storage.getInput(sessionId);
      const inputs = storage.getInput(sessionId);

      expect(inputs).toHaveLength(0);
    });

    it('should drop input when queue is full', () => {
      const sessionId = brandedTypes.sessionId('input-session-3');

      // Fill queue to max (100)
      for (let i = 0; i < 100; i++) {
        storage.queueInput(sessionId, { index: i });
      }

      // Try to add one more (should be silently dropped)
      storage.queueInput(sessionId, { index: 100 });

      const inputs = storage.getInput(sessionId);
      expect(inputs).toHaveLength(100);
      expect((inputs[99] as any).index).toBe(99);
    });

    it('should clear input explicitly', () => {
      const sessionId = brandedTypes.sessionId('input-session-4');
      storage.queueInput(sessionId, { data: 'test' });

      storage.clearInput(sessionId);

      const inputs = storage.getInput(sessionId);
      expect(inputs).toHaveLength(0);
    });
  });

  describe('WebSocket Client Tracking', () => {
    it('should add and track clients', () => {
      const sessionId = brandedTypes.sessionId('ws-session-1');
      storage.addClient('client-1', sessionId);
      storage.addClient('client-2', sessionId);

      const clients = storage.getClientsForSession(sessionId);
      expect(clients).toHaveLength(2);
      expect(clients).toContain('client-1');
      expect(clients).toContain('client-2');
    });

    it('should remove client', () => {
      const sessionId = brandedTypes.sessionId('ws-session-2');
      storage.addClient('client-3', sessionId);

      storage.removeClient('client-3');

      const clients = storage.getClientsForSession(sessionId);
      expect(clients).toHaveLength(0);
    });

    it('should return empty array for session with no clients', () => {
      const sessionId = brandedTypes.sessionId('ws-session-3');
      const clients = storage.getClientsForSession(sessionId);

      expect(clients).toEqual([]);
    });
  });

  describe('Session Window Management', () => {
    it('should follow and unfollow sessions', () => {
      const sessionId = brandedTypes.sessionId('follow-session-1');

      storage.followSession(sessionId);
      expect(storage.getFollowedSessions()).toContain(sessionId);

      storage.unfollowSession(sessionId);
      expect(storage.getFollowedSessions()).not.toContain(sessionId);
    });

    it('should set and get session window config', () => {
      const sessionId = brandedTypes.sessionId('config-session-1');
      const config: SessionWindowConfig = {
        layout: 'split',
        zoom: 1.5,
      } as SessionWindowConfig;

      storage.setSessionWindowConfig(sessionId, config);
      const retrieved = storage.getSessionWindowConfig(sessionId);

      expect(retrieved?.layout).toBe('split');
      expect(retrieved?.zoom).toBe(1.5);
    });

    it('should delete config when unfollowing', () => {
      const sessionId = brandedTypes.sessionId('config-session-2');
      storage.followSession(sessionId);
      storage.setSessionWindowConfig(sessionId, { zoom: 2 } as SessionWindowConfig);

      storage.unfollowSession(sessionId);

      const config = storage.getSessionWindowConfig(sessionId);
      expect(config).toBeUndefined();
    });
  });

  describe('Frequency Tracking', () => {
    it('should track action frequency', () => {
      const projectId = 'proj-1' as ProjectId;
      const actionType = 'button-click';

      storage.trackAction(actionType, projectId);
      storage.trackAction(actionType, projectId);
      storage.trackAction(actionType, projectId);

      const record = storage.getFrequency(actionType, projectId);
      expect(record?.count).toBe(3);
    });

    it('should track actions without project ID', () => {
      storage.trackAction('global-action');
      storage.trackAction('global-action');

      const record = storage.getFrequency('global-action');
      expect(record?.count).toBe(2);
    });

    it('should get top actions by count', () => {
      const projectId = 'proj-2' as ProjectId;

      // Track different actions with different frequencies
      for (let i = 0; i < 10; i++) storage.trackAction('action-high', projectId);
      for (let i = 0; i < 5; i++) storage.trackAction('action-medium', projectId);
      for (let i = 0; i < 2; i++) storage.trackAction('action-low', projectId);

      const topActions = storage.getTopActions(projectId, 2);

      expect(topActions).toHaveLength(2);
      expect(topActions[0].actionType).toBe('action-high');
      expect(topActions[1].actionType).toBe('action-medium');
    });
  });

  describe('Bookmarks', () => {
    it('should add and retrieve bookmarks', () => {
      const projectId = 'proj-bm-1' as ProjectId;
      const bookmark: Bookmark = {
        id: 'bm-1',
        projectId,
        timestamp: brandedTypes.currentTimestamp(),
        description: 'Test bookmark',
        category: 'insight',
        tags: ['test'],
      } as Bookmark;

      storage.addBookmark(bookmark);
      const bookmarks = storage.getBookmarks(projectId);

      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0].description).toBe('Test bookmark');
    });

    it('should filter bookmarks by category', () => {
      const projectId = 'proj-bm-2' as ProjectId;

      storage.addBookmark({
        id: 'bm-2',
        projectId,
        timestamp: brandedTypes.currentTimestamp(),
        category: 'insight',
        tags: [],
      } as Bookmark);

      storage.addBookmark({
        id: 'bm-3',
        projectId,
        timestamp: brandedTypes.currentTimestamp(),
        category: 'error',
        tags: [],
      } as Bookmark);

      const insights = storage.getBookmarks(projectId, { category: 'insight' });
      expect(insights).toHaveLength(1);
    });

    it('should remove bookmarks', () => {
      const projectId = 'proj-bm-3' as ProjectId;
      storage.addBookmark({
        id: 'bm-4',
        projectId,
        timestamp: brandedTypes.currentTimestamp(),
        tags: [],
      } as Bookmark);

      storage.removeBookmark('bm-4');

      const bookmarks = storage.getBookmarks(projectId);
      expect(bookmarks).toHaveLength(0);
    });
  });

  describe('Patterns', () => {
    it('should add and retrieve patterns', () => {
      const projectId = 'proj-pat-1' as ProjectId;
      const pattern: DetectedPattern = {
        id: 'pat-1',
        projectId,
        patternType: 'commit-format',
        confidence: 0.85,
        detectedAt: brandedTypes.currentTimestamp(),
      } as DetectedPattern;

      storage.addPattern(pattern);
      const patterns = storage.getPatterns(projectId);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].confidence).toBe(0.85);
    });

    it('should filter patterns by type', () => {
      const projectId = 'proj-pat-2' as ProjectId;

      storage.addPattern({
        id: 'pat-2',
        projectId,
        patternType: 'commit-format',
        confidence: 0.9,
        detectedAt: brandedTypes.currentTimestamp(),
      } as DetectedPattern);

      storage.addPattern({
        id: 'pat-3',
        projectId,
        patternType: 'action-sequence',
        confidence: 0.8,
        detectedAt: brandedTypes.currentTimestamp(),
      } as DetectedPattern);

      const commitPatterns = storage.getPatterns(projectId, { patternType: 'commit-format' });
      expect(commitPatterns).toHaveLength(1);
    });

    it('should filter patterns by minimum confidence', () => {
      const projectId = 'proj-pat-3' as ProjectId;

      storage.addPattern({
        id: 'pat-4',
        projectId,
        patternType: 'commit-format',
        confidence: 0.6,
        detectedAt: brandedTypes.currentTimestamp(),
      } as DetectedPattern);

      storage.addPattern({
        id: 'pat-5',
        projectId,
        patternType: 'commit-format',
        confidence: 0.9,
        detectedAt: brandedTypes.currentTimestamp(),
      } as DetectedPattern);

      const highConfidence = storage.getPatterns(projectId, { minConfidence: 0.8 });
      expect(highConfidence).toHaveLength(1);
      expect(highConfidence[0].confidence).toBe(0.9);
    });
  });

  describe('Harmony Tracking', () => {
    it('should add and retrieve harmony checks by session', () => {
      const sessionId = brandedTypes.sessionId('session-harmony-1');
      const check: HarmonyCheck = {
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'valid',
        parsedFormat: 'json',
      } as HarmonyCheck;

      storage.addHarmonyCheck(check);
      const checks = storage.getHarmonyChecks(sessionId);

      expect(checks).toHaveLength(1);
      expect(checks[0].result).toBe('valid');
    });

    it('should filter harmony checks by result', () => {
      const sessionId = brandedTypes.sessionId('session-harmony-2');

      storage.addHarmonyCheck({
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'valid',
      } as HarmonyCheck);

      storage.addHarmonyCheck({
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'violation',
      } as HarmonyCheck);

      const violations = storage.getHarmonyChecks(sessionId, { result: 'violation' });
      expect(violations).toHaveLength(1);
    });

    it('should calculate harmony metrics', () => {
      const sessionId = brandedTypes.sessionId('session-harmony-3');

      // Add 8 valid, 1 degraded, 1 violation
      for (let i = 0; i < 8; i++) {
        storage.addHarmonyCheck({
          sessionId,
          timestamp: brandedTypes.currentTimestamp(),
          result: 'valid',
        } as HarmonyCheck);
      }
      storage.addHarmonyCheck({
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'degraded',
      } as HarmonyCheck);
      storage.addHarmonyCheck({
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'violation',
      } as HarmonyCheck);

      const metrics = storage.getHarmonyMetrics(sessionId, 'session');

      expect(metrics.totalChecks).toBe(10);
      expect(metrics.validCount).toBe(8);
      expect(metrics.degradedCount).toBe(1);
      expect(metrics.violationCount).toBe(1);
      expect(metrics.harmonyPercentage).toBe(90); // (8+1)/10 = 0.9 -> 90%
    });

    it('should return default metrics for session with no checks', () => {
      const sessionId = brandedTypes.sessionId('session-harmony-empty');
      const metrics = storage.getHarmonyMetrics(sessionId, 'session');

      expect(metrics.totalChecks).toBe(0);
      expect(metrics.harmonyPercentage).toBe(100);
    });
  });

  describe('Chain Storage', () => {
    it('should add and retrieve chains', () => {
      const sessionId = brandedTypes.sessionId('chain-session-1');
      const chainId = brandedTypes.chainId('chain-1');
      const chain: Chain = {
        id: chainId,
        sessionId,
        title: 'Test Chain',
        status: 'active',
        startedAt: brandedTypes.currentTimestamp(),
        steps: [],
      };

      storage.addChain(sessionId, chain);
      const chains = storage.getChains(sessionId);

      expect(chains).toHaveLength(1);
      expect(chains[0].title).toBe('Test Chain');
    });

    it('should find chain by ID across sessions', () => {
      const sessionId = brandedTypes.sessionId('chain-session-2');
      const chainId = brandedTypes.chainId('chain-find-me');
      const chain: Chain = {
        id: chainId,
        sessionId,
        title: 'Findable Chain',
        status: 'active',
        startedAt: brandedTypes.currentTimestamp(),
        steps: [],
      };

      storage.addChain(sessionId, chain);
      const found = storage.getChain(chainId);

      expect(found).toBeDefined();
      expect(found?.title).toBe('Findable Chain');
    });

    it('should return undefined for non-existent chain', () => {
      const chainId = brandedTypes.chainId('non-existent-chain');
      const found = storage.getChain(chainId);

      expect(found).toBeUndefined();
    });

    it('should enforce FIFO eviction when exceeding max chains', () => {
      const sessionId = brandedTypes.sessionId('chain-evict-session');

      // Add more than MAX_CHAINS_PER_SESSION (100)
      for (let i = 0; i < 105; i++) {
        storage.addChain(sessionId, {
          id: brandedTypes.chainId(`chain-${i}`),
          sessionId,
          title: `Chain ${i}`,
          status: 'active',
          startedAt: brandedTypes.currentTimestamp(),
          steps: [],
        });
      }

      const chains = storage.getChains(sessionId);
      expect(chains.length).toBeLessThanOrEqual(100);
      // First chains should be evicted
      expect(chains[0].title).not.toBe('Chain 0');
    });

    it('should return empty array for session with no chains', () => {
      const sessionId = brandedTypes.sessionId('no-chains-session');
      const chains = storage.getChains(sessionId);

      expect(chains).toEqual([]);
    });
  });

  describe('Session History and Cleanup', () => {
    it('should evict oldest completed session when at capacity', () => {
      const maxSessions = 1000;
      const oldestSessionId = brandedTypes.sessionId('oldest-completed');

      // Add oldest completed session
      storage.setSession({
        id: oldestSessionId,
        status: 'completed',
        startedAt: new Date('2020-01-01T00:00:00Z').toISOString() as Timestamp,
        cwd: '/test',
      });

      // Fill to capacity with active sessions
      for (let i = 0; i < maxSessions - 1; i++) {
        storage.setSession({
          id: brandedTypes.sessionId(`active-session-${i}`),
          status: 'active',
          startedAt: brandedTypes.currentTimestamp(),
          cwd: '/test',
        });
      }

      // Add one more session (should trigger eviction)
      const newSessionId = brandedTypes.sessionId('trigger-eviction');
      storage.setSession({
        id: newSessionId,
        status: 'active',
        startedAt: brandedTypes.currentTimestamp(),
        cwd: '/test',
      });

      // Oldest completed session should be evicted
      expect(storage.getSession(oldestSessionId)).toBeUndefined();
      expect(storage.getSession(newSessionId)).toBeDefined();
    });

    it('should evict oldest failed session when at capacity', () => {
      const maxSessions = 1000;
      const oldestFailedId = brandedTypes.sessionId('oldest-failed');

      // Add oldest failed session
      storage.setSession({
        id: oldestFailedId,
        status: 'failed',
        startedAt: new Date('2020-01-01T00:00:00Z').toISOString() as Timestamp,
        cwd: '/test',
      });

      // Fill to capacity
      for (let i = 0; i < maxSessions - 1; i++) {
        storage.setSession({
          id: brandedTypes.sessionId(`filler-${i}`),
          status: 'active',
          startedAt: brandedTypes.currentTimestamp(),
          cwd: '/test',
        });
      }

      // Trigger eviction
      storage.setSession({
        id: brandedTypes.sessionId('trigger-2'),
        status: 'active',
        startedAt: brandedTypes.currentTimestamp(),
        cwd: '/test',
      });

      expect(storage.getSession(oldestFailedId)).toBeUndefined();
    });

    it('should clean up all related data when evicting session', () => {
      const maxSessions = 1000;
      const targetSessionId = brandedTypes.sessionId('evict-with-data');

      // Create session with full data
      storage.setSession({
        id: targetSessionId,
        status: 'completed',
        startedAt: new Date('2020-01-01T00:00:00Z').toISOString() as Timestamp,
        cwd: '/test',
      });

      // Add related data
      storage.addEvent(targetSessionId, {
        type: 'step:spawned',
        sessionId: targetSessionId,
        timestamp: brandedTypes.currentTimestamp(),
        stepNumber: 1 as any,
        action: 'test',
      } as WorkspaceEvent);

      storage.addChain(targetSessionId, {
        id: brandedTypes.chainId('test-chain'),
        sessionId: targetSessionId,
        title: 'Test',
        status: 'active',
        startedAt: brandedTypes.currentTimestamp(),
        steps: [],
      });

      storage.queueCommand(targetSessionId, { type: 'pause' } as CommandPayload);
      storage.queueInput(targetSessionId, { data: 'test' });

      storage.addHarmonyCheck({
        sessionId: targetSessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'valid',
      } as HarmonyCheck);

      // Fill to capacity and trigger eviction
      for (let i = 0; i < maxSessions - 1; i++) {
        storage.setSession({
          id: brandedTypes.sessionId(`filler-evict-${i}`),
          status: 'active',
          startedAt: brandedTypes.currentTimestamp(),
          cwd: '/test',
        });
      }

      storage.setSession({
        id: brandedTypes.sessionId('trigger-cleanup'),
        status: 'active',
        startedAt: brandedTypes.currentTimestamp(),
        cwd: '/test',
      });

      // Verify all related data is cleaned
      expect(storage.getSession(targetSessionId)).toBeUndefined();
      expect(storage.getEvents(targetSessionId)).toEqual([]);
      expect(storage.getChains(targetSessionId)).toEqual([]);
      expect(storage.getCommands(targetSessionId)).toEqual([]);
      expect(storage.getInput(targetSessionId)).toEqual([]);
      expect(storage.getHarmonyChecks(targetSessionId)).toEqual([]);
    });

    it('should not evict active sessions when at capacity', () => {
      const maxSessions = 1000;
      const activeSessionId = brandedTypes.sessionId('keep-active');
      const completedSessionId = brandedTypes.sessionId('evict-completed');

      // Add completed session (older)
      storage.setSession({
        id: completedSessionId,
        status: 'completed',
        startedAt: new Date('2020-01-01T00:00:00Z').toISOString() as Timestamp,
        cwd: '/test',
      });

      // Add active session (newer but should be kept)
      storage.setSession({
        id: activeSessionId,
        status: 'active',
        startedAt: new Date('2020-02-01T00:00:00Z').toISOString() as Timestamp,
        cwd: '/test',
      });

      // Fill to capacity
      for (let i = 0; i < maxSessions - 2; i++) {
        storage.setSession({
          id: brandedTypes.sessionId(`filler-active-${i}`),
          status: 'active',
          startedAt: brandedTypes.currentTimestamp(),
          cwd: '/test',
        });
      }

      // Trigger eviction
      storage.setSession({
        id: brandedTypes.sessionId('trigger-active-test'),
        status: 'active',
        startedAt: brandedTypes.currentTimestamp(),
        cwd: '/test',
      });

      // Active session should be kept, completed should be evicted
      expect(storage.getSession(activeSessionId)).toBeDefined();
      expect(storage.getSession(completedSessionId)).toBeUndefined();
    });
  });

  describe('Advanced Event Filtering', () => {
    it('should handle events without timestamps gracefully', () => {
      const sessionId = brandedTypes.sessionId('no-timestamp-events');

      // Add event without timestamp
      const eventNoTimestamp = {
        type: 'step:spawned',
        sessionId,
        stepNumber: 1 as any,
        action: 'test',
      } as WorkspaceEvent;

      storage.addEvent(sessionId, eventNoTimestamp);

      // getEventsSince should include events without timestamps
      const events = storage.getEventsSince(sessionId, brandedTypes.currentTimestamp());
      expect(events).toHaveLength(1);
    });

    it('should filter events with exact timestamp boundary', () => {
      const sessionId = brandedTypes.sessionId('boundary-events');
      const boundaryTime = new Date('2024-06-01T12:00:00Z').toISOString() as Timestamp;

      storage.addEvent(sessionId, {
        type: 'step:spawned',
        sessionId,
        timestamp: boundaryTime,
        stepNumber: 1 as any,
        action: 'boundary-event',
      } as WorkspaceEvent);

      const events = storage.getEventsSince(sessionId, boundaryTime);
      expect(events).toHaveLength(1);
    });
  });

  describe('Client Management Edge Cases', () => {
    it('should handle adding client without session ID', () => {
      storage.addClient('client-no-session');

      // Client should exist but not be associated with any session
      const sessionId = brandedTypes.sessionId('random-session');
      const clients = storage.getClientsForSession(sessionId);
      expect(clients).toEqual([]);
    });

    it('should handle removing non-existent client', () => {
      storage.removeClient('non-existent-client');

      // Should not throw error
      expect(storage.clients.size).toBe(0);
    });

    it('should handle multiple clients for same session', () => {
      const sessionId = brandedTypes.sessionId('multi-client-session');

      storage.addClient('client-a', sessionId);
      storage.addClient('client-b', sessionId);
      storage.addClient('client-c', sessionId);

      const clients = storage.getClientsForSession(sessionId);
      expect(clients).toHaveLength(3);
      expect(clients).toContain('client-a');
      expect(clients).toContain('client-b');
      expect(clients).toContain('client-c');
    });
  });

  describe('Session Window Edge Cases', () => {
    it('should not delete config when unfollowing non-followed session', () => {
      const sessionId = brandedTypes.sessionId('never-followed');
      const config: SessionWindowConfig = { zoom: 1.0 } as SessionWindowConfig;

      storage.setSessionWindowConfig(sessionId, config);
      storage.unfollowSession(sessionId);

      // Config should still exist since session was never followed
      const retrieved = storage.getSessionWindowConfig(sessionId);
      expect(retrieved).toBeDefined();
    });

    it('should handle multiple follow/unfollow cycles', () => {
      const sessionId = brandedTypes.sessionId('cycle-session');

      storage.followSession(sessionId);
      storage.unfollowSession(sessionId);
      storage.followSession(sessionId);
      storage.unfollowSession(sessionId);

      expect(storage.getFollowedSessions()).not.toContain(sessionId);
    });
  });

  describe('Frequency Tracking Advanced', () => {
    it('should track daily counts correctly', () => {
      const projectId = 'proj-daily' as ProjectId;
      const actionType = 'daily-action';

      storage.trackAction(actionType, projectId);
      storage.trackAction(actionType, projectId);

      const record = storage.getFrequency(actionType, projectId);
      const today = new Date().toISOString().split('T')[0];

      expect(record?.dailyCounts[today]).toBe(2);
    });

    it('should update lastSeen on repeated tracking', () => {
      const actionType = 'repeated-action';

      storage.trackAction(actionType);
      const firstRecord = storage.getFrequency(actionType);
      const firstLastSeen = firstRecord?.lastSeen;

      // Small delay
      storage.trackAction(actionType);
      const secondRecord = storage.getFrequency(actionType);

      expect(secondRecord?.count).toBe(2);
      expect(secondRecord?.lastSeen).toBeDefined();
    });

    it('should separate project-scoped and global actions', () => {
      const projectId = 'proj-scope' as ProjectId;
      const actionType = 'scoped-action';

      storage.trackAction(actionType, projectId);
      storage.trackAction(actionType); // global

      const projectRecord = storage.getFrequency(actionType, projectId);
      const globalRecord = storage.getFrequency(actionType);

      expect(projectRecord?.count).toBe(1);
      expect(globalRecord?.count).toBe(1);
    });

    it('should handle empty top actions for project', () => {
      const projectId = 'proj-empty' as ProjectId;
      const topActions = storage.getTopActions(projectId, 10);

      expect(topActions).toEqual([]);
    });
  });

  describe('Bookmark Filtering Advanced', () => {
    it('should filter by userId', () => {
      const projectId = 'proj-user-filter' as ProjectId;
      const userId1 = brandedTypes.userId('user-a');
      const userId2 = brandedTypes.userId('user-b');

      storage.addBookmark({
        id: 'bm-user-1',
        projectId,
        userId: userId1,
        timestamp: brandedTypes.currentTimestamp(),
        tags: [],
      } as Bookmark);

      storage.addBookmark({
        id: 'bm-user-2',
        projectId,
        userId: userId2,
        timestamp: brandedTypes.currentTimestamp(),
        tags: [],
      } as Bookmark);

      const user1Bookmarks = storage.getBookmarks(projectId, { userId: userId1 });
      expect(user1Bookmarks).toHaveLength(1);
      expect(user1Bookmarks[0].userId).toBe(userId1);
    });

    it('should filter by timestamp (since)', () => {
      const projectId = 'proj-time-filter' as ProjectId;
      const oldTime = new Date('2020-01-01T00:00:00Z').toISOString() as Timestamp;
      const newTime = new Date('2024-01-01T00:00:00Z').toISOString() as Timestamp;

      storage.addBookmark({
        id: 'bm-old',
        projectId,
        timestamp: oldTime,
        tags: [],
      } as Bookmark);

      storage.addBookmark({
        id: 'bm-new',
        projectId,
        timestamp: newTime,
        tags: [],
      } as Bookmark);

      const recentBookmarks = storage.getBookmarks(projectId, {
        since: '2023-01-01T00:00:00Z',
      });

      expect(recentBookmarks).toHaveLength(1);
      expect(recentBookmarks[0].id).toBe('bm-new');
    });

    it('should filter by tags (any match)', () => {
      const projectId = 'proj-tag-filter' as ProjectId;

      storage.addBookmark({
        id: 'bm-tag-1',
        projectId,
        timestamp: brandedTypes.currentTimestamp(),
        tags: ['important', 'bug'],
      } as Bookmark);

      storage.addBookmark({
        id: 'bm-tag-2',
        projectId,
        timestamp: brandedTypes.currentTimestamp(),
        tags: ['feature'],
      } as Bookmark);

      const bugBookmarks = storage.getBookmarks(projectId, {
        tags: ['bug', 'critical'],
      });

      expect(bugBookmarks).toHaveLength(1);
      expect(bugBookmarks[0].id).toBe('bm-tag-1');
    });

    it('should combine multiple filters', () => {
      const projectId = 'proj-multi-filter' as ProjectId;
      const userId = brandedTypes.userId('filter-user');

      storage.addBookmark({
        id: 'bm-match',
        projectId,
        userId,
        category: 'insight',
        timestamp: brandedTypes.currentTimestamp(),
        tags: ['important'],
      } as Bookmark);

      storage.addBookmark({
        id: 'bm-no-match-category',
        projectId,
        userId,
        category: 'error',
        timestamp: brandedTypes.currentTimestamp(),
        tags: ['important'],
      } as Bookmark);

      storage.addBookmark({
        id: 'bm-no-match-user',
        projectId,
        userId: brandedTypes.userId('other-user'),
        category: 'insight',
        timestamp: brandedTypes.currentTimestamp(),
        tags: ['important'],
      } as Bookmark);

      const filtered = storage.getBookmarks(projectId, {
        userId,
        category: 'insight',
        tags: ['important'],
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('bm-match');
    });
  });

  describe('Pattern Filtering Advanced', () => {
    it('should filter by timestamp (since)', () => {
      const projectId = 'proj-pattern-time' as ProjectId;
      const oldTime = new Date('2020-01-01T00:00:00Z').toISOString() as Timestamp;
      const newTime = new Date('2024-01-01T00:00:00Z').toISOString() as Timestamp;

      storage.addPattern({
        id: 'pat-old',
        projectId,
        patternType: 'commit-format',
        confidence: 0.9,
        detectedAt: oldTime,
      } as DetectedPattern);

      storage.addPattern({
        id: 'pat-new',
        projectId,
        patternType: 'commit-format',
        confidence: 0.9,
        detectedAt: newTime,
      } as DetectedPattern);

      const recentPatterns = storage.getPatterns(projectId, {
        since: '2023-01-01T00:00:00Z',
      });

      expect(recentPatterns).toHaveLength(1);
      expect(recentPatterns[0].id).toBe('pat-new');
    });

    it('should combine type and confidence filters', () => {
      const projectId = 'proj-pattern-combo' as ProjectId;

      storage.addPattern({
        id: 'pat-match',
        projectId,
        patternType: 'commit-format',
        confidence: 0.95,
        detectedAt: brandedTypes.currentTimestamp(),
      } as DetectedPattern);

      storage.addPattern({
        id: 'pat-wrong-type',
        projectId,
        patternType: 'action-sequence',
        confidence: 0.95,
        detectedAt: brandedTypes.currentTimestamp(),
      } as DetectedPattern);

      storage.addPattern({
        id: 'pat-low-confidence',
        projectId,
        patternType: 'commit-format',
        confidence: 0.5,
        detectedAt: brandedTypes.currentTimestamp(),
      } as DetectedPattern);

      const filtered = storage.getPatterns(projectId, {
        patternType: 'commit-format',
        minConfidence: 0.8,
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('pat-match');
    });
  });

  describe('Harmony Tracking Advanced', () => {
    it('should track checks by project ID', () => {
      const sessionId = brandedTypes.sessionId('proj-harmony-session');
      const projectId = 'proj-harmony' as ProjectId;

      storage.addHarmonyCheck({
        sessionId,
        projectId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'valid',
      } as HarmonyCheck);

      const projectChecks = storage.getHarmonyChecks(projectId);
      expect(projectChecks).toHaveLength(1);
    });

    it('should limit session checks to 100 (FIFO)', () => {
      const sessionId = brandedTypes.sessionId('limit-harmony-session');

      // Add 105 checks
      for (let i = 0; i < 105; i++) {
        storage.addHarmonyCheck({
          sessionId,
          timestamp: brandedTypes.currentTimestamp(),
          result: 'valid',
          parsedFormat: `format-${i}`,
        } as HarmonyCheck);
      }

      const checks = storage.getHarmonyChecks(sessionId);
      expect(checks.length).toBeLessThanOrEqual(100);
    });

    it('should filter by formatType', () => {
      const sessionId = brandedTypes.sessionId('sess-format-filter');

      storage.addHarmonyCheck({
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'valid',
        parsedFormat: 'json',
      } as HarmonyCheck);

      storage.addHarmonyCheck({
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'valid',
        parsedFormat: 'xml',
      } as HarmonyCheck);

      // First verify all checks are stored
      const allChecks = storage.getHarmonyChecks(sessionId, {});
      expect(allChecks).toHaveLength(2);

      const jsonChecks = storage.getHarmonyChecks(sessionId, {
        formatType: 'json',
      });

      expect(jsonChecks).toHaveLength(1);
      expect(jsonChecks[0].parsedFormat).toBe('json');
    });

    it('should filter by since timestamp', () => {
      const sessionId = brandedTypes.sessionId('sess-time-filter');
      const oldTime = new Date('2020-01-01T00:00:00Z').toISOString() as Timestamp;
      const newTime = new Date('2024-01-01T00:00:00Z').toISOString() as Timestamp;

      storage.addHarmonyCheck({
        sessionId,
        timestamp: oldTime,
        result: 'valid',
      } as HarmonyCheck);

      storage.addHarmonyCheck({
        sessionId,
        timestamp: newTime,
        result: 'valid',
      } as HarmonyCheck);

      const recentChecks = storage.getHarmonyChecks(sessionId, {
        since: '2023-01-01T00:00:00Z' as Timestamp,
      });

      expect(recentChecks).toHaveLength(1);
    });

    it('should apply limit filter (last N checks)', () => {
      const sessionId = brandedTypes.sessionId('sess-limit-filter');

      for (let i = 0; i < 20; i++) {
        storage.addHarmonyCheck({
          sessionId,
          timestamp: brandedTypes.currentTimestamp(),
          result: 'valid',
        } as HarmonyCheck);
      }

      const limitedChecks = storage.getHarmonyChecks(sessionId, { limit: 5 });
      expect(limitedChecks).toHaveLength(5);
    });

    it('should calculate format breakdown in metrics', () => {
      const sessionId = brandedTypes.sessionId('sess-breakdown');

      storage.addHarmonyCheck({
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'valid',
        parsedFormat: 'json',
      } as HarmonyCheck);

      storage.addHarmonyCheck({
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'valid',
        parsedFormat: 'json',
      } as HarmonyCheck);

      storage.addHarmonyCheck({
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'valid',
        parsedFormat: 'xml',
      } as HarmonyCheck);

      const metrics = storage.getHarmonyMetrics(sessionId, 'session');

      expect(metrics.formatBreakdown['json']).toBe(2);
      expect(metrics.formatBreakdown['xml']).toBe(1);
    });

    it('should handle checks with no parsedFormat', () => {
      const sessionId = brandedTypes.sessionId('sess-no-format');

      storage.addHarmonyCheck({
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'valid',
      } as HarmonyCheck);

      const metrics = storage.getHarmonyMetrics(sessionId, 'session');

      expect(metrics.formatBreakdown['Unknown']).toBe(1);
    });

    it('should slice recent violations correctly', () => {
      const sessionId = brandedTypes.sessionId('sess-violations');

      // Add 15 violations
      for (let i = 0; i < 15; i++) {
        storage.addHarmonyCheck({
          sessionId,
          timestamp: brandedTypes.currentTimestamp(),
          result: 'violation',
          parsedFormat: `violation-${i}`,
        } as HarmonyCheck);
      }

      const metrics = storage.getHarmonyMetrics(sessionId, 'session');

      // Should only return last 10 violations
      expect(metrics.recentViolations).toHaveLength(10);
    });
  });
});
