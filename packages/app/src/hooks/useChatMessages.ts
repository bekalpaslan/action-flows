/**
 * useChatMessages Hook
 * Listens to WebSocket events for chat messages and maintains message state.
 * Consumes claude-cli:output events and aggregates stream-JSON chunks
 * into complete ChatMessage objects for display in the ChatPanel.
 *
 * Since the backend may not yet emit chat:message/chat:history events,
 * this hook processes claude-cli:output events directly, parsing
 * stream-JSON JSONL and aggregating text deltas into messages.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { SessionId, ClaudeCliOutputEvent, WorkspaceEvent } from '@afw/shared';
import { useWebSocketContext } from '../contexts/WebSocketContext';

/**
 * Local ChatMessage type (temporary until shared types are updated by backend agent)
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  messageType?: 'text' | 'tool_use' | 'tool_result' | 'error';
  metadata?: {
    model?: string;
    stopReason?: string;
    toolName?: string;
    stepNumber?: number;
    cost?: string;
    duration?: string;
  };
}

let messageCounter = 0;
function generateMessageId(): string {
  return `msg-${Date.now()}-${++messageCounter}`;
}

/**
 * useChatMessages - Hook to manage chat message state from WebSocket events
 *
 * Parses claude-cli:output stream-JSON into structured messages.
 * Also listens for future chat:message and chat:history events.
 */
