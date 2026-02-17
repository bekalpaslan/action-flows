/**
 * usePromptButtons Hook
 * Returns context-aware prompt buttons based on session state and chat messages.
 * Buttons auto-adjust as session state changes.
 */

import { useMemo, useCallback } from 'react';
import type { Session } from '@afw/shared';
import type { ChatDisplayMessage } from './useChatMessages';
import { selectPromptButtons, type PromptButton, type PromptButtonContext } from '../services/promptButtonSelector';

export interface UsePromptButtonsOptions {
  /** Current session data */
  session?: Session;
  /** Chat messages for context detection */
  messages: ChatDisplayMessage[];
  /** Whether the CLI session is currently running */
  cliRunning: boolean;
}

export interface UsePromptButtonsReturn {
  /** Array of context-aware prompt buttons */
  buttons: PromptButton[];
  /** Handle button click - returns the prompt text to send */
  getButtonPromptText: (button: PromptButton) => string | null;
}

/**
 * usePromptButtons - Returns context-aware prompt buttons
 */
export function usePromptButtons({
  session,
  messages,
  cliRunning,
}: UsePromptButtonsOptions): UsePromptButtonsReturn {
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;

  const buttons = useMemo(() => {
    const context: PromptButtonContext = {
      sessionStatus: session?.status || 'unknown',
      conversationState: session?.conversationState || 'idle',
      lastMessage,
      cliRunning,
      chainPaused: (session?.currentChain?.status as string) === 'paused',
      quickResponses: session?.lastPrompt?.quickResponses,
    };

    return selectPromptButtons(context);
  }, [session, lastMessage, cliRunning]);

  const getButtonPromptText = useCallback((button: PromptButton): string | null => {
    if (button.promptText) {
      return button.promptText;
    }
    // For command-type buttons, return null (handled differently)
    return null;
  }, []);

  return {
    buttons,
    getButtonPromptText,
  };
}
