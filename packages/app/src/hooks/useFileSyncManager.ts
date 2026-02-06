/**
 * File Sync Manager Hook (Phase 10 - Tasks 10.5, 10.8, 10.9)
 *
 * Manages live file synchronization between filesystem and editor:
 * - Auto-updates editor when file modified externally (no unsaved changes)
 * - Detects conflicts when file modified with unsaved changes
 * - Handles deleted files with warning indicators
 * - Batches rapid file changes with debouncing
 */

import { useCallback, useRef, useEffect } from 'react';
import type { WorkspaceEvent, FileModifiedEvent, FileDeletedEvent } from '@afw/shared';

export interface EditorFile {
  path: string;
  content: string;
  isDirty: boolean;
  originalContent: string;
  isDeleted?: boolean; // Flag for deleted files
}

export interface FileConflict {
  filePath: string;
  userVersion: string;
  externalVersion: string;
}

export interface FileSyncCallbacks {
  onFileModified: (path: string, newContent: string) => void;
  onFileDeleted: (path: string) => void;
  onConflictDetected: (conflict: FileConflict) => void;
  readFileContent: (path: string) => Promise<string>;
  showToast?: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export interface UseFileSyncManagerReturn {
  handleFileSystemEvent: (event: WorkspaceEvent, openFiles: EditorFile[]) => Promise<void>;
}

const DEBOUNCE_DELAY_MS = 300; // 300ms as per task requirements

/**
 * Hook to manage live file synchronization
 */
export function useFileSyncManager(callbacks: FileSyncCallbacks): UseFileSyncManagerReturn {
  const { onFileModified, onFileDeleted, onConflictDetected, readFileContent, showToast } = callbacks;

  // Debounce map for batch handling
  const debounceMapRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Notification tracking to prevent duplicate toasts
  const notificationMapRef = useRef<Map<string, number>>(new Map());
  const NOTIFICATION_COOLDOWN_MS = 2000; // Don't show same notification within 2s

  /**
   * Show a notification (with cooldown to prevent spam)
   */
  const showNotification = useCallback((message: string, key: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const now = Date.now();
    const lastNotification = notificationMapRef.current.get(key);

    if (!lastNotification || now - lastNotification > NOTIFICATION_COOLDOWN_MS) {
      console.log(`[FileSync] ${message}`);
      notificationMapRef.current.set(key, now);

      // Show toast notification if callback provided
      if (showToast) {
        showToast(message, type);
      }
    }
  }, [showToast]);

  /**
   * Handle file modified event
   */
  const handleFileModified = useCallback(
    async (event: FileModifiedEvent, openFiles: EditorFile[]) => {
      const filePath = event.relativePath || event.path;
      const openFile = openFiles.find((f) => f.path === filePath);

      if (!openFile) {
        // File not open in editor, ignore
        return;
      }

      // Clear existing debounce timeout
      const existingTimeout = debounceMapRef.current.get(filePath);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new debounce timeout
      const timeout = setTimeout(async () => {
        debounceMapRef.current.delete(filePath);

        try {
          // Read new file content
          const newContent = await readFileContent(filePath);

          if (openFile.isDirty) {
            // File has unsaved changes → conflict!
            showNotification(
              `Conflict detected: "${filePath}" was modified externally`,
              `conflict:${filePath}`,
              'warning'
            );

            onConflictDetected({
              filePath,
              userVersion: openFile.content,
              externalVersion: newContent,
            });
          } else {
            // No unsaved changes → auto-update
            showNotification(
              `File updated: "${filePath}" was modified externally`,
              `modified:${filePath}`,
              'info'
            );

            onFileModified(filePath, newContent);
          }
        } catch (error) {
          console.error(`[FileSync] Error reading modified file "${filePath}":`, error);
          showNotification(
            `Error syncing "${filePath}": ${error instanceof Error ? error.message : 'Unknown error'}`,
            `error:${filePath}`,
            'error'
          );
        }
      }, DEBOUNCE_DELAY_MS);

      debounceMapRef.current.set(filePath, timeout);
    },
    [readFileContent, onFileModified, onConflictDetected, showNotification]
  );

  /**
   * Handle file deleted event
   */
  const handleFileDeleted = useCallback(
    async (event: FileDeletedEvent, openFiles: EditorFile[]) => {
      const filePath = event.relativePath || event.path;
      const openFile = openFiles.find((f) => f.path === filePath);

      if (!openFile) {
        // File not open in editor, ignore
        return;
      }

      showNotification(
        `File deleted: "${filePath}" was deleted externally`,
        `deleted:${filePath}`,
        'warning'
      );

      onFileDeleted(filePath);
    },
    [onFileDeleted, showNotification]
  );

  /**
   * Handle any file system event
   */
  const handleFileSystemEvent = useCallback(
    async (event: WorkspaceEvent, openFiles: EditorFile[]) => {
      if (event.type === 'file:modified') {
        await handleFileModified(event as FileModifiedEvent, openFiles);
      } else if (event.type === 'file:deleted') {
        await handleFileDeleted(event as FileDeletedEvent, openFiles);
      }
      // file:created doesn't affect open files
    },
    [handleFileModified, handleFileDeleted]
  );

  // Cleanup debounce timeouts and notification cooldown map on unmount
  useEffect(() => {
    return () => {
      // Clear all debounce timeouts
      for (const timeout of debounceMapRef.current.values()) {
        clearTimeout(timeout);
      }
      debounceMapRef.current.clear();

      // Clear notification cooldown map (H4 fix)
      notificationMapRef.current.clear();
    };
  }, []);

  return {
    handleFileSystemEvent,
  };
}
