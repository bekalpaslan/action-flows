import { useState, useCallback, useRef, useEffect } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { EditorTabs } from './EditorTabs';
import { useEditorFiles } from '../../hooks/useEditorFiles';
import type { SessionId } from '@afw/shared';
import { configureMonaco } from '../../monaco-config';
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import { useFileSyncManager, type FileConflict } from '../../hooks/useFileSyncManager';
import { ConflictDialog } from './ConflictDialog';
import { ToastContainer, type ToastMessage } from '../Toast/Toast';
import './CodeEditor.css';

// Configure Monaco workers on module load
configureMonaco();

/**
 * Language map for file extensions
 * Defined at module scope to avoid recreation on every render
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

export interface CodeEditorProps {
  sessionId: SessionId;
  initialFiles?: string[];
  fileToOpen?: string | null;
  onFileOpened?: () => void;
}

interface EditorFile {
  path: string;
  content: string;
  isDirty: boolean;
  originalContent: string;
}

/**
 * CodeEditor component with Monaco Editor integration
 *
 * Features:
 * - Multiple file tabs with close buttons
 * - Syntax highlighting for TypeScript, Python, JSON, etc.
 * - Save functionality (Ctrl+S)
 * - Unsaved changes tracking
 * - Go to Line (Ctrl+G)
 * - Find (Ctrl+F)
 */
export function CodeEditor({ sessionId, initialFiles = [], fileToOpen, onFileOpened }: CodeEditorProps) {
  const [openFiles, setOpenFiles] = useState<EditorFile[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [conflict, setConflict] = useState<FileConflict | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  // Use ref to always have the current openFiles state for save operations
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
   * Toast management functions (C2 fix)
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
   * File sync callbacks (C1 fix)
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
   * Initialize file sync manager (C1 fix)
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
   * Subscribe to WebSocket file events (C1 fix)
   */
  useEffect(() => {
    if (!onEvent) return;

    const unsubscribe = onEvent((event) => {
      // Only handle file events
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
   * Conflict resolution handlers (C1 fix)
   */
  const handleConflictResolve = useCallback(
    (resolution: 'keep-mine' | 'take-theirs') => {
      if (!conflict) return;

      if (resolution === 'take-theirs') {
        // Discard user changes, use external version
        handleFileModified(conflict.filePath, conflict.externalVersion);
        showToast(`File "${conflict.filePath}" updated with external version`, 'success');
      } else {
        // Keep user changes, mark as dirty
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

    // For now, just show an alert with line counts
    // In a full implementation, this would open a diff viewer
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
      // Check if file is already open
      const existingFile = openFiles.find((f) => f.path === path);
      if (existingFile) {
        setActiveFilePath(path);
        return;
      }

      // Read file content
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
      }
    },
    [openFiles, readFile]
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

      // Confirm if file has unsaved changes
      if (file?.isDirty) {
        const confirmed = window.confirm(
          `"${path}" has unsaved changes. Close anyway?`
        );
        if (!confirmed) return;
      }

      setOpenFiles((prev) => prev.filter((f) => f.path !== path));

      // Switch to another file if closing the active one
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
   * Save the active file (Ctrl+S)
   * Uses ref to get current file state, avoiding stale closures
   */
  const handleSave = useCallback(async () => {
    const currentFiles = openFilesRef.current;
    const currentActiveFile = currentFiles.find((f) => f.path === activeFilePath);

    if (!currentActiveFile || !currentActiveFile.isDirty || !activeFilePath) return;

    try {
      await writeFile(currentActiveFile.path, currentActiveFile.content);

      // Clear dirty flag and update original content
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

      console.log(`Saved: ${currentActiveFile.path}`);
    } catch (err) {
      console.error('Error saving file:', err);
      alert(`Failed to save file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [activeFilePath, writeFile]);

  /**
   * Handle editor mount
   */
  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Add Ctrl+S keyboard shortcut for save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    // Ctrl+G is built-in (Go to Line)
    // Ctrl+F is built-in (Find)
  }, [handleSave]);

  /**
   * Get language from file extension
   */
  const getLanguage = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    return LANGUAGE_MAP[ext || ''] || 'plaintext';
  };

  return (
    <aside className={`code-editor ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="code-editor-header">
        <h3 className="code-editor-title">Editor</h3>
        <div className="code-editor-actions">
          <button
            className="sidebar-toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand' : 'Collapse'}
            aria-label={isCollapsed ? 'Expand editor' : 'Collapse editor'}
          >
            {isCollapsed ? '←' : '→'}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <EditorTabs
            files={openFiles}
            activeFilePath={activeFilePath}
            onTabClick={setActiveFilePath}
            onTabClose={handleCloseFile}
          />

          <div className="code-editor-content">
            {isLoading && <div className="editor-loading">Loading file...</div>}
            {error && (
              <div className="editor-error">
                <p>Error:</p>
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
                }}
              />
            )}
            {!isLoading && !error && !activeFile && (
              <div className="editor-empty">
                <p>No file open</p>
                <p className="hint">Double-click a file in the explorer to open it</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Conflict resolution dialog (C1 fix) */}
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

      {/* Toast notifications (C2 fix) */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </aside>
  );
}
