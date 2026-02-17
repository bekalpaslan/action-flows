/**
 * useChatMessages Hook
 * Listens to WebSocket events for chat messages and maintains message state.
 * Consumes chat:message and chat:history events from the backend message aggregator.
 * Falls back to claude-cli:output for stderr error display.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { SessionId, ClaudeCliOutputEvent, WorkspaceEvent } from '@afw/shared';
import { useWebSocketContext } from '../contexts/WebSocketContext';

/**
 * Display-only ViewModel — distinct from @afw/shared ChatMessage.
 * Enriches backend message fields with display-friendly metadata (cost, duration strings).
 */
export interface ChatDisplayMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  messageType?: 'text' | 'tool_use' | 'tool_result' | 'error';
  metadata?: {
    model?: string;
    stopReason?: string;
    toolName?: string;
    toolUseId?: string;
    toolInput?: unknown;
    spawnPrompt?: string;
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
 */
export function useChatMessages(sessionId: SessionId) {
  const [messages, setMessages] = useState<ChatDisplayMessage[]>([]);
  const [isLoading] = useState(false);
  const [error] = useState<Error | null>(null);
  const { onEvent, subscribe, unsubscribe } = useWebSocketContext();
  const seenIdsRef = useRef<Set<string>>(new Set());

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
   * Clear messages when session changes
   */
  useEffect(() => {
    setMessages([]);
    seenIdsRef.current.clear();
  }, [sessionId]);

  /**
   * Listen for WebSocket events
   */
  useEffect(() => {
    if (!onEvent) return;

    const unsubscribeEvent = onEvent((event: WorkspaceEvent) => {
      if (event.sessionId !== sessionId) return;

      // Handle chat:message events (structured messages from backend aggregator)
      if (event.type === 'chat:message') {
        const chatEvent = event as unknown as {
          message: {
            id: string;
            role: string;
            content: string;
            timestamp: string;
            messageType?: string;
            metadata?: Record<string, unknown>;
          };
        };
        const msg = chatEvent.message;
        if (msg && msg.id) {
          const chatMsg: ChatDisplayMessage = {
            id: msg.id,
            role: (msg.role as ChatDisplayMessage['role']) || 'assistant',
            content: msg.content || '',
            timestamp: msg.timestamp || new Date().toISOString(),
            messageType: (msg.messageType as ChatDisplayMessage['messageType']) || 'text',
            metadata: msg.metadata
              ? {
                  model: msg.metadata.model as string | undefined,
                  stopReason: msg.metadata.stopReason as string | undefined,
                  toolName: msg.metadata.toolName as string | undefined,
                  toolUseId: msg.metadata.toolUseId as string | undefined,
                  toolInput: msg.metadata.toolInput,
                  spawnPrompt: msg.metadata.spawnPrompt as string | undefined,
                  cost:
                    typeof msg.metadata.costUsd === 'number'
                      ? `$${msg.metadata.costUsd.toFixed(4)}`
                      : undefined,
                  duration:
                    typeof msg.metadata.durationMs === 'number'
                      ? `${(msg.metadata.durationMs / 1000).toFixed(1)}s`
                      : undefined,
                }
              : undefined,
          };

          // Dedup check OUTSIDE updater to avoid React StrictMode double-invocation issue.
          // StrictMode calls updater functions twice; mutating seenIdsRef inside would
          // cause the second call to treat the message as a duplicate and drop it.
          if (seenIdsRef.current.has(chatMsg.id)) {
            setMessages(prev => prev.map(m => (m.id === chatMsg.id ? chatMsg : m)));
          } else {
            seenIdsRef.current.add(chatMsg.id);
            setMessages(prev => [...prev, chatMsg]);
          }
        }
      }

      // Handle chat:history events (initial history on reconnect)
      if (event.type === 'chat:history') {
        const historyEvent = event as unknown as {
          messages: Array<{
            id: string;
            role: string;
            content: string;
            timestamp: string;
            messageType?: string;
            metadata?: Record<string, unknown>;
          }>;
        };
        if (historyEvent.messages && Array.isArray(historyEvent.messages)) {
          const chatMsgs: ChatDisplayMessage[] = historyEvent.messages.map(msg => ({
            id: msg.id,
            role: (msg.role as ChatDisplayMessage['role']) || 'assistant',
            content: msg.content || '',
            timestamp: msg.timestamp || new Date().toISOString(),
            messageType: (msg.messageType as ChatDisplayMessage['messageType']) || 'text',
            metadata: msg.metadata
              ? {
                  model: msg.metadata.model as string | undefined,
                  stopReason: msg.metadata.stopReason as string | undefined,
                  toolName: msg.metadata.toolName as string | undefined,
                  toolUseId: msg.metadata.toolUseId as string | undefined,
                  toolInput: msg.metadata.toolInput,
                  spawnPrompt: msg.metadata.spawnPrompt as string | undefined,
                  cost:
                    typeof msg.metadata.costUsd === 'number'
                      ? `$${msg.metadata.costUsd.toFixed(4)}`
                      : undefined,
                  duration:
                    typeof msg.metadata.durationMs === 'number'
                      ? `${(msg.metadata.durationMs / 1000).toFixed(1)}s`
                      : undefined,
                }
              : undefined,
          }));
          setMessages(chatMsgs);
          seenIdsRef.current = new Set(chatMsgs.map(m => m.id));
        }
      }

      // Handle claude-cli:output for stderr only (stdout handled via chat:message)
      if (event.type === 'claude-cli:output') {
        const outputEvent = event as ClaudeCliOutputEvent;
        if (outputEvent.stream === 'stderr') {
          const errMsg: ChatDisplayMessage = {
            id: generateMessageId(),
            role: 'system',
            content: outputEvent.output,
            timestamp: new Date().toISOString(),
            messageType: 'error',
          };
          setMessages(prev => [...prev, errMsg]);
        }
      }

      // Handle CLI exit events
      if (event.type === 'claude-cli:exited') {
        const exitMsg: ChatDisplayMessage = {
          id: generateMessageId(),
          role: 'system',
          content: 'Claude CLI session ended',
          timestamp: new Date().toISOString(),
          messageType: 'text',
        };
        setMessages(prev => [...prev, exitMsg]);
      }
    });

    return unsubscribeEvent;
  }, [sessionId, onEvent]);

  /**
   * Add a user message to the chat
   */
  const addUserMessage = useCallback((content: string) => {
    const msg: ChatDisplayMessage = {
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
  }, []);

  return {
    messages,
    isLoading,
    error,
    addUserMessage,
    clearMessages,
  };
}
