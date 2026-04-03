import { useCallback } from 'react';
import { wsClient } from '../lib/ws-client';
import { useChatStore } from '../stores/chatStore';
import type { WorkbenchId } from '../lib/types';

/**
 * Send a user message: add to chatStore, clear input, and send via WebSocket.
 * Exported as standalone function for unit testing.
 */
export function sendMessage(workbenchId: WorkbenchId, text: string): void {
  const store = useChatStore.getState();

  // Add user message to store
  store.addMessage(workbenchId, {
    id: crypto.randomUUID(),
    role: 'user',
    content: text,
    timestamp: new Date().toISOString(),
    status: 'sent',
  });

  // Clear input field
  store.setInputValue(workbenchId, '');

  // Send via WebSocket
  wsClient.send({
    type: 'chat:send',
    payload: { workbenchId, text },
  });
}

/**
 * Send an AskUserQuestion response: mark as submitted in store and send via WebSocket.
 * Exported as standalone function for unit testing.
 */
export function sendAskUserResponse(
  workbenchId: WorkbenchId,
  messageId: string,
  toolCallId: string,
  response: unknown
): void {
  const store = useChatStore.getState();

  // Mark as submitted in store
  store.submitAskUserResponse(workbenchId, messageId, JSON.stringify(response));

  // Send via WebSocket
  wsClient.send({
    type: 'chat:ask-user-response',
    payload: { workbenchId, toolCallId, response },
  });
}

/**
 * Hook that provides message sending functions for a chat session.
 * Uses useChatStore.getState() (not selector) to avoid re-subscription on store changes.
 */
export function useChatSend() {
  const send = useCallback(
    (workbenchId: WorkbenchId, text: string) => sendMessage(workbenchId, text),
    []
  );

  const sendAskResponse = useCallback(
    (workbenchId: WorkbenchId, messageId: string, toolCallId: string, response: unknown) =>
      sendAskUserResponse(workbenchId, messageId, toolCallId, response),
    []
  );

  return {
    sendMessage: send,
    sendAskUserResponse: sendAskResponse,
  };
}
