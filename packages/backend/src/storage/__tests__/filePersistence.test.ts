import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Session, WorkspaceEvent, SessionId, Timestamp } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import * as path from 'path';

// Mock fs/promises before imports
vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    readdir: vi.fn(),
    rm: vi.fn(),
  },
}));

// Import after mocking
import { FilePersistence, type SessionSnapshot } from '../file-persistence.js';

describe('FilePersistence', () => {
  let persistence: FilePersistence;
  let testSession: Session;
  let testEvents: WorkspaceEvent[];
  let sessionId: SessionId;
  let fs: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get mocked fs module
    const fsModule = await import('fs/promises');
    fs = fsModule.default;

    persistence = new FilePersistence();
    sessionId = brandedTypes.sessionId('test-session-123');

    testSession = {
      id: sessionId,
      status: 'in_progress' as const,
      startedAt: brandedTypes.currentTimestamp(),
      cwd: '/test/project',
      chains: [],
    };

    testEvents = [
      {
        type: 'session:started',
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        cwd: '/test/project',
      } as WorkspaceEvent,
      {
        type: 'step:spawned',
        sessionId,
        timestamp: brandedTypes.currentTimestamp(),
        stepNumber: 1 as any,
        action: 'test-action',
      } as WorkspaceEvent,
    ];

    // Default mock implementations
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);
    fs.readdir.mockResolvedValue([]);
  });

  describe('saveSession', () => {
    it('should create directory structure for the date', async () => {
      const now = new Date('2026-02-08T12:00:00Z');
      vi.setSystemTime(now);

      await persistence.saveSession(sessionId, testSession, testEvents);

      const expectedPath = path.join(process.cwd(), 'data', 'history', '2026-02-08');
      expect(fs.mkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });

      vi.useRealTimers();
    });

    it('should write session snapshot to JSON file', async () => {
      const now = new Date('2026-02-08T15:30:00Z');
      vi.setSystemTime(now);

      await persistence.saveSession(sessionId, testSession, testEvents);

      const expectedPath = path.join(
        process.cwd(),
        'data',
        'history',
        '2026-02-08',
        `${sessionId}.json`
      );

      expect(fs.writeFile).toHaveBeenCalledWith(
        expectedPath,
        expect.stringContaining(sessionId),
        'utf-8'
      );

      vi.useRealTimers();
    });

    it('should include savedAt timestamp in snapshot', async () => {
      const now = new Date('2026-02-08T20:00:00Z');
      vi.setSystemTime(now);

      await persistence.saveSession(sessionId, testSession, testEvents);

      const writeCall = fs.writeFile.mock.calls[0];
      const writtenData = JSON.parse(writeCall[1]);

      expect(writtenData).toHaveProperty('savedAt');
      expect(writtenData.savedAt).toBe(now.toISOString());

      vi.useRealTimers();
    });

    it('should save session and events in snapshot', async () => {
      await persistence.saveSession(sessionId, testSession, testEvents);

      const writeCall = fs.writeFile.mock.calls[0];
      const writtenData: SessionSnapshot = JSON.parse(writeCall[1]);

      expect(writtenData.session).toEqual(testSession);
      expect(writtenData.events).toEqual(testEvents);
    });

    it('should format JSON with indentation', async () => {
      await persistence.saveSession(sessionId, testSession, testEvents);

      const writeCall = fs.writeFile.mock.calls[0];
      const jsonString = writeCall[1];

      // Should be pretty-printed with 2-space indentation
      expect(jsonString).toContain('\n');
      expect(jsonString).toMatch(/  "/); // Check for indentation
    });

    it('should handle EEXIST error when directory exists', async () => {
      const existsError = Object.assign(new Error('Directory exists'), { code: 'EEXIST' });
      fs.mkdir.mockRejectedValueOnce(existsError);

      await expect(
        persistence.saveSession(sessionId, testSession, testEvents)
      ).resolves.not.toThrow();
    });

    it('should propagate non-EEXIST errors', async () => {
      const otherError = Object.assign(new Error('Permission denied'), { code: 'EACCES' });
      fs.mkdir.mockRejectedValue(otherError);

      await expect(
        persistence.saveSession(sessionId, testSession, testEvents)
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('loadSession', () => {
    it('should load session snapshot from current date by default', async () => {
      const now = new Date('2026-02-10T10:00:00Z');
      vi.setSystemTime(now);

      const mockSnapshot: SessionSnapshot = {
        session: testSession,
        events: testEvents,
        savedAt: now.toISOString(),
      };

      fs.readFile.mockResolvedValue(JSON.stringify(mockSnapshot));

      const result = await persistence.loadSession(sessionId);

      const expectedPath = path.join(
        process.cwd(),
        'data',
        'history',
        '2026-02-10',
        `${sessionId}.json`
      );

      expect(fs.readFile).toHaveBeenCalledWith(expectedPath, 'utf-8');
      expect(result).toEqual(mockSnapshot);

      vi.useRealTimers();
    });

    it('should load session snapshot from specified date', async () => {
      const targetDate = new Date('2026-01-15T00:00:00Z');
      const mockSnapshot: SessionSnapshot = {
        session: testSession,
        events: testEvents,
        savedAt: targetDate.toISOString(),
      };

      fs.readFile.mockResolvedValue(JSON.stringify(mockSnapshot));

      const result = await persistence.loadSession(sessionId, targetDate);

      const expectedPath = path.join(
        process.cwd(),
        'data',
        'history',
        '2026-01-15',
        `${sessionId}.json`
      );

      expect(fs.readFile).toHaveBeenCalledWith(expectedPath, 'utf-8');
      expect(result).toEqual(mockSnapshot);
    });

    it('should return null when file does not exist', async () => {
      const notFoundError = Object.assign(new Error('File not found'), { code: 'ENOENT' });
      fs.readFile.mockRejectedValue(notFoundError);

      const result = await persistence.loadSession(sessionId);

      expect(result).toBeNull();
    });

    it('should propagate non-ENOENT errors', async () => {
      const permissionError = Object.assign(new Error('Permission denied'), { code: 'EACCES' });
      fs.readFile.mockRejectedValue(permissionError);

      await expect(persistence.loadSession(sessionId)).rejects.toThrow('Permission denied');
    });

    it('should parse JSON correctly', async () => {
      const mockSnapshot: SessionSnapshot = {
        session: {
          ...testSession,
          metadata: { key: 'value' },
        },
        events: testEvents,
        savedAt: '2026-02-08T12:00:00Z',
      };

      fs.readFile.mockResolvedValue(JSON.stringify(mockSnapshot));

      const result = await persistence.loadSession(sessionId);

      expect(result).toEqual(mockSnapshot);
      expect(result?.session.metadata).toEqual({ key: 'value' });
    });
  });

  describe('listSessionsByDate', () => {
    it('should list all session IDs for a given date', async () => {
      const date = new Date('2026-02-08');
      const mockFiles = ['session-1.json', 'session-2.json', 'session-3.json'];

      fs.readdir.mockResolvedValue(mockFiles);

      const result = await persistence.listSessionsByDate(date);

      const expectedPath = path.join(process.cwd(), 'data', 'history', '2026-02-08');
      expect(fs.readdir).toHaveBeenCalledWith(expectedPath);
      expect(result).toEqual(['session-1', 'session-2', 'session-3']);
    });

    it('should filter out non-JSON files', async () => {
      const date = new Date('2026-02-08');
      const mockFiles = [
        'session-1.json',
        'README.md',
        'session-2.json',
        '.gitkeep',
        'backup.txt',
      ];

      fs.readdir.mockResolvedValue(mockFiles);

      const result = await persistence.listSessionsByDate(date);

      expect(result).toEqual(['session-1', 'session-2']);
    });

    it('should return empty array when directory does not exist', async () => {
      const date = new Date('2026-01-01');
      const notFoundError = Object.assign(new Error('Directory not found'), { code: 'ENOENT' });
      fs.readdir.mockRejectedValue(notFoundError);

      const result = await persistence.listSessionsByDate(date);

      expect(result).toEqual([]);
    });

    it('should propagate non-ENOENT errors', async () => {
      const date = new Date('2026-02-08');
      const permissionError = Object.assign(new Error('Permission denied'), { code: 'EACCES' });
      fs.readdir.mockRejectedValue(permissionError);

      await expect(persistence.listSessionsByDate(date)).rejects.toThrow('Permission denied');
    });

    it('should handle dates with single-digit month and day', async () => {
      const date = new Date('2026-01-05');

      fs.readdir.mockResolvedValue([]);

      await persistence.listSessionsByDate(date);

      const expectedPath = path.join(process.cwd(), 'data', 'history', '2026-01-05');
      expect(fs.readdir).toHaveBeenCalledWith(expectedPath);
    });
  });

  describe('listAvailableDates', () => {
    it('should list all date directories in reverse chronological order', async () => {
      const mockEntries = [
        { name: '2026-01-15', isDirectory: () => true },
        { name: '2026-02-08', isDirectory: () => true },
        { name: '2026-01-20', isDirectory: () => true },
      ];

      fs.readdir.mockResolvedValue(mockEntries);

      const result = await persistence.listAvailableDates();

      expect(result).toEqual(['2026-02-08', '2026-01-20', '2026-01-15']);
    });

    it('should filter out non-directory entries', async () => {
      const mockEntries = [
        { name: '2026-02-08', isDirectory: () => true },
        { name: 'README.md', isDirectory: () => false },
        { name: '2026-02-07', isDirectory: () => true },
        { name: '.gitignore', isDirectory: () => false },
      ];

      fs.readdir.mockResolvedValue(mockEntries);

      const result = await persistence.listAvailableDates();

      expect(result).toEqual(['2026-02-08', '2026-02-07']);
    });

    it('should create storage directory if it does not exist', async () => {
      fs.readdir.mockResolvedValue([]);

      await persistence.listAvailableDates();

      const expectedPath = path.join(process.cwd(), 'data', 'history');
      expect(fs.mkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });
    });

    it('should return empty array when no dates exist', async () => {
      fs.readdir.mockResolvedValue([]);

      const result = await persistence.listAvailableDates();

      expect(result).toEqual([]);
    });

    it('should handle ENOENT gracefully', async () => {
      const notFoundError = Object.assign(new Error('Directory not found'), { code: 'ENOENT' });
      fs.readdir.mockRejectedValue(notFoundError);

      const result = await persistence.listAvailableDates();

      expect(result).toEqual([]);
    });

    it('should propagate non-ENOENT errors', async () => {
      const permissionError = Object.assign(new Error('Permission denied'), { code: 'EACCES' });
      fs.readdir.mockRejectedValue(permissionError);

      await expect(persistence.listAvailableDates()).rejects.toThrow('Permission denied');
    });
  });

  describe('cleanupOldFiles', () => {
    it('should delete directories older than retention period (7 days)', async () => {
      const now = new Date('2026-02-08T00:00:00Z');
      vi.setSystemTime(now);

      const mockDates = [
        '2026-02-07', // 1 day old - keep
        '2026-02-01', // 7 days old - keep (exactly at cutoff)
        '2026-01-31', // 8 days old - delete
        '2026-01-15', // 24 days old - delete
      ];

      fs.readdir.mockResolvedValue(
        mockDates.map(name => ({ name, isDirectory: () => true }))
      );

      const deletedCount = await persistence.cleanupOldFiles();

      expect(deletedCount).toBe(2);
      expect(fs.rm).toHaveBeenCalledWith(
        path.join(process.cwd(), 'data', 'history', '2026-01-31'),
        { recursive: true, force: true }
      );
      expect(fs.rm).toHaveBeenCalledWith(
        path.join(process.cwd(), 'data', 'history', '2026-01-15'),
        { recursive: true, force: true }
      );

      vi.useRealTimers();
    });

    it('should not delete recent directories', async () => {
      const now = new Date('2026-02-08T00:00:00Z');
      vi.setSystemTime(now);

      const mockDates = [
        '2026-02-08', // today
        '2026-02-07', // yesterday
        '2026-02-05', // 3 days old
      ];

      fs.readdir.mockResolvedValue(
        mockDates.map(name => ({ name, isDirectory: () => true }))
      );

      const deletedCount = await persistence.cleanupOldFiles();

      expect(deletedCount).toBe(0);
      expect(fs.rm).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should return 0 when no old files exist', async () => {
      fs.readdir.mockResolvedValue([]);

      const deletedCount = await persistence.cleanupOldFiles();

      expect(deletedCount).toBe(0);
    });

    it('should handle rm errors gracefully with force option', async () => {
      const now = new Date('2026-02-08T00:00:00Z');
      vi.setSystemTime(now);

      const mockDates = ['2026-01-01'];
      fs.readdir.mockResolvedValue(
        mockDates.map(name => ({ name, isDirectory: () => true }))
      );

      const rmError = new Error('Deletion failed');
      fs.rm.mockRejectedValue(rmError);

      await expect(persistence.cleanupOldFiles()).rejects.toThrow('Deletion failed');

      vi.useRealTimers();
    });

    it('should calculate cutoff date correctly', async () => {
      const now = new Date('2026-02-15T12:00:00Z');
      vi.setSystemTime(now);

      // Cutoff should be 2026-02-08 (now - 7 days)
      // Dates before 2026-02-08 should be deleted
      const mockDates = [
        '2026-02-09', // 6 days old - keep
        '2026-02-07', // 8 days old - delete
      ];

      // Need to mock both calls - once for listAvailableDates, once for mkdir
      let callCount = 0;
      fs.readdir.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call from listAvailableDates
          return Promise.resolve(mockDates.map(name => ({ name, isDirectory: () => true })));
        }
        return Promise.resolve([]);
      });

      // Mock rm to resolve successfully
      fs.rm.mockResolvedValue(undefined);

      const deletedCount = await persistence.cleanupOldFiles();

      expect(deletedCount).toBe(1);
      expect(fs.rm).toHaveBeenCalledWith(
        path.join(process.cwd(), 'data', 'history', '2026-02-07'),
        { recursive: true, force: true }
      );

      vi.useRealTimers();
    });
  });

  describe('getStats', () => {
    it('should calculate total dates and sessions', async () => {
      const mockDates = ['2026-02-08', '2026-02-07', '2026-02-06'];

      fs.readdir
        .mockResolvedValueOnce(mockDates.map(name => ({ name, isDirectory: () => true })))
        .mockResolvedValueOnce(['sess1.json', 'sess2.json'])
        .mockResolvedValueOnce(['sess3.json'])
        .mockResolvedValueOnce(['sess4.json', 'sess5.json', 'sess6.json']);

      const stats = await persistence.getStats();

      expect(stats.totalDates).toBe(3);
      expect(stats.totalSessions).toBe(6);
    });

    it('should identify oldest and newest dates', async () => {
      const mockDates = ['2026-02-08', '2026-01-15', '2026-02-01'];

      fs.readdir
        .mockResolvedValueOnce(mockDates.map(name => ({ name, isDirectory: () => true })))
        .mockResolvedValue([]);

      const stats = await persistence.getStats();

      expect(stats.newestDate).toBe('2026-02-08');
      expect(stats.oldestDate).toBe('2026-01-15');
    });

    it('should handle empty storage', async () => {
      fs.readdir.mockResolvedValue([]);

      const stats = await persistence.getStats();

      expect(stats.totalDates).toBe(0);
      expect(stats.totalSessions).toBe(0);
      expect(stats.oldestDate).toBeNull();
      expect(stats.newestDate).toBeNull();
    });

    it('should count sessions across all dates', async () => {
      const mockDates = ['2026-02-08', '2026-02-07'];

      fs.readdir
        .mockResolvedValueOnce(mockDates.map(name => ({ name, isDirectory: () => true })))
        .mockResolvedValueOnce(['s1.json', 's2.json', 's3.json'])
        .mockResolvedValueOnce(['s4.json', 's5.json']);

      const stats = await persistence.getStats();

      expect(stats.totalSessions).toBe(5);
    });

    it('should handle dates with no sessions', async () => {
      const mockDates = ['2026-02-08', '2026-02-07'];

      fs.readdir
        .mockResolvedValueOnce(mockDates.map(name => ({ name, isDirectory: () => true })))
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const stats = await persistence.getStats();

      expect(stats.totalDates).toBe(2);
      expect(stats.totalSessions).toBe(0);
    });
  });

  describe('Date path formatting', () => {
    it('should pad single-digit months with zero', async () => {
      const date = new Date('2026-01-15');

      await persistence.saveSession(sessionId, testSession, testEvents);

      // Mock was called before this test, need to find right call
      const mkdirCalls = fs.mkdir.mock.calls;
      // Clear and test specifically
      vi.clearAllMocks();
      vi.setSystemTime(date);

      await persistence.saveSession(sessionId, testSession, testEvents);

      const expectedPath = path.join(process.cwd(), 'data', 'history', '2026-01-15');
      expect(fs.mkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });

      vi.useRealTimers();
    });

    it('should pad single-digit days with zero', async () => {
      const date = new Date('2026-12-05');
      vi.setSystemTime(date);

      await persistence.saveSession(sessionId, testSession, testEvents);

      const expectedPath = path.join(process.cwd(), 'data', 'history', '2026-12-05');
      expect(fs.mkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });

      vi.useRealTimers();
    });

    it('should format year-month-day correctly', async () => {
      const date = new Date('2026-11-25');
      vi.setSystemTime(date);

      await persistence.saveSession(sessionId, testSession, testEvents);

      const expectedPath = path.join(process.cwd(), 'data', 'history', '2026-11-25');
      expect(fs.mkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });

      vi.useRealTimers();
    });
  });

  describe('Edge cases', () => {
    it('should handle sessions with no events', async () => {
      await persistence.saveSession(sessionId, testSession, []);

      const writeCall = fs.writeFile.mock.calls[0];
      const writtenData: SessionSnapshot = JSON.parse(writeCall[1]);

      expect(writtenData.events).toEqual([]);
    });

    it('should handle sessions with large event arrays', async () => {
      const largeEventArray: WorkspaceEvent[] = Array(1000)
        .fill(null)
        .map((_, i) => ({
          type: 'step:spawned',
          sessionId,
          timestamp: brandedTypes.currentTimestamp(),
          stepNumber: i as any,
          action: `action-${i}`,
        } as WorkspaceEvent));

      await persistence.saveSession(sessionId, testSession, largeEventArray);

      const writeCall = fs.writeFile.mock.calls[0];
      const writtenData: SessionSnapshot = JSON.parse(writeCall[1]);

      expect(writtenData.events.length).toBe(1000);
    });

    it('should handle session IDs with special characters', async () => {
      const specialSessionId = brandedTypes.sessionId('session-123_abc-def');

      await persistence.saveSession(specialSessionId, testSession, testEvents);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('session-123_abc-def.json'),
        expect.any(String),
        'utf-8'
      );
    });
  });
});
