/**
 * File Watcher Service (Phase 10)
 *
 * Monitors project directories for file changes and broadcasts events via WebSocket
 * with step attribution for tracking which agent made which changes.
 */

import * as crypto from 'crypto';
import chokidar, { type FSWatcher } from 'chokidar';
import * as path from 'path';
import type { SessionId, FileCreatedEvent, FileModifiedEvent, FileDeletedEvent, StepNumber } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { storage } from '../storage/index.js';
import { telemetry } from './telemetry.js';

/**
 * Active watchers per session
 * Key: sessionId, Value: FSWatcher instance
 */
const activeWatchers = new Map<SessionId, FSWatcher>();

/**
 * Active step tracking per session
 * When a step is running, file changes are attributed to that step
 * Key: sessionId, Value: { stepNumber, action }
 */
interface ActiveStep {
  stepNumber: StepNumber;
  action: string;
}

const activeSteps = new Map<SessionId, ActiveStep>();

/**
 * Debounce map for rapid file changes
 * Key: sessionId:path, Value: timeout ID
 */
const debounceMap = new Map<string, NodeJS.Timeout>();
const DEBOUNCE_DELAY_MS = 300; // 300ms as per task requirements

/**
 * Ignore patterns for file watching
 */
const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/__pycache__/**',
  '**/*.pyc',
  '**/.env',
  '**/.env.*',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
  '**/.vscode/**',
  '**/.idea/**',
];

/**
 * Broadcast function type
 */
type BroadcastFunction = (sessionId: SessionId, event: FileCreatedEvent | FileModifiedEvent | FileDeletedEvent) => void;

let broadcastFunction: BroadcastFunction | null = null;

/**
 * Set the broadcast function for file events
 * Called by the main server to inject the WebSocket broadcast function
 */
export function setBroadcastFunction(fn: BroadcastFunction) {
  broadcastFunction = fn;
  telemetry.log('info', 'FileWatcher', 'Broadcast function registered');
}

/**
 * Retry configuration for watcher crashes
 */
const MAX_RETRY_ATTEMPTS = 3;
const INITIAL_RETRY_DELAY_MS = 1000; // 1 second

/**
 * Track retry attempts per session
 */
const retryAttempts = new Map<SessionId, number>();

/**
 * Start watching a session's working directory with auto-retry on failure
 */
export async function startWatchingWithRetry(sessionId: SessionId, cwd: string): Promise<void> {
  const currentAttempt = retryAttempts.get(sessionId) ?? 0;

  try {
    await startWatching(sessionId, cwd);
    // Success - reset retry counter
    retryAttempts.delete(sessionId);
  } catch (error) {
    telemetry.log('error', 'FileWatcher', `Failed to start watcher for session ${sessionId}`, {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
      attempt: currentAttempt + 1,
    });

    if (currentAttempt < MAX_RETRY_ATTEMPTS) {
      const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, currentAttempt); // Exponential backoff: 1s, 2s, 4s
      retryAttempts.set(sessionId, currentAttempt + 1);

      telemetry.log('info', 'FileWatcher', `Retrying watcher start for session ${sessionId} in ${delay}ms`, {
        sessionId,
        attempt: currentAttempt + 1,
        maxAttempts: MAX_RETRY_ATTEMPTS,
        delay,
      });

      setTimeout(() => {
        startWatchingWithRetry(sessionId, cwd);
      }, delay);
    } else {
      telemetry.log('error', 'FileWatcher', `Max retry attempts reached for session ${sessionId}, giving up`, {
        sessionId,
        attempts: MAX_RETRY_ATTEMPTS,
      });
      retryAttempts.delete(sessionId);
      throw error;
    }
  }
}

/**
 * Start watching a session's working directory
 */
export async function startWatching(sessionId: SessionId, cwd: string): Promise<void> {
  // Stop existing watcher if any
  if (activeWatchers.has(sessionId)) {
    await stopWatching(sessionId);
  }

  telemetry.log('info', 'FileWatcher', `Starting file watch for session ${sessionId} in ${cwd}`, { sessionId, cwd });

  const watcher = chokidar.watch(cwd, {
    ignored: IGNORE_PATTERNS,
    persistent: true,
    ignoreInitial: true, // Don't emit events for existing files
    depth: 10, // Limit watch depth to prevent resource exhaustion (Agent A security fix)
    awaitWriteFinish: {
      stabilityThreshold: 100, // Wait 100ms after last change
      pollInterval: 50,
    },
  });

  // File created event
  watcher.on('add', (filePath: string) => {
    handleFileChange(sessionId, filePath, 'created', cwd);
  });

  // File modified event
  watcher.on('change', (filePath: string) => {
    handleFileChange(sessionId, filePath, 'modified', cwd);
  });

  // File deleted event
  watcher.on('unlink', (filePath: string) => {
    handleFileChange(sessionId, filePath, 'deleted', cwd);
  });

  // Directory created event (H1 fix)
  watcher.on('addDir', (dirPath: string) => {
    handleFileChange(sessionId, dirPath, 'created', cwd);
  });

  // Directory deleted event (H1 fix)
  watcher.on('unlinkDir', (dirPath: string) => {
    handleFileChange(sessionId, dirPath, 'deleted', cwd);
  });

  // Error handler with auto-restart
  watcher.on('error', (error: Error) => {
    telemetry.log('error', 'FileWatcher', `Error watching session ${sessionId}: ${error.message}`, { sessionId, error: error.stack }, sessionId);

    // Critical error - attempt to restart the watcher
    stopWatching(sessionId).then(() => {
      telemetry.log('warn', 'fileWatcher', `Attempting to restart watcher for session ${sessionId} after error`, { sessionId });
      startWatchingWithRetry(sessionId, cwd);
    });
  });

  activeWatchers.set(sessionId, watcher);

  // Wait for watcher to be ready
  await new Promise<void>((resolve) => {
    watcher.on('ready', () => {
      telemetry.log('info', 'FileWatcher', `Ready for session ${sessionId}`, { sessionId }, sessionId);
      resolve();
    });
  });
}

