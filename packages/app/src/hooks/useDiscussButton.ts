/**
 * useDiscussButton Hook
 *
 * Manages the state and behavior for the DiscussButton + DiscussDialog combo.
 * Formats the discussion message with optional context for sending to chat.
 *
 * MVP Scope:
 * - Dialog state management (open/close)
 * - Message formatting with markdown <details> block for context
 * - Returns formatted message string (parent component decides what to do with it)
 */

import { useState, useCallback } from 'react';

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
  /** Handle sending the message (formats and returns the message) */
  handleSend: (message: string) => string;
}

/**
 * useDiscussButton - Hook for managing DiscussButton/DiscussDialog state
 */
export function useDiscussButton({
  getContext,
}: UseDiscussButtonParams): UseDiscussButtonReturn {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  /**
   * Format the message with optional context as markdown <details> block
   */
  const handleSend = useCallback(
    (message: string): string => {
      const context = getContext?.();

      if (!context || Object.keys(context).length === 0) {
        return message;
      }

      // Format as markdown with collapsible details
      const formattedMessage = `${message}

<details>
<summary>Component Context</summary>

\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\`

</details>`;

      return formattedMessage;
    },
    [getContext]
  );

  return {
    isDialogOpen,
    openDialog,
    closeDialog,
    handleSend,
  };
}