export function useChatMessages(sessionId: SessionId) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);
  const { onEvent, subscribe, unsubscribe } = useWebSocketContext();

  // Message aggregation state (accumulates text deltas into complete messages)
  const bufferRef = useRef<string>('');
  const currentMessageIdRef = useRef<string | null>(null);
  const currentToolNameRef = useRef<string | null>(null);
  const lineBufferRef = useRef<string>('');
  const seenIdsRef = useRef<Set<string>>(new Set());

  /**
   * Finalize the current buffer into a message
   */
  const finalizeMessage = useCallback((
    messageType: ChatMessage['messageType'] = 'text',
    extraMetadata?: ChatMessage['metadata']
  ) => {
    const content = bufferRef.current.trim();
    if (!content) {
      // Reset without emitting
      bufferRef.current = '';
      currentMessageIdRef.current = null;
      currentToolNameRef.current = null;
      return;
    }

    const msgId = currentMessageIdRef.current || generateMessageId();
    const msg: ChatMessage = {
      id: msgId,
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      messageType: currentToolNameRef.current ? 'tool_use' : messageType,
      metadata: {
        ...extraMetadata,
        toolName: currentToolNameRef.current || undefined,
      },
    };

    setMessages(prev => {
      // Deduplicate
      if (seenIdsRef.current.has(msgId)) {
        return prev.map(m => m.id === msgId ? msg : m);
      }
      seenIdsRef.current.add(msgId);
      return [...prev, msg];
    });

    // Reset buffer
    bufferRef.current = '';
    currentMessageIdRef.current = null;
    currentToolNameRef.current = null;
  }, []);

  /**
   * Subscribe to session WebSocket events
   */
  useEffect(() => {
    if (!sessionId) return;
    subscribe(sessionId);
    return () => {
      unsubscribe(sessionId);
    };
  }, [sessionId, subscribe, unsubscribe]);

  /**
   * Listen for WebSocket events
   */
  useEffect(() => {
    if (!onEvent) return;

    const unsubscribeEvent = onEvent((event: WorkspaceEvent) => {
      if (event.sessionId !== sessionId) return;

      // Handle claude-cli:output events (current format)
      if (event.type === 'claude-cli:output') {
        const outputEvent = event as ClaudeCliOutputEvent;
        const raw = outputEvent.output;
        const isError = outputEvent.stream === 'stderr';

        if (isError) {
          // stderr messages become error-type messages
          const errMsg: ChatMessage = {
            id: generateMessageId(),
            role: 'system',
            content: raw,
            timestamp: new Date().toISOString(),
            messageType: 'error',
          };
          setMessages(prev => [...prev, errMsg]);
          return;
        }

        // Parse stream-JSON JSONL from stdout
        const buffered = lineBufferRef.current + raw;
        const lines = buffered.split('\n');
        lineBufferRef.current = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const msg = JSON.parse(trimmed);

            switch (msg.type) {
              case 'system':
                // Silently ignore init messages
                break;

              case 'stream_event': {
                const ev = msg.event;
                if (!ev) break;

                if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta' && ev.delta.text) {
                  // Accumulate text chunk
                  if (!currentMessageIdRef.current) {
                    currentMessageIdRef.current = generateMessageId();
                  }
                  bufferRef.current += ev.delta.text;
                }

                if (ev.type === 'content_block_start' && ev.content_block?.type === 'tool_use') {
                  // Finalize any previous text buffer first
                  finalizeMessage();
                  // Start a new tool_use message
                  currentMessageIdRef.current = generateMessageId();
                  currentToolNameRef.current = ev.content_block.name || 'unknown';
                  bufferRef.current = `[Tool: ${ev.content_block.name}] `;
                }

                if (ev.type === 'content_block_start' && ev.content_block?.type === 'text') {
                  // Start of a text block - if there's tool content, finalize it
                  if (currentToolNameRef.current) {
                    finalizeMessage('tool_use');
                  }
                }

                if (ev.type === 'message_stop') {
                  // End of assistant turn - finalize
                  finalizeMessage();
                }
                break;
              }

              case 'assistant':
                // Complete assistant message (fallback) - usually we get stream_event instead
                break;

              case 'result': {
                // Turn completion with metadata
                const metadata: ChatMessage['metadata'] = {};
                if (msg.total_cost_usd != null) {
                  metadata.cost = `$${msg.total_cost_usd.toFixed(4)}`;
                }
                if (msg.duration_ms != null) {
                  metadata.duration = `${(msg.duration_ms / 1000).toFixed(1)}s`;
                }

                // Finalize any remaining buffer with metadata
                finalizeMessage(msg.is_error ? 'error' : 'text', metadata);

                if (msg.is_error) {
                  const errorMsg: ChatMessage = {
                    id: generateMessageId(),
                    role: 'system',
                    content: msg.result || 'Unknown error',
                    timestamp: new Date().toISOString(),
                    messageType: 'error',
                  };
                  setMessages(prev => [...prev, errorMsg]);
                }
                break;
              }

              default:
                break;
            }
          } catch {
            // Non-JSON line - treat as plain text output
            if (trimmed) {
              if (!currentMessageIdRef.current) {
                currentMessageIdRef.current = generateMessageId();
              }
              bufferRef.current += trimmed + '\n';
            }
          }
        }
      }

      // Handle CLI exit events
      if (event.type === 'claude-cli:exited') {
        // Finalize any remaining buffer
        finalizeMessage();

        const exitMsg: ChatMessage = {
          id: generateMessageId(),
          role: 'system',
          content: 'Claude CLI session ended',
          timestamp: new Date().toISOString(),
          messageType: 'text',
        };
        setMessages(prev => [...prev, exitMsg]);
      }

      // Future: handle chat:message events from backend
      // if (event.type === 'chat:message') { ... }
      // if (event.type === 'chat:history') { ... }
    });

    return unsubscribeEvent;
  }, [sessionId, onEvent, finalizeMessage]);

  /**
   * Add a user message to the chat
   */
  const addUserMessage = useCallback((content: string) => {
    const msg: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
      messageType: 'text',
    };
    setMessages(prev => [...prev, msg]);
  }, []);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    seenIdsRef.current.clear();
    bufferRef.current = '';
    lineBufferRef.current = '';
    currentMessageIdRef.current = null;
    currentToolNameRef.current = null;
  }, []);

  return {
    messages,
    isLoading,
    error,
    addUserMessage,
    clearMessages,
  };
}
