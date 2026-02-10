/**
 * useDiscussButton Hook
 *
 * Manages the state and behavior for the DiscussButton + DiscussDialog combo.
 * Formats the discussion message with optional context and sends it to ChatPanel.
 *
 * Features:
 * - Dialog state management (open/close)
 * - Message formatting with markdown <details> block for context
 * - Automatic routing to ChatPanel via DiscussContext (legacy)
 * - Integration with ChatWindowContext for sliding chat window
 * - Works with all 41+ components without requiring individual wiring
 */

import { useState, useCallback } from 'react';
import { useDiscussContext } from '../contexts/DiscussContext';

export interface UseDiscussButtonParams {
  /** Name of the component being discussed */
  componentName: string;
  /** Optional function to get current component context */
  getContext?: () => Record<string, unknown>;
}

export interface UseDiscussButtonReturn {
  /** Whether the dialog is currently open */
  isDialogOpen: boolean;
  /** Open the dialog */
  openDialog: () => void;
  /** Close the dialog */
  closeDialog: () => void;
  /** Handle sending the message (formats and sends to chat) */
  handleSend: (message: string) => void;
}

/**
 * useDiscussButton - Hook for managing DiscussButton/DiscussDialog state
 */
export function useDiscussButton({
  getContext,
}: UseDiscussButtonParams): UseDiscussButtonReturn {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { prefillChatInput, registerDiscussionMessage } = useDiscussContext();

  const openDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  /**
   * Format the message with optional context and send to chat
   * Note: Does NOT close the dialog - the caller should do that
   */
  const handleSend = useCallback(
    (message: string): void => {
      const context = getContext?.();

      let formattedMessage = message;

      if (context && Object.keys(context).length > 0) {
        // Format as markdown with collapsible details
        formattedMessage = `${message}

<details>
<summary>Component Context</summary>

\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`

</details>`;
      }

      // Register message for sliding chat window integration
      registerDiscussionMessage(formattedMessage, context);

      // Also send to chat via context (legacy support)
      prefillChatInput(formattedMessage);
    },
    [getContext, prefillChatInput, registerDiscussionMessage]
  );

  return {
    isDialogOpen,
    openDialog,
    closeDialog,
    handleSend,
  };
}
