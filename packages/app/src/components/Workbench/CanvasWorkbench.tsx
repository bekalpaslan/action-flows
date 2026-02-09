/**
 * CanvasWorkbench Component
 * Live HTML/CSS preview for design collaboration
 *
 * Features:
 * - Monaco Editor for HTML/CSS input
 * - Sandboxed iframe for live preview
 * - localStorage persistence
 * - Clear button to reset
 *
 * Layout:
 * - Header with title and clear button
 * - Split pane: 60% editor (left) / 40% preview (right)
 * - Monaco Editor with HTML syntax highlighting
 * - Sandboxed iframe with srcDoc for rendering
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { configureMonaco } from '../../monaco-config';
import './CanvasWorkbench.css';

// Configure Monaco workers on module load
configureMonaco();

const STORAGE_KEY = 'afw-canvas-markup';
const DEBOUNCE_DELAY = 500;

export interface CanvasWorkbenchProps {
  initialMarkup?: string;
  onContentChange?: (markup: string) => void;
}

export function CanvasWorkbench({
  initialMarkup = '',
  onContentChange,
}: CanvasWorkbenchProps) {
  const [markup, setMarkup] = useState<string>(() => {
    // Try to load from localStorage first, fall back to initialMarkup
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored || initialMarkup;
    } catch {
      return initialMarkup;
    }
  });

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist markup to localStorage with debounce
  useEffect(() => {
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, markup);
        onContentChange?.(markup);
      } catch (err) {
        console.error('Failed to save canvas markup to localStorage:', err);
      }
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        // Persist final state on unmount so debounced writes aren't lost
        try {
          localStorage.setItem(STORAGE_KEY, markup);
        } catch {
          // Ignore quota errors on cleanup
        }
      }
    };
  }, [markup, onContentChange]);

  /**
   * Handle markup change from editor
   */
  const handleMarkupChange = useCallback((value: string | undefined) => {
    setMarkup(value || '');
  }, []);

  /**
   * Clear canvas (reset markup to empty)
   */
  const handleClear = useCallback(() => {
    if (markup.trim() === '') return;
    if (confirm('Clear canvas markup? This cannot be undone.')) {
      setMarkup('');
    }
  }, [markup]);

  /**
   * Generate iframe content with proper HTML structure
   */
  const generateIframeContent = (htmlMarkup: string): string => {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="script-src 'none'; object-src 'none';">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { margin: 0; padding: 16px; font-family: system-ui, -apple-system, sans-serif; background: #ffffff; }
    </style>
  </head>
  <body>
    ${htmlMarkup}
  </body>
</html>`;
  };

  return (
    <div className="canvas-workbench">
      {/* Header */}
      <header className="canvas-workbench__header">
        <h1 className="canvas-workbench__title">Canvas</h1>
        <div className="canvas-workbench__controls">
          <button
            type="button"
            className="canvas-workbench__button"
            onClick={handleClear}
            title="Clear canvas markup"
          >
            Clear
          </button>
        </div>
      </header>

      {/* Content: Editor + Preview */}
      <div className="canvas-workbench__content">
        {/* Left: Monaco Editor (60%) */}
        <div className="canvas-workbench__editor">
          <Editor
            height="100%"
            language="html"
            value={markup}
            onChange={handleMarkupChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              fontFamily: "'Menlo', 'Monaco', 'Consolas', monospace",
            }}
          />
        </div>

        {/* Right: iframe Preview (40%) */}
        <div className="canvas-workbench__preview">
          <iframe
            title="Canvas Preview"
            className="canvas-workbench__iframe"
            srcDoc={generateIframeContent(markup)}
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
