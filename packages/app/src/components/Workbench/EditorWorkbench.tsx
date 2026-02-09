/**
 * EditorWorkbench Component
 * Full-screen code editor workbench with multi-file support
 *
 * Features:
 * - Monaco-based code editor integration
 * - Multi-file tabs with close buttons
 * - File save (Cmd/Ctrl+S)
 * - Unsaved changes indicator
 * - File path breadcrumb
 * - Syntax highlighting for various languages
 *
 * Layout:
 * - Header bar with title and file breadcrumb
 * - EditorTabs for open files
 * - Monaco editor main content area
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import type { SessionId } from '@afw/shared';
import { EditorTabs } from '../CodeEditor/EditorTabs';
import { useEditorFiles } from '../../hooks/useEditorFiles';
import { configureMonaco } from '../../monaco-config';
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import { useFileSyncManager, type FileConflict } from '../../hooks/useFileSyncManager';
import { ConflictDialog } from '../CodeEditor/ConflictDialog';
import { ToastContainer, type ToastMessage } from '../Toast/Toast';
import './EditorWorkbench.css';

// Configure Monaco workers on module load
configureMonaco();

/**
 * Language map for file extensions
 */
const LANGUAGE_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  py: 'python',
  json: 'json',
  md: 'markdown',
  html: 'html',
  css: 'css',
  scss: 'scss',
  yaml: 'yaml',
  yml: 'yaml',
  xml: 'xml',
  sh: 'shell',
  bash: 'shell',
  sql: 'sql',
  go: 'go',
  rs: 'rust',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  rb: 'ruby',
  php: 'php',
};

export interface EditorWorkbenchProps {
  /** Session ID for file operations */
  sessionId: SessionId;

  /** Initial files to open */
  initialFiles?: string[];

  /** File to open externally */
  fileToOpen?: string | null;

  /** Callback when external file is opened */
  onFileOpened?: () => void;
}

interface EditorFile {
  path: string;
  content: string;
  isDirty: boolean;
  originalContent: string;
  isDeleted?: boolean;
}

/**
 * EditorWorkbench - Full-screen code editor for the Editor workbench
 */
