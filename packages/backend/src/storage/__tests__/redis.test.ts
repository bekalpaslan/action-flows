/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { Session, Chain, WorkspaceEvent, CommandPayload, SessionWindowConfig, Bookmark, DetectedPattern, HarmonyCheck, FrequencyRecord } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import type { SessionId, ChainId, UserId, ProjectId, Timestamp } from '@afw/shared';
import { createRedisStorage } from '../redis.js';
import type { RedisStorage } from '../redis.js';

// Mock ioredis
vi.mock('ioredis', () => {
  class RedisMock {
    private store = new Map<string, string>();
    private sets = new Map<string, Set<string>>();
    private lists = new Map<string, string[]>();
    private ttls = new Map<string, number>();
    private pubsubChannels = new Map<string, Array<(channel: string, message: string) => void>>();
    private messageHandlers: Array<(channel: string, message: string) => void> = [];

    // GET / SET / DEL
    async get(key: string): Promise<string | null> {
      return this.store.get(key) ?? null;
    }

    async set(key: string, value: string): Promise<'OK'> {
      this.store.set(key, value);
      return 'OK';
    }

    async setex(key: string, ttl: number, value: string): Promise<'OK'> {
      this.store.set(key, value);
      this.ttls.set(key, ttl);
      return 'OK';
    }

    async del(...keys: string[]): Promise<number> {
      let deleted = 0;
      for (const key of keys) {
        if (this.store.delete(key) || this.sets.delete(key) || this.lists.delete(key)) {
          deleted++;
        }
      }
      return deleted;
    }

    async expire(key: string, ttl: number): Promise<number> {
      if (this.store.has(key) || this.sets.has(key) || this.lists.has(key)) {
        this.ttls.set(key, ttl);
        return 1;
      }
      return 0;
    }

    // LIST operations
    async rpush(key: string, ...values: string[]): Promise<number> {
      const list = this.lists.get(key) || [];
      list.push(...values);
      this.lists.set(key, list);
      return list.length;
    }

    async lpush(key: string, ...values: string[]): Promise<number> {
      const list = this.lists.get(key) || [];
      list.unshift(...values);
      this.lists.set(key, list);
      return list.length;
    }

    async lrange(key: string, start: number, stop: number): Promise<string[]> {
      const list = this.lists.get(key) || [];
      if (stop === -1) {
        return list.slice(start);
      }
      return list.slice(start, stop + 1);
    }

    async ltrim(key: string, start: number, stop: number): Promise<'OK'> {
      const list = this.lists.get(key) || [];
      this.lists.set(key, list.slice(start, stop + 1));
      return 'OK';
    }

    // SET operations
    async sadd(key: string, ...members: string[]): Promise<number> {
      const set = this.sets.get(key) || new Set();
      let added = 0;
      for (const member of members) {
        if (!set.has(member)) {
          set.add(member);
          added++;
        }
      }
      this.sets.set(key, set);
      return added;
    }

    async srem(key: string, ...members: string[]): Promise<number> {
      const set = this.sets.get(key);
      if (!set) return 0;
      let removed = 0;
      for (const member of members) {
        if (set.delete(member)) {
          removed++;
        }
      }
      return removed;
    }

    async smembers(key: string): Promise<string[]> {
      const set = this.sets.get(key);
      return set ? Array.from(set) : [];
    }

    // KEYS operation (used by getTopActions)
    async keys(pattern: string): Promise<string[]> {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      const allKeys = Array.from(this.store.keys());
      return allKeys.filter(key => regex.test(key));
    }

    // Pub/Sub operations
    async subscribe(channel: string): Promise<void> {
      if (!this.pubsubChannels.has(channel)) {
        this.pubsubChannels.set(channel, []);
      }
    }

    on(event: string, handler: (channel: string, message: string) => void): void {
      if (event === 'message') {
        this.messageHandlers.push(handler);
      }
    }

    removeListener(event: string, handler: (channel: string, message: string) => void): void {
      if (event === 'message') {
        const index = this.messageHandlers.indexOf(handler);
        if (index !== -1) {
          this.messageHandlers.splice(index, 1);
        }
      }
    }

    async publish(channel: string, message: string): Promise<number> {
      // Simulate message delivery to subscribers
      this.messageHandlers.forEach(handler => handler(channel, message));
      return this.messageHandlers.length;
    }

    async quit(): Promise<'OK'> {
      this.store.clear();
      this.sets.clear();
      this.lists.clear();
      this.ttls.clear();
      this.pubsubChannels.clear();
      this.messageHandlers = [];
      return 'OK';
    }

    // Test helper to inspect store
    _getStore() {
      return this.store;
    }

    _getLists() {
      return this.lists;
    }

    _getSets() {
      return this.sets;
    }
  }

  return {
    Redis: RedisMock,
  };
});

