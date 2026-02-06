import { DiffEditor } from '@monaco-editor/react';
import { useCallback, useState, useEffect } from 'react';
import type { SessionId } from '@afw/shared';
import './DiffView.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface DiffViewProps {
  sessionId: SessionId;
  path: string;
  onClose: () => void;
}

interface DiffData {
  before: string;
  after: string;
  hasPreviousVersion: boolean;
  message?: string;
}

/**
 * DiffView component showing side-by-side comparison
 *
 * Features:
 * - Monaco diff editor with before/after comparison
 * - Synchronized scrolling
 * - Close button
 */
export function DiffView({ sessionId, path, onClose }: DiffViewProps) {
  const [diffData, setDiffData] = useState<DiffData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load diff data from backend
   */
  useEffect(() => {
    const fetchDiff = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/files/${sessionId}/diff?path=${encodeURIComponent(path)}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to load diff');
        }

        const data = await response.json();
        setDiffData({
          before: data.before,
          after: data.after,
          hasPreviousVersion: data.hasPreviousVersion,
          message: data.message,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error loading diff:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiff();
  }, [sessionId, path]);

  /**
   * Get language from file extension
   */
  const getLanguage = useCallback((filePath: string): string => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
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

    return languageMap[ext || ''] || 'plaintext';
  }, []);

  return (
    <div className="diff-view-overlay">
      <div className="diff-view-container">
        <div className="diff-view-header">
          <h3 className="diff-view-title">Diff: {path}</h3>
          <button
            className="diff-close-btn"
            onClick={onClose}
            aria-label="Close diff view"
          >
            ×
          </button>
        </div>

        <div className="diff-view-content">
          {isLoading && (
            <div className="diff-loading">Loading diff...</div>
          )}
          {error && (
            <div className="diff-error">
              <p>Error loading diff:</p>
              <p className="error-message">{error}</p>
            </div>
          )}
          {!isLoading && !error && diffData && (
            <>
              {diffData.message && !diffData.hasPreviousVersion && (
                <div className="diff-warning">
                  <p>{diffData.message}</p>
                </div>
              )}
              <DiffEditor
                height="100%"
                language={getLanguage(path)}
                original={diffData.before}
                modified={diffData.after}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  renderSideBySide: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
