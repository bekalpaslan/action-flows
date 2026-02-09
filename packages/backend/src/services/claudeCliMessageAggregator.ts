/**
 * Claude CLI Message Aggregator
 * Buffers stream-JSON chunks from Claude CLI stdout and detects message boundaries
 * to emit complete ChatMessage objects for the chat UI.
 *
 * Message boundary detection:
 * - `type: 'result'` → End of assistant turn (primary signal)
 * - `type: 'error'` → Error message (immediate finalize)
 * - 2-second timeout → Fallback finalize for streaming chunks without explicit boundary
 */

import type { ChatMessage, SessionId, Timestamp } from '@afw/shared';
import crypto from 'crypto';

/** Callback fired when a complete ChatMessage has been aggregated */
export type MessageCallback = (message: ChatMessage) => void;

/**
 * Generates a unique message ID
 */
function generateMessageId(): string {
  return `msg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Message Aggregator for a single Claude CLI session.
 * Accumulates text chunks from stream-JSON parsing and emits complete
 * ChatMessage objects when message boundaries are detected.
 */
export class ClaudeCliMessageAggregator {
  private readonly sessionId: SessionId;
  private buffer: string = '';
  private currentMessageId: string | null = null;
  private currentMetadata: ChatMessage['metadata'] = {};
  private currentMessageType: ChatMessage['messageType'] = 'text';
  private onMessage: MessageCallback | null = null;
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  private readonly TIMEOUT_MS = 2000; // 2-second fallback timeout

  constructor(sessionId: SessionId) {
    this.sessionId = sessionId;
  }

  /**
   * Register callback for complete messages
   */
  setMessageCallback(callback: MessageCallback): void {
    this.onMessage = callback;
  }

  /**
   * Append a text chunk to the current message buffer.
   * Resets the timeout timer on each chunk.
   */
  appendChunk(text: string): void {
    if (!this.currentMessageId) {
      this.currentMessageId = generateMessageId();
    }
    this.buffer += text;
    this.resetTimeout();
  }

  /**
   * Set metadata on the current in-progress message
   */
  setMetadata(key: string, value: unknown): void {
    if (!this.currentMetadata) {
      this.currentMetadata = {};
    }
    (this.currentMetadata as Record<string, unknown>)[key] = value;
  }

  /**
   * Set the message type for the current in-progress message
   */
  setMessageType(messageType: ChatMessage['messageType']): void {
    this.currentMessageType = messageType;
  }

  /**
   * Finalize the current buffered message and emit it.
   * Returns the finalized ChatMessage or null if buffer was empty.
   */
  finalizeMessage(): ChatMessage | null {
    this.clearTimeout();

    if (!this.buffer.trim() && !this.currentMessageId) {
      return null;
    }

    const message: ChatMessage = {
      id: this.currentMessageId || generateMessageId(),
      sessionId: this.sessionId,
      role: 'assistant',
      content: this.buffer,
      timestamp: new Date().toISOString() as Timestamp,
      messageType: this.currentMessageType || 'text',
      metadata: Object.keys(this.currentMetadata || {}).length > 0
        ? { ...this.currentMetadata }
        : undefined,
    };

    // Reset state for next message
    this.buffer = '';
    this.currentMessageId = null;
    this.currentMetadata = {};
    this.currentMessageType = 'text';

    // Emit via callback
    if (this.onMessage && message.content.trim()) {
      this.onMessage(message);
    }

    return message;
  }

  /**
   * Create and emit a user message (for when user sends input)
   */
  createUserMessage(content: string): ChatMessage {
    const message: ChatMessage = {
      id: generateMessageId(),
      sessionId: this.sessionId,
      role: 'user',
      content,
      timestamp: new Date().toISOString() as Timestamp,
      messageType: 'text',
    };

    if (this.onMessage) {
      this.onMessage(message);
    }

    return message;
  }

  /**
   * Create and emit a system message
   */
  createSystemMessage(content: string): ChatMessage {
    const message: ChatMessage = {
      id: generateMessageId(),
      sessionId: this.sessionId,
      role: 'system',
      content,
      timestamp: new Date().toISOString() as Timestamp,
      messageType: 'text',
    };

    if (this.onMessage) {
      this.onMessage(message);
    }

    return message;
  }

  /**
   * Check if there is an in-progress message being buffered
   */
  hasBufferedContent(): boolean {
    return this.buffer.length > 0;
  }

  /**
   * Get the current buffer contents (for debugging)
   */
  getBufferLength(): number {
    return this.buffer.length;
  }

  /**
   * Clean up timers on session end
   */
  dispose(): void {
    this.clearTimeout();
    // Finalize any remaining buffered content
    if (this.hasBufferedContent()) {
      this.finalizeMessage();
    }
  }

  /**
   * Reset the fallback timeout timer
   */
  private resetTimeout(): void {
    this.clearTimeout();
    this.timeoutHandle = setTimeout(() => {
      if (this.hasBufferedContent()) {
        console.log(`[MessageAggregator] Timeout finalize for session ${this.sessionId} (${this.buffer.length} chars)`);
        this.finalizeMessage();
      }
    }, this.TIMEOUT_MS);
  }

  /**
   * Clear the fallback timeout timer
   */
  private clearTimeout(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
  }
}
