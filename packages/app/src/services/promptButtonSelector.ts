/**
 * Prompt Button Selector Service
 * Determines which prompt buttons to display based on current session state.
 *
 * Button categories:
 * - Approval: approve/reject chain (when awaiting input)
 * - Chain controls: pause/resume/cancel
 * - Quick prompts: predefined common prompts
 * - Error recovery: retry/skip
 * - Code actions: apply/review (when last message contains code)
 */

import type { ButtonAction } from '@afw/shared';
import type { ChatMessage } from '../hooks/useChatMessages';

/**
 * PromptButton - simplified button for the chat prompt area
 */
export interface PromptButton {
  id: string;
  label: string;
  icon?: string;
  category: 'approval' | 'chain-control' | 'quick-prompt' | 'error-recovery' | 'code-action' | 'default';
  /** The text to send as user input when clicked */
  promptText?: string;
  /** Or a command action to execute */
  action?: ButtonAction;
}

export interface PromptButtonContext {
  /** Current session status */
  sessionStatus: string;
  /** Current conversation state */
  conversationState?: 'idle' | 'awaiting_input' | 'receiving_input' | 'active';
  /** Last message in the chat */
  lastMessage?: ChatMessage;
  /** Whether CLI session is running */
  cliRunning: boolean;
  /** Whether a chain is currently paused */
  chainPaused?: boolean;
  /** Last prompt quick responses from session */
  quickResponses?: string[];
}

/**
 * Select context-appropriate prompt buttons
 */
export function selectPromptButtons(context: PromptButtonContext): PromptButton[] {
  const buttons: PromptButton[] = [];

  // 1. Quick responses from session (binary prompts)
  if (context.conversationState === 'awaiting_input' && context.quickResponses && context.quickResponses.length > 0) {
    context.quickResponses.forEach((response, idx) => {
      buttons.push({
        id: `quick-response-${idx}`,
        label: response,
        category: 'approval',
        promptText: response,
      });
    });
  }

  // 2. Approval buttons (when awaiting input and no specific quick responses)
  if (context.conversationState === 'awaiting_input' && (!context.quickResponses || context.quickResponses.length === 0)) {
    buttons.push(
      {
        id: 'approve',
        label: 'Yes',
        icon: 'check',
        category: 'approval',
        promptText: 'yes',
      },
      {
        id: 'reject',
        label: 'No',
        icon: 'x',
        category: 'approval',
        promptText: 'no',
      }
    );
  }

  // 3. Error recovery buttons
  if (context.lastMessage?.messageType === 'error') {
    buttons.push(
      {
        id: 'retry',
        label: 'Retry',
        icon: 'refresh',
        category: 'error-recovery',
        action: { type: 'command', commandType: 'retry' },
      },
      {
        id: 'skip',
        label: 'Skip',
        icon: 'skip',
        category: 'error-recovery',
        action: { type: 'command', commandType: 'skip' },
      }
    );
  }

  // 4. Chain control buttons
  if (context.chainPaused) {
    buttons.push(
      {
        id: 'resume',
        label: 'Resume',
        icon: 'play',
        category: 'chain-control',
        action: { type: 'command', commandType: 'resume' },
      },
      {
        id: 'cancel',
        label: 'Cancel',
        icon: 'stop',
        category: 'chain-control',
        action: { type: 'command', commandType: 'cancel' },
      }
    );
  }

  // 5. Code action buttons (when last message contains code blocks)
  if (context.lastMessage?.content?.includes('```')) {
    buttons.push(
      {
        id: 'apply-code',
        label: 'Apply',
        icon: 'check',
        category: 'code-action',
        promptText: 'yes, apply the changes',
      },
      {
        id: 'review-code',
        label: 'Explain',
        icon: 'info',
        category: 'code-action',
        promptText: 'explain the changes in detail',
      }
    );
  }

  // 6. Default quick prompts (always shown when CLI is running)
  if (context.cliRunning) {
    // Avoid duplicating labels already present from other sections
    const existingLabels = new Set(buttons.map(b => b.label.toLowerCase()));
    const defaults: PromptButton[] = [
      {
        id: 'continue',
        label: 'Continue',
        category: 'default',
        promptText: 'continue',
      },
      {
        id: 'explain',
        label: 'Explain',
        category: 'default',
        promptText: 'explain what you just did',
      },
      {
        id: 'status',
        label: 'Status',
        category: 'default',
        promptText: 'what is the current status?',
      },
    ];
    for (const btn of defaults) {
      if (!existingLabels.has(btn.label.toLowerCase())) {
        buttons.push(btn);
      }
    }
  }

  return buttons;
}
