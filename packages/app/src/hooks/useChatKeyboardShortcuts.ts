import { useEffect } from 'react';
import { useChatWindowContext } from '../contexts/ChatWindowContext';

/**
 * useChatKeyboardShortcuts
 * Hook that manages keyboard shortcuts for the sliding chat window.
 *
 * Shortcuts:
 * - Cmd/Ctrl+Shift+C: Toggle chat panel open/close (global)
 * - Escape: Close chat panel (only when chat is open, respects input fields)
 *
 * Edge cases handled:
 * - Escape in Monaco editor, xterm terminal, or other text inputs outside chat won't close chat
 * - Escape in chat input field WILL close the chat
 * - Cmd/Ctrl+Shift+C works from anywhere globally
 */
export function useChatKeyboardShortcuts() {
  const { isOpen, toggleChat, closeChat } = useChatWindowContext();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+Shift+C — toggle chat (global shortcut)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        toggleChat();
        return;
      }

      // Escape — close chat (only when open)
      if (e.key === 'Escape' && isOpen) {
        const active = document.activeElement;

        // Check if active element is an input or textarea
        const isInInput =
          active instanceof HTMLInputElement ||
          active instanceof HTMLTextAreaElement;

        // If in an input, only prevent Escape if it's NOT inside the chat window
        if (isInInput && !active.closest('.sliding-chat-window')) {
          // Don't intercept — let the input handle Escape as normal
          return;
        }

        e.preventDefault();
        closeChat();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleChat, closeChat]);
}
