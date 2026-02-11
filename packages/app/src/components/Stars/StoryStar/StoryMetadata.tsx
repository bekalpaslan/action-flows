import './StoryMetadata.css';

interface StoryMetadataProps {
  totalChapters: number;
  totalWords: number;
  lastUpdated?: string;
}

/**
 * StoryMetadata Component
 * Displays statistics about the story (chapter count, word count, etc.)
 */
export function StoryMetadata({
  totalChapters,
  totalWords,
  lastUpdated,
}: StoryMetadataProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="story-metadata">
      <div className="story-metadata__stat">
        <span className="story-metadata__label">Chapters</span>
        <span className="story-metadata__value">{totalChapters}</span>
      </div>

      <span className="story-metadata__separator">•</span>

      <div className="story-metadata__stat">
        <span className="story-metadata__label">Words</span>
        <span className="story-metadata__value">{totalWords.toLocaleString()}</span>
      </div>

      {lastUpdated && (
        <>
          <span className="story-metadata__separator">•</span>

          <div className="story-metadata__stat">
            <span className="story-metadata__label">Updated</span>
            <span className="story-metadata__value">
              {formatDate(lastUpdated)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
