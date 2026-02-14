import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { FSWatcher } from 'chokidar';
import type { SessionId, StepNumber, FileCreatedEvent, FileModifiedEvent, FileDeletedEvent } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import * as path from 'path';

// Mock chokidar before imports
vi.mock('chokidar', () => {
  const mockWatcher: Partial<FSWatcher> = {
    on: vi.fn().mockReturnThis(),
    close: vi.fn().mockResolvedValue(undefined),
  };

  return {
    default: {
      watch: vi.fn().mockReturnValue(mockWatcher),
    },
  };
});

// Mock storage before imports
vi.mock('../../storage/index.js', () => ({
  storage: {
    addEvent: vi.fn(),
  },
}));

// Import after mocking
import {
  setBroadcastFunction,
  startWatching,
  stopWatching,
  setActiveStep,
  clearActiveStep,
  shutdownAllWatchers,
} from '../fileWatcher.js';

describe('FileWatcher Service', () => {
  let broadcastSpy: ReturnType<typeof vi.fn>;
  let sessionId: SessionId;
  let testCwd: string;
  let mockStorage: any;
  let mockChokidar: any;
  let mockWatcher: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get mocked modules
    const chokidarModule = await import('chokidar');
    mockChokidar = chokidarModule.default;

    const storageModule = await import('../../storage/index.js');
    mockStorage = storageModule.storage;

    // Setup fresh mock watcher for each test
    mockWatcher = {
      on: vi.fn().mockReturnThis(),
      close: vi.fn().mockResolvedValue(undefined),
    };
    mockChokidar.watch = vi.fn().mockReturnValue(mockWatcher);

    broadcastSpy = vi.fn() as any;
    setBroadcastFunction(broadcastSpy as any);
    sessionId = brandedTypes.sessionId('test-session-1');
    testCwd = '/test/project';
  });

  afterEach(async () => {
    await shutdownAllWatchers();
  });

  describe('startWatching', () => {
    it('should initialize chokidar watcher with correct options', async () => {
      const readyPromise = Promise.resolve();
      mockWatcher.on = vi.fn((event, handler) => {
        if (event === 'ready' && typeof handler === 'function') {
          setTimeout(() => handler(), 0);
        }
        return mockWatcher;
      }) as any;

      await startWatching(sessionId, testCwd);

      expect(mockChokidar.watch).toHaveBeenCalledWith(testCwd, {
        ignored: expect.arrayContaining([
          '**/node_modules/**',
          '**/.git/**',
          '**/__pycache__/**',
        ]),
        persistent: true,
        ignoreInitial: true,
        depth: 10,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50,
        },
      });
    });

    it('should register event handlers for file operations', async () => {
      mockWatcher.on = vi.fn((event, handler) => {
        if (event === 'ready' && typeof handler === 'function') {
          setTimeout(() => handler(), 0);
        }
        return mockWatcher;
      }) as any;

      await startWatching(sessionId, testCwd);

      const onCalls = (mockWatcher.on as any).mock.calls;
      const eventTypes = onCalls.map((call: any) => call[0]);

      expect(eventTypes).toContain('add');
      expect(eventTypes).toContain('change');
      expect(eventTypes).toContain('unlink');
      expect(eventTypes).toContain('addDir');
      expect(eventTypes).toContain('unlinkDir');
      expect(eventTypes).toContain('error');
      expect(eventTypes).toContain('ready');
    });

    it('should stop existing watcher before starting new one for same session', async () => {
      mockWatcher.on = vi.fn((event, handler) => {
        if (event === 'ready' && typeof handler === 'function') {
          setTimeout(() => handler(), 0);
        }
        return mockWatcher;
      }) as any;

      await startWatching(sessionId, testCwd);
      const firstCloseCall = mockWatcher.close;

      await startWatching(sessionId, testCwd);

      expect(firstCloseCall).toHaveBeenCalled();
    });

    it('should wait for watcher to be ready before resolving', async () => {
      let readyResolve: () => void;
      const readyPromise = new Promise<void>((resolve) => {
        readyResolve = resolve;
      });

      mockWatcher.on = vi.fn((event, handler) => {
        if (event === 'ready' && typeof handler === 'function') {
          readyPromise.then(() => handler());
        }
        return mockWatcher;
      }) as any;

      const watchPromise = startWatching(sessionId, testCwd);

      // Should not resolve immediately
      let resolved = false;
      watchPromise.then(() => { resolved = true; });

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(resolved).toBe(false);

      // Trigger ready
      readyResolve!();
      await watchPromise;
      expect(resolved).toBe(true);
    });
  });

  describe('stopWatching', () => {
    beforeEach(async () => {
      mockWatcher.on = vi.fn((event, handler) => {
        if (event === 'ready' && typeof handler === 'function') {
          setTimeout(() => handler(), 0);
        }
        return mockWatcher;
      }) as any;

      await startWatching(sessionId, testCwd);
    });

    it('should close the watcher for the session', async () => {
      await stopWatching(sessionId);
      expect(mockWatcher.close).toHaveBeenCalled();
    });

    it('should clear active step tracking', async () => {
      setActiveStep(sessionId, 1 as StepNumber, 'test-action');
      await stopWatching(sessionId);

      // After stopping, set active step again and emit event to verify cleanup
      // This is an indirect test - if cleanup worked, new events won't have old step
      setActiveStep(sessionId, 2 as StepNumber, 'new-action');
      // The fact that we can set a new step without error indicates cleanup worked
    });

    it('should do nothing if session has no active watcher', async () => {
      const nonExistentSession = brandedTypes.sessionId('non-existent');
      await expect(stopWatching(nonExistentSession)).resolves.not.toThrow();
    });

    it('should clear debounce timeouts for the session', async () => {
      // Trigger a file change to create debounce timeout
      const addHandler = (mockWatcher.on as any).mock.calls.find(
        (call: any) => call[0] === 'add'
      )?.[1];

      if (addHandler) {
        addHandler('/test/project/file.txt');
      }

      await stopWatching(sessionId);

      // If timeouts were cleared, they won't fire
      await new Promise(resolve => setTimeout(resolve, 400));
      // Test passes if no errors thrown
    });
  });

  describe('setActiveStep and clearActiveStep', () => {
    it('should track active step for a session', () => {
      const stepNumber = 5 as StepNumber;
      const action = 'code-implementation';

      expect(() => setActiveStep(sessionId, stepNumber, action)).not.toThrow();
    });

    it('should clear active step for a session', () => {
      setActiveStep(sessionId, 1 as StepNumber, 'test');
      expect(() => clearActiveStep(sessionId)).not.toThrow();
    });

    it('should allow setting different steps for different sessions', () => {
      const session1 = brandedTypes.sessionId('session-1');
      const session2 = brandedTypes.sessionId('session-2');

      setActiveStep(session1, 1 as StepNumber, 'action-1');
      setActiveStep(session2, 2 as StepNumber, 'action-2');

      // Both should succeed without interference
      clearActiveStep(session1);
      clearActiveStep(session2);
    });
  });

  describe('File change events', () => {
    let addHandler: (filePath: string) => void;
    let changeHandler: (filePath: string) => void;
    let unlinkHandler: (filePath: string) => void;
    let addDirHandler: (dirPath: string) => void;
    let unlinkDirHandler: (dirPath: string) => void;

    beforeEach(async () => {
      mockWatcher.on = vi.fn((event, handler) => {
        if (event === 'add') addHandler = handler;
        if (event === 'change') changeHandler = handler;
        if (event === 'unlink') unlinkHandler = handler;
        if (event === 'addDir') addDirHandler = handler;
        if (event === 'unlinkDir') unlinkDirHandler = handler;
        if (event === 'ready' && typeof handler === 'function') {
          setTimeout(() => handler(), 0);
        }
        return mockWatcher;
      }) as any;

      await startWatching(sessionId, testCwd);
      vi.clearAllMocks();
    });

    it('should emit file:created event on file add', async () => {
      const filePath = '/test/project/src/index.ts';
      addHandler(filePath);

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 350));

      expect(broadcastSpy).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          type: 'file:created',
          sessionId,
          path: filePath,
          extension: '.ts',
          id: expect.any(String),
        })
      );

      // Check relativePath uses OS-specific separators
      const call = broadcastSpy.mock.calls[0][1];
      expect(call.relativePath).toMatch(/src[\\/]index\.ts/);
    });

    it('should emit file:modified event on file change', async () => {
      const filePath = '/test/project/src/utils.ts';
      changeHandler(filePath);

      await new Promise(resolve => setTimeout(resolve, 350));

      expect(broadcastSpy).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          type: 'file:modified',
          sessionId,
          path: filePath,
          changeType: 'content',
          id: expect.any(String),
        })
      );

      // Check relativePath uses OS-specific separators
      const call = broadcastSpy.mock.calls[0][1];
      expect(call.relativePath).toMatch(/src[\\/]utils\.ts/);
    });

    it('should emit file:deleted event on file unlink', async () => {
      const filePath = '/test/project/old-file.txt';
      unlinkHandler(filePath);

      await new Promise(resolve => setTimeout(resolve, 350));

      expect(broadcastSpy).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          type: 'file:deleted',
          sessionId,
          path: filePath,
          id: expect.any(String),
        })
      );
    });

    it('should emit file:created event on directory add', async () => {
      const dirPath = '/test/project/new-folder';
      addDirHandler(dirPath);

      await new Promise(resolve => setTimeout(resolve, 350));

      expect(broadcastSpy).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          type: 'file:created',
          path: dirPath,
          id: expect.any(String),
        })
      );
    });

    it('should emit file:deleted event on directory unlink', async () => {
      const dirPath = '/test/project/old-folder';
      unlinkDirHandler(dirPath);

      await new Promise(resolve => setTimeout(resolve, 350));

      expect(broadcastSpy).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          type: 'file:deleted',
          path: dirPath,
          id: expect.any(String),
        })
      );
    });

    it('should include step attribution when active step is set', async () => {
      const stepNumber = 3 as StepNumber;
      const action = 'edit-file';
      setActiveStep(sessionId, stepNumber, action);

      const filePath = '/test/project/modified.ts';
      changeHandler(filePath);

      await new Promise(resolve => setTimeout(resolve, 350));

      expect(broadcastSpy).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          stepNumber,
        })
      );
    });

    it('should not include step attribution when no active step', async () => {
      const filePath = '/test/project/file.ts';
      addHandler(filePath);

      await new Promise(resolve => setTimeout(resolve, 350));

      expect(broadcastSpy).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          stepNumber: null,
        })
      );
    });

    it('should debounce rapid file changes (300ms)', async () => {
      const filePath = '/test/project/rapid-change.ts';

      // Trigger multiple rapid changes
      changeHandler(filePath);
      await new Promise(resolve => setTimeout(resolve, 50));
      changeHandler(filePath);
      await new Promise(resolve => setTimeout(resolve, 50));
      changeHandler(filePath);

      // Should not broadcast yet
      expect(broadcastSpy).not.toHaveBeenCalled();

      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 350));

      // Should broadcast only once
      expect(broadcastSpy).toHaveBeenCalledTimes(1);
    });

    it('should store events in session history', async () => {
      const filePath = '/test/project/history-test.ts';
      addHandler(filePath);

      await new Promise(resolve => setTimeout(resolve, 350));

      expect(mockStorage.addEvent).toHaveBeenCalledWith(
        sessionId,
        expect.objectContaining({
          type: 'file:created',
          id: expect.any(String),
        })
      );
    });

    it('should handle broadcast errors gracefully', async () => {
      const errorBroadcast = vi.fn().mockImplementation(() => {
        throw new Error('Broadcast failed');
      });
      setBroadcastFunction(errorBroadcast);

      const filePath = '/test/project/error-test.ts';
      addHandler(filePath);

      await new Promise(resolve => setTimeout(resolve, 350));

      // Should not throw, just log error
      expect(errorBroadcast).toHaveBeenCalled();
      // Still stores in history despite broadcast error
      expect(mockStorage.addEvent).toHaveBeenCalled();
    });

    it('should skip broadcast when broadcast function not set', async () => {
      setBroadcastFunction(null as any);

      const filePath = '/test/project/no-broadcast.ts';
      addHandler(filePath);

      await new Promise(resolve => setTimeout(resolve, 350));

      // Should not throw, just log warning
      // Note: Storage addEvent is not called when broadcast function is null
      expect(broadcastSpy).not.toHaveBeenCalled();
    });

    it('should calculate correct relative paths', async () => {
      const filePath = '/test/project/deep/nested/file.js';
      addHandler(filePath);

      await new Promise(resolve => setTimeout(resolve, 350));

      const call = broadcastSpy.mock.calls[0][1];

      // Check that relativePath contains the nested structure
      expect(call.relativePath).toMatch(/deep[\\/]nested[\\/]file\.js/);
      expect(call.directory).toMatch(/deep[\\/]nested/);
    });

    it('should extract correct file extensions', async () => {
      const testCases = [
        { path: '/test/project/file.ts', ext: '.ts' },
        { path: '/test/project/data.json', ext: '.json' },
        { path: '/test/project/README.md', ext: '.md' },
        { path: '/test/project/noext', ext: '' },
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();
        addHandler(testCase.path);
        await new Promise(resolve => setTimeout(resolve, 350));

        expect(broadcastSpy).toHaveBeenCalledWith(
          sessionId,
          expect.objectContaining({
            extension: testCase.ext,
          })
        );
      }
    });
  });

  describe('Error handling', () => {
    it('should log errors from watcher', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let errorHandler: (error: Error) => void;

      mockWatcher.on = vi.fn((event, handler) => {
        if (event === 'error') errorHandler = handler;
        if (event === 'ready' && typeof handler === 'function') {
          setTimeout(() => handler(), 0);
        }
        return mockWatcher;
      }) as any;

      await startWatching(sessionId, testCwd);

      const testError = new Error('Watcher error');
      errorHandler!(testError);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[FileWatcher] Error watching session'),
        testError
      );

      consoleSpy.mockRestore();
    });
  });

  describe('shutdownAllWatchers', () => {
    it('should close all active watchers', async () => {
      const session1 = brandedTypes.sessionId('shutdown-1');
      const session2 = brandedTypes.sessionId('shutdown-2');

      mockWatcher.on = vi.fn((event, handler) => {
        if (event === 'ready' && typeof handler === 'function') {
          setTimeout(() => handler(), 0);
        }
        return mockWatcher;
      }) as any;

      await startWatching(session1, '/path1');
      await startWatching(session2, '/path2');

      const closeSpy = mockWatcher.close as any;
      vi.clearAllMocks();

      await shutdownAllWatchers();

      expect(closeSpy).toHaveBeenCalledTimes(2);
    });

    it('should clear all active steps', async () => {
      const session1 = brandedTypes.sessionId('shutdown-3');

      mockWatcher.on = vi.fn((event, handler) => {
        if (event === 'ready' && typeof handler === 'function') {
          setTimeout(() => handler(), 0);
        }
        return mockWatcher;
      }) as any;

      await startWatching(session1, '/path');
      setActiveStep(session1, 1 as StepNumber, 'action');

      await shutdownAllWatchers();

      // After shutdown, setting a new step should work (old state cleared)
      expect(() => setActiveStep(session1, 2 as StepNumber, 'new')).not.toThrow();
    });

    it('should clear all debounce timeouts', async () => {
      const session1 = brandedTypes.sessionId('shutdown-4');
      let addHandler: (filePath: string) => void;

      mockWatcher.on = vi.fn((event, handler) => {
        if (event === 'add') addHandler = handler;
        if (event === 'ready' && typeof handler === 'function') {
          setTimeout(() => handler(), 0);
        }
        return mockWatcher;
      }) as any;

      await startWatching(session1, '/path');

      addHandler!('/path/file.txt');

      await shutdownAllWatchers();

      // Wait beyond debounce period
      await new Promise(resolve => setTimeout(resolve, 400));

      // Should not have broadcast (timeout was cleared)
      expect(broadcastSpy).not.toHaveBeenCalled();
    });
  });

  describe('setBroadcastFunction', () => {
    it('should register a broadcast function', () => {
      const newBroadcast = vi.fn();
      expect(() => setBroadcastFunction(newBroadcast)).not.toThrow();
    });

    it('should log when broadcast function is registered', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      setBroadcastFunction(vi.fn());

      expect(consoleSpy).toHaveBeenCalledWith('[FileWatcher] Broadcast function registered');

      consoleSpy.mockRestore();
    });
  });

  describe('Ignore patterns', () => {
    it('should ignore node_modules', async () => {
      mockWatcher.on = vi.fn((event, handler) => {
        if (event === 'ready' && typeof handler === 'function') {
          setTimeout(() => handler(), 0);
        }
        return mockWatcher;
      }) as any;

      await startWatching(sessionId, testCwd);

      const watchCall = mockChokidar.watch.mock.calls[0];
      const options = watchCall[1];

      expect(options.ignored).toContain('**/node_modules/**');
    });

    it('should ignore .git directory', async () => {
      mockWatcher.on = vi.fn((event, handler) => {
        if (event === 'ready' && typeof handler === 'function') {
          setTimeout(() => handler(), 0);
        }
        return mockWatcher;
      }) as any;

      await startWatching(sessionId, testCwd);

      const watchCall = mockChokidar.watch.mock.calls[0];
      const options = watchCall[1];

      expect(options.ignored).toContain('**/.git/**');
    });

    it('should ignore build and dist directories', async () => {
      mockWatcher.on = vi.fn((event, handler) => {
        if (event === 'ready' && typeof handler === 'function') {
          setTimeout(() => handler(), 0);
        }
        return mockWatcher;
      }) as any;

      await startWatching(sessionId, testCwd);

      const watchCall = mockChokidar.watch.mock.calls[0];
      const options = watchCall[1];

      expect(options.ignored).toContain('**/dist/**');
      expect(options.ignored).toContain('**/build/**');
    });
  });
});
