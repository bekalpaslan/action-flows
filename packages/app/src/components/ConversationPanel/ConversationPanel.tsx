/**
 * Conversation Panel Component
 *
 * Displays Claude's output and allows Dashboard users to respond via UI
 * instead of CLI. Supports quick-response buttons for binary prompts.
 */

import React, { useState, useEffect, useRef } from 'react';
import type { Session } from '@afw/shared';
import './ConversationPanel.css';

interface ConversationPanelProps {
  session: Session;
  onSubmitInput: (input: string) => Promise<void>;
}

interface Message {
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
}

export function ConversationPanel({ session, onSubmitInput }: ConversationPanelProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAwaiting = session.conversationState === 'awaiting_input';
  const canSend = isAwaiting && input.trim().length > 0 && !isSending;

  const quickResponses = session.lastPrompt?.quickResponses || [];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Parse session events/chain output into messages (simplified for Phase 6)
  useEffect(() => {
    const msgs: Message[] = [];

    if (session.lastPrompt) {
      msgs.push({
        role: 'assistant',
        content: session.lastPrompt.text,
        timestamp: session.lastPrompt.timestamp,
      });
    }

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

  return (
    <div className="conversation-panel">
      <div className="conversation-header">
        <h3>Conversation</h3>
        {isAwaiting && (
          <span className="awaiting-badge">
            <span className="pulse-dot" />
            Awaiting Input
          </span>
        )}
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
            </div>
            <div className="message-content">{msg.content}</div>
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
    </div>
  );
}
