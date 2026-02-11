import { useMemo } from 'react';
import type { Chapter } from '@afw/shared';
import './ChapterViewer.css';

interface ChapterViewerProps {
  chapter: Chapter | null;
}

/**
 * ChapterViewer Component
 * Displays a single chapter with beautiful typography for reading
 * Renders markdown content with prose styling
 */
export function ChapterViewer({ chapter }: ChapterViewerProps) {
  // Simple markdown parsing for headers, bold, italic
  // For production, use a library like react-markdown or marked
  const renderedContent = useMemo(() => {
    if (!chapter) return null;

    const html = chapter.content
      // Headers
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Line breaks
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');

    return `<p>${html}</p>`;
  }, [chapter]);

  if (!chapter) {
    return (
      <div className="chapter-viewer">
        <div className="chapter-viewer__empty">
          <p>Select a chapter to read</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chapter-viewer">
      <div className="chapter-viewer__header">
        <h2 className="chapter-viewer__title">{chapter.title}</h2>
        <div className="chapter-viewer__meta">
          <span className="chapter-viewer__meta-item">
            {chapter.wordCount} words
          </span>
          {chapter.theme && (
            <span className="chapter-viewer__meta-item">
              Theme: {chapter.theme}
            </span>
          )}
          <span className="chapter-viewer__meta-item">
            {new Date(chapter.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="chapter-viewer__content">
        <div
          className="chapter-viewer__prose"
          dangerouslySetInnerHTML={{ __html: renderedContent || '' }}
        />
      </div>
    </div>
  );
}
