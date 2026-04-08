import { useRef, useEffect } from 'react';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { MessageBubble } from './MessageBubble';
import { ForkButton } from './ForkButton';
import { ForkBadge } from './ForkBadge';
import { ScrollToBottom } from './ScrollToBottom';
import { ChatEmptyState } from './ChatEmptyState';
import { useForkStore } from '@/stores/forkStore';
import { useSessionStore } from '@/stores/sessionStore';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/lib/chat-types';
import type { WorkbenchId } from '@/lib/types';

export interface MessageListProps {
  messages: ChatMessage[];
  workbenchId: WorkbenchId;
  workbenchLabel: string;
  connected: boolean;
  onAskUserSubmit: (messageId: string, response: string | string[]) => void;
  className?: string;
}

/**
 * Scrollable message container with auto-scroll on new messages
 * and scroll-to-bottom button per UI-SPEC D-07.
 */
export function MessageList({ messages, workbenchId, workbenchLabel, connected, onAskUserSubmit, className }: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const { handleScroll, scrollToBottom, onNewMessage, isUserScrolled, unreadCount } = useAutoScroll(listRef);

  // Fork state selectors
  const sessionId = useSessionStore((s) => s.getSession(workbenchId).sessionId);
  const isForkPoint = useForkStore((s) => s.isForkPoint);
  const forks = useForkStore((s) => s.forksByParent);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      onNewMessage(lastMessage?.role === 'user');
    }
  }, [messages.length, onNewMessage]);

  if (messages.length === 0) {
    return <ChatEmptyState connected={connected} workbenchLabel={workbenchLabel} className={className} />;
  }

  return (
    <div className={cn('relative flex-1 min-h-0', className)}>
      <div
        ref={listRef}
        onScroll={handleScroll}
        role="log"
        aria-label={`Chat with ${workbenchLabel} agent`}
        className="h-full overflow-y-auto scroll-smooth px-4 py-4"
      >
        <div role="list" className="flex flex-col gap-4">
          {messages.map((message) => {
            const isForked = sessionId ? isForkPoint(sessionId, message.id) : false;
            // Count forks at this message point
            const forkCount = sessionId
              ? (forks[sessionId] ?? []).filter((f) => f.forkPointMessageId === message.id).length
              : 0;

            return (
              <div role="listitem" key={message.id} className="group relative">
                <MessageBubble
                  message={message}
                  workbenchId={workbenchId}
                  onAskUserSubmit={onAskUserSubmit}
                />
                {isForked && (
                  <div className="mt-1 flex items-center">
                    <ForkBadge forkCount={forkCount} />
                  </div>
                )}
                {sessionId && (
                  <ForkButton
                    messageId={message.id}
                    parentSessionId={sessionId}
                    workbenchId={workbenchId}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <ScrollToBottom
        visible={isUserScrolled.current ?? false}
        unreadCount={unreadCount.current ?? 0}
        onClick={scrollToBottom}
      />
    </div>
  );
}
