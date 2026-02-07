import { useEffect, useCallback } from 'react';

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  handler: () => void;
  description?: string;
}

/**
 * useKeyboardShortcuts hook
 *
 * Registers global keyboard shortcuts for session window navigation
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        // Check if all modifier keys match
        const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey;
        const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey;
        const altMatch = shortcut.altKey === undefined || shortcut.altKey === event.altKey;
        const metaMatch = shortcut.metaKey === undefined || shortcut.metaKey === event.metaKey;

        // Check if key matches
        const keyMatch = shortcut.key === event.key || shortcut.key === event.code;

        if (ctrlMatch && shiftMatch && altMatch && metaMatch && keyMatch) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

/**
 * useSessionWindowKeyboardShortcuts hook
 *
 * Registers shortcuts specific to session window grid navigation
 */
export function useSessionWindowKeyboardShortcuts({
  onExitFullScreen,
  onToggleFullScreen,
  onFocusTile,
  onCycleTiles,
}: {
  onExitFullScreen?: () => void;
  onToggleFullScreen?: () => void;
  onFocusTile?: (index: number) => void;
  onCycleTiles?: (direction: 'next' | 'prev') => void;
}) {
  const shortcuts: KeyboardShortcut[] = [];

  // Escape: exit full-screen
  if (onExitFullScreen) {
    shortcuts.push({
      key: 'Escape',
      handler: onExitFullScreen,
      description: 'Exit full-screen mode',
    });
  }

  // F: toggle full-screen on focused tile
  if (onToggleFullScreen) {
    shortcuts.push({
      key: 'f',
      handler: onToggleFullScreen,
      description: 'Toggle full-screen mode',
    });
  }

  // 1-9: focus specific tile
  if (onFocusTile) {
    for (let i = 1; i <= 9; i++) {
      shortcuts.push({
        key: `${i}`,
        handler: () => onFocusTile(i - 1),
        description: `Focus session tile ${i}`,
      });
    }
  }

  // Tab: cycle to next tile
  if (onCycleTiles) {
    shortcuts.push({
      key: 'Tab',
      handler: () => onCycleTiles('next'),
      description: 'Cycle to next session tile',
    });

    shortcuts.push({
      key: 'Tab',
      shiftKey: true,
      handler: () => onCycleTiles('prev'),
      description: 'Cycle to previous session tile',
    });
  }

  useKeyboardShortcuts(shortcuts);
}
