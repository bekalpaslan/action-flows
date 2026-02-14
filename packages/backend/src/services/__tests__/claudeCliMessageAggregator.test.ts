import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SessionId, ChatMessage } from '@afw/shared';
import { brandedTypes } from '@afw/shared';
import { ClaudeCliMessageAggregator } from '../claudeCliMessageAggregator.js';

describe('ClaudeCliMessageAggregator', () => {
  let aggregator: ClaudeCliMessageAggregator;
  let sessionId: SessionId;
  let mockCallback: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    sessionId = brandedTypes.sessionId('test-aggregator-session');
    aggregator = new ClaudeCliMessageAggregator(sessionId);
    mockCallback = vi.fn();
    aggregator.setMessageCallback(mockCallback);
  });

  afterEach(() => {
    vi.useRealTimers();
    aggregator.dispose();
  });

  describe('appendChunk', () => {
    it('should accumulate text chunks', () => {
      aggregator.appendChunk('Hello ');
      aggregator.appendChunk('world');

      expect(aggregator.getBufferLength()).toBe(11);
      expect(aggregator.hasBufferedContent()).toBe(true);
    });

    it('should handle string chunks', () => {
      aggregator.appendChunk('test');

      expect(aggregator.getBufferLength()).toBe(4);
    });

    it('should extract text from content block arrays', () => {
      const contentArray = [
        { type: 'text', text: 'Hello' },
        { type: 'text', text: ' world' },
      ];

      aggregator.appendChunk(contentArray);

      expect(aggregator.getBufferLength()).toBe(11);
    });

    it('should filter non-text blocks from content arrays', () => {
      const contentArray = [
        { type: 'text', text: 'Hello' },
        { type: 'image', source: 'data:...' },
        { type: 'text', text: ' world' },
      ];

      aggregator.appendChunk(contentArray);

      expect(aggregator.getBufferLength()).toBe(11);
    });

    it('should ignore empty content arrays', () => {
      aggregator.appendChunk([]);

      expect(aggregator.hasBufferedContent()).toBe(false);
    });

    it('should ignore arrays without text blocks', () => {
      const contentArray = [
        { type: 'image', source: 'data:...' },
      ];

      aggregator.appendChunk(contentArray);

      expect(aggregator.hasBufferedContent()).toBe(false);
    });

    it('should convert non-string values to strings', () => {
      aggregator.appendChunk(123 as any);

      expect(aggregator.getBufferLength()).toBe(3);
    });

    it('should generate message ID on first chunk', () => {
      aggregator.appendChunk('first chunk');

      const message = aggregator.finalizeMessage();

      expect(message).toBeDefined();
      expect(message!.id).toMatch(/^msg-\d+-[a-f0-9]+$/);
    });

    it('should reset timeout on each chunk', () => {
      aggregator.appendChunk('chunk 1');

      vi.advanceTimersByTime(1000);

      aggregator.appendChunk('chunk 2');

      // Callback should not be called yet
      expect(mockCallback).not.toHaveBeenCalled();

      // Advance to 2 seconds from last chunk
      vi.advanceTimersByTime(2000);

      expect(mockCallback).toHaveBeenCalledOnce();
    });
  });

  describe('setMetadata', () => {
    it('should set metadata on current message', () => {
      aggregator.appendChunk('test');
      aggregator.setMetadata('key', 'value');

      const message = aggregator.finalizeMessage();

      expect(message!.metadata).toEqual({ key: 'value' });
    });

    it('should accumulate multiple metadata keys', () => {
      aggregator.appendChunk('test');
      aggregator.setMetadata('key1', 'value1');
      aggregator.setMetadata('key2', 'value2');

      const message = aggregator.finalizeMessage();

      expect(message!.metadata).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('should initialize metadata object if not set', () => {
      aggregator.setMetadata('key', 'value');

      expect(() => aggregator.finalizeMessage()).not.toThrow();
    });
  });

  describe('setMessageType', () => {
    it('should set message type', () => {
      aggregator.appendChunk('test');
      aggregator.setMessageType('error');

      const message = aggregator.finalizeMessage();

      expect(message!.messageType).toBe('error');
    });

    it('should default to text type', () => {
      aggregator.appendChunk('test');

      const message = aggregator.finalizeMessage();

      expect(message!.messageType).toBe('text');
    });
  });

  describe('finalizeMessage', () => {
    it('should create and emit complete message', () => {
      aggregator.appendChunk('Test message');

      const message = aggregator.finalizeMessage();

      expect(message).toBeDefined();
      expect(message!.sessionId).toBe(sessionId);
      expect(message!.role).toBe('assistant');
      expect(message!.content).toBe('Test message');
      expect(message!.timestamp).toBeDefined();
      expect(mockCallback).toHaveBeenCalledWith(message);
    });

    it('should return null if buffer is empty', () => {
      const message = aggregator.finalizeMessage();

      expect(message).toBeNull();
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should not emit callback if buffer only contains whitespace', () => {
      aggregator.appendChunk('   \n\t  ');

      const message = aggregator.finalizeMessage();

      // Message is created but callback is not invoked (line 123 check)
      expect(message).toBeDefined();
      expect(message!.content).toBe('   \n\t  ');
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should reset buffer after finalize', () => {
      aggregator.appendChunk('Test');
      aggregator.finalizeMessage();

      expect(aggregator.hasBufferedContent()).toBe(false);
      expect(aggregator.getBufferLength()).toBe(0);
    });

    it('should reset message ID after finalize', () => {
      aggregator.appendChunk('Message 1');
      const message1 = aggregator.finalizeMessage();

      aggregator.appendChunk('Message 2');
      const message2 = aggregator.finalizeMessage();

      expect(message1!.id).not.toBe(message2!.id);
    });

    it('should reset metadata after finalize', () => {
      aggregator.appendChunk('Message 1');
      aggregator.setMetadata('key', 'value');
      aggregator.finalizeMessage();

      aggregator.appendChunk('Message 2');
      const message2 = aggregator.finalizeMessage();

      expect(message2!.metadata).toBeUndefined();
    });

    it('should reset message type after finalize', () => {
      aggregator.appendChunk('Message 1');
      aggregator.setMessageType('error');
      aggregator.finalizeMessage();

      aggregator.appendChunk('Message 2');
      const message2 = aggregator.finalizeMessage();

      expect(message2!.messageType).toBe('text');
    });

    it('should clear timeout when finalized', () => {
      aggregator.appendChunk('test');

      aggregator.finalizeMessage();

      // Advance time - callback should not be called again
      vi.advanceTimersByTime(3000);

      expect(mockCallback).toHaveBeenCalledOnce();
    });

    it('should include metadata only if present', () => {
      aggregator.appendChunk('test');

      const message = aggregator.finalizeMessage();

      expect(message!.metadata).toBeUndefined();
    });

    it('should preserve metadata values', () => {
      aggregator.appendChunk('test');
      aggregator.setMetadata('string', 'value');
      aggregator.setMetadata('number', 123);
      aggregator.setMetadata('boolean', true);
      aggregator.setMetadata('object', { nested: 'data' });

      const message = aggregator.finalizeMessage();

      expect(message!.metadata).toEqual({
        string: 'value',
        number: 123,
        boolean: true,
        object: { nested: 'data' },
      });
    });
  });

  describe('timeout-based finalization', () => {
    it('should finalize message after 2-second timeout', () => {
      aggregator.appendChunk('Test message');

      expect(mockCallback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(2000);

      expect(mockCallback).toHaveBeenCalledOnce();
      expect(mockCallback.mock.calls[0][0].content).toBe('Test message');
    });

    it('should not finalize if buffer is empty', () => {
      aggregator.appendChunk('test');
      aggregator.finalizeMessage(); // Clear buffer

      vi.advanceTimersByTime(2000);

      expect(mockCallback).toHaveBeenCalledOnce(); // Only the manual finalize
    });

    it('should reset timeout when new chunk arrives', () => {
      aggregator.appendChunk('chunk 1');

      vi.advanceTimersByTime(1500);

      aggregator.appendChunk(' chunk 2');

      vi.advanceTimersByTime(1500); // 3 seconds total, but < 2 from last chunk

      expect(mockCallback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500); // Now 2 seconds from last chunk

      expect(mockCallback).toHaveBeenCalledOnce();
      expect(mockCallback.mock.calls[0][0].content).toBe('chunk 1 chunk 2');
    });

    it('should log timeout finalization', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      aggregator.appendChunk('Test message');

      vi.advanceTimersByTime(2000);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[MessageAggregator] Timeout finalize')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('createUserMessage', () => {
    it('should create and emit user message', () => {
      const message = aggregator.createUserMessage('User input');

      expect(message.sessionId).toBe(sessionId);
      expect(message.role).toBe('user');
      expect(message.content).toBe('User input');
      expect(message.messageType).toBe('text');
      expect(message.timestamp).toBeDefined();
      expect(mockCallback).toHaveBeenCalledWith(message);
    });

    it('should generate unique message IDs', () => {
      const message1 = aggregator.createUserMessage('Message 1');
      const message2 = aggregator.createUserMessage('Message 2');

      expect(message1.id).not.toBe(message2.id);
    });

    it('should not affect aggregator buffer', () => {
      aggregator.appendChunk('buffered content');

      aggregator.createUserMessage('User input');

      expect(aggregator.hasBufferedContent()).toBe(true);
      expect(aggregator.getBufferLength()).toBe(16);
    });
  });

  describe('createSystemMessage', () => {
    it('should create and emit system message', () => {
      const message = aggregator.createSystemMessage('System notification');

      expect(message.sessionId).toBe(sessionId);
      expect(message.role).toBe('system');
      expect(message.content).toBe('System notification');
      expect(message.messageType).toBe('text');
      expect(message.timestamp).toBeDefined();
      expect(mockCallback).toHaveBeenCalledWith(message);
    });

    it('should generate unique message IDs', () => {
      const message1 = aggregator.createSystemMessage('Notification 1');
      const message2 = aggregator.createSystemMessage('Notification 2');

      expect(message1.id).not.toBe(message2.id);
    });

    it('should not affect aggregator buffer', () => {
      aggregator.appendChunk('buffered content');

      aggregator.createSystemMessage('System notification');

      expect(aggregator.hasBufferedContent()).toBe(true);
    });
  });

  describe('hasBufferedContent', () => {
    it('should return false when buffer is empty', () => {
      expect(aggregator.hasBufferedContent()).toBe(false);
    });

    it('should return true when buffer has content', () => {
      aggregator.appendChunk('test');

      expect(aggregator.hasBufferedContent()).toBe(true);
    });

    it('should return false after finalize', () => {
      aggregator.appendChunk('test');
      aggregator.finalizeMessage();

      expect(aggregator.hasBufferedContent()).toBe(false);
    });
  });

  describe('getBufferLength', () => {
    it('should return 0 for empty buffer', () => {
      expect(aggregator.getBufferLength()).toBe(0);
    });

    it('should return correct length for buffered content', () => {
      aggregator.appendChunk('Hello world');

      expect(aggregator.getBufferLength()).toBe(11);
    });

    it('should return 0 after finalize', () => {
      aggregator.appendChunk('test');
      aggregator.finalizeMessage();

      expect(aggregator.getBufferLength()).toBe(0);
    });
  });

  describe('dispose', () => {
    it('should finalize buffered content on dispose', () => {
      aggregator.appendChunk('Buffered message');

      aggregator.dispose();

      expect(mockCallback).toHaveBeenCalledOnce();
      expect(mockCallback.mock.calls[0][0].content).toBe('Buffered message');
    });

    it('should clear timeout on dispose', () => {
      aggregator.appendChunk('test');

      aggregator.dispose();

      vi.advanceTimersByTime(2000);

      expect(mockCallback).toHaveBeenCalledOnce(); // Only from dispose
    });

    it('should clear buffer on dispose', () => {
      aggregator.appendChunk('test');

      aggregator.dispose();

      expect(aggregator.hasBufferedContent()).toBe(false);
    });

    it('should clear callback reference on dispose', () => {
      aggregator.dispose();

      aggregator.appendChunk('test');
      aggregator.finalizeMessage();

      // Should not throw, callback should not be called
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should clear message ID on dispose', () => {
      aggregator.appendChunk('test');

      aggregator.dispose();

      expect(aggregator['currentMessageId']).toBeNull();
    });

    it('should clear metadata on dispose', () => {
      aggregator.setMetadata('key', 'value');

      aggregator.dispose();

      expect(aggregator['currentMetadata']).toEqual({});
    });
  });

  describe('callback invocation', () => {
    it('should invoke callback on finalizeMessage', () => {
      aggregator.appendChunk('test');

      aggregator.finalizeMessage();

      expect(mockCallback).toHaveBeenCalledOnce();
    });

    it('should invoke callback on timeout finalize', () => {
      aggregator.appendChunk('test');

      vi.advanceTimersByTime(2000);

      expect(mockCallback).toHaveBeenCalledOnce();
    });

    it('should invoke callback on createUserMessage', () => {
      aggregator.createUserMessage('test');

      expect(mockCallback).toHaveBeenCalledOnce();
    });

    it('should invoke callback on createSystemMessage', () => {
      aggregator.createSystemMessage('test');

      expect(mockCallback).toHaveBeenCalledOnce();
    });

    it('should not invoke callback if not set', () => {
      const newAggregator = new ClaudeCliMessageAggregator(sessionId);

      newAggregator.appendChunk('test');

      expect(() => newAggregator.finalizeMessage()).not.toThrow();
    });

    it('should not invoke callback for empty content', () => {
      aggregator.appendChunk('   ');

      aggregator.finalizeMessage();

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('message ID generation', () => {
    it('should generate unique IDs across messages', () => {
      const ids = new Set<string>();

      for (let i = 0; i < 100; i++) {
        aggregator.appendChunk('test');
        const message = aggregator.finalizeMessage();
        ids.add(message!.id);
      }

      expect(ids.size).toBe(100);
    });

    it('should generate IDs in correct format', () => {
      aggregator.appendChunk('test');
      const message = aggregator.finalizeMessage();

      expect(message!.id).toMatch(/^msg-\d+-[a-f0-9]{8}$/);
    });
  });

  describe('edge cases', () => {
    it('should handle Unicode characters', () => {
      aggregator.appendChunk('Hello 世界 🌍');

      const message = aggregator.finalizeMessage();

      expect(message!.content).toBe('Hello 世界 🌍');
    });

    it('should handle newlines in content', () => {
      aggregator.appendChunk('Line 1\nLine 2\nLine 3');

      const message = aggregator.finalizeMessage();

      expect(message!.content).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should handle special characters', () => {
      aggregator.appendChunk('Special: \t\r\n!@#$%^&*()');

      const message = aggregator.finalizeMessage();

      expect(message!.content).toBe('Special: \t\r\n!@#$%^&*()');
    });

    it('should handle very long messages', () => {
      const longMessage = 'x'.repeat(100000);

      aggregator.appendChunk(longMessage);

      const message = aggregator.finalizeMessage();

      expect(message!.content.length).toBe(100000);
    });

    it('should handle rapid chunk appends', () => {
      for (let i = 0; i < 1000; i++) {
        aggregator.appendChunk('x');
      }

      const message = aggregator.finalizeMessage();

      expect(message!.content.length).toBe(1000);
    });
  });
});
