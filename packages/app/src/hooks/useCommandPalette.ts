/**
 * useCommandPalette Hook
 *
 * Manages the command palette state and keyboard interactions.
 * Provides fuzzy search, keyboard navigation, and command execution.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { commandRegistry, type Command } from '../utils/commandRegistry';

export interface UseCommandPaletteResult {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  query: string;
  setQuery: (query: string) => void;
  results: Command[];
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  executeSelected: () => void;
  executeCommand: (commandId: string) => void;
}

export function useCommandPalette(): UseCommandPaletteResult {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Compute results based on query
  const results = useMemo(() => {
    if (!query.trim()) {
      // Show recent commands when query is empty
      const recent = commandRegistry.getRecent();
      if (recent.length > 0) {
        return recent;
      }
      // Fallback to all commands if no recent history
      return commandRegistry.getAll();
    }
    return commandRegistry.search(query);
  }, [query]);

  // Reset selected index when query or results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, results]);

  // Open/close handlers
  const open = useCallback(() => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Execute selected command
  const executeSelected = useCallback(async () => {
    if (results.length === 0) return;

    const command = results[selectedIndex];
    if (!command) return;

    try {
      await commandRegistry.execute(command.id);
      close();
    } catch (error) {
      console.error('Failed to execute command:', error);
    }
  }, [results, selectedIndex, close]);

  // Execute command by ID
  const executeCommand = useCallback(async (commandId: string) => {
    try {
      await commandRegistry.execute(commandId);
      close();
    } catch (error) {
      console.error('Failed to execute command:', error);
    }
  }, [close]);

  // Global keyboard listener
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows) to toggle
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        toggle();
        return;
      }

      // Only handle these keys when palette is open
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          close();
          break;

        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;

        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : prev
          );
          break;

        case 'Enter':
          event.preventDefault();
          executeSelected();
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, results.length, toggle, close, executeSelected]);

  return {
    isOpen,
    open,
    close,
    toggle,
    query,
    setQuery,
    results,
    selectedIndex,
    setSelectedIndex,
    executeSelected,
    executeCommand,
  };
}
