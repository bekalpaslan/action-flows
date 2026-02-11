import { useState, useEffect } from 'react';
import type { Chapter } from '@afw/shared';
export type { Chapter };

interface UseChaptersResult {
  chapters: Chapter[];
  selectedChapterId: string | null;
  loading: boolean;
  error: Error | null;
  selectChapter: (id: string) => void;
  continueStory: () => Promise<void>;
  refreshChapters: () => Promise<void>;
}

/**
 * Hook for fetching and managing story chapters
 * Provides data loading, chapter selection, and story continuation
 */
export function useChapters(): UseChaptersResult {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Fetch chapters on mount
  useEffect(() => {
    refreshChapters();
  }, []);

  // Auto-select first chapter when chapters load
  useEffect(() => {
    if (chapters.length > 0 && !selectedChapterId) {
      setSelectedChapterId(chapters[0].id);
    }
  }, [chapters, selectedChapterId]);

  const refreshChapters = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/story/chapters`);
      if (!response.ok) {
        throw new Error(`Failed to fetch chapters: ${response.statusText}`);
      }

      const data = await response.json();
      setChapters(Array.isArray(data) ? data : []);

      // Reset selected chapter if list changed
      if (selectedChapterId && !data.some((c: Chapter) => c.id === selectedChapterId)) {
        setSelectedChapterId(data.length > 0 ? data[0].id : null);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('[useChapters] Error fetching chapters:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectChapter = (id: string) => {
    if (chapters.some((c) => c.id === id)) {
      setSelectedChapterId(id);
    }
  };

  const continueStory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/story/continue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: 'auto-generated' }),
      });

      if (!response.ok) {
        throw new Error(`Failed to continue story: ${response.statusText}`);
      }

      // Refresh chapters to show the new one
      // In a full implementation, this would be triggered by WebSocket event
      setTimeout(() => {
        refreshChapters();
      }, 1000);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      console.error('[useChapters] Error continuing story:', error);
      throw error;
    }
  };

  return {
    chapters,
    selectedChapterId,
    loading,
    error,
    selectChapter,
    continueStory,
    refreshChapters,
  };
}
