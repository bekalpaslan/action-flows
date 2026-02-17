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
import type { SessionId, Session, WorkspaceEvent, ReminderDefinition, ReminderVariant, ChainId } from '@afw/shared';
import { useWebSocketContext } from '../../contexts/WebSocketContext';
import { useDiscussContext } from '../../contexts/DiscussContext';
import { useChatWindowContext, AVAILABLE_MODELS } from '../../contexts/ChatWindowContext';
import { useChatMessages, type ChatMessage } from '../../hooks/useChatMessages';
import { usePromptButtons } from '../../hooks/usePromptButtons';
import { claudeCliService } from '../../services/claudeCliService';
import { DiscussButton, DiscussDialog } from '../DiscussButton';
import { ErrorModal } from '../ErrorModal';
import { useDiscussButton } from '../../hooks/useDiscussButton';
import { useErrorAnnouncements } from '../../hooks/useErrorAnnouncements';
import { extractChainCompilation } from '../../services/chainCompilationDetector';
import { ReminderButtonBar } from './ReminderButtonBar';
import { useReminderButtons } from '../../hooks/useReminderButtons';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
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
  /** Called when user clicks close in chat header */
  onClose?: () => void;
  /** Pre-populate the input field (from DiscussButton context) */
  prefillMessage?: string;
  /** Show X button in header (default false for backward compat) */
  showCloseButton?: boolean;
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
  onClose,
  prefillMessage,
  showCloseButton = false,
}: ChatPanelProps): React.ReactElement {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [cliState, setCliState] = useState<CliSessionState>('not-started');
  const [copyTooltip, setCopyTooltip] = useState('Copy');
  const [expandedSpawnPrompts, setExpandedSpawnPrompts] = useState<Set<string>>(new Set());
  const [lastChainCompilation, setLastChainCompilation] = useState<{
    chainId: ChainId;
    title: string;
    timestamp: string;
  } | null>(null);
  const [chainApproved, setChainApproved] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [focusedOptionIndex, setFocusedOptionIndex] = useState(0);
  const [displayedErrorIndex, setDisplayedErrorIndex] = useState(0);
  const cliStateRef = useRef<CliSessionState>('not-started');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  const { send } = useWebSocketContext();
  const { registerChatInput, unregisterChatInput } = useDiscussContext();
  const { selectedModel, setSelectedModel } = useChatWindowContext();
  const { messages, addUserMessage } = useChatMessages(sessionId);
  const { buttons, getButtonPromptText } = usePromptButtons({
    session,
    messages,
    cliRunning: cliState === 'running',
  });
  const { createInstance: createReminderInstance } = useReminderButtons();

  // Error announcements management
  const { unreadErrors, dismissError, handleRecoveryAction } = useErrorAnnouncements(sessionId);
  const currentError = unreadErrors.length > 0 ? unreadErrors[displayedErrorIndex] : null;

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

  // Check CLI state when switching sessions — restore 'running' if backend has an active CLI session
  useEffect(() => {
    let cancelled = false;
    claudeCliService.getSessionStatus(sessionId)
      .then((status) => {
        if (!cancelled) {
          setCliStateSync(status.isRunning ? 'running' : 'not-started');
        }
      })
      .catch(() => {
        // No CLI session exists on backend for this session
        if (!cancelled) {
          setCliStateSync('not-started');
        }
      });
    return () => { cancelled = true; };
  }, [sessionId, setCliStateSync]);

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
  const chainCount = session?.chains?.length ?? 0;
  const activeChain = session?.currentChain;
  const sessionDuration = session
    ? session.duration
      ? formatDuration(session.duration)
      : session.status === 'in_progress'
        ? formatDuration(Date.now() - new Date(session.startedAt).getTime())
        : undefined
    : undefined;

  /**
   * Register chat send function with DiscussContext on mount.
   * Uses a ref so the registered callback always calls the latest handleSendMessage.
   */
  const handleSendMessageRef = useRef<(msg: string) => void>(() => {});
  useEffect(() => {
    registerChatInput((message: string) => {
      handleSendMessageRef.current(message);
    });

    return () => {
      unregisterChatInput();
    };
  }, [registerChatInput, unregisterChatInput]);

  /**
   * Auto-scroll to bottom when new messages arrive
   */
  useEffect(() => {
    if (messagesEndRef.current && messagesEndRef.current.scrollIntoView) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  /**
   * Detect chain compilations from assistant messages
   */
  useEffect(() => {
    if (messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return;

    // Check if last message is a chain compilation
    const chainId = session?.currentChain?.id;
    if (!chainId) return;

    const compilation = extractChainCompilation(lastMessage.content, chainId);
    if (compilation) {
      setLastChainCompilation({
        chainId: compilation.chainId,
        title: compilation.title,
        timestamp: lastMessage.timestamp,
      });
      setChainApproved(false); // Reset approval state
    }
  }, [messages, session?.currentChain?.id]);

  /**
   * Handle prefillMessage: when it changes and is non-empty, set input value
   */
  useEffect(() => {
    if (prefillMessage && prefillMessage.trim()) {
      setInput(prefillMessage);
      // Clear the prefill so it doesn't re-apply on re-renders
      // Note: parent should manage the prefillMessage lifecycle
    }
  }, [prefillMessage]);

  /**
   * Close model dropdown on outside click or ESC key
   */
  useEffect(() => {
    if (!isModelDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isModelDropdownOpen]);

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

      // Check if message is an approval
      const lowerTrimmed = trimmed.toLowerCase();
      if (lowerTrimmed === 'yes' || lowerTrimmed === 'execute' || lowerTrimmed === 'approve') {
        setChainApproved(true);
      }

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

  // Keep ref in sync so DiscussContext always calls the latest version
  handleSendMessageRef.current = handleSendMessage;

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
   * Handle model selection
   */
  const handleModelSelect = useCallback((modelId: string) => {
    setSelectedModel(modelId);
    setIsModelDropdownOpen(false);
    setFocusedOptionIndex(0);
  }, [setSelectedModel]);

  /**
   * Handle keyboard navigation in model selector
   */
  const handleModelSelectorKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isModelDropdownOpen) {
      // Open dropdown on Enter, Space, or ArrowDown when closed
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsModelDropdownOpen(true);
        setFocusedOptionIndex(AVAILABLE_MODELS.findIndex(m => m.id === selectedModel));
      }
      return;
    }

    // Dropdown is open - handle navigation
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedOptionIndex(prev => Math.min(prev + 1, AVAILABLE_MODELS.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedOptionIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setFocusedOptionIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedOptionIndex(AVAILABLE_MODELS.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleModelSelect(AVAILABLE_MODELS[focusedOptionIndex].id);
        break;
      case 'Escape':
        e.preventDefault();
        setIsModelDropdownOpen(false);
        break;
      case 'Tab':
        // Allow Tab to close dropdown and move focus naturally
        setIsModelDropdownOpen(false);
        break;
    }
  }, [isModelDropdownOpen, focusedOptionIndex, selectedModel, handleModelSelect]);

  /**
   * Handle add context button click
   */
  const handleAddContextClick = useCallback(() => {
    console.log('[ChatPanel] Context menu not yet implemented');
  }, []);

  /**
   * Handle reminder button click
   */
  const handleReminderClick = useCallback(async (
    reminder: ReminderDefinition,
    variant: ReminderVariant
  ) => {
    if (!lastChainCompilation) {
      console.error('[ChatPanel] No chain compilation detected');
      return;
    }

    // Create reminder instance
    const instance = await createReminderInstance(
      reminder.id,
      sessionId,
      lastChainCompilation.chainId,
      reminder.reminderText,
      variant
    );

    if (!instance) {
      console.error('[ChatPanel] Failed to create reminder instance');
      return;
    }

    // Execute variant-specific actions
    switch (variant) {
      case 'remind-approve':
        // Auto-approve the chain
        setInput('yes');
        setTimeout(() => {
          handleSendMessage('yes');
        }, 100);
        setChainApproved(true);
        break;

      case 'remind-restart':
        // Trigger chain recompilation
        setInput('recompile the chain');
        setTimeout(() => {
          handleSendMessage('recompile the chain');
        }, 100);
        setChainApproved(false);
        break;

      case 'double-check':
        // Send verification prompt
        if (reminder.checkItems && reminder.checkItems.length > 0) {
          const prompt = `Before executing, verify:\n${reminder.checkItems.map(item => `- ${item}`).join('\n')}`;
          setInput(prompt);
        } else {
          setInput(`Before executing, verify: ${reminder.reminderText}`);
        }
        // User must manually send this prompt
        break;

      case 'remind-generic':
        // No chain action, just stored
        console.log('[ChatPanel] Generic reminder stored:', instance);
        break;
    }
  }, [lastChainCompilation, sessionId, createReminderInstance, handleSendMessage]);

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
  }



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
      <div key={msg.id || idx} className={bubbleClasses} data-testid={`message-msg-${idx + 1}`} data-message-id={msg.id}>
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
        <div className="chat-bubble__content">
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{msg.content}</ReactMarkdown>
        </div>

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
      data-testid="chat-panel"
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
          {showCloseButton && (
            <button
              className="chat-panel__close-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (onClose) {
                  onClose();
                }
              }}
              aria-label="Close chat"
              title="Close chat"
            >
              ×
            </button>
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

      {/* Session Info Bar — compact metadata row (non-scrolling, always visible) */}
      {!isCollapsed && session && (
        <div className="chat-panel__info-bar" data-testid="session-info-header">
          <button
            className="chat-panel__info-session-id"
            onClick={(e) => { e.stopPropagation(); handleCopyId(); }}
            title={copyTooltip}
            aria-label="Copy session ID"
            data-testid="session-id-display"
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
            <span className="chat-panel__info-chip" data-testid="session-duration">{sessionDuration}</span>
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
          <div
            className="chat-panel__messages"
            ref={messagesContainerRef}
            role="log"
            aria-label="Chat messages"
            aria-live="polite"
            aria-atomic="false"
            data-testid="message-list"
          >
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
              <div className="chat-panel__typing" data-testid="typing-indicator">
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

          {/* Reminder Button Bar (at approval gates) */}
          {lastChainCompilation && !chainApproved && (
            <ReminderButtonBar
              sessionId={sessionId}
              chainId={lastChainCompilation.chainId}
              onReminderClick={handleReminderClick}
            />
          )}

          {/* Prompt Buttons */}
          {buttons && buttons.length > 0 && (
            <div className="chat-panel__prompt-buttons" data-testid="prompt-buttons-container">
              {buttons.map((button, idx) => (
                <button
                  key={button.id}
                  className={`chat-panel__prompt-btn chat-panel__prompt-btn--${button.category}`}
                  onClick={() => handlePromptButtonClick(button)}
                  disabled={isSending}
                  title={button.promptText || button.label}
                  data-testid={`prompt-button-${idx}`}
                >
                  {button.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Area — NEW two-row layout */}
          <div className="chat-panel__input-container">
            {/* Top row: textarea */}
            <div className="chat-panel__input-row">
              <textarea
                ref={inputRef}
                className="chat-panel__input-field"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Reply to Claude"
                disabled={isSending}
                rows={1}
                aria-label="Chat message input"
                data-testid="chat-input"
              />
            </div>

            {/* Bottom row: toolbar */}
            <div className="chat-panel__toolbar">
              {/* Left: Add context button */}
              <button
                className="chat-panel__add-context-btn"
                onClick={handleAddContextClick}
                aria-label="Add context"
                title="Add context (coming soon)"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="10" y1="5" x2="10" y2="15" />
                  <line x1="5" y1="10" x2="15" y2="10" />
                </svg>
              </button>

              {/* Right: Model selector + Send button */}
              <div className="chat-panel__toolbar-right">
                {/* Model selector */}
                <div className="chat-panel__model-selector" ref={modelDropdownRef}>
                  <button
                    className="chat-panel__model-selector-trigger"
                    onClick={() => setIsModelDropdownOpen(prev => !prev)}
                    onKeyDown={handleModelSelectorKeyDown}
                    aria-label="Select AI model"
                    aria-haspopup="listbox"
                    aria-expanded={isModelDropdownOpen}
                  >
                    <span className="chat-panel__model-selector-label">
                      {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.label || 'Select Model'}
                    </span>
                    <svg className="chat-panel__model-selector-caret" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </button>

                  {/* Model dropdown menu */}
                  {isModelDropdownOpen && (
                    <div
                      className="chat-panel__model-selector-dropdown"
                      role="listbox"
                      aria-label="Available AI models"
                    >
                      {AVAILABLE_MODELS.map((model, index) => (
                        <button
                          key={model.id}
                          role="option"
                          aria-selected={selectedModel === model.id}
                          className={`chat-panel__model-selector-option ${selectedModel === model.id ? 'chat-panel__model-selector-option--selected' : ''}`}
                          onClick={() => handleModelSelect(model.id)}
                          onKeyDown={handleModelSelectorKeyDown}
                          tabIndex={focusedOptionIndex === index ? 0 : -1}
                          ref={focusedOptionIndex === index ? (el) => el?.focus() : null}
                        >
                          <span className="chat-panel__model-selector-option-label">{model.label}</span>
                          {selectedModel === model.id && (
                            <svg className="chat-panel__model-selector-checkmark" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Send button */}
                <button
                  className="chat-panel__send-btn"
                  onClick={() => handleSendMessage(input)}
                  disabled={!input.trim() || isSending}
                  aria-label="Send message"
                  data-testid="send-button"
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
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0a.5.5 0 01.5.5v11.793l3.146-3.147a.5.5 0 01.708.708l-4 4a.5.5 0 01-.708 0l-4-4a.5.5 0 01.708-.708L7.5 12.293V.5A.5.5 0 018 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
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
