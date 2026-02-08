/**
 * StarBookmark Component
 *
 * Star icon component for bookmarking Claude responses.
 * When clicked, opens a dialog asking "Why are you starring this?"
 * Supports creating and removing bookmarks via API.
 *
 * SRD Section 3.4: Bookmark System
 */

import { useState, useCallback } from 'react';
import type { SessionId, Timestamp, BookmarkCategory } from '@afw/shared';
import { StarBookmarkDialog } from './StarBookmarkDialog';
import './StarBookmark.css';

interface StarBookmarkProps {
  /** Session containing this message */
  sessionId: SessionId;
  /** Index of the message in conversation */
  messageIndex: number;
  /** The message content to bookmark */
  messageContent: string;
  /** Timestamp of the message */
  messageTimestamp: Timestamp;
  /** Whether already bookmarked */
  isBookmarked?: boolean;
  /** Callback when bookmark is created */
  onBookmark?: (bookmarkId: string) => void;
  /** Callback when bookmark is removed */
  onUnbookmark?: () => void;
}

/**
 * Star icon component for bookmarking Claude responses.
 * When clicked, opens a dialog asking "Why are you starring this?"
 */
export function StarBookmark({
  sessionId,
  messageIndex,
  messageContent,
  messageTimestamp,
  isBookmarked = false,
  onBookmark,
  onUnbookmark,
}: StarBookmarkProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [starred, setStarred] = useState(isBookmarked);
  const [isLoading, setIsLoading] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);

  const handleClick = useCallback(() => {
    if (!starred) {
      setIsDialogOpen(true);
    } else {
      // Remove bookmark
      handleUnbookmark();
    }
  }, [starred]);

  const handleUnbookmark = useCallback(async () => {
    if (!bookmarkId) {
      console.warn('[StarBookmark] No bookmark ID to delete');
      setStarred(false);
      return;
    }

    setIsLoading(true);
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${BACKEND_URL}/api/bookmarks/${bookmarkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete bookmark: ${response.statusText}`);
      }

      setStarred(false);
      setBookmarkId(null);
      onUnbookmark?.();
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  }, [bookmarkId, onUnbookmark]);

  const handleBookmarkCreate = useCallback(
    async (category: BookmarkCategory, explanation: string, tags: string[]) => {
      setIsLoading(true);
      try {
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

        const response = await fetch(`${BACKEND_URL}/api/bookmarks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            messageIndex,
            messageContent,
            messageTimestamp,
            category,
            explanation,
            tags,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create bookmark: ${response.statusText}`);
        }

        const data = (await response.json()) as { id: string };
        setBookmarkId(data.id);
        setStarred(true);
        setIsDialogOpen(false);
        onBookmark?.(data.id);
      } catch (error) {
        console.error('Failed to create bookmark:', error);
        // Could show error toast here
      } finally {
        setIsLoading(false);
      }
    },
    [sessionId, messageIndex, messageContent, messageTimestamp, onBookmark]
  );

  return (
    <>
      <button
        className={`star-bookmark ${starred ? 'starred' : ''} ${isLoading ? 'loading' : ''}`}
        onClick={handleClick}
        disabled={isLoading}
        title={starred ? 'Remove bookmark' : 'Bookmark this response'}
        aria-label={starred ? 'Remove bookmark' : 'Bookmark this response'}
      >
        {starred ? '★' : '☆'}
      </button>

      {isDialogOpen && (
        <StarBookmarkDialog
          messageContent={messageContent}
          onSubmit={handleBookmarkCreate}
          onCancel={() => setIsDialogOpen(false)}
          isLoading={isLoading}
        />
      )}
    </>
  );
}
