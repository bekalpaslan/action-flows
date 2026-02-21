/**
 * Conversation Panel Component
 *
 * Displays Claude's output and allows Dashboard users to respond via UI
 * instead of CLI. Supports quick-response buttons for binary prompts.
 *
 * Message History:
 * - Renders full conversation history from session data
 * - Extracts Claude responses from lastPrompt and chain step results
 * - Renders user responses from lastPrompt quickResponses selection
 * - Supports InlineButtons placeholder for future integration (Step 4)
 */

import React, { useState, useEffect, useRef } from 'react';
import type { Session, ButtonDefinition, ButtonId } from '@afw/shared';
import { InlineButtons } from '../InlineButtons';
import { ErrorModal } from '../ErrorModal';
import { useErrorAnnouncements } from '../../hooks/useErrorAnnouncements';
import './ConversationPanel.css';

/**
 * Default demo buttons for testing the button system.
 * These will be replaced by registry-based buttons in Phase 3.
 */
const DEFAULT_BUTTONS: ButtonDefinition[] = [
  {
    id: 'btn-copy' as ButtonId,
    label: 'Copy',
    icon: '📋',
    action: { type: 'clipboard', payload: { text: '' } },
    contexts: ['code-change', 'analysis-report', 'general'],
    source: { type: 'core' },
    priority: 1,
    enabled: true,
  },
  {
    id: 'btn-retry' as ButtonId,
    label: 'Retry',
    icon: '🔄',
    action: { type: 'command', commandType: 'retry' },
    contexts: ['error-message'],
    source: { type: 'core' },
    priority: 2,
    enabled: true,
  },
  {
    id: 'btn-approve' as ButtonId,
    label: 'Approve',
    icon: '✅',
    action: { type: 'quick-action', payload: { response: 'yes' } },
    contexts: ['question-prompt'],
    source: { type: 'core' },
    priority: 1,
    enabled: true,
  },
  {
    id: 'btn-reject' as ButtonId,
    label: 'Reject',
    icon: '❌',
    action: { type: 'quick-action', payload: { response: 'no' } },
    contexts: ['question-prompt'],
    source: { type: 'core' },
    priority: 2,
    enabled: true,
  },
];

interface ConversationPanelProps {
  session: Session;
  onSubmitInput: (input: string) => Promise<void>;
}

interface Message {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  stepNumber?: number;
  hasInlineButtons?: boolean;
}

