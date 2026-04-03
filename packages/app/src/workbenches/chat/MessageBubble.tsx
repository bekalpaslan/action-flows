import { memo } from 'react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ToolCallCard } from './ToolCallCard';
import { AskUserRenderer } from './AskUserRenderer';
import { ApprovalGateCard } from './ApprovalGateCard';
import { useChatStore } from '@/stores/chatStore';
import type { ChatMessage } from '@/lib/chat-types';
import type { WorkbenchId } from '@/lib/types';
import { WORKBENCHES } from '@/lib/types';

export interface MessageBubbleProps {
  message: ChatMessage;
  workbenchId: WorkbenchId;
  onAskUserSubmit?: (messageId: string, response: string | string[]) => void;
}

/**
 * Truncate string to maxLen characters, appending "..." if truncated.
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

/**
 * Single message renderer for the chat panel. Renders user, agent, and system
 * messages with appropriate alignment, styling, markdown, tool calls, streaming
 * cursor, and interactive AskUserQuestion.
 *
 * Wrapped in React.memo comparing message.id, message.status, and content length
 * for render optimization.
 */
function MessageBubbleInner({ message, workbenchId, onAskUserSubmit }: MessageBubbleProps) {
  const workbench = WORKBENCHES.find((w) => w.id === workbenchId);
  const WorkbenchIcon = workbench?.icon;
  const workbenchLabel = workbench?.label ?? workbenchId;

  const contentPreview = truncate(message.content, 50);

  if (message.role === 'user') {
    return (
      <div className="flex justify-end animate-fade-in" aria-label={`You said: ${contentPreview}`}>
        <div className="bg-surface-3 rounded-lg px-4 py-3 max-w-[85%]">
          <p className="text-body whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.role === 'system') {
    return (
      <div className="flex justify-center animate-fade-in" aria-label={`System: ${contentPreview}`}>
        <p className="text-text-muted text-caption italic">{message.content}</p>
      </div>
    );
  }

  // Agent message
  return (
    <div
      className="flex justify-start gap-3 animate-fade-in"
      aria-label={`${workbenchLabel} agent said: ${contentPreview}`}
    >
      {/* Agent avatar - workbench icon */}
      {WorkbenchIcon && (
        <div className="shrink-0 mt-1">
          <WorkbenchIcon className="h-5 w-5 text-text-dim" />
        </div>
      )}

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {/* Markdown content */}
        {message.content && (
          <MarkdownRenderer content={message.content} />
        )}

        {/* Streaming cursor */}
        {message.status === 'streaming' && (
          <span
            className={cn(
              'inline-block w-[2px] h-[1em] bg-accent',
              'motion-safe:animate-[blink_1060ms_ease-in-out_infinite]',
              'motion-reduce:opacity-100'
            )}
            aria-hidden="true"
          />
        )}

        {/* Tool calls */}
        {message.toolCalls?.map((toolCall) => (
          <ToolCallCard key={toolCall.id} toolCall={toolCall} />
        ))}

        {/* AskUserQuestion */}
        {message.askUserQuestion && (
          <AskUserRenderer
            question={message.askUserQuestion.question}
            onSubmit={(response) => onAskUserSubmit?.(message.id, response)}
            submitted={message.askUserQuestion.submitted}
          />
        )}

        {/* Approval Gate */}
        {message.approvalRequest && (
          <ApprovalGateCard
            request={message.approvalRequest}
            onApprove={(approvalId) => {
              useChatStore.getState().resolveApproval(workbenchId, approvalId, 'approved');
            }}
            onDeny={(approvalId) => {
              useChatStore.getState().resolveApproval(workbenchId, approvalId, 'denied');
            }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Memoized MessageBubble - only re-renders when message identity, status,
 * or content length changes.
 */
export const MessageBubble = memo(MessageBubbleInner, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.message.content.length === nextProps.message.content.length &&
    prevProps.message.approvalRequest?.status === nextProps.message.approvalRequest?.status
  );
});

MessageBubble.displayName = 'MessageBubble';
