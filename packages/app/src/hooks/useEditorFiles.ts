import { useState, useCallback } from 'react';
import type { SessionId } from '@afw/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface FileContent {
  content: string;
  encoding: string;
  size: number;
  modified: string;
}

export interface WriteFileResult {
  path: string;
  size: number;
  modified: string;
}

/**
 * Hook for editor file operations (read, write)
 */
export function useEditorFiles(sessionId: SessionId) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Read a file's contents
   */
  const readFile = useCallback(
    async (path: string): Promise<FileContent | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/files/${sessionId}/read?path=${encodeURIComponent(path)}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to read file');
        }

        const data = await response.json();
        return {
          content: data.content,
          encoding: data.encoding,
          size: data.size,
          modified: data.modified,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error reading file:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  /**
   * Write a file's contents
   */
  const writeFile = useCallback(
    async (path: string, content: string): Promise<WriteFileResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/files/${sessionId}/write?path=${encodeURIComponent(path)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to write file');
        }

        const data = await response.json();
        return {
          path: data.path,
          size: data.size,
          modified: data.modified,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error writing file:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId]
  );

  return {
    readFile,
    writeFile,
    isLoading,
    error,
  };
}
