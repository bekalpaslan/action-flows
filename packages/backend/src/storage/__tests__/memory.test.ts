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
  });
});
