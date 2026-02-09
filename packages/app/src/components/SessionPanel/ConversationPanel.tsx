/**
 * ConversationPanel Component
 * Persistent conversation panel for Session Panel layout
 * Extracted from SlidingWindow overlay, now a stacked panel
 *
 * Features:
 * - Displays Claude's output and user responses
 * - Message history from session data
 * - Quick-response buttons for binary prompts
 * - Collapsible header with "Conversation" title
 * - flex-grow: 1 (fills remaining space in left panel stack)
 * - Input field at bottom of panel (not in BottomControlPanel)
 * - Optimized for narrow 25% panel width
 */

import React, { useState, useEffect, useRef } from 'react';
import type { Session, ButtonDefinition, ButtonId } from '@afw/shared';
import { InlineButtons } from '../InlineButtons';
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

export interface ConversationPanelProps {
  /** Session data */
  session: Session;
  /** Callback when input is submitted */
  onSubmitInput: (input: string) => Promise<void>;
  /** Height of the panel (optional) */
  height?: number | string;
  /** Enable collapsible header */
  collapsible?: boolean;
}

interface Message {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  stepNumber?: number;
  hasInlineButtons?: boolean;
}

/**
 * ConversationPanel - Persistent conversation panel (no longer an overlay)
 * Adapted from ConversationPanel.tsx for SessionPanel layout
 */
export function ConversationPanel({
  session,
  onSubmitInput,
  height,
  collapsible = true,
}: ConversationPanelProps): React.ReactElement {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAwaiting = session.conversationState === 'awaiting_input';
  const canSend = isAwaiting && input.trim().length > 0 && !isSending;

  const quickResponses = session.lastPrompt?.quickResponses || [];

  /**
   * Toggle collapse state
   */
  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  /**
   * Auto-scroll to bottom when messages change
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Extract full message history from session data
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
        hasInlineButtons: true,
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

  const panelHeight = height ? (typeof height === 'number' ? `${height}px` : height) : undefined;

  return (
    <div
      className={`conversation-panel ${isCollapsed ? 'collapsed' : ''}`.trim()}
      style={{ height: isCollapsed ? '32px' : panelHeight }}
      role="region"
      aria-label="Conversation"
    >
      {/* Panel Header (Collapsible) */}
      <div className="conversation-panel-header" onClick={collapsible ? toggleCollapse : undefined}>
        <div className="header-title-row">
          <h3 className="panel-title">Conversation</h3>
          {messages.length > 0 && (
            <span className="message-count">
              {messages.length} message{messages.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="header-actions">
          {isAwaiting && !isCollapsed && (
            <span className="awaiting-badge">
              <span className="pulse-dot" />
              Awaiting
            </span>
          )}
          {collapsible && (
            <button
              className="collapse-toggle"
              aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapse();
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="currentColor"
                className={`collapse-icon ${isCollapsed ? 'collapsed' : ''}`}
              >
                <path d="M4.427 9.573l3.396-3.396a.25.25 0 0 1 .354 0l3.396 3.396a.25.25 0 0 1-.177.427H4.604a.25.25 0 0 1-.177-.427z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Panel Content */}
      {!isCollapsed && (
        <>
          {/* Messages Container */}
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

          {/* Input Area */}
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
        </>
      )}
    </div>
  );
}
