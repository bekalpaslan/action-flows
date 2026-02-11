import { useMemo } from 'react';
import { useChapters } from '../../../hooks/useChapters';
import type { Chapter } from '@afw/shared';
import { ChapterList } from './ChapterList';
import { ChapterViewer } from './ChapterViewer';
import { ContinueButton } from './ContinueButton';
import { StoryMetadata } from './StoryMetadata';
import './StoryStar.css';

interface StoryStarProps {
  /** Override chapters from hook (useful for testing) */
  chapters?: Chapter[];
  /** Override selected chapter ID */
  selectedChapterId?: string;
  /** Callback when "Continue" button is clicked */
  onContinue?: () => Promise<void>;
  /** Callback when a chapter is selected */
  onChapterSelect?: (chapterId: string) => void;
}

/**
 * StoryStar Workbench Component
 * Main component for reading and navigating through story chapters
 * Provides beautiful prose reading experience with navigation sidebar
 */
export function StoryStar({
  chapters: overrideChapters,
  selectedChapterId: overrideSelectedId,
  onContinue: overrideOnContinue,
  onChapterSelect: overrideOnSelect,
}: StoryStarProps) {
  const {
    chapters: hookChapters,
    selectedChapterId: hookSelectedId,
    loading,
    error,
    selectChapter,
    continueStory,
  } = useChapters();

  // Use override props if provided (for testing/composition), otherwise use hook
  const chapters = overrideChapters ?? hookChapters;
  const selectedChapterId = overrideSelectedId ?? hookSelectedId;

  const handleSelectChapter = (id: string) => {
    selectChapter(id);
    overrideOnSelect?.(id);
  };

  const handleContinue = async () => {
    const handler = overrideOnContinue ?? continueStory;
    await handler();
  };

  // Get selected chapter
  const selectedChapter = useMemo(
    () => chapters.find((c) => c.id === selectedChapterId) || null,
    [chapters, selectedChapterId]
  );

  // Calculate total word count
  const totalWords = useMemo(
    () => chapters.reduce((sum, c) => sum + c.wordCount, 0),
    [chapters]
  );

  // Get last updated timestamp
  const lastUpdated = useMemo(() => {
    if (chapters.length === 0) return undefined;
    return chapters[chapters.length - 1].createdAt;
  }, [chapters]);

  // Show loading state
  if (loading) {
    return (
      <div className="story-star">
        <div className="story-star__loading">
          <div className="story-star__loading-spinner" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="story-star">
        <div className="story-star__empty-state">
          <p>Failed to load story</p>
          <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>{error.message}</p>
        </div>
      </div>
    );
  }

  // Show empty state if no chapters
  if (chapters.length === 0) {
    return (
      <div className="story-star">
        <div className="story-star__header">
          <h1>Story of Us</h1>
          <p style={{ margin: '0.5rem 0 0 0', opacity: 0.7 }}>
            No chapters yet. Say "tell me a story" to begin.
          </p>
        </div>

        <div className="story-star__empty-state">
          <p>The story awaits your word...</p>
          <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>
            Speak "tell me a story" in the orchestrator to begin writing.
          </p>
        </div>
      </div>
    );
  }

  // Render full story workbench
  return (
    <div className="story-star">
      <div className="story-star__header">
        <h1>Story of Us</h1>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1rem',
            gap: '1rem',
          }}
        >
          <StoryMetadata
            totalChapters={chapters.length}
            totalWords={totalWords}
            lastUpdated={lastUpdated}
          />
          <ContinueButton onClick={handleContinue} />
        </div>
      </div>

      <div className="story-star__content">
        <aside className="story-star__chapter-list">
          <ChapterList
            chapters={chapters}
            selectedChapterId={selectedChapterId}
            onSelect={handleSelectChapter}
          />
        </aside>

        <main className="story-star__chapter-viewer">
          <ChapterViewer chapter={selectedChapter} />
        </main>
      </div>
    </div>
  );
}

export default StoryStar;
