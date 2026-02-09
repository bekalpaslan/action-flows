import { useEffect, useRef } from 'react';
import { useVimContext } from '../contexts/VimNavigationContext';

const GG_TIMEOUT = 500; // ms for double-tap 'gg'

/**
 * Hook to set up global keyboard listeners for vim navigation.
 *
 * Normal mode keys:
 * - h: Navigate left/prev
 * - j: Navigate down/next
 * - k: Navigate up/prev
 * - l: Navigate right/next
 * - gg: Go to first target (double-tap)
 * - G: Go to last target
 * - /: Open command palette (search)
 * - i: Enter insert mode
 * - v: Enter visual mode
 * - :: Enter command mode
 * - Escape: Reset to normal mode
 *
 * Insert mode:
 * - Only Escape works (returns to normal)
 * - All other keys pass through
 *
 * Auto-insert mode when input/textarea is focused.
 */
export function useVimNavigation(): void {
  const {
    mode,
    setMode,
    isEnabled,
    navigateNext,
    navigatePrev,
    navigateFirst,
    navigateLast,
  } = useVimContext();

  const lastGPressRef = useRef<number>(0);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Auto-insert mode when focused on input elements
      if (isInputElement && mode === 'normal') {
        setMode('insert');
        return;
      }

      // In insert mode, only Escape works
      if (mode === 'insert') {
        if (e.key === 'Escape') {
          e.preventDefault();
          setMode('normal');
          // Blur the focused element to return to normal mode
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }
        return;
      }

      // Normal mode navigation
      if (mode === 'normal') {
        switch (e.key) {
          case 'h':
            e.preventDefault();
            navigatePrev();
            break;

          case 'j':
            e.preventDefault();
            navigateNext();
            break;

          case 'k':
            e.preventDefault();
            navigatePrev();
            break;

          case 'l':
            e.preventDefault();
            navigateNext();
            break;

          case 'g': {
            // Handle double-tap 'gg' for first target
            e.preventDefault();
            const now = Date.now();
            if (now - lastGPressRef.current < GG_TIMEOUT) {
              // Double-tap detected
              navigateFirst();
              lastGPressRef.current = 0;
            } else {
              // First 'g' press
              lastGPressRef.current = now;
            }
            break;
          }

          case 'G':
            e.preventDefault();
            navigateLast();
            break;

          case '/':
            e.preventDefault();
            // TODO: Open command palette
            // This will be wired up when command palette component is integrated
            console.log('Command palette: /');
            break;

          case 'i':
            e.preventDefault();
            setMode('insert');
            break;

          case 'v':
            e.preventDefault();
            setMode('visual');
            break;

          case ':':
            e.preventDefault();
            setMode('command');
            break;

          case 'Escape':
            e.preventDefault();
            setMode('normal');
            break;
        }
      }

      // Visual mode (future implementation)
      if (mode === 'visual') {
        if (e.key === 'Escape') {
          e.preventDefault();
          setMode('normal');
        }
        // TODO: Add visual mode navigation when needed
      }

      // Command mode (future implementation)
      if (mode === 'command') {
        if (e.key === 'Escape') {
          e.preventDefault();
          setMode('normal');
        }
        // TODO: Add command mode input handling when needed
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isEnabled,
    mode,
    setMode,
    navigateNext,
    navigatePrev,
    navigateFirst,
    navigateLast,
  ]);
}
