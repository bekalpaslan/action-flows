import { useEffect, useRef } from 'react';
import { wsClient } from '../lib/ws-client';
import { useChatStore } from '../stores/chatStore';
import { parseAskUserQuestion } from '../lib/chat-types';
import type { WSEnvelope } from '@afw/shared';
import type { WorkbenchId } from '../lib/types';

/** Valid workbench IDs for normalization guard */
const VALID_WORKBENCH_IDS = ['work', 'explore', 'review', 'pm', 'settings', 'archive', 'studio'];

/**
 * Standalone handler for session:message WebSocket events.
 * Exported for unit testing without React rendering.
 *
 * Maps Agent SDK message types to chatStore mutations:
 * - assistant: text blocks -> addMessage, tool_use -> addMessage with toolCalls/askUserQuestion
 * - stream_event: content_block_start/delta/stop for streaming text
 * - result: marks streaming complete
 */
export function handleSessionMessage(
  envelope: WSEnvelope,
  currentStreamingIdRef?: { current: string | null }
): void {
  try {
    if (envelope.type !== 'session:message') return;

    const payload = envelope.payload as {
      workbenchId: string;
      message: {
        type: string;
        message?: { content?: unknown[] };
        event?: Record<string, unknown>;
      };
    } | null;

    if (!payload || typeof payload !== 'object') return;

    // WorkbenchId normalization (Issue #4): compare as string, guard against invalid values
    const wbId = String(payload.workbenchId) as WorkbenchId;
    if (!VALID_WORKBENCH_IDS.includes(wbId)) return;

    const message = payload.message;
    if (!message || typeof message !== 'object' || typeof message.type !== 'string') return;

    const store = useChatStore.getState();

    switch (message.type) {
      case 'assistant': {
        const content = message.message?.content;
        if (!Array.isArray(content)) return;

        for (const block of content) {
          if (!block || typeof block !== 'object') continue;
          const b = block as Record<string, unknown>;

          if (b.type === 'text') {
            store.addMessage(wbId, {
              id: crypto.randomUUID(),
              role: 'agent',
              content: String(b.text ?? ''),
              timestamp: new Date().toISOString(),
              status: 'complete',
            });
          } else if (b.type === 'tool_use') {
            const toolName = String(b.name ?? '');

            if (toolName === 'AskUserQuestion') {
              const parsed = parseAskUserQuestion(b.input);
              if (parsed.length > 0) {
                store.addMessage(wbId, {
                  id: crypto.randomUUID(),
                  role: 'agent',
                  content: '',
                  timestamp: new Date().toISOString(),
                  status: 'complete',
                  askUserQuestion: {
                    toolCallId: String(b.id ?? ''),
                    question: parsed[0]!,
                    response: null,
                    submitted: false,
                  },
                });
              }
            } else {
              // Regular tool use - add as a message with toolCalls
              store.addMessage(wbId, {
                id: crypto.randomUUID(),
                role: 'agent',
                content: '',
                timestamp: new Date().toISOString(),
                status: 'complete',
                toolCalls: [
                  {
                    id: String(b.id ?? ''),
                    name: toolName,
                    input: JSON.stringify(b.input),
                    output: null,
                    status: 'running',
                  },
                ],
              });
            }
          }
        }
        break;
      }

      case 'stream_event': {
        const event = message.event;
        if (!event || typeof event !== 'object') return;

        const eventType = event.type as string;

        if (eventType === 'content_block_start') {
          const contentBlock = event.content_block as Record<string, unknown> | undefined;
          if (contentBlock?.type === 'text') {
            const msgId = crypto.randomUUID();
            if (currentStreamingIdRef) {
              currentStreamingIdRef.current = msgId;
            }
            store.addMessage(wbId, {
              id: msgId,
              role: 'agent',
              content: '',
              timestamp: new Date().toISOString(),
              status: 'streaming',
            });
            store.setStreaming(wbId, true);
          }
        } else if (eventType === 'content_block_delta') {
          const delta = event.delta as Record<string, unknown> | undefined;
          if (delta?.type === 'text_delta' && currentStreamingIdRef?.current) {
            store.appendStreamChunk(wbId, currentStreamingIdRef.current, String(delta.text ?? ''));
          }
        } else if (eventType === 'content_block_stop') {
          if (currentStreamingIdRef?.current) {
            store.updateMessage(wbId, currentStreamingIdRef.current, { status: 'complete' });
            currentStreamingIdRef.current = null;
          }
          store.setStreaming(wbId, false);
        }
        break;
      }

      case 'result': {
        store.setStreaming(wbId, false);
        break;
      }

      default: {
        // Unknown message type - log at debug level, do not crash
        console.debug('[useChatMessages] Unknown message type:', message.type);
        break;
      }
    }
  } catch (error) {
    // Graceful error handling - never crash on unexpected message format
    console.debug('[useChatMessages] Error parsing message:', error);
  }
}

/**
 * WebSocket subscription hook that maps session:message events to chatStore updates.
 * Uses useChatStore.getState() (not selector) to avoid re-subscription on store changes.
 * Subscribes to '_system' channel and filters for session:message type.
 *
 * Call ONCE in AppShell or ChatPanel (not per-component).
 */
export function useChatMessages(): void {
  const currentStreamingIdRef = useRef<string | null>(null);

  useEffect(() => {
    const unsub = wsClient.subscribe('_system', (envelope: WSEnvelope) => {
      handleSessionMessage(envelope, currentStreamingIdRef);
    });

    return () => {
      unsub();
    };
  }, []);
}
