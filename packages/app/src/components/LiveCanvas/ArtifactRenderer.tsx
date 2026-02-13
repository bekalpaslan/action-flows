/**
 * ArtifactRenderer Component
 *
 * Phase 2B of Inspiration Roadmap — Thread 4 (Live Canvas)
 *
 * Renders agent-generated artifacts (HTML, SVG, Mermaid, Markdown, React)
 * in a sandboxed iframe. Shows loading/error states. Supports live updates via WS.
 */

import { useEffect, useRef, useState } from 'react';
import type { StoredArtifact, ArtifactType } from '@afw/shared';
import './ArtifactRenderer.css';

export interface ArtifactRendererProps {
  artifact: StoredArtifact;
  onError?: (error: Error) => void;
}

/**
 * Renders an artifact based on its type
 */
export function ArtifactRenderer({ artifact, onError }: ArtifactRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setRenderError(null);

    try {
      if (!iframeRef.current) return;

      const content = renderArtifactContent(artifact);
      const iframe = iframeRef.current;

      // Write content to iframe
      const doc = iframe.contentDocument;
      if (!doc) {
        throw new Error('Failed to access iframe document');
      }

      doc.open();
      doc.write(content);
      doc.close();

      setIsLoading(false);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setRenderError(err.message);
      setIsLoading(false);
      onError?.(err);
    }
  }, [artifact, onError]);

  if (artifact.status === 'error') {
    return (
      <div className="artifact-renderer artifact-renderer--error">
        <div className="artifact-renderer__error-icon">⚠️</div>
        <div className="artifact-renderer__error-message">
          Artifact failed to generate
        </div>
        {artifact.data?.error && (
          <div className="artifact-renderer__error-details">
            {String(artifact.data.error)}
          </div>
        )}
      </div>
    );
  }

  if (renderError) {
    return (
      <div className="artifact-renderer artifact-renderer--error">
        <div className="artifact-renderer__error-icon">⚠️</div>
        <div className="artifact-renderer__error-message">
          Failed to render artifact
        </div>
        <div className="artifact-renderer__error-details">
          {renderError}
        </div>
      </div>
    );
  }

  return (
    <div className="artifact-renderer">
      {isLoading && (
        <div className="artifact-renderer__loading">
          <div className="artifact-renderer__spinner" />
          <div className="artifact-renderer__loading-text">
            Rendering {artifact.type} artifact...
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        className="artifact-renderer__iframe"
        sandbox="allow-scripts"
        title={artifact.title || `Artifact ${artifact.id}`}
        style={{ opacity: isLoading ? 0 : 1 }}
      />
    </div>
  );
}

/**
 * Generate HTML content for an artifact based on its type
 */
function renderArtifactContent(artifact: StoredArtifact): string {
  const baseStyles = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 16px;
        background: #ffffff;
        color: #1a1a1a;
      }
      pre {
        background: #f5f5f5;
        padding: 12px;
        border-radius: 4px;
        overflow-x: auto;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 14px;
      }
      code {
        font-family: 'Monaco', 'Menlo', monospace;
      }
    </style>
  `;

  switch (artifact.type) {
    case 'html':
      return wrapInHtmlDocument(artifact.content, baseStyles);

    case 'svg':
      return wrapInHtmlDocument(artifact.content, baseStyles);

    case 'markdown':
      return wrapInHtmlDocument(
        `<div class="markdown-content">${convertMarkdownToHtml(artifact.content)}</div>`,
        baseStyles + getMarkdownStyles()
      );

    case 'mermaid':
      return wrapInHtmlDocument(
        `<pre class="mermaid-diagram">${escapeHtml(artifact.content)}</pre>`,
        baseStyles + getMermaidStyles()
      );

    case 'react':
      // For React artifacts, we need a more complex setup
      // For now, show the source code as a fallback
      return wrapInHtmlDocument(
        `<div class="react-artifact">
          <div class="react-artifact__header">React Component</div>
          <pre><code>${escapeHtml(artifact.content)}</code></pre>
          <div class="react-artifact__note">
            Note: Live React rendering requires additional setup
          </div>
        </div>`,
        baseStyles + getReactStyles()
      );

    default:
      return wrapInHtmlDocument(
        `<pre><code>${escapeHtml(artifact.content)}</code></pre>`,
        baseStyles
      );
  }
}

/**
 * Wrap content in a complete HTML document
 */
function wrapInHtmlDocument(content: string, styles: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${styles}
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;
}

/**
 * Simple markdown to HTML conversion
 * Supports: headers, bold, italic, code blocks, links, lists
 */
function convertMarkdownToHtml(markdown: string): string {
  let html = markdown;

  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]+?)\n```/g, (_, lang, code) => {
    return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code)}</code></pre>`;
  });

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // Line breaks
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');

  // Wrap in paragraph
  html = `<p>${html}</p>`;

  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Additional styles for markdown content
 */
function getMarkdownStyles(): string {
  return `
    <style>
      .markdown-content h1 {
        font-size: 2em;
        margin-bottom: 0.5em;
        border-bottom: 2px solid #e0e0e0;
        padding-bottom: 0.3em;
      }
      .markdown-content h2 {
        font-size: 1.5em;
        margin-top: 1em;
        margin-bottom: 0.5em;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 0.3em;
      }
      .markdown-content h3 {
        font-size: 1.25em;
        margin-top: 0.8em;
        margin-bottom: 0.4em;
      }
      .markdown-content p {
        line-height: 1.6;
        margin-bottom: 1em;
      }
      .markdown-content a {
        color: #0066cc;
        text-decoration: none;
      }
      .markdown-content a:hover {
        text-decoration: underline;
      }
      .markdown-content code {
        background: #f5f5f5;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 0.9em;
      }
      .markdown-content pre code {
        background: none;
        padding: 0;
      }
    </style>
  `;
}

/**
 * Styles for mermaid diagrams (static display)
 */
function getMermaidStyles(): string {
  return `
    <style>
      .mermaid-diagram {
        background: #f9f9f9;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 16px;
        font-family: monospace;
        white-space: pre-wrap;
        line-height: 1.5;
      }
    </style>
  `;
}

/**
 * Styles for React component display
 */
function getReactStyles(): string {
  return `
    <style>
      .react-artifact {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
      }
      .react-artifact__header {
        background: #f5f5f5;
        padding: 12px 16px;
        font-weight: 600;
        border-bottom: 1px solid #e0e0e0;
      }
      .react-artifact pre {
        margin: 16px;
        background: #f9f9f9;
        border: 1px solid #e0e0e0;
      }
      .react-artifact__note {
        background: #fffbea;
        border-top: 1px solid #ffd700;
        padding: 12px 16px;
        font-size: 0.9em;
        color: #856404;
      }
    </style>
  `;
}
