import { useCallback } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useChatStore } from '@/stores/chatStore';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatSend } from '@/hooks/useChatSend';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { WORKBENCHES } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * Main chat panel container. Composes ChatHeader + MessageList + ChatInput.
 * Reads the active workbench from uiStore, session status from sessionStore,
 * and chat state from chatStore.
 *
 * Per UI-SPEC Chat Panel Layout Contract (D-06).
 */
export function ChatPanel() {
  // Get active workbench
  const workbenchId = useUIStore((s) => s.activeWorkbench);
  const workbenchMeta = WORKBENCHES.find((w) => w.id === workbenchId)!;

  // Get session status
  const sessionStatus = useSessionStore((s) => s.getSession(workbenchId).status);

  // Get chat state
  const chat = useChatStore((s) => s.getChat(workbenchId));

  // WebSocket subscription for incoming messages (call once)
  useChatMessages();

  // Send functions
  const { sendMessage, sendAskUserResponse } = useChatSend();

  // Connection state
  const connected = sessionStatus === 'idle' || sessionStatus === 'running';

  // Input handlers
  const handleInputChange = useCallback(
    (value: string) => {
      useChatStore.getState().setInputValue(workbenchId, value);
    },
    [workbenchId]
  );

  const handleSend = useCallback(() => {
    if (chat.inputValue.trim()) {
      sendMessage(workbenchId, chat.inputValue.trim());
    }
  }, [chat.inputValue, sendMessage, workbenchId]);

  const handleAskUserSubmit = useCallback(
    (messageId: string, response: string | string[]) => {
      const msg = chat.messages.find((m) => m.id === messageId);
      if (msg?.askUserQuestion) {
        sendAskUserResponse(workbenchId, messageId, msg.askUserQuestion.toolCallId, response);
      }
    },
    [chat.messages, sendAskUserResponse, workbenchId]
  );

  return (
    <div className={cn('flex flex-col h-full bg-surface')}>
      <ChatHeader
        workbenchId={workbenchId}
        workbenchLabel={workbenchMeta.label}
        sessionStatus={sessionStatus}
      />
      <MessageList
        messages={chat.messages}
        workbenchId={workbenchId}
        workbenchLabel={workbenchMeta.label}
        connected={connected}
        onAskUserSubmit={handleAskUserSubmit}
        className="flex-1"
      />
      <ChatInput
        value={chat.inputValue}
        onChange={handleInputChange}
        onSend={handleSend}
        disabled={!connected}
        workbenchLabel={workbenchMeta.label}
      />
    </div>
  );
}
