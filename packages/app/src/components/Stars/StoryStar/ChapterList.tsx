import type { Chapter } from '@afw/shared';
import './ChapterList.css';

interface ChapterListProps {
  chapters: Chapter[];
  selectedChapterId: string | null;
  onSelect: (id: string) => void;
}

/**
 * ChapterList Component
 * Displays a sidebar list of all chapters with selection highlighting
 */
export function ChapterList({
  chapters,
  selectedChapterId,
  onSelect,
}: ChapterListProps) {
  if (chapters.length === 0) {
    return (
      <div className="chapter-list">
        <div className="chapter-list__empty">
          <p>No chapters yet</p>
          <p className="chapter-list__empty-hint">Say "tell me a story" to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chapter-list">
      {chapters.map((chapter) => (
        <button
          key={chapter.id}
          className={`chapter-list__item ${
            selectedChapterId === chapter.id ? 'active' : ''
          }`}
          onClick={() => onSelect(chapter.id)}
          type="button"
          title={chapter.title}
        >
          <span className="chapter-list__item-number">
            {chapter.number}
          </span>
          <span className="chapter-list__item-title">
            {chapter.title || `Chapter ${chapter.number}`}
          </span>
          {chapter.theme && (
            <span className="chapter-list__item-theme">{chapter.theme}</span>
          )}
        </button>
      ))}
    </div>
  );
}