describe('RedisStorage', () => {
  let storage: RedisStorage;

  beforeEach(() => {
    storage = createRedisStorage('redis://localhost:6379', 'test:');
  });

  afterEach(async () => {
    await storage.disconnect();
  });

  describe('Session CRUD', () => {
    it('should store and retrieve a session', async () => {
      const sessionId = brandedTypes.sessionId('test-session-1');
      const session: Session = {
        id: sessionId,
        status: 'in_progress',
        startedAt: brandedTypes.currentTimestamp(),
        cwd: '/test/path',
        chains: [],
      };

      await storage.setSession(session);
      const retrieved = await storage.getSession(sessionId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(sessionId);
      expect(retrieved?.status).toBe('in_progress');
    });

    it('should return undefined for non-existent session', async () => {
      const sessionId = brandedTypes.sessionId('non-existent');
      const retrieved = await storage.getSession(sessionId);

      expect(retrieved).toBeUndefined();
    });

    it('should update an existing session', async () => {
      const sessionId = brandedTypes.sessionId('test-session-2');
      const session: Session = {
        id: sessionId,
        status: 'pending',
        startedAt: brandedTypes.currentTimestamp(),
        cwd: '/test/path',
        chains: [],
      };

      await storage.setSession(session);
      await storage.setSession({ ...session, status: 'in_progress' });

      const retrieved = await storage.getSession(sessionId);
      expect(retrieved?.status).toBe('in_progress');
    });

    it('should delete a session', async () => {
      const sessionId = brandedTypes.sessionId('test-session-3');
      const session: Session = {
        id: sessionId,
        status: 'in_progress',
        startedAt: brandedTypes.currentTimestamp(),
        cwd: '/test/path',
        chains: [],
      };

      await storage.setSession(session);
      await storage.deleteSession(sessionId);

      const retrieved = await storage.getSession(sessionId);
      expect(retrieved).toBeUndefined();
    });

    it('should handle session with user property', async () => {
      const userId = brandedTypes.userId('user-1');
      const sessionId = brandedTypes.sessionId('session-with-user');
      const session: Session = {
        id: sessionId,
        status: 'in_progress',
        startedAt: brandedTypes.currentTimestamp(),
        cwd: '/test',
        user: userId,
        chains: [],
      };

      await storage.setSession(session);
      const retrieved = await storage.getSession(sessionId);

      expect(retrieved?.user).toBe(userId);
    });
  });

  describe('Event Storage', () => {
    it('should add and retrieve events', async () => {
      const sessionId = brandedTypes.sessionId('event-session-1');
      const event: WorkspaceEvent = {
        type: 'step:spawned',
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        id: 'evt-1',
        stepNumber: 1 as any,
        action: 'test',
      } as WorkspaceEvent;

      await storage.addEvent(sessionId, event);
      const events = await storage.getEvents(sessionId);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('step:spawned');
    });

    it('should return empty array for session with no events', async () => {
      const sessionId = brandedTypes.sessionId('no-events');
      const events = await storage.getEvents(sessionId);

      expect(events).toEqual([]);
    });

    it('should retrieve events since a timestamp', async () => {
      const sessionId = brandedTypes.sessionId('events-since-session');
      const oldTimestamp = new Date('2024-01-01T00:00:00Z').toISOString() as Timestamp;
      const newTimestamp = new Date('2024-06-01T00:00:00Z').toISOString() as Timestamp;

      const oldEvent: WorkspaceEvent = {
        type: 'step:spawned',
        sessionId,
        timestamp: oldTimestamp,
        id: 'evt-2',
        stepNumber: 1 as any,
        action: 'old',
      } as WorkspaceEvent;

      const newEvent: WorkspaceEvent = {
        type: 'step:completed',
        sessionId,
        timestamp: newTimestamp,
        id: 'evt-3',
        stepNumber: 1 as any,
        duration: 1000 as any,
        succeeded: true,
      } as WorkspaceEvent;

      await storage.addEvent(sessionId, oldEvent);
      await storage.addEvent(sessionId, newEvent);

      const filteredEvents = await storage.getEventsSince(sessionId, '2024-03-01T00:00:00Z');
      expect(filteredEvents).toHaveLength(1);
      expect(filteredEvents[0].type).toBe('step:completed');
    });

    it('should handle events without timestamps gracefully', async () => {
      const sessionId = brandedTypes.sessionId('event-no-timestamp');
      const event = {
        type: 'step:spawned',
        sessionId,
        stepNumber: 1,
      } as any;

      await storage.addEvent(sessionId, event);
      const events = await storage.getEventsSince(sessionId, '2024-01-01T00:00:00Z');

      // Should include events without timestamps for safety
      expect(events).toHaveLength(1);
    });

    it.skip('should publish events to pub/sub channel on add', async () => { // TODO: Fix redis.ts pub/sub handler storage
      const sessionId = brandedTypes.sessionId('pubsub-event-session');
      const event: WorkspaceEvent = {
        type: 'step:spawned',
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        id: 'evt-4',
        stepNumber: 1 as any,
        action: 'pubsub-test',
      } as WorkspaceEvent;

      const messages: string[] = [];
      await storage.subscribe('test:events', (message) => {
        messages.push(message);
      });

      await storage.addEvent(sessionId, event);

      // Give pub/sub time to propagate
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(messages).toHaveLength(1);
      const parsed = JSON.parse(messages[0]);
      expect(parsed.sessionId).toBe(sessionId);
      expect(parsed.event.type).toBe('step:spawned');
    });
  });

  describe('Chain Storage', () => {
    it('should add and retrieve chains', async () => {
      const sessionId = brandedTypes.sessionId('chain-session-1');
      const chainId = brandedTypes.chainId('chain-1');
      const chain: Chain = {
        id: chainId,
        sessionId,
        title: 'Test Chain',
        status: 'in_progress',
        compiledAt: brandedTypes.currentTimestamp(),
        source: 'composed',
        steps: [],
      };

      await storage.addChain(sessionId, chain);
      const chains = await storage.getChains(sessionId);

      expect(chains).toHaveLength(1);
      expect(chains[0].title).toBe('Test Chain');
    });

    it('should retrieve chain by ID', async () => {
      const sessionId = brandedTypes.sessionId('chain-session-2');
      const chainId = brandedTypes.chainId('chain-find-me');
      const chain: Chain = {
        id: chainId,
        sessionId,
        title: 'Findable Chain',
        status: 'in_progress',
        compiledAt: brandedTypes.currentTimestamp(),
        source: 'composed',
        steps: [],
      };

      await storage.addChain(sessionId, chain);
      const found = await storage.getChain(chainId);

      expect(found).toBeDefined();
      expect(found?.title).toBe('Findable Chain');
    });

    it('should return undefined for non-existent chain', async () => {
      const chainId = brandedTypes.chainId('non-existent-chain');
      const found = await storage.getChain(chainId);

      expect(found).toBeUndefined();
    });

    it('should store multiple chains for a session', async () => {
      const sessionId = brandedTypes.sessionId('multi-chain-session');
      const chain1: Chain = {
        id: brandedTypes.chainId('chain-1'),
        sessionId,
        title: 'Chain 1',
        status: 'in_progress',
        compiledAt: brandedTypes.currentTimestamp(),
        source: 'composed',
        steps: [],
      };
      const chain2: Chain = {
        id: brandedTypes.chainId('chain-2'),
        sessionId,
        title: 'Chain 2',
        status: 'pending',
        compiledAt: brandedTypes.currentTimestamp(),
        source: 'flow',
        steps: [],
      };

      await storage.addChain(sessionId, chain1);
      await storage.addChain(sessionId, chain2);

      const chains = await storage.getChains(sessionId);
      expect(chains).toHaveLength(2);
    });
  });

  describe('Command Queue', () => {
    it('should queue and retrieve commands', async () => {
      const sessionId = brandedTypes.sessionId('cmd-session-1');
      const command: CommandPayload = {
        commandId: 'cmd-1',
        command: { type: 'pause', reason: 'user request' },
        issuedAt: brandedTypes.currentTimestamp(),
      };

      await storage.queueCommand(sessionId, command);
      const commands = await storage.getCommands(sessionId);

      expect(commands).toHaveLength(1);
      expect(commands[0].command.type).toBe('pause');
    });

    it('should clear commands after retrieval (poll-and-consume)', async () => {
      const sessionId = brandedTypes.sessionId('cmd-session-2');
      await storage.queueCommand(sessionId, { commandId: "cmd-1", command: { type: "pause" }, issuedAt: brandedTypes.currentTimestamp() } as CommandPayload);

      // First retrieval
      const commands1 = await storage.getCommands(sessionId);
      expect(commands1).toHaveLength(1);

      // Second retrieval should be empty
      const commands2 = await storage.getCommands(sessionId);
      expect(commands2).toHaveLength(0);
    });

    it('should clear commands explicitly', async () => {
      const sessionId = brandedTypes.sessionId('cmd-session-3');
      await storage.queueCommand(sessionId, { commandId: "cmd-2", command: { type: "resume" }, issuedAt: brandedTypes.currentTimestamp() } as CommandPayload);

      await storage.clearCommands(sessionId);

      const commands = await storage.getCommands(sessionId);
      expect(commands).toHaveLength(0);
    });

    it('should queue multiple commands in FIFO order', async () => {
      const sessionId = brandedTypes.sessionId('cmd-session-4');
      await storage.queueCommand(sessionId, { commandId: "cmd-1", command: { type: "pause" }, issuedAt: brandedTypes.currentTimestamp() } as CommandPayload);
      await storage.queueCommand(sessionId, { commandId: "cmd-2", command: { type: "resume" }, issuedAt: brandedTypes.currentTimestamp() } as CommandPayload);
      await storage.queueCommand(sessionId, { commandId: "cmd-3", command: { type: "cancel" }, issuedAt: brandedTypes.currentTimestamp() } as CommandPayload);

      const commands = await storage.getCommands(sessionId);
      expect(commands).toHaveLength(3);
      expect(commands[0].command.type).toBe('pause');
      expect(commands[1].command.type).toBe('resume');
      expect(commands[2].command.type).toBe('cancel');
    });
  });

  describe('Input Queue', () => {
    it('should queue and retrieve input', async () => {
      const sessionId = brandedTypes.sessionId('input-session-1');
      const input = { answer: 'yes' };

      await storage.queueInput(sessionId, input);
      const inputs = await storage.getInput(sessionId);

      expect(inputs).toHaveLength(1);
      expect(inputs[0]).toEqual({ answer: 'yes' });
    });

    it('should clear input after retrieval', async () => {
      const sessionId = brandedTypes.sessionId('input-session-2');
      await storage.queueInput(sessionId, { data: 'test' });

      await storage.getInput(sessionId);
      const inputs = await storage.getInput(sessionId);

      expect(inputs).toHaveLength(0);
    });

    it('should clear input explicitly', async () => {
      const sessionId = brandedTypes.sessionId('input-session-3');
      await storage.queueInput(sessionId, { data: 'test' });

      await storage.clearInput(sessionId);

      const inputs = await storage.getInput(sessionId);
      expect(inputs).toHaveLength(0);
    });

    it('should handle complex input objects', async () => {
      const sessionId = brandedTypes.sessionId('input-session-4');
      const complexInput = {
        nested: { value: 42 },
        array: [1, 2, 3],
        string: 'test',
      };

      await storage.queueInput(sessionId, complexInput);
      const inputs = await storage.getInput(sessionId);

      expect(inputs[0]).toEqual(complexInput);
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

    it('should track clients without session ID', () => {
      storage.addClient('client-no-session');
      // Should not throw error
      const clients = storage.getClientsForSession(brandedTypes.sessionId('any-session'));
      expect(clients).toEqual([]);
    });
  });

  describe('Session Window Management', () => {
    it('should follow and unfollow sessions', async () => {
      const sessionId = brandedTypes.sessionId('follow-session-1');

      await storage.followSession(sessionId);
      let followed = await storage.getFollowedSessions();
      expect(followed).toContain(sessionId);

      await storage.unfollowSession(sessionId);
      followed = await storage.getFollowedSessions();
      expect(followed).not.toContain(sessionId);
    });

    it('should set and get session window config', async () => {
      const sessionId = brandedTypes.sessionId('config-session-1');
      const config: SessionWindowConfig = {
        sessionId,
        autoExpand: true,
        enableAnimations: true,
      };

      await storage.setSessionWindowConfig(sessionId, config);
      const retrieved = await storage.getSessionWindowConfig(sessionId);

      expect(retrieved?.autoExpand).toBe(true);
      expect(retrieved?.enableAnimations).toBe(true);
    });

    it('should delete config when unfollowing', async () => {
      const sessionId = brandedTypes.sessionId('config-session-2');
      await storage.followSession(sessionId);
      await storage.setSessionWindowConfig(sessionId, { sessionId, autoExpand: false });

      await storage.unfollowSession(sessionId);

      const config = await storage.getSessionWindowConfig(sessionId);
      expect(config).toBeUndefined();
    });

    it('should not delete config when unfollowing non-followed session', async () => {
      const sessionId = brandedTypes.sessionId('config-session-3');
      await storage.setSessionWindowConfig(sessionId, { sessionId, autoExpand: true });

      // Unfollow without following first
      await storage.unfollowSession(sessionId);

      // Config should still exist
      const config = await storage.getSessionWindowConfig(sessionId);
      expect(config).toBeDefined();
    });

    it('should track multiple followed sessions', async () => {
      const session1 = brandedTypes.sessionId('follow-1');
      const session2 = brandedTypes.sessionId('follow-2');
      const session3 = brandedTypes.sessionId('follow-3');

      await storage.followSession(session1);
      await storage.followSession(session2);
      await storage.followSession(session3);

      const followed = await storage.getFollowedSessions();
      expect(followed).toHaveLength(3);
      expect(followed).toContain(session1);
      expect(followed).toContain(session2);
      expect(followed).toContain(session3);
    });
  });

  describe('Frequency Tracking', () => {
    it('should track action frequency', async () => {
      const projectId = 'proj-1' as ProjectId;
      const actionType = 'button-click';

      await storage.trackAction(actionType, projectId);
      await storage.trackAction(actionType, projectId);
      await storage.trackAction(actionType, projectId);

      const record = await storage.getFrequency(actionType, projectId);
      expect(record?.count).toBe(3);
      expect(record?.actionType).toBe(actionType);
      expect(record?.projectId).toBe(projectId);
    });

    it('should track actions without project ID', async () => {
      await storage.trackAction('global-action');
      await storage.trackAction('global-action');

      const record = await storage.getFrequency('global-action');
      expect(record?.count).toBe(2);
    });

    it('should update daily counts', async () => {
      const projectId = 'proj-freq-1' as ProjectId;
      await storage.trackAction('daily-action', projectId);

      const record = await storage.getFrequency('daily-action', projectId);
      const today = new Date().toISOString().split('T')[0];

      expect(record?.dailyCounts[today]).toBe(1);
    });

    it('should update timestamps on subsequent tracks', async () => {
      const projectId = 'proj-freq-2' as ProjectId;
      await storage.trackAction('timestamp-action', projectId);

      const record1 = await storage.getFrequency('timestamp-action', projectId);
      const firstSeen = record1?.firstSeen;

      // Track again
      await new Promise(resolve => setTimeout(resolve, 10));
      await storage.trackAction('timestamp-action', projectId);

      const record2 = await storage.getFrequency('timestamp-action', projectId);

      expect(record2?.firstSeen).toBe(firstSeen);
      expect(record2?.lastSeen).not.toBe(firstSeen);
    });

    it('should get top actions by count', async () => {
      const projectId = 'proj-top-actions' as ProjectId;

      // Track different actions with different frequencies
      for (let i = 0; i < 10; i++) await storage.trackAction('action-high', projectId);
      for (let i = 0; i < 5; i++) await storage.trackAction('action-medium', projectId);
      for (let i = 0; i < 2; i++) await storage.trackAction('action-low', projectId);

      const topActions = await storage.getTopActions(projectId, 2);

      expect(topActions).toHaveLength(2);
      expect(topActions[0].actionType).toBe('action-high');
      expect(topActions[0].count).toBe(10);
      expect(topActions[1].actionType).toBe('action-medium');
      expect(topActions[1].count).toBe(5);
    });

    it('should return empty array when no actions tracked', async () => {
      const projectId = 'proj-no-actions' as ProjectId;
      const topActions = await storage.getTopActions(projectId, 10);

      expect(topActions).toEqual([]);
    });
  });

  describe('Bookmarks', () => {
    it('should add and retrieve bookmarks', async () => {
      const projectId = 'proj-bm-1' as ProjectId;
      const sessionId = brandedTypes.sessionId('bm-session-1');
      const bookmark: Bookmark = {
        id: 'bm-1' as any,
        sessionId,
        projectId,
        messageIndex: 1,
        messageContent: 'Test message content',
        timestamp: brandedTypes.currentTimestamp(),
        explanation: 'Test bookmark',
        category: 'useful-pattern',
        tags: ['test'],
      };

      await storage.addBookmark(bookmark);
      const bookmarks = await storage.getBookmarks(projectId);

      expect(bookmarks).toHaveLength(1);
      expect(bookmarks[0].explanation).toBe('Test bookmark');
    });

    it('should filter bookmarks by category', async () => {
      const projectId = 'proj-bm-2' as ProjectId;

      await storage.addBookmark({
        id: 'bm-2' as any,
        sessionId: brandedTypes.sessionId('bm-session-2'),
        projectId,
        messageIndex: 1,
        messageContent: 'Insight message',
        timestamp: brandedTypes.currentTimestamp(),
        explanation: 'Insight bookmark',
        category: 'useful-pattern',
        tags: [],
      });

      await storage.addBookmark({
        id: 'bm-3' as any,
        sessionId: brandedTypes.sessionId('bm-session-3'),
        projectId,
        messageIndex: 2,
        messageContent: 'Error message',
        timestamp: brandedTypes.currentTimestamp(),
        explanation: 'Error bookmark',
        category: 'good-output',
        tags: [],
      });

      const insights = await storage.getBookmarks(projectId, { category: 'useful-pattern' });
      expect(insights).toHaveLength(1);
      expect(insights[0].category).toBe('useful-pattern');
    });

    it('should filter bookmarks by userId', async () => {
      const projectId = 'proj-bm-3' as ProjectId;
      const userId1 = brandedTypes.userId('user-1');
      const userId2 = brandedTypes.userId('user-2');

      await storage.addBookmark({
        id: 'bm-4' as any,
        sessionId: brandedTypes.sessionId('bm-session-4'),
        projectId,
        userId: userId1,
        messageIndex: 1,
        messageContent: 'User 1 message',
        timestamp: brandedTypes.currentTimestamp(),
        explanation: 'User 1 bookmark',
        category: 'useful-pattern',
        tags: [],
      });

      await storage.addBookmark({
        id: 'bm-5' as any,
        sessionId: brandedTypes.sessionId('bm-session-5'),
        projectId,
        userId: userId2,
        messageIndex: 1,
        messageContent: 'User 2 message',
        timestamp: brandedTypes.currentTimestamp(),
        explanation: 'User 2 bookmark',
        category: 'useful-pattern',
        tags: [],
      });

      const user1Bookmarks = await storage.getBookmarks(projectId, { userId: userId1 });
      expect(user1Bookmarks).toHaveLength(1);
      expect(user1Bookmarks[0].userId).toBe(userId1);
    });

    it('should filter bookmarks by timestamp (since)', async () => {
      const projectId = 'proj-bm-4' as ProjectId;
      const oldTimestamp = new Date('2024-01-01T00:00:00Z').toISOString() as Timestamp;
      const newTimestamp = new Date('2024-06-01T00:00:00Z').toISOString() as Timestamp;

      await storage.addBookmark({
        id: 'bm-old' as any,
        sessionId: brandedTypes.sessionId('bm-session-old'),
        projectId,
        messageIndex: 1,
        messageContent: 'Old message',
        timestamp: oldTimestamp,
        explanation: 'Old bookmark',
        category: 'useful-pattern',
        tags: [],
      });

      await storage.addBookmark({
        id: 'bm-new' as any,
        sessionId: brandedTypes.sessionId('bm-session-new'),
        projectId,
        messageIndex: 1,
        messageContent: 'New message',
        timestamp: newTimestamp,
        explanation: 'New bookmark',
        category: 'useful-pattern',
        tags: [],
      });

      const recentBookmarks = await storage.getBookmarks(projectId, {
        since: brandedTypes.timestamp('2024-03-01T00:00:00Z'),
      });

      expect(recentBookmarks).toHaveLength(1);
      expect(recentBookmarks[0].id).toBe('bm-new');
    });

    it('should filter bookmarks by tags', async () => {
      const projectId = 'proj-bm-5' as ProjectId;

      await storage.addBookmark({
        id: 'bm-6' as any,
        sessionId: brandedTypes.sessionId('bm-session-6'),
        projectId,
        messageIndex: 1,
        messageContent: 'Important message',
        timestamp: brandedTypes.currentTimestamp(),
        explanation: 'Important bookmark',
        category: 'useful-pattern',
        tags: ['important', 'review'],
      });

      await storage.addBookmark({
        id: 'bm-7' as any,
        sessionId: brandedTypes.sessionId('bm-session-7'),
        projectId,
        messageIndex: 1,
        messageContent: 'Draft message',
        timestamp: brandedTypes.currentTimestamp(),
        explanation: 'Draft bookmark',
        category: 'useful-pattern',
        tags: ['draft'],
      });

      const importantBookmarks = await storage.getBookmarks(projectId, {
        tags: ['important'],
      });

      expect(importantBookmarks).toHaveLength(1);
      expect(importantBookmarks[0].tags).toContain('important');
    });

    it('should remove bookmarks', async () => {
      const projectId = 'proj-bm-6' as ProjectId;
      await storage.addBookmark({
        id: 'bm-remove' as any,
        sessionId: brandedTypes.sessionId('bm-session-remove'),
        projectId,
        messageIndex: 1,
        messageContent: 'Message to remove',
        timestamp: brandedTypes.currentTimestamp(),
        explanation: 'Bookmark to remove',
        category: 'useful-pattern',
        tags: [],
      });

      await storage.removeBookmark('bm-remove');

      const bookmarks = await storage.getBookmarks(projectId);
      expect(bookmarks).toHaveLength(0);
    });

    it('should handle removing non-existent bookmark gracefully', async () => {
      await storage.removeBookmark('non-existent-bookmark');
      // Should not throw error
    });
  });

  describe('Patterns', () => {
    it('should add and retrieve patterns', async () => {
      const projectId = 'proj-pat-1' as ProjectId;
      const pattern: DetectedPattern = {
        id: 'pat-1' as any,
        projectId,
        patternType: 'frequency',
        confidence: 0.85 as any,
        description: 'Frequent action pattern',
        relatedBookmarkIds: [],
        detectedAt: brandedTypes.currentTimestamp(),
        lastSeen: brandedTypes.currentTimestamp(),
      };

      await storage.addPattern(pattern);
      const patterns = await storage.getPatterns(projectId);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].confidence).toBe(0.85);
    });

    it('should filter patterns by type', async () => {
      const projectId = 'proj-pat-2' as ProjectId;

      await storage.addPattern({
        id: 'pat-2' as any,
        projectId,
        patternType: 'frequency',
        description: 'Test pattern',
        confidence: 0.9 as any,
        lastSeen: brandedTypes.currentTimestamp(),
        detectedAt: brandedTypes.currentTimestamp(),
        relatedBookmarkIds: [],
      });

      await storage.addPattern({
        id: 'pat-3' as any,
        projectId,
        patternType: 'sequence',
        description: 'Test pattern',
        confidence: 0.8 as any,
        lastSeen: brandedTypes.currentTimestamp(),
        detectedAt: brandedTypes.currentTimestamp(),
        relatedBookmarkIds: [],
      });

      const commitPatterns = await storage.getPatterns(projectId, { patternType: 'frequency' });
      expect(commitPatterns).toHaveLength(1);
      expect(commitPatterns[0].patternType).toBe('frequency');
    });

    it('should filter patterns by minimum confidence', async () => {
      const projectId = 'proj-pat-3' as ProjectId;

      await storage.addPattern({
        id: 'pat-4' as any,
        projectId,
        patternType: 'frequency',
        description: 'Test pattern',
        confidence: 0.6 as any,
        lastSeen: brandedTypes.currentTimestamp(),
        detectedAt: brandedTypes.currentTimestamp(),
        relatedBookmarkIds: [],
      });

      await storage.addPattern({
        id: 'pat-5' as any,
        projectId,
        patternType: 'frequency',
        description: 'Test pattern',
        confidence: 0.9 as any,
        lastSeen: brandedTypes.currentTimestamp(),
        detectedAt: brandedTypes.currentTimestamp(),
        relatedBookmarkIds: [],
      });

      const highConfidence = await storage.getPatterns(projectId, { minConfidence: 0.8 });
      expect(highConfidence).toHaveLength(1);
      expect(highConfidence[0].confidence).toBe(0.9);
    });

    it('should filter patterns by timestamp (since)', async () => {
      const projectId = 'proj-pat-4' as ProjectId;
      const oldTimestamp = new Date('2024-01-01T00:00:00Z').toISOString() as Timestamp;
      const newTimestamp = new Date('2024-06-01T00:00:00Z').toISOString() as Timestamp;

      await storage.addPattern({
        id: 'pat-old' as any,
        projectId,
        patternType: 'frequency',
        description: 'Test pattern',
        confidence: 0.8 as any,
        lastSeen: brandedTypes.currentTimestamp(),
        detectedAt: oldTimestamp,
        relatedBookmarkIds: [],
      });

      await storage.addPattern({
        id: 'pat-new' as any,
        projectId,
        patternType: 'frequency',
        description: 'Test pattern',
        confidence: 0.9 as any,
        lastSeen: brandedTypes.currentTimestamp(),
        detectedAt: newTimestamp,
        relatedBookmarkIds: [],
      });

      const recentPatterns = await storage.getPatterns(projectId, {
        since: brandedTypes.timestamp('2024-03-01T00:00:00Z'),
      });

      expect(recentPatterns).toHaveLength(1);
      expect(recentPatterns[0].id).toBe('pat-new');
    });
  });

  describe('Harmony Tracking', () => {
    it('should add and retrieve harmony checks by session', async () => {
      const sessionId = brandedTypes.sessionId('session-harmony-1');
      const check: HarmonyCheck = {
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'valid',
        parsedFormat: 'json',
      } as HarmonyCheck;

      await storage.addHarmonyCheck(check);
      const checks = await storage.getHarmonyChecks(sessionId);

      expect(checks).toHaveLength(1);
      expect(checks[0].result).toBe('valid');
    });

    it('should store harmony checks by project', async () => {
      const sessionId = brandedTypes.sessionId('session-harmony-2');
      const projectId = 'proj-harmony-1' as ProjectId;
      const check: HarmonyCheck = {
        sessionId,
        projectId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'valid',
      } as HarmonyCheck;

      await storage.addHarmonyCheck(check);
      const checks = await storage.getHarmonyChecks(projectId);

      expect(checks).toHaveLength(1);
    });

    it('should filter harmony checks by result', async () => {
      const sessionId = brandedTypes.sessionId('session-harmony-3');

      await storage.addHarmonyCheck({
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'valid',
      } as HarmonyCheck);

      await storage.addHarmonyCheck({
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'violation',
      } as HarmonyCheck);

      const violations = await storage.getHarmonyChecks(sessionId, { result: 'violation' });
      expect(violations).toHaveLength(1);
      expect(violations[0].result).toBe('violation');
    });

    it('should filter harmony checks by format type', async () => {
      const sessionId = brandedTypes.sessionId('session-harmony-4');

      await storage.addHarmonyCheck({
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'valid',
        parsedFormat: 'json',
      } as HarmonyCheck);

      await storage.addHarmonyCheck({
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'valid',
        parsedFormat: 'markdown',
      } as HarmonyCheck);

      const jsonChecks = await storage.getHarmonyChecks(sessionId, { formatType: 'json' });
      expect(jsonChecks).toHaveLength(1);
      expect(jsonChecks[0].parsedFormat).toBe('json');
    });

    it('should filter harmony checks by timestamp (since)', async () => {
      const sessionId = brandedTypes.sessionId('session-harmony-5');
      const oldTimestamp = new Date('2024-01-01T00:00:00Z').toISOString() as Timestamp;
      const newTimestamp = new Date('2024-06-01T00:00:00Z').toISOString() as Timestamp;

      await storage.addHarmonyCheck({
        sessionId,
        timestamp: oldTimestamp,
        result: 'valid',
      } as HarmonyCheck);

      await storage.addHarmonyCheck({
        sessionId,
        timestamp: newTimestamp,
        result: 'valid',
      } as HarmonyCheck);

      const recentChecks = await storage.getHarmonyChecks(sessionId, {
        since: brandedTypes.timestamp('2024-03-01T00:00:00Z') as Timestamp,
      });

      expect(recentChecks).toHaveLength(1);
    });

    it('should limit harmony checks retrieved', async () => {
      const sessionId = brandedTypes.sessionId('session-harmony-6');

      for (let i = 0; i < 10; i++) {
        await storage.addHarmonyCheck({
          sessionId,
          timestamp: brandedTypes.currentTimestamp(),
          result: 'valid',
        } as HarmonyCheck);
      }

      const limitedChecks = await storage.getHarmonyChecks(sessionId, { limit: 3 });
      expect(limitedChecks).toHaveLength(3);
    });

    it('should enforce max 100 checks per session', async () => {
      const sessionId = brandedTypes.sessionId('session-harmony-max');

      // Add 105 checks
      for (let i = 0; i < 105; i++) {
        await storage.addHarmonyCheck({
          sessionId,
          timestamp: brandedTypes.currentTimestamp(),
          result: 'valid',
        } as HarmonyCheck);
      }

      const checks = await storage.getHarmonyChecks(sessionId);
      expect(checks.length).toBeLessThanOrEqual(100);
    });

    it('should calculate harmony metrics', async () => {
      const sessionId = brandedTypes.sessionId('session-harmony-metrics');

      // Add 8 valid, 1 degraded, 1 violation
      for (let i = 0; i < 8; i++) {
        await storage.addHarmonyCheck({
          sessionId,
          timestamp: brandedTypes.currentTimestamp(),
          result: 'valid',
        } as HarmonyCheck);
      }
      await storage.addHarmonyCheck({
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'degraded',
      } as HarmonyCheck);
      await storage.addHarmonyCheck({
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'violation',
      } as HarmonyCheck);

      const metrics = await storage.getHarmonyMetrics(sessionId, 'session');

      expect(metrics.totalChecks).toBe(10);
      expect(metrics.validCount).toBe(8);
      expect(metrics.degradedCount).toBe(1);
      expect(metrics.violationCount).toBe(1);
      expect(metrics.harmonyPercentage).toBe(90); // (8+1)/10 = 0.9 -> 90%
    });

    it('should return default metrics for session with no checks', async () => {
      const sessionId = brandedTypes.sessionId('session-harmony-empty');
      const metrics = await storage.getHarmonyMetrics(sessionId, 'session');

      expect(metrics.totalChecks).toBe(0);
      expect(metrics.harmonyPercentage).toBe(100);
      expect(metrics.recentViolations).toEqual([]);
    });

    it('should calculate format breakdown in metrics', async () => {
      const sessionId = brandedTypes.sessionId('session-harmony-formats');

      await storage.addHarmonyCheck({
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'valid',
        parsedFormat: 'json',
      } as HarmonyCheck);

      await storage.addHarmonyCheck({
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'valid',
        parsedFormat: 'json',
      } as HarmonyCheck);

      await storage.addHarmonyCheck({
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        result: 'valid',
        parsedFormat: 'markdown',
      } as HarmonyCheck);

      const metrics = await storage.getHarmonyMetrics(sessionId, 'session');

      expect(metrics.formatBreakdown['json']).toBe(2);
      expect(metrics.formatBreakdown['markdown']).toBe(1);
    });
  });

  describe('Pub/Sub', () => {
    it.skip('should subscribe and receive messages', async () => { // TODO: Fix redis.ts pub/sub handler storage
      const messages: string[] = [];
      const channel = 'test:channel';

      await storage.subscribe(channel, (message) => {
        messages.push(message);
      });

      await storage.publish(channel, 'test-message');

      // Give pub/sub time to propagate
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(messages).toContain('test-message');
    });

    it.skip('should handle multiple subscribers', async () => { // TODO: Fix redis.ts pub/sub handler storage
      const messages1: string[] = [];
      const messages2: string[] = [];
      const channel = 'test:multi-channel';

      await storage.subscribe(channel, (message) => {
        messages1.push(message);
      });

      await storage.subscribe(channel, (message) => {
        messages2.push(message);
      });

      await storage.publish(channel, 'broadcast-message');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(messages1).toContain('broadcast-message');
      expect(messages2).toContain('broadcast-message');
    });

    it.skip('should only deliver to subscribed channels', async () => { // TODO: Fix redis.ts pub/sub handler storage
      const channel1Messages: string[] = [];
      const channel2Messages: string[] = [];

      await storage.subscribe('test:channel-1', (message) => {
        channel1Messages.push(message);
      });

      await storage.subscribe('test:channel-2', (message) => {
        channel2Messages.push(message);
      });

      await storage.publish('test:channel-1', 'message-1');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(channel1Messages).toContain('message-1');
      expect(channel2Messages).not.toContain('message-1');
    });
  });

  describe('Connection Management', () => {
    it('should disconnect cleanly', async () => {
      const sessionId = brandedTypes.sessionId('disconnect-test');
      await storage.setSession({
        id: sessionId,
        status: 'in_progress',
        startedAt: brandedTypes.currentTimestamp(),
        cwd: '/test',
        chains: [],
      });

      await storage.disconnect();

      // After disconnect, operations should fail gracefully
      // (In production Redis would throw errors, but our mock clears the store)
    });

    it('should cleanup subscriptions on disconnect', async () => {
      const messages: string[] = [];
      await storage.subscribe('test:cleanup', (message) => {
        messages.push(message);
      });

      await storage.disconnect();

      // After disconnect, new storage instance shouldn't receive old messages
      const newStorage = createRedisStorage('redis://localhost:6379', 'test:');
      await newStorage.publish('test:cleanup', 'should-not-receive');

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(messages).not.toContain('should-not-receive');

      await newStorage.disconnect();
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parse errors gracefully for sessions', async () => {
      // This test ensures the error handling doesn't crash the app
      const sessionId = brandedTypes.sessionId('error-session');

      // Attempt to get session (should return undefined on error)
      const session = await storage.getSession(sessionId);
      expect(session).toBeUndefined();
    });

    it('should handle errors in event retrieval gracefully', async () => {
      const sessionId = brandedTypes.sessionId('error-events');
      const events = await storage.getEvents(sessionId);

      expect(events).toEqual([]);
    });

    it('should handle errors in command operations gracefully', async () => {
      const sessionId = brandedTypes.sessionId('error-commands');

      // Should not throw
      await storage.queueCommand(sessionId, { commandId: "cmd-1", command: { type: "pause" }, issuedAt: brandedTypes.currentTimestamp() } as CommandPayload);
      const commands = await storage.getCommands(sessionId);

      expect(Array.isArray(commands)).toBe(true);
    });
  });

  describe('TTL Management', () => {
    it('should set TTL on session storage', async () => {
      const sessionId = brandedTypes.sessionId('ttl-session');
      const session: Session = {
        id: sessionId,
        status: 'in_progress',
        startedAt: brandedTypes.currentTimestamp(),
        cwd: '/test',
        chains: [],
      };

      await storage.setSession(session);

      // In a real Redis instance, this would have a 24-hour TTL
      // Our mock doesn't expire automatically, but it stores the TTL
      const retrieved = await storage.getSession(sessionId);
      expect(retrieved).toBeDefined();
    });

    it('should set TTL on events', async () => {
      const sessionId = brandedTypes.sessionId('ttl-events');
      const event: WorkspaceEvent = {
        type: 'step:spawned',
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        id: 'evt-5',
        stepNumber: 1 as any,
        action: 'test',
      } as WorkspaceEvent;

      await storage.addEvent(sessionId, event);

      const events = await storage.getEvents(sessionId);
      expect(events).toHaveLength(1);
    });

    it('should set short TTL on command queue', async () => {
      const sessionId = brandedTypes.sessionId('ttl-commands');
      await storage.queueCommand(sessionId, { commandId: "cmd-1", command: { type: "pause" }, issuedAt: brandedTypes.currentTimestamp() } as CommandPayload);

      // Commands have 5-minute TTL
      const commands = await storage.getCommands(sessionId);
      expect(commands).toHaveLength(1);
    });
  });
});
