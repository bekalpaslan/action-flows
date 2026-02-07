/**
 * File Watcher Service (Phase 10)
 *
 * Monitors project directories for file changes and broadcasts events via WebSocket
 * with step attribution for tracking which agent made which changes.
 */

import chokidar, { type FSWatcher } from 'chokidar';
import * as path from 'path';
import type { SessionId, FileCreatedEvent, FileModifiedEvent, FileDeletedEvent, StepNumber } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { storage } from '../storage/index.js';

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
  console.log('[FileWatcher] Broadcast function registered');
}

/**
 * Start watching a session's working directory
 */
export async function startWatching(sessionId: SessionId, cwd: string): Promise<void> {
  // Stop existing watcher if any
  if (activeWatchers.has(sessionId)) {
    await stopWatching(sessionId);
  }

  console.log(`[FileWatcher] Starting file watch for session ${sessionId} in ${cwd}`);

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

  // Error handler
  watcher.on('error', (error: Error) => {
    console.error(`[FileWatcher] Error watching session ${sessionId}:`, error);
  });

  activeWatchers.set(sessionId, watcher);

  // Wait for watcher to be ready
  await new Promise<void>((resolve) => {
    watcher.on('ready', () => {
      console.log(`[FileWatcher] Ready for session ${sessionId}`);
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
    console.log(`[FileWatcher] Stopping file watch for session ${sessionId}`);
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
  console.log(`[FileWatcher] Active step for ${sessionId}: #${stepNumber} (${action})`);
}

/**
 * Clear the active step for a session
 * Called when a step completes
 */
export function clearActiveStep(sessionId: SessionId): void {
  activeSteps.delete(sessionId);
  console.log(`[FileWatcher] Cleared active step for ${sessionId}`);
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
    console.warn('[FileWatcher] Broadcast function not set, skipping event');
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
      type: 'file:deleted',
      sessionId,
      timestamp,
      path: filePath,
      relativePath,
      stepNumber: activeStep?.stepNumber ?? null,
    } as FileDeletedEvent;
  }

  console.log(`[FileWatcher] ${changeType.toUpperCase()}: ${relativePath} (session: ${sessionId}${activeStep ? `, step: #${activeStep.stepNumber}` : ''})`);

  // Broadcast event with error recovery (H3 fix)
  try {
    broadcastFunction(sessionId, event);
  } catch (error) {
    console.error(`[FileWatcher] Error broadcasting event for session ${sessionId}:`, error);
    // Don't throw - continue processing other events
  }

  // Store event in session history
  storage.addEvent(sessionId, event as any);
}

/**
 * Cleanup all watchers on server shutdown
 */
export async function shutdownAllWatchers(): Promise<void> {
  console.log('[FileWatcher] Shutting down all file watchers...');
  const promises: Promise<void>[] = [];

  for (const [sessionId, watcher] of activeWatchers.entries()) {
    promises.push(
      watcher.close().then(() => {
        console.log(`[FileWatcher] Closed watcher for session ${sessionId}`);
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

  console.log('[FileWatcher] All file watchers shut down');
}