/** @deprecated Use ChatPanel + useChatMessages instead. Retained for contract compatibility. */
export function ConversationPanel({ session, onSubmitInput }: ConversationPanelProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAwaiting = session.conversationState === 'awaiting_input';
  const canSend = isAwaiting && input.trim().length > 0 && !isSending;

  const quickResponses = session.lastPrompt?.quickResponses || [];

  // Error announcements management
  const { unreadErrors, dismissError, handleRecoveryAction } = useErrorAnnouncements(session.id);
  const [displayedErrorIndex, setDisplayedErrorIndex] = useState(0);
  const currentError = unreadErrors.length > 0 ? unreadErrors[displayedErrorIndex] : null;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Extract full message history from session data
   *
   * Sources:
   * 1. Chain step results (completed steps with summaries/results)
   * 2. lastPrompt (current awaiting prompt from Claude)
   * 3. User submissions tracked locally in state
   */
  useEffect(() => {
    const msgs: Message[] = [];

    // Extract messages from chain steps (completed chains/steps)
    if (session.chains && session.chains.length > 0) {
      session.chains.forEach((chain) => {
        if (chain.steps && chain.steps.length > 0) {
          chain.steps.forEach((step) => {
            // Add step description/result as assistant message if available
            const content = step.description || (step.result ? String(step.result) : null);
            if (content) {
              msgs.push({
                role: 'assistant',
                content,
                timestamp: step.completedAt || step.startedAt || new Date().toISOString(),
                stepNumber: step.stepNumber,
                hasInlineButtons: false,
              });
            }
          });
        }
      });
    }

    // Add last prompt (current awaiting input) as latest assistant message
    if (session.lastPrompt) {
      msgs.push({
        role: 'assistant',
        content: session.lastPrompt.text,
        timestamp: session.lastPrompt.timestamp,
        hasInlineButtons: true, // Placeholder for InlineButtons integration (Step 4)
      });
    }

    // Sort messages by timestamp (chronological order)
    msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    setMessages(msgs);
  }, [session]);

  const handleSubmit = async (inputText: string) => {
    if (!inputText.trim() || !isAwaiting) return;

    setIsSending(true);

    try {
      await onSubmitInput(inputText);

      // Add user message to local state
      setMessages(prev => [
        ...prev,
        {
          role: 'user',
          content: inputText,
          timestamp: new Date().toISOString(),
        },
      ]);

      setInput('');
    } catch (error) {
      console.error('Failed to submit input:', error);
      alert(`Failed to send input: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        handleSubmit(input);
      }
    }
  };

  const handleQuickResponse = (response: string) => {
    handleSubmit(response);
  };

  const handleErrorDismiss = (errorId: string) => {
    dismissError(errorId);
    // Move to next unread error if available
    if (displayedErrorIndex < unreadErrors.length - 1) {
      setDisplayedErrorIndex(displayedErrorIndex + 1);
    } else {
      setDisplayedErrorIndex(0);
    }
  };

  const handleErrorRetry = (errorId: string) => {
    handleRecoveryAction(errorId, 'retry');
    handleErrorDismiss(errorId);
  };

  const handleErrorSkip = (errorId: string) => {
    handleRecoveryAction(errorId, 'skip');
    handleErrorDismiss(errorId);
  };

  const handleErrorCancel = (errorId: string) => {
    handleRecoveryAction(errorId, 'cancel');
    handleErrorDismiss(errorId);
  };

  return (
    <div className="conversation-panel">
      <div className="conversation-header">
        <h3>Conversation</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isAwaiting && (
            <span className="awaiting-badge">
              <span className="pulse-dot" />
              Awaiting Input
            </span>
          )}
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 && (
          <div className="no-messages">
            <p>No conversation yet. Waiting for Claude to ask a question...</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`message message-${msg.role}`}>
            <div className="message-role">
              {msg.role === 'assistant' ? 'Claude' : 'You'}
              {msg.stepNumber !== undefined && (
                <span className="message-step-number"> (Step {msg.stepNumber})</span>
              )}
            </div>
            <div className="message-content">{msg.content}</div>
            {msg.hasInlineButtons && (
              <InlineButtons
                messageContent={msg.content}
                sessionId={session.id}
                buttons={DEFAULT_BUTTONS}
                onAction={(button) => {
                  console.log('InlineButton action triggered:', button);
                }}
              />
            )}
            <div className="message-timestamp">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        {quickResponses.length > 0 && (
          <div className="quick-responses">
            {quickResponses.map((response, idx) => (
              <button
                key={idx}
                className="quick-response-btn"
                onClick={() => handleQuickResponse(response)}
                disabled={!isAwaiting || isSending}
              >
                {response}
              </button>
            ))}
          </div>
        )}

        <div className="input-field-container">
          <textarea
            className="input-field"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isAwaiting
                ? 'Type your response... (Enter to send, Shift+Enter for new line)'
                : 'Session is not awaiting input'
            }
            disabled={!isAwaiting || isSending}
            rows={3}
          />
          <button
            className="send-btn"
            onClick={() => handleSubmit(input)}
            disabled={!canSend}
            title={!isAwaiting ? 'Session not awaiting input' : 'Send'}
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>

        {!isAwaiting && (
          <div className="not-awaiting-notice">
            <small>
              💡 Input will be enabled when Claude asks a question
            </small>
          </div>
        )}
      </div>

      <ErrorModal
        isOpen={currentError !== null}
        error={currentError}
        onDismiss={handleErrorDismiss}
        onRetry={handleErrorRetry}
        onSkip={handleErrorSkip}
        onCancel={handleErrorCancel}
      />
    </div>
  );
}
