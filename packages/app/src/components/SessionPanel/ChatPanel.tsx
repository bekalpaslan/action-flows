/**
 * ChatPanel Component
 * Mobile-format chat window that replaces CliPanel + ConversationPanel + SmartPromptLibrary.
 * Includes integrated session info header bar (merged from SessionInfoPanel).
 *
 * Features:
 * - Compact session info bar at top (status, ID, duration, chain info)
 * - Message bubbles (user right/blue, assistant left/gray, system center/muted)
 * - Auto-scroll to bottom on new messages
 * - Timestamps and metadata on messages
 * - Typing indicator during active streaming
 * - Context-aware prompt buttons at the bottom
 * - Text input with Send button
 * - Collapsible header
 * - Optimized for narrow 25% panel width (280px min)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { SessionId, Session, WorkspaceEvent } from '@afw/shared';
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import { useDiscussContext } from '../../contexts/DiscussContext';
import { useChatMessages, type ChatMessage } from '../../hooks/useChatMessages';
import { usePromptButtons } from '../../hooks/usePromptButtons';
import { claudeCliService } from '../../services/claudeCliService';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import type { PromptButton } from '../../services/promptButtonSelector';
import './ChatPanel.css';

/* ============================================================================
 * Session Info Helpers (absorbed from SessionInfoPanel)
 * ============================================================================ */

/** Format timestamp as relative time (e.g., "5m ago", "2h ago") */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