export function EditorWorkbench({
  sessionId,
  initialFiles = [],
  fileToOpen,
  onFileOpened,
}: EditorWorkbenchProps): React.ReactElement {
  const [openFiles, setOpenFiles] = useState<EditorFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [conflict, setConflict] = useState<FileConflict | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const openFilesRef = useRef<EditorFile[]>([]);

  const { readFile, writeFile, isLoading, error } = useEditorFiles(sessionId);
  const { onEvent } = useWebSocketContext();

  // Keep ref in sync with state
  useEffect(() => {
    openFilesRef.current = openFiles;
  }, [openFiles]);

  // Get the active file
  const activeFile = openFiles.find((f) => f.path === activeFilePath);

  /**
   * Toast management functions
   */
  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    const id = `${Date.now()}-${Math.random()}`;
    const toast: ToastMessage = { id, message, type };
    setToasts((prev) => [...prev, toast]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /**
   * File sync callbacks
   */
  const handleFileModified = useCallback((path: string, newContent: string) => {
    setOpenFiles((prev) =>
      prev.map((file) =>
        file.path === path
          ? {
              ...file,
              content: newContent,
              originalContent: newContent,
              isDirty: false,
            }
          : file
      )
    );
  }, []);

  const handleFileDeleted = useCallback((path: string) => {
    setOpenFiles((prev) =>
      prev.map((file) =>
        file.path === path
          ? {
              ...file,
              isDeleted: true,
            }
          : file
      )
    );
  }, []);

  const handleConflictDetected = useCallback((detectedConflict: FileConflict) => {
    setConflict(detectedConflict);
  }, []);

  /**
   * Initialize file sync manager
   */
  const { handleFileSystemEvent } = useFileSyncManager({
    onFileModified: handleFileModified,
    onFileDeleted: handleFileDeleted,
    onConflictDetected: handleConflictDetected,
    readFileContent: async (path: string) => {
      const result = await readFile(path);
      return result?.content || '';
    },
    showToast,
  });

  /**
   * Subscribe to WebSocket file events
   */
  useEffect(() => {
    if (!onEvent) return;

    const unsubscribe = onEvent((event) => {
      if (
        event.type === 'file:modified' ||
        event.type === 'file:deleted' ||
        event.type === 'file:created'
      ) {
        handleFileSystemEvent(event, openFiles);
      }
    });

    return unsubscribe;
  }, [onEvent, handleFileSystemEvent, openFiles]);

  /**
   * Conflict resolution handlers
   */
  const handleConflictResolve = useCallback(
    (resolution: 'keep-mine' | 'take-theirs') => {
      if (!conflict) return;

      if (resolution === 'take-theirs') {
        handleFileModified(conflict.filePath, conflict.externalVersion);
        showToast(`File "${conflict.filePath}" updated with external version`, 'success');
      } else {
        setOpenFiles((prev) =>
          prev.map((file) =>
            file.path === conflict.filePath
              ? {
                  ...file,
                  content: conflict.userVersion,
                  isDirty: true,
                }
              : file
          )
        );
        showToast(`Kept your changes to "${conflict.filePath}"`, 'info');
      }

      setConflict(null);
    },
    [conflict, handleFileModified, showToast]
  );

  const handleShowDiff = useCallback(() => {
    if (!conflict) return;

    const userLines = conflict.userVersion.split('\n').length;
    const externalLines = conflict.externalVersion.split('\n').length;

    alert(
      `Diff View (simplified):\n\n` +
        `Your version: ${userLines} lines\n` +
        `External version: ${externalLines} lines\n\n` +
        `Full diff viewer coming soon...`
    );
  }, [conflict]);

  const handleConflictCancel = useCallback(() => {
    setConflict(null);
  }, []);

  /**
   * Open a file in the editor
   */
  const handleOpenFile = useCallback(
    async (path: string) => {
      const existingFile = openFiles.find((f) => f.path === path);
      if (existingFile) {
        setActiveFilePath(path);
        return;
      }

      try {
        const result = await readFile(path);
        if (result) {
          const newFile: EditorFile = {
            path,
            content: result.content,
            isDirty: false,
            originalContent: result.content,
          };

          setOpenFiles((prev) => [...prev, newFile]);
          setActiveFilePath(path);
        }
      } catch (err) {
        console.error('Error opening file:', err);
        showToast(`Failed to open file: ${path}`, 'error');
      }
    },
    [openFiles, readFile, showToast]
  );

  // Load initial files
  useEffect(() => {
    if (initialFiles.length > 0) {
      initialFiles.forEach((path) => {
        handleOpenFile(path);
      });
    }
  }, [initialFiles, handleOpenFile]);

  // Handle external file open requests
  useEffect(() => {
    if (fileToOpen) {
      handleOpenFile(fileToOpen);
      onFileOpened?.();
    }
  }, [fileToOpen, onFileOpened, handleOpenFile]);

  /**
   * Close a file tab
   */
  const handleCloseFile = useCallback(
    (path: string) => {
      const file = openFiles.find((f) => f.path === path);

      if (file?.isDirty) {
        const confirmed = window.confirm(`"${path}" has unsaved changes. Close anyway?`);
        if (!confirmed) return;
      }

      setOpenFiles((prev) => prev.filter((f) => f.path !== path));

      if (activeFilePath === path) {
        const remainingFiles = openFiles.filter((f) => f.path !== path);
        setActiveFilePath(remainingFiles.length > 0 ? remainingFiles[0].path : null);
      }
    },
    [openFiles, activeFilePath]
  );

  /**
   * Handle content change in editor
   */
  const handleContentChange = useCallback(
    (value: string | undefined) => {
      if (!activeFilePath || value === undefined) return;

      setOpenFiles((prev) =>
        prev.map((file) =>
          file.path === activeFilePath
            ? {
                ...file,
                content: value,
                isDirty: value !== file.originalContent,
              }
            : file
        )
      );
    },
    [activeFilePath]
  );

  /**
   * Save the active file (Ctrl/Cmd+S)
   */
  const handleSave = useCallback(async () => {
    const currentFiles = openFilesRef.current;
    const currentActiveFile = currentFiles.find((f) => f.path === activeFilePath);

    if (!currentActiveFile || !currentActiveFile.isDirty || !activeFilePath) return;

    try {
      await writeFile(currentActiveFile.path, currentActiveFile.content);

      setOpenFiles((prev) =>
        prev.map((file) =>
          file.path === activeFilePath
            ? {
                ...file,
                isDirty: false,
                originalContent: file.content,
              }
            : file
        )
      );

      showToast(`Saved: ${currentActiveFile.path}`, 'success');
    } catch (err) {
      console.error('Error saving file:', err);
      showToast(`Failed to save file: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  }, [activeFilePath, writeFile, showToast]);

  /**
   * Handle editor mount
   */
  const handleEditorMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;

      // Add Ctrl/Cmd+S keyboard shortcut for save
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        handleSave();
      });

      // Focus editor on mount
      editor.focus();
    },
    [handleSave]
  );

  /**
   * Get language from file extension
   */
  const getLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    return LANGUAGE_MAP[ext || ''] || 'plaintext';
  };

  /**
   * Get breadcrumb segments from file path
   */
  const getBreadcrumbSegments = (path: string): string[] => {
    if (!path) return [];
    return path.split('/').filter(Boolean);
  };

  /**
   * Check if any files have unsaved changes
   */
  const hasUnsavedChanges = openFiles.some((f) => f.isDirty);

  return (
    <div className="editor-workbench">
      {/* Header Bar */}
      <div className="editor-workbench__header">
        <div className="editor-workbench__header-left">
          <h1 className="editor-workbench__title">Editor</h1>
          {hasUnsavedChanges && (
            <span className="editor-workbench__unsaved-badge">Unsaved Changes</span>
          )}
        </div>
        <div className="editor-workbench__header-right">
          {activeFile && (
            <div className="editor-workbench__breadcrumb">
              {getBreadcrumbSegments(activeFile.path).map((segment, index, arr) => (
                <React.Fragment key={index}>
                  <span
                    className={`breadcrumb-segment ${
                      index === arr.length - 1 ? 'breadcrumb-segment--file' : ''
                    }`}
                  >
                    {segment}
                  </span>
                  {index < arr.length - 1 && (
                    <span className="breadcrumb-separator">/</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Tabs */}
      <EditorTabs
        files={openFiles}
        activeFilePath={activeFilePath}
        onTabClick={setActiveFilePath}
        onTabClose={handleCloseFile}
      />

      {/* Main Editor Content */}
      <div className="editor-workbench__content">
        {isLoading && (
          <div className="editor-workbench__loading">
            <div className="loading-spinner" />
            <span>Loading file...</span>
          </div>
        )}

        {error && (
          <div className="editor-workbench__error">
            <span className="error-icon">!</span>
            <p className="error-message">{error}</p>
          </div>
        )}

        {!isLoading && !error && activeFile && (
          <Editor
            height="100%"
            language={getLanguage(activeFile.path)}
            value={activeFile.content}
            onChange={handleContentChange}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: true,
              scrollBeyondLastLine: false,
              readOnly: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
              folding: true,
              foldingHighlight: true,
              showFoldingControls: 'mouseover',
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
            }}
          />
        )}

        {!isLoading && !error && !activeFile && (
          <div className="editor-workbench__empty">
            <div className="empty-icon">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h2>No File Open</h2>
            <p className="empty-hint">
              Open a file from the file explorer or use the command palette
            </p>
            <p className="empty-shortcut">
              <kbd>Ctrl</kbd> + <kbd>P</kbd> to quick open
            </p>
          </div>
        )}
      </div>

      {/* Conflict resolution dialog */}
      {conflict && (
        <ConflictDialog
          filePath={conflict.filePath}
          userVersion={conflict.userVersion}
          externalVersion={conflict.externalVersion}
          onResolve={handleConflictResolve}
          onShowDiff={handleShowDiff}
          onCancel={handleConflictCancel}
        />
      )}

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
