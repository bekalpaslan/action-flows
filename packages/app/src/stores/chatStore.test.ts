import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from './chatStore';
import { parseAskUserQuestion } from '../lib/chat-types';
import type { ChatMessage } from '../lib/chat-types';

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: overrides.id ?? 'msg-1',
    role: overrides.role ?? 'user',
    content: overrides.content ?? 'hello',
    timestamp: overrides.timestamp ?? '2026-04-03T00:00:00Z',
    status: overrides.status ?? 'sent',
    ...overrides,
  };
}

describe('chatStore', () => {
  beforeEach(() => {
    // Reset store state between tests
    useChatStore.getState().chats.clear();
  });

  it('Test 1: getChat returns default WorkbenchChat when no state set', () => {
    const chat = useChatStore.getState().getChat('work');
    expect(chat.messages).toEqual([]);
    expect(chat.inputValue).toBe('');
    expect(chat.isStreaming).toBe(false);
    expect(chat.activeSessionId).toBeNull();
  });

  it('Test 2: addMessage adds message to workbench chat', () => {
    const msg = makeMessage();
    useChatStore.getState().addMessage('work', msg);

    const chat = useChatStore.getState().getChat('work');
    expect(chat.messages).toHaveLength(1);
    expect(chat.messages[0]!.id).toBe('msg-1');
    expect(chat.messages[0]!.content).toBe('hello');
  });

  it('Test 3: appendStreamChunk appends text to message with matching id', () => {
    const msg = makeMessage({ id: 'stream-1', content: 'Hello' });
    useChatStore.getState().addMessage('work', msg);
    useChatStore.getState().appendStreamChunk('work', 'stream-1', ' world');

    const chat = useChatStore.getState().getChat('work');
    expect(chat.messages[0]!.content).toBe('Hello world');
  });

  it('Test 4: setInputValue sets inputValue for workbench', () => {
    useChatStore.getState().setInputValue('work', 'hello');

    const chat = useChatStore.getState().getChat('work');
    expect(chat.inputValue).toBe('hello');
  });

  it('Test 5: setStreaming sets isStreaming for workbench', () => {
    useChatStore.getState().setStreaming('work', true);

    const chat = useChatStore.getState().getChat('work');
    expect(chat.isStreaming).toBe(true);
  });

  it('Test 6: updateMessage updates partial message fields', () => {
    const msg = makeMessage({ id: 'msg-up', status: 'sending' });
    useChatStore.getState().addMessage('work', msg);
    useChatStore.getState().updateMessage('work', 'msg-up', { status: 'complete' });

    const chat = useChatStore.getState().getChat('work');
    expect(chat.messages[0]!.status).toBe('complete');
    expect(chat.messages[0]!.content).toBe('hello'); // unchanged
  });

  it('Test 7: updateToolCall updates tool call within message', () => {
    const msg = makeMessage({
      id: 'msg-tc',
      toolCalls: [
        { id: 'tc-1', name: 'read_file', input: '{}', output: null, status: 'running' },
      ],
    });
    useChatStore.getState().addMessage('work', msg);
    useChatStore.getState().updateToolCall('work', 'msg-tc', 'tc-1', { status: 'complete', output: 'done' });

    const chat = useChatStore.getState().getChat('work');
    const tc = chat.messages[0]!.toolCalls![0]!;
    expect(tc.status).toBe('complete');
    expect(tc.output).toBe('done');
  });

  it('Test 8: submitAskUserResponse sets response and submitted=true', () => {
    const msg = makeMessage({
      id: 'msg-ask',
      askUserQuestion: {
        toolCallId: 'tc-ask-1',
        question: { type: 'single_select', question: 'Choose one', options: [{ value: 'a', label: 'Option A' }] },
        response: null,
        submitted: false,
      },
    });
    useChatStore.getState().addMessage('work', msg);
    useChatStore.getState().submitAskUserResponse('work', 'msg-ask', 'option-a');

    const chat = useChatStore.getState().getChat('work');
    const ask = chat.messages[0]!.askUserQuestion!;
    expect(ask.response).toBe('option-a');
    expect(ask.submitted).toBe(true);
  });

  it('Test 9: loadSessionHistory replaces all messages', () => {
    useChatStore.getState().addMessage('work', makeMessage({ id: 'old-1' }));
    useChatStore.getState().addMessage('work', makeMessage({ id: 'old-2' }));

    const newMessages = [
      makeMessage({ id: 'new-1', content: 'restored' }),
      makeMessage({ id: 'new-2', content: 'history' }),
      makeMessage({ id: 'new-3', content: 'loaded' }),
    ];
    useChatStore.getState().loadSessionHistory('work', newMessages);

    const chat = useChatStore.getState().getChat('work');
    expect(chat.messages).toHaveLength(3);
    expect(chat.messages[0]!.id).toBe('new-1');
    expect(chat.messages[2]!.id).toBe('new-3');
  });

  it('Test 10: clearChat resets to default WorkbenchChat', () => {
    useChatStore.getState().addMessage('work', makeMessage());
    useChatStore.getState().setInputValue('work', 'typed text');
    useChatStore.getState().setStreaming('work', true);

    useChatStore.getState().clearChat('work');

    const chat = useChatStore.getState().getChat('work');
    expect(chat.messages).toEqual([]);
    expect(chat.inputValue).toBe('');
    expect(chat.isStreaming).toBe(false);
    expect(chat.activeSessionId).toBeNull();
  });

  it('Test 11: operations on work do not affect explore chat state (isolation)', () => {
    useChatStore.getState().addMessage('work', makeMessage({ id: 'work-msg', content: 'work content' }));
    useChatStore.getState().addMessage('explore', makeMessage({ id: 'explore-msg', content: 'explore content' }));

    // Modify work chat
    useChatStore.getState().setInputValue('work', 'work input');
    useChatStore.getState().setStreaming('work', true);

    // Verify explore is unaffected
    const exploreChat = useChatStore.getState().getChat('explore');
    expect(exploreChat.messages).toHaveLength(1);
    expect(exploreChat.messages[0]!.id).toBe('explore-msg');
    expect(exploreChat.inputValue).toBe('');
    expect(exploreChat.isStreaming).toBe(false);

    // Verify work has its changes
    const workChat = useChatStore.getState().getChat('work');
    expect(workChat.messages).toHaveLength(1);
    expect(workChat.messages[0]!.id).toBe('work-msg');
    expect(workChat.inputValue).toBe('work input');
    expect(workChat.isStreaming).toBe(true);
  });
});

