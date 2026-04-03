import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChatStore } from '../../stores/chatStore';
import { wsClient } from '../../lib/ws-client';

// Mock crypto.randomUUID for deterministic IDs
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => `send-uuid-${++uuidCounter}`,
});

// Mock wsClient.send
vi.spyOn(wsClient, 'send').mockImplementation(() => {});

// Import AFTER mocking
const { sendMessage, sendAskUserResponse } = await import('../useChatSend');

describe('useChatSend', () => {
  beforeEach(() => {
    useChatStore.getState().chats.clear();
    uuidCounter = 0;
    vi.clearAllMocks();
  });

  it('Test 10: sendMessage adds user message to store and sends chat:send via wsClient', () => {
    sendMessage('work', 'Hello agent');

    const chat = useChatStore.getState().getChat('work');
    expect(chat.messages).toHaveLength(1);
    expect(chat.messages[0]!.role).toBe('user');
    expect(chat.messages[0]!.content).toBe('Hello agent');
    expect(chat.messages[0]!.status).toBe('sent');

    expect(wsClient.send).toHaveBeenCalledWith({
      type: 'chat:send',
      payload: { workbenchId: 'work', text: 'Hello agent' },
    });
  });

  it('Test 11: sendMessage clears inputValue after sending', () => {
    useChatStore.getState().setInputValue('work', 'Hello agent');
    expect(useChatStore.getState().getChat('work').inputValue).toBe('Hello agent');

    sendMessage('work', 'Hello agent');

    expect(useChatStore.getState().getChat('work').inputValue).toBe('');
  });

  it('Test 12: sendAskUserResponse marks submitted in store and sends chat:ask-user-response via wsClient', () => {
    // Set up a message with askUserQuestion
    useChatStore.getState().addMessage('work', {
      id: 'msg-ask',
      role: 'agent',
      content: '',
      timestamp: '2026-04-03T00:00:00Z',
      status: 'complete',
      askUserQuestion: {
        toolCallId: 'tc-ask-1',
        question: { type: 'single_select', question: 'Choose one', options: [{ value: 'a', label: 'A' }] },
        response: null,
        submitted: false,
      },
    });

    sendAskUserResponse('work', 'msg-ask', 'tc-ask-1', 'Option A');

    const chat = useChatStore.getState().getChat('work');
    const ask = chat.messages[0]!.askUserQuestion!;
    expect(ask.submitted).toBe(true);
    expect(ask.response).toBe('"Option A"'); // JSON.stringify

    expect(wsClient.send).toHaveBeenCalledWith({
      type: 'chat:ask-user-response',
      payload: { workbenchId: 'work', toolCallId: 'tc-ask-1', response: 'Option A' },
    });
  });
});
