import { useState, useEffect, useRef, useCallback } from 'react';
import { commandRegistry, type CommandSearchResult } from '../../utils/commandRegistry';
import './CommandPalette.css';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * CommandPalette component
 *
 * Features:
 * - Modal overlay with backdrop
 * - Search input with fuzzy matching
 * - Command list with keyboard navigation
 * - Up/Down arrow navigation
 * - Enter to execute command
 * - Escape to close palette
 */
export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CommandSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /**
   * Search commands when query changes
   */
  useEffect(() => {
    if (isOpen) {
      const searchResults = commandRegistry.search(query);
      setResults(searchResults);
      setSelectedIndex(0); // Reset selection when results change
    }
  }, [query, isOpen]);

  /**
   * Focus input when palette opens
   */
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  /**
   * Reset state when closing
   */
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  /**
   * Scroll selected item into view
   */
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector('.command-item-selected');
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  /**
   * Execute selected command
   */
  const executeCommand = useCallback(async (commandId: string) => {
    try {
      await commandRegistry.execute(commandId);
      onClose();
    } catch (error) {
      console.error('Failed to execute command:', error);
      // Keep palette open on error so user can see what happened
    }
  }, [onClose]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;

      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          executeCommand(results[selectedIndex].command.id);
        }
        break;

      case 'Escape':
        e.preventDefault();
        onClose();
        break;

      default:
        break;
    }
  }, [results, selectedIndex, executeCommand, onClose]);

  /**
   * Handle backdrop click
   */
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  /**
   * Handle command item click
   */
  const handleCommandClick = useCallback((commandId: string) => {
    executeCommand(commandId);
  }, [executeCommand]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="command-palette-backdrop" onClick={handleBackdropClick}>
      <div className="command-palette">
        {/* Search Input */}
        <div className="command-palette-search">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              className="clear-button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Command List */}
        <div className="command-list" ref={listRef}>
          {results.length === 0 ? (
            <div className="no-results">
              {query ? 'No commands found' : 'No commands available'}
            </div>
          ) : (
            results.map((result, index) => {
              const { command } = result;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={command.id}
                  className={`command-item ${isSelected ? 'command-item-selected' : ''}`}
                  onClick={() => handleCommandClick(command.id)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="command-item-content">
                    {command.icon && (
                      <span className="command-icon">{command.icon}</span>
                    )}
                    <div className="command-text">
                      <div className="command-label">{command.label}</div>
                      {command.description && (
                        <div className="command-description">{command.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="command-meta">
                    {command.shortcut && (
                      <span className="command-shortcut">{command.shortcut}</span>
                    )}
                    <span className="command-category">{command.category}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with hints */}
        <div className="command-palette-footer">
          <span className="footer-hint">
            <kbd>↑↓</kbd> Navigate
          </span>
          <span className="footer-hint">
            <kbd>↵</kbd> Execute
          </span>
          <span className="footer-hint">
            <kbd>Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}