describe('parseAskUserQuestion', () => {
  it('Test 12: valid Agent SDK input returns correct ParsedQuestion array', () => {
    const input = {
      questions: [
        {
          question: 'Which framework?',
          options: [
            { label: 'React', description: 'Component-based UI' },
            { label: 'Vue', description: 'Progressive framework' },
          ],
          multiSelect: false,
        },
        {
          question: 'Select features',
          options: [
            { label: 'Auth' },
            { label: 'Logging' },
          ],
          multiSelect: true,
        },
      ],
    };

    const result = parseAskUserQuestion(input);
    expect(result).toHaveLength(2);

    expect(result[0]!.type).toBe('single_select');
    expect(result[0]!.question).toBe('Which framework?');
    expect(result[0]!.options).toHaveLength(2);
    expect(result[0]!.options![0]!.value).toBe('React');
    expect(result[0]!.options![0]!.label).toBe('React');
    expect(result[0]!.options![0]!.description).toBe('Component-based UI');

    expect(result[1]!.type).toBe('multi_select');
    expect(result[1]!.question).toBe('Select features');
    expect(result[1]!.options).toHaveLength(2);
  });

  it('Test 13: malformed input returns empty array (graceful fallback)', () => {
    expect(parseAskUserQuestion(null)).toEqual([]);
    expect(parseAskUserQuestion(undefined)).toEqual([]);
    expect(parseAskUserQuestion('string')).toEqual([]);
    expect(parseAskUserQuestion(42)).toEqual([]);
    expect(parseAskUserQuestion({})).toEqual([]);
    expect(parseAskUserQuestion({ questions: 'not-array' })).toEqual([]);
    expect(parseAskUserQuestion({ questions: [null] })).toEqual([]);
  });
});
