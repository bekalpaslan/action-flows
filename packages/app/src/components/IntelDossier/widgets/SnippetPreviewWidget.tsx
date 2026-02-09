/**
 * SnippetPreviewWidget Component
 *
 * Displays a code snippet with file name, line range, and optional annotation.
 */

import './widgets.css';

export interface SnippetPreviewWidgetProps {
  data: {
    file: string;
    lineStart?: number;
    lineEnd?: number;
    code: string;
    annotation?: string;
    language?: string;
  };
  span: number;
}

/**
 * Code excerpt with metadata and annotation.
 */
export function SnippetPreviewWidget({ data, span }: SnippetPreviewWidgetProps) {
  const { file, lineStart, lineEnd, code, annotation, language } = data;

  const lineRange = lineStart && lineEnd
    ? `:${lineStart}-${lineEnd}`
    : lineStart
    ? `:${lineStart}`
    : '';

  return (
    <div className="widget widget-snippet-preview" style={{ gridColumn: `span ${span}` }}>
      <div className="widget-snippet-preview__header">
        <span className="widget-snippet-preview__file">{file}{lineRange}</span>
        {language && (
          <span className="widget-snippet-preview__language">{language}</span>
        )}
      </div>
      <pre className="widget-snippet-preview__code">
        <code>{code}</code>
      </pre>
      {annotation && (
        <div className="widget-snippet-preview__annotation">{annotation}</div>
      )}
    </div>
  );
}