/**
 * Stop watching a session's directory
 */
export async function stopWatching(sessionId: SessionId): Promise<void> {
  const watcher = activeWatchers.get(sessionId);
  if (watcher) {
    telemetry.log('info', 'FileWatcher', `Stopping file watch for session ${sessionId}`, { sessionId }, sessionId);
    await watcher.close();
    activeWatchers.delete(sessionId);
  }

  // Clean up active step tracking
  activeSteps.delete(sessionId);

  // Clean up debounce timeouts (H2 fix - proper cleanup)
  for (const [key, timeout] of debounceMap.entries()) {
    if (key.startsWith(`${sessionId}:`)) {
      clearTimeout(timeout);
      debounceMap.delete(key);
    }
  }
}

/**
 * Set the active step for a session (for file change attribution)
 * Called when a step starts executing
 */
export function setActiveStep(sessionId: SessionId, stepNumber: StepNumber, action: string): void {
  activeSteps.set(sessionId, { stepNumber, action });
  telemetry.log('debug', 'FileWatcher', `Active step for ${sessionId}: #${stepNumber} (${action})`, { sessionId, stepNumber, action }, sessionId);
}

/**
 * Clear the active step for a session
 * Called when a step completes
 */
export function clearActiveStep(sessionId: SessionId): void {
  activeSteps.delete(sessionId);
  telemetry.log('debug', 'FileWatcher', `Cleared active step for ${sessionId}`, { sessionId }, sessionId);
}

/**
 * Handle file change event with debouncing
 */
function handleFileChange(
  sessionId: SessionId,
  filePath: string,
  changeType: 'created' | 'modified' | 'deleted',
  cwd: string
): void {
  // Generate debounce key
  const debounceKey = `${sessionId}:${filePath}`;

  // Clear existing timeout
  const existingTimeout = debounceMap.get(debounceKey);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Set new timeout
  const timeout = setTimeout(() => {
    debounceMap.delete(debounceKey);
    emitFileChangeEvent(sessionId, filePath, changeType, cwd);
  }, DEBOUNCE_DELAY_MS);

  debounceMap.set(debounceKey, timeout);
}

/**
 * Emit file change event after debounce
 */
function emitFileChangeEvent(
  sessionId: SessionId,
  filePath: string,
  changeType: 'created' | 'modified' | 'deleted',
  cwd: string
): void {
  if (!broadcastFunction) {
    telemetry.log('warn', 'FileWatcher', 'Broadcast function not set, skipping event', { sessionId, filePath, changeType }, sessionId);
    return;
  }

  // Calculate relative path
  const relativePath = path.relative(cwd, filePath);

  // Get active step attribution if available
  const activeStep = activeSteps.get(sessionId);

  const timestamp = brandedTypes.currentTimestamp();

  let event: FileCreatedEvent | FileModifiedEvent | FileDeletedEvent;

  if (changeType === 'created') {
    event = {
      id: crypto.randomUUID(),
      type: 'file:created',
      sessionId,
      timestamp,
      path: filePath,
      relativePath,
      stepNumber: activeStep?.stepNumber ?? null,
      directory: path.dirname(relativePath),
      extension: path.extname(filePath),
    } as FileCreatedEvent;
  } else if (changeType === 'modified') {
    event = {
      id: crypto.randomUUID(),
      type: 'file:modified',
      sessionId,
      timestamp,
      path: filePath,
      relativePath,
      stepNumber: activeStep?.stepNumber ?? null,
      changeType: 'content',
    } as FileModifiedEvent;
  } else {
    // deleted
    event = {
      id: crypto.randomUUID(),
      type: 'file:deleted',
      sessionId,
      timestamp,
      path: filePath,
      relativePath,
      stepNumber: activeStep?.stepNumber ?? null,
    } as FileDeletedEvent;
  }

  telemetry.log('debug', 'FileWatcher', `${changeType.toUpperCase()}: ${relativePath}`, { sessionId, changeType, relativePath, stepNumber: activeStep?.stepNumber }, sessionId);

  // Broadcast event with error recovery (H3 fix)
  try {
    broadcastFunction(sessionId, event);
  } catch (error) {
    // CRITICAL: This error was previously swallowed - now captured in telemetry
    telemetry.log('error', 'FileWatcher', `Error broadcasting event for session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`, { sessionId, error: error instanceof Error ? error.stack : String(error), changeType, relativePath }, sessionId);
    // Don't throw - continue processing other events
  }

  // Store event in session history
  storage.addEvent(sessionId, event as any);
}

/**
 * Cleanup all watchers on server shutdown
 */
export async function shutdownAllWatchers(): Promise<void> {
  telemetry.log('info', 'FileWatcher', 'Shutting down all file watchers...', { watcherCount: activeWatchers.size });
  const promises: Promise<void>[] = [];

  for (const [sessionId, watcher] of activeWatchers.entries()) {
    promises.push(
      watcher.close().then(() => {
        telemetry.log('info', 'FileWatcher', `Closed watcher for session ${sessionId}`, { sessionId }, sessionId);
      })
    );
  }

  await Promise.all(promises);
  activeWatchers.clear();
  activeSteps.clear();

  // Clear all debounce timeouts
  for (const timeout of debounceMap.values()) {
    clearTimeout(timeout);
  }
  debounceMap.clear();

  telemetry.log('info', 'FileWatcher', 'All file watchers shut down');
}
