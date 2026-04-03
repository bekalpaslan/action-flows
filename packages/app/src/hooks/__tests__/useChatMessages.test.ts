import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useChatStore } from '../../stores/chatStore';
import type { WorkbenchId } from '../../lib/types';

// Mock crypto.randomUUID for deterministic IDs
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => `test-uuid-${++uuidCounter}`,
});

// Import AFTER mocking crypto
const { handleSessionMessage } = await import('../useChatMessages');

/** Shared streaming ref used across tests that involve stream events */
function makeStreamRef() {
  return { current: null as string | null };
}

describe('useChatMessages - handleSessionMessage', () => {
  beforeEach(() => {
    useChatStore.getState().chats.clear();
    uuidCounter = 0;
  });

  it('Test 1: assistant message with text block calls addMessage with role=agent, status=complete', () => {
    const addMessageSpy = vi.spyOn(useChatStore.getState(), 'addMessage');

    handleSessionMessage({
      channel: '_system',
      type: 'session:message',
      payload: {
        workbenchId: 'work',
        message: {
          type: 'assistant',
          message: {
            content: [
              { type: 'text', text: 'Hello from agent' },
            ],
          },
        },
      },
    });

    expect(addMessageSpy).toHaveBeenCalledWith(
      'work',
      expect.objectContaining({
        role: 'agent',
        content: 'Hello from agent',
        status: 'complete',
      })
    );
    addMessageSpy.mockRestore();
  });

  it('Test 2: assistant message with tool_use block (non-AskUserQuestion) adds message with toolCalls', () => {
    handleSessionMessage({
      channel: '_system',
      type: 'session:message',
      payload: {
        workbenchId: 'work',
        message: {
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                id: 'tool-1',
                name: 'read_file',
                input: { path: '/test.ts' },
              },
            ],
          },
        },
      },
    });

    const chat = useChatStore.getState().getChat('work');
    const toolMsg = chat.messages.find((m) => m.toolCalls && m.toolCalls.length > 0);
    expect(toolMsg).toBeDefined();
    expect(toolMsg!.toolCalls![0]!.id).toBe('tool-1');
    expect(toolMsg!.toolCalls![0]!.name).toBe('read_file');
    expect(toolMsg!.toolCalls![0]!.status).toBe('running');
  });

  it('Test 3: assistant message with AskUserQuestion tool_use calls addMessage with askUserQuestion field populated', () => {
    handleSessionMessage({
      channel: '_system',
      type: 'session:message',
      payload: {
        workbenchId: 'work',
        message: {
          type: 'assistant',
          message: {
            content: [
              {
                type: 'tool_use',
                id: 'ask-tool-1',
                name: 'AskUserQuestion',
                input: {
                  questions: [
                    {
                      question: 'Which option?',
                      options: [{ label: 'Option A' }, { label: 'Option B' }],
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    });

    const chat = useChatStore.getState().getChat('work');
    const askMsg = chat.messages.find((m) => m.askUserQuestion != null);
    expect(askMsg).toBeDefined();
    expect(askMsg!.askUserQuestion!.toolCallId).toBe('ask-tool-1');
    expect(askMsg!.askUserQuestion!.question.question).toBe('Which option?');
    expect(askMsg!.askUserQuestion!.submitted).toBe(false);
  });

  it('Test 4: stream_event content_block_start (text) calls addMessage with status=streaming and setStreaming(true)', () => {
    const setStreamingSpy = vi.spyOn(useChatStore.getState(), 'setStreaming');
    const streamRef = makeStreamRef();

    handleSessionMessage(
      {
        channel: '_system',
        type: 'session:message',
        payload: {
          workbenchId: 'work',
          message: {
            type: 'stream_event',
            event: {
              type: 'content_block_start',
              index: 0,
              content_block: { type: 'text', text: '' },
            },
          },
        },
      },
      streamRef
    );

    const chat = useChatStore.getState().getChat('work');
    const streamingMsg = chat.messages.find((m) => m.status === 'streaming');
    expect(streamingMsg).toBeDefined();
    expect(streamingMsg!.role).toBe('agent');
    expect(setStreamingSpy).toHaveBeenCalledWith('work', true);
    setStreamingSpy.mockRestore();
  });

  it('Test 5: stream_event content_block_delta (text_delta) calls appendStreamChunk', () => {
    const streamRef = makeStreamRef();

    // Set up a streaming message first
    handleSessionMessage(
      {
        channel: '_system',
        type: 'session:message',
        payload: {
          workbenchId: 'work',
          message: {
            type: 'stream_event',
            event: {
              type: 'content_block_start',
              index: 0,
              content_block: { type: 'text', text: '' },
            },
          },
        },
      },
      streamRef
    );

    const appendSpy = vi.spyOn(useChatStore.getState(), 'appendStreamChunk');

    handleSessionMessage(
      {
        channel: '_system',
        type: 'session:message',
        payload: {
          workbenchId: 'work',
          message: {
            type: 'stream_event',
            event: {
              type: 'content_block_delta',
              index: 0,
              delta: { type: 'text_delta', text: 'Hello ' },
            },
          },
        },
      },
      streamRef
    );

    expect(appendSpy).toHaveBeenCalledWith('work', expect.any(String), 'Hello ');
    appendSpy.mockRestore();
  });

  it('Test 6: stream_event content_block_stop calls updateMessage with status=complete and setStreaming(false)', () => {
    const streamRef = makeStreamRef();

    // Set up streaming
    handleSessionMessage(
      {
        channel: '_system',
        type: 'session:message',
        payload: {
          workbenchId: 'work',
          message: {
            type: 'stream_event',
            event: {
              type: 'content_block_start',
              index: 0,
              content_block: { type: 'text', text: '' },
            },
          },
        },
      },
      streamRef
    );

    const setStreamingSpy = vi.spyOn(useChatStore.getState(), 'setStreaming');

    handleSessionMessage(
      {
        channel: '_system',
        type: 'session:message',
        payload: {
          workbenchId: 'work',
          message: {
            type: 'stream_event',
            event: {
              type: 'content_block_stop',
              index: 0,
            },
          },
        },
      },
      streamRef
    );

    const chat = useChatStore.getState().getChat('work');
    const completedMsg = chat.messages.find((m) => m.status === 'complete');
    expect(completedMsg).toBeDefined();
    expect(setStreamingSpy).toHaveBeenCalledWith('work', false);
    setStreamingSpy.mockRestore();
  });

  it('Test 7: result message calls setStreaming(false)', () => {
    const setStreamingSpy = vi.spyOn(useChatStore.getState(), 'setStreaming');

    handleSessionMessage({
      channel: '_system',
      type: 'session:message',
      payload: {
        workbenchId: 'work',
        message: {
          type: 'result',
        },
      },
    });

    expect(setStreamingSpy).toHaveBeenCalledWith('work', false);
    setStreamingSpy.mockRestore();
  });

  it('Test 8: malformed message does not throw (graceful error handling)', () => {
    expect(() => {
      handleSessionMessage({
        channel: '_system',
        type: 'session:message',
        payload: null,
      });
    }).not.toThrow();

    expect(() => {
      handleSessionMessage({
        channel: '_system',
        type: 'session:message',
        payload: { workbenchId: 'work', message: { type: 'assistant', message: null } },
      });
    }).not.toThrow();

    expect(() => {
      handleSessionMessage({
        channel: '_system',
        type: 'session:message',
        payload: { workbenchId: 'work', message: 'not-an-object' },
      });
    }).not.toThrow();
  });

  it('Test 9: workbenchId from payload is compared as string (normalization)', () => {
    handleSessionMessage({
      channel: '_system',
      type: 'session:message',
      payload: {
        workbenchId: 'work', // string, not branded type
        message: {
          type: 'assistant',
          message: {
            content: [{ type: 'text', text: 'Normalized' }],
          },
        },
      },
    });

    const chat = useChatStore.getState().getChat('work' as WorkbenchId);
    expect(chat.messages).toHaveLength(1);
    expect(chat.messages[0]!.content).toBe('Normalized');

    // Invalid workbenchId should be silently dropped
    handleSessionMessage({
      channel: '_system',
      type: 'session:message',
      payload: {
        workbenchId: 'invalid-bench',
        message: {
          type: 'assistant',
          message: {
            content: [{ type: 'text', text: 'Should not appear' }],
          },
        },
      },
    });

    // No new messages should appear in any workbench for invalid ID
    const invalidChat = useChatStore.getState().getChat('work' as WorkbenchId);
    expect(invalidChat.messages).toHaveLength(1); // still just the one from above
  });
});
