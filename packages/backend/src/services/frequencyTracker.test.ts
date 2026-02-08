import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FrequencyTracker, FREQUENCY_CONFIG } from './frequencyTracker.js';
import type { Storage } from '../storage/index.js';
import type { FrequencyRecord, ProjectId } from '@afw/shared';

describe('FrequencyTracker', () => {
  let tracker: FrequencyTracker;
  let mockStorage: Storage;

  beforeEach(() => {
    // Create mock storage with all required methods
    mockStorage = {
      // Session storage
      getSession: vi.fn(),
      setSession: vi.fn(),
      deleteSession: vi.fn(),

      // User session tracking
      getSessionsByUser: vi.fn(),
      getUsersWithActiveSessions: vi.fn(),

      // Events storage
      addEvent: vi.fn(),
      getEvents: vi.fn(),
      getEventsSince: vi.fn(),

      // Chains storage
      addChain: vi.fn(),
      getChains: vi.fn(),
      getChain: vi.fn(),

      // Commands queue per session
      queueCommand: vi.fn(),
      getCommands: vi.fn(),
      clearCommands: vi.fn(),

      // Input queue per session
      queueInput: vi.fn(),
      getInput: vi.fn(),
      clearInput: vi.fn(),

      // Connected WebSocket clients
      addClient: vi.fn(),
      removeClient: vi.fn(),
      getClientsForSession: vi.fn(),

      // Session window storage
      followSession: vi.fn(),
      unfollowSession: vi.fn(),
      getFollowedSessions: vi.fn(),
      setSessionWindowConfig: vi.fn(),
      getSessionWindowConfig: vi.fn(),

      // Frequency tracking
      trackAction: vi.fn(),
      getFrequency: vi.fn(),
      getTopActions: vi.fn(),

      // Bookmarks
      addBookmark: vi.fn(),
      getBookmarks: vi.fn(),
      removeBookmark: vi.fn(),

      // Patterns (detected)
      addPattern: vi.fn(),
      getPatterns: vi.fn(),
    } as unknown as Storage;

    tracker = new FrequencyTracker(mockStorage);
  });

  describe('track', () => {
    it('should call storage.trackAction', async () => {
      const projectId = 'proj-123' as ProjectId;
      const actionType = 'button-click';

      const mockRecord: FrequencyRecord = {
        actionType,
        projectId,
        count: 1,
        firstSeen: new Date().toISOString() as any,
        lastSeen: new Date().toISOString() as any,
        dailyCounts: { [new Date().toISOString().split('T')[0]]: 1 },
      };

      (mockStorage.trackAction as any).mockResolvedValue(undefined);
      (mockStorage.getFrequency as any).mockResolvedValue(mockRecord);

      await tracker.track(actionType, projectId);

      expect(mockStorage.trackAction).toHaveBeenCalledWith(actionType, projectId, undefined);
    });

    it('should return updated frequency record', async () => {
      const projectId = 'proj-123' as ProjectId;
      const actionType = 'button-click';

      const mockRecord: FrequencyRecord = {
        actionType,
        projectId,
        count: 3,
        firstSeen: new Date().toISOString() as any,
        lastSeen: new Date().toISOString() as any,
        dailyCounts: { [new Date().toISOString().split('T')[0]]: 3 },
      };

      (mockStorage.trackAction as any).mockResolvedValue(undefined);
      (mockStorage.getFrequency as any).mockResolvedValue(mockRecord);

      const result = await tracker.track(actionType, projectId);

      expect(result.count).toBe(3);
      expect(result.actionType).toBe(actionType);
    });
  });

  describe('isPatternCandidate', () => {
    it('should return true when count >= patternThreshold', () => {
      const record: FrequencyRecord = {
        actionType: 'test',
        count: FREQUENCY_CONFIG.patternThreshold,
        firstSeen: new Date().toISOString() as any,
        lastSeen: new Date().toISOString() as any,
        dailyCounts: {},
      };

      expect(tracker.isPatternCandidate(record)).toBe(true);
    });

    it('should return false when count < patternThreshold', () => {
      const record: FrequencyRecord = {
        actionType: 'test',
        count: FREQUENCY_CONFIG.patternThreshold - 1,
        firstSeen: new Date().toISOString() as any,
        lastSeen: new Date().toISOString() as any,
        dailyCounts: {},
      };

      expect(tracker.isPatternCandidate(record)).toBe(false);
    });
  });

  describe('isToolbarCandidate', () => {
    it('should return true when count >= toolbarThreshold', () => {
      const record: FrequencyRecord = {
        actionType: 'test',
        count: FREQUENCY_CONFIG.toolbarThreshold,
        firstSeen: new Date().toISOString() as any,
        lastSeen: new Date().toISOString() as any,
        dailyCounts: {},
      };

      expect(tracker.isToolbarCandidate(record)).toBe(true);
    });

    it('should return false when count < toolbarThreshold', () => {
      const record: FrequencyRecord = {
        actionType: 'test',
        count: FREQUENCY_CONFIG.toolbarThreshold - 1,
        firstSeen: new Date().toISOString() as any,
        lastSeen: new Date().toISOString() as any,
        dailyCounts: {},
      };

      expect(tracker.isToolbarCandidate(record)).toBe(false);
    });
  });

  describe('getTrend', () => {
    it('should return last 7 days of counts by default', () => {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(new Date().setDate(new Date().getDate() - 1))
        .toISOString()
        .split('T')[0];

      const record: FrequencyRecord = {
        actionType: 'test',
        count: 5,
        firstSeen: new Date().toISOString() as any,
        lastSeen: new Date().toISOString() as any,
        dailyCounts: {
          [today]: 3,
          [yesterday]: 2,
        },
      };

      const trend = tracker.getTrend(record);

      expect(trend).toHaveLength(7);
      expect(trend[6]).toBe(3); // today should be last
      expect(trend[5]).toBe(2); // yesterday
    });

    it('should return specified number of days', () => {
      const record: FrequencyRecord = {
        actionType: 'test',
        count: 1,
        firstSeen: new Date().toISOString() as any,
        lastSeen: new Date().toISOString() as any,
        dailyCounts: {},
      };

      const trend = tracker.getTrend(record, 3);

      expect(trend).toHaveLength(3);
    });
  });

  describe('cleanup', () => {
    it('should remove daily counts older than retention period', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - FREQUENCY_CONFIG.retentionDays - 1);
      const oldDateStr = oldDate.toISOString().split('T')[0];

      const recentDate = new Date().toISOString().split('T')[0];

      const record: FrequencyRecord = {
        actionType: 'test',
        count: 10,
        firstSeen: oldDate.toISOString() as any,
        lastSeen: new Date().toISOString() as any,
        dailyCounts: {
          [oldDateStr]: 5,
          [recentDate]: 5,
        },
      };

      const cleaned = await tracker.cleanup(record);

      expect(cleaned.dailyCounts[oldDateStr]).toBeUndefined();
      expect(cleaned.dailyCounts[recentDate]).toBe(5);
    });
  });

  describe('getTopActions', () => {
    it('should call storage.getTopActions with correct parameters', async () => {
      const projectId = 'proj-123' as ProjectId;

      (mockStorage.getTopActions as any).mockResolvedValue([]);

      await tracker.getTopActions(projectId, 5);

      expect(mockStorage.getTopActions).toHaveBeenCalledWith(projectId, 5);
    });

    it('should use default limit of 10 if not specified', async () => {
      const projectId = 'proj-123' as ProjectId;

      (mockStorage.getTopActions as any).mockResolvedValue([]);

      await tracker.getTopActions(projectId);

      expect(mockStorage.getTopActions).toHaveBeenCalledWith(projectId, 10);
    });
  });

  describe('query', () => {
    it('should filter records by minCount', async () => {
      const projectId = 'proj-123' as ProjectId;

      const records: FrequencyRecord[] = [
        {
          actionType: 'action1',
          projectId,
          count: 10,
          firstSeen: new Date().toISOString() as any,
          lastSeen: new Date().toISOString() as any,
          dailyCounts: {},
        },
        {
          actionType: 'action2',
          projectId,
          count: 2,
          firstSeen: new Date().toISOString() as any,
          lastSeen: new Date().toISOString() as any,
          dailyCounts: {},
        },
      ];

      (mockStorage.getTopActions as any).mockResolvedValue(records);

      const result = await tracker.query({
        projectId,
        minCount: 5,
      });

      expect(result).toHaveLength(1);
      expect(result[0].actionType).toBe('action1');
    });

    it('should sort by count descending by default', async () => {
      const projectId = 'proj-123' as ProjectId;

      const records: FrequencyRecord[] = [
        {
          actionType: 'action1',
          projectId,
          count: 5,
          firstSeen: new Date().toISOString() as any,
          lastSeen: new Date().toISOString() as any,
          dailyCounts: {},
        },
        {
          actionType: 'action2',
          projectId,
          count: 10,
          firstSeen: new Date().toISOString() as any,
          lastSeen: new Date().toISOString() as any,
          dailyCounts: {},
        },
      ];

      (mockStorage.getTopActions as any).mockResolvedValue(records);

      const result = await tracker.query({
        projectId,
      });

      expect(result[0].count).toBe(10);
      expect(result[1].count).toBe(5);
    });

    it('should sort by lastSeen when orderBy is specified', async () => {
      const projectId = 'proj-123' as ProjectId;

      const oldDate = new Date(new Date().getTime() - 86400000).toISOString() as any;
      const newDate = new Date().toISOString() as any;

      const records: FrequencyRecord[] = [
        {
          actionType: 'action1',
          projectId,
          count: 10,
          firstSeen: oldDate,
          lastSeen: oldDate,
          dailyCounts: {},
        },
        {
          actionType: 'action2',
          projectId,
          count: 5,
          firstSeen: newDate,
          lastSeen: newDate,
          dailyCounts: {},
        },
      ];

      (mockStorage.getTopActions as any).mockResolvedValue(records);

      const result = await tracker.query({
        projectId,
        orderBy: 'lastSeen',
      });

      expect(result[0].actionType).toBe('action2'); // newest first
      expect(result[1].actionType).toBe('action1'); // oldest second
    });
  });
});