/** Format duration in milliseconds to human-readable string */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/** Truncate session ID for display */
function truncateSessionId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.substring(0, 8)}...${id.substring(id.length - 4)}`;
}

/** Get status badge CSS modifier */
function getStatusColor(status: string): string {
  switch (status) {
    case 'in_progress':
    case 'active':
      return 'green';
    case 'completed':
      return 'gray';
    case 'failed':
    case 'error':
      return 'red';
    case 'paused':
      return 'yellow';
    default:
      return 'gray';
  }
}

/** Get human-readable status text */
function getStatusText(status: string): string {
  switch (status) {
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    case 'paused':
      return 'Paused';
    case 'active':
      return 'Active';
    default:
      return status;
  }
}

export interface ChatPanelProps {
  /** Session ID to connect to */
  sessionId: SessionId;
  /** Full session object for context-aware buttons */
  session?: Session;
  /** Callback when user sends a message */
  onSendMessage?: (message: string) => Promise<void>;
  /** Enable collapsible header */
  collapsible?: boolean;
  /** Working directory for CLI session */
  cwd?: string;
}

/** CLI session lifecycle states */
type CliSessionState = 'not-started' | 'starting' | 'running' | 'stopped';

/**
 * ChatPanel - Mobile-format chat interface for Claude CLI sessions
 */
export function ChatPanel({
  sessionId,
  session,
  onSendMessage,
  collapsible = true,
  cwd = 'D:/ActionFlowsDashboard',
}: ChatPanelProps): React.ReactElement {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [cliState, setCliState] = useState<CliSessionState>('not-started');
  const [copyTooltip, setCopyTooltip] = useState('Copy');
  const [expandedSpawnPrompts, setExpandedSpawnPrompts] = useState<Set<string>>(new Set());
  const cliStateRef = useRef<CliSessionState>('not-started');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { send } = useWebSocketContext();
  const { registerChatInput, unregisterChatInput } = useDiscussContext();
  const { messages, addUserMessage } = useChatMessages(sessionId);
  const { buttons, getButtonPromptText } = usePromptButtons({
    session,
    messages,
    cliRunning: cliState === 'running',
  });

  // DiscussButton integration
  const { isDialogOpen, openDialog, closeDialog, handleSend } = useDiscussButton({
    componentName: 'ChatPanel',
    getContext: () => ({
      messageCount: messages.length,
      sessionStatus: session?.status,
      cliState,
    }),
  });

  /**
   * Synchronously update both ref and state
   */
  const setCliStateSync = useCallback((state: CliSessionState) => {
    cliStateRef.current = state;
    setCliState(state);
  }, []);

  /**
   * Toggle collapse state
   */
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  /**
   * Copy session ID to clipboard
   */
  const handleCopyId = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(sessionId).then(() => {
        setCopyTooltip('Copied!');
        setTimeout(() => setCopyTooltip('Copy'), 2000);
      });
    }
  }, [sessionId]);

  /**
   * Toggle spawn prompt expansion for a message
   */
  const toggleSpawnPrompt = useCallback((msgId: string) => {
    setExpandedSpawnPrompts(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
      } else {
        next.add(msgId);
      }
      return next;
    });
  }, []);

  // Derive session info metrics
  const sessionStatus = session?.status ?? 'active';
  const statusColor = getStatusColor(sessionStatus);
  const statusText = getStatusText(sessionStatus);
  const chainCount = session?.chains.length ?? 0;
  const activeChain = session?.currentChain;
  const sessionDuration = session
    ? session.duration
      ? formatDuration(session.duration)
      : session.status === 'in_progress'
        ? formatDuration(Date.now() - new Date(session.startedAt).getTime())
        : undefined
    : undefined;

  /**
   * Register chat input with DiscussContext on mount
   */
  useEffect(() => {
    const inputSetter = (message: string) => {
      // Add the message directly to the chat conversation
      addUserMessage(message);
    };

    registerChatInput(inputSetter);

    return () => {
      unregisterChatInput();
    };
  }, [registerChatInput, unregisterChatInput]);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  /**
   * Start the Claude CLI session
   */
  const startCliSession = useCallback(async (): Promise<boolean> => {
    if (cliStateRef.current !== 'not-started' && cliStateRef.current !== 'stopped') {
      return cliStateRef.current === 'running';
    }

    setCliStateSync('starting');

    try {
      await claudeCliService.startSession(sessionId, cwd);
      setCliStateSync('running');
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      // If session already exists on backend, treat as running (reconnect case)
      if (errorMsg.includes('already exists')) {
        setCliStateSync('running');
        return true;
      }
      setCliStateSync('stopped');
      addUserMessage(`Failed to start CLI session: ${errorMsg}`);
      return false;
    }
  }, [sessionId, cwd, setCliStateSync, addUserMessage]);

  /**
   * Send a message
   */
  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isSending) return;

    setIsSending(true);
    const trimmed = messageText.trim();

    try {
      // Start CLI session if not running
      if (cliStateRef.current !== 'running') {
        const started = await startCliSession();
        if (!started) {
          setIsSending(false);
          return;
        }
      }

      // Add user message to chat
      addUserMessage(trimmed);

      // If parent provided a handler, use it
      if (onSendMessage) {
        await onSendMessage(trimmed);
      } else {
        // Otherwise send via WebSocket as 'input' type
        send({
          type: 'input',
          sessionId: sessionId,
          payload: trimmed,
          timestamp: new Date().toISOString(),
        } as unknown as WorkspaceEvent);
      }

      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  }, [isSending, sessionId, send, onSendMessage, startCliSession, addUserMessage]);

  /**
   * Handle Enter key in textarea
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  }, [input, handleSendMessage]);

  /**
   * Handle prompt button click
   */
  const handlePromptButtonClick = useCallback((button: PromptButton) => {
    const text = getButtonPromptText(button);
    if (text) {
      handleSendMessage(text);
    }
  }, [getButtonPromptText, handleSendMessage]);



  /**
   * Determine if the assistant is currently "typing" (streaming)
   * Heuristic: if last message is from assistant and was very recently updated
   */
  const isTyping = false; // TODO: track from streaming state

  /**
   * Format timestamp for display
   */
  const formatTime = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  /**
   * Render a single message bubble
   */
  const renderMessage = (msg: ChatMessage, idx: number) => {
    const isUser = msg.role === 'user';
    const isSystem = msg.role === 'system';
    const isError = msg.messageType === 'error';
    const isToolUse = msg.messageType === 'tool_use';

    const bubbleClasses = [
      'chat-bubble',
      `chat-bubble--${msg.role}`,
      isError ? 'chat-bubble--error' : '',
      isToolUse ? 'chat-bubble--tool_use' : '',
    ].filter(Boolean).join(' ');

    return (
      <div key={msg.id || idx} className={bubbleClasses}>
        {/* Role label (not for system messages) */}
        {!isSystem && (
          <span className="chat-bubble__role">
            {isUser ? 'You' : 'Claude'}
          </span>
        )}

        {/* Tool badge */}
        {isToolUse && msg.metadata?.toolName && (
          <span className="chat-bubble__tool-badge">
            Tool: {msg.metadata.toolName}
          </span>
        )}

        {/* Spawn Prompt Expandable Section */}
        {isToolUse && msg.metadata?.spawnPrompt && (
          <div className="chat-bubble__spawn-prompt">
            <button
              className="chat-bubble__spawn-prompt-header"
              onClick={() => toggleSpawnPrompt(msg.id)}
              aria-expanded={expandedSpawnPrompts.has(msg.id)}
              aria-controls={`spawn-prompt-${msg.id}`}
              aria-label={expandedSpawnPrompts.has(msg.id) ? 'Collapse spawn prompt' : 'Expand spawn prompt'}
            >
              <span className="chat-bubble__spawn-prompt-icon">
                {expandedSpawnPrompts.has(msg.id) ? '▼' : '▶'}
              </span>
              <span className="chat-bubble__spawn-prompt-label">
                Spawn Prompt
              </span>
            </button>
            {expandedSpawnPrompts.has(msg.id) && (
              <pre
                className="chat-bubble__spawn-prompt-content"
                id={`spawn-prompt-${msg.id}`}
              >
                <code>{msg.metadata.spawnPrompt}</code>
              </pre>
            )}
          </div>
        )}

        {/* Message content */}
        <div className="chat-bubble__content">{msg.content}</div>

        {/* Metadata footer */}
        <div className="chat-bubble__metadata">
          <span className="chat-bubble__timestamp">{formatTime(msg.timestamp)}</span>
          {msg.metadata?.cost && (
            <span className="chat-bubble__cost">{msg.metadata.cost}</span>
          )}
          {msg.metadata?.duration && (
            <span className="chat-bubble__cost">{msg.metadata.duration}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`chat-panel ${isCollapsed ? 'collapsed' : ''}`.trim()}
      role="region"
      aria-label="Chat"
    >
      {/* Header — includes session info bar */}
      <div className="chat-panel-header" onClick={collapsible ? toggleCollapse : undefined}>
        <div className="chat-panel-header__left">
          <h3 className="panel-title">Chat</h3>
          {/* Status badge (from SessionInfoPanel) */}
          {session && (
            <div className={`chat-panel-header__session-status chat-panel-header__session-status--${statusColor}`}>
              <span className="chat-panel-header__session-dot" />
              <span>{statusText}</span>
            </div>
          )}
          {messages.length > 0 && (
            <span className="chat-panel-header__message-count">
              {messages.length}
            </span>
          )}
        </div>
        <div className="chat-panel-header__right">
          {cliState === 'running' && !isCollapsed && (
            <span className="chat-panel-header__status-badge">
              <span className="chat-panel-header__status-dot" />
              Live
            </span>
          )}
          <DiscussButton componentName="ChatPanel" onClick={openDialog} size="small" />
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

      {/* Session Info Bar — compact metadata row (non-scrolling, always visible) */}
      {!isCollapsed && session && (
        <div className="chat-panel__info-bar">
          <button
            className="chat-panel__info-session-id"
            onClick={(e) => { e.stopPropagation(); handleCopyId(); }}
            title={copyTooltip}
            aria-label="Copy session ID"
          >
            <span className="chat-panel__info-session-id-text">
              {truncateSessionId(sessionId)}
            </span>
            <svg className="chat-panel__info-copy-icon" width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2z" />
              <path d="M2 6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1H6a3 3 0 0 1-3-3V6H2z" />
            </svg>
          </button>
          {session.startedAt && (
            <span className="chat-panel__info-chip" title={new Date(session.startedAt).toLocaleString()}>
              {formatRelativeTime(new Date(session.startedAt).getTime())}
            </span>
          )}
          {sessionDuration && (
            <span className="chat-panel__info-chip">{sessionDuration}</span>
          )}
          <span className="chat-panel__info-chip">
            {chainCount} chain{chainCount !== 1 ? 's' : ''}
          </span>
          {activeChain && (
            <span className="chat-panel__info-chip chat-panel__info-chip--active" title={activeChain.title}>
              {activeChain.title}
            </span>
          )}
        </div>
      )}

      {/* Content (hidden when collapsed) */}
      {!isCollapsed && (
        <>
          {/* Messages */}
          <div className="chat-panel__messages" ref={messagesContainerRef}>
            {messages.length === 0 && (
              <div className="chat-panel__empty">
                <div className="chat-panel__empty-icon">&#x1F4AC;</div>
                <div className="chat-panel__empty-text">
                  Type a message to start a conversation with Claude
                </div>
              </div>
            )}

            {messages.map((msg, idx) => renderMessage(msg, idx))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="chat-panel__typing">
                <div className="chat-panel__typing-dots">
                  <span className="chat-panel__typing-dot" />
                  <span className="chat-panel__typing-dot" />
                  <span className="chat-panel__typing-dot" />
                </div>
                <span>Claude is thinking...</span>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Buttons */}
          {buttons.length > 0 && (
            <div className="chat-panel__prompt-buttons">
              {buttons.map(button => (
                <button
                  key={button.id}
                  className={`chat-panel__prompt-btn chat-panel__prompt-btn--${button.category}`}
                  onClick={() => handlePromptButtonClick(button)}
                  disabled={isSending}
                  title={button.promptText || button.label}
                >
                  {button.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="chat-panel__input-area">
            <textarea
              ref={inputRef}
              className="chat-panel__input-field"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send)"
              disabled={isSending}
              rows={1}
              aria-label="Chat message input"
            />
            <button
              className="chat-panel__send-btn"
              onClick={() => handleSendMessage(input)}
              disabled={!input.trim() || isSending}
              aria-label="Send message"
            >
              {isSending ? (
                <svg
                  className="chat-panel__send-icon spinning"
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M8 1a7 7 0 1 0 7 7h-2a5 5 0 1 1-5-5V1z" />
                </svg>
              ) : (
                <svg
                  className="chat-panel__send-icon"
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M15.854 7.854l-5-5a.5.5 0 0 0-.708.708L14.293 7.5H.5a.5.5 0 0 0 0 1h13.793l-4.147 4.146a.5.5 0 0 0 .708.708l5-5a.5.5 0 0 0 0-.708z" />
                </svg>
              )}
            </button>
          </div>
        </>
      )}

      {/* DiscussDialog */}
      <DiscussDialog
        isOpen={isDialogOpen}
        componentName="ChatPanel"
        componentContext={{
          messageCount: messages.length,
          sessionStatus: session?.status,
          cliState,
        }}
        onSend={handleSend}
        onClose={closeDialog}
      />
    </div>
  );
}
