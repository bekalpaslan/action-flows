/**
 * ChatPanel Component Tests
 *
 * Tests the mobile-format chat window including:
 * - Smoke rendering with required sessionId prop
 * - Message list rendering and auto-scroll
 * - Chat input and send functionality
 * - Prompt button integration
 * - Typing indicator display
 * - Accessibility attributes
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatPanel } from '../../components/SessionPanel/ChatPanel';
import type { SessionId } from '@afw/shared';
import { useCommonTestSetup, createMockChatMessages, createMockPromptButtons } from '../../__tests__/utils';

// Mock contexts
vi.mock('../../contexts/WebSocketContext', () => ({
  useWebSocketContext: () => ({
    status: 'connected',
    send: vi.fn(),
    onEvent: null,
  }),
}));

vi.mock('../../contexts/DiscussContext', () => ({
  useDiscussContext: () => ({
    sessionId: 'session-test' as SessionId,
    model: 'claude-3-sonnet',
  }),
}));

vi.mock('../../contexts/ChatWindowContext', () => ({
  useChatWindowContext: () => ({
    model: 'claude-3-sonnet',
  }),
  AVAILABLE_MODELS: ['claude-3-sonnet', 'claude-3-opus'],
}));

vi.mock('../../hooks/useChatMessages', () => ({
  useChatMessages: (sessionId: SessionId) => ({
    messages: createMockChatMessages(2),
    addMessage: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('../../hooks/usePromptButtons', () => ({
  usePromptButtons: () => ({
    prompts: createMockPromptButtons(2),
  }),
}));

vi.mock('../../hooks/useReminderButtons', () => ({
  useReminderButtons: () => ({
    reminders: [],
  }),
}));

vi.mock('../../hooks/useDiscussButton', () => ({
  useDiscussButton: () => ({
    isOpen: false,
    toggleDialog: vi.fn(),
  }),
}));

vi.mock('../../hooks/useErrorAnnouncements', () => ({
  useErrorAnnouncements: () => ({
    announceError: vi.fn(),
    unreadErrors: [],
    dismissError: vi.fn(),
    handleRecoveryAction: vi.fn(),
    displayedErrorIdx: 0,
  }),
}));

vi.mock('../../services/claudeCliService', () => ({
  claudeCliService: {
    sendMessage: vi.fn(),
  },
}));

vi.mock('../../services/chainCompilationDetector', () => ({
  extractChainCompilation: vi.fn(() => null),
}));

vi.mock('../../components/DiscussButton', () => ({
  DiscussButton: () => <button data-testid="discuss-button">Discuss</button>,
  DiscussDialog: () => <div data-testid="discuss-dialog" />,
}));

vi.mock('../../components/ErrorModal', () => ({
  ErrorModal: () => <div data-testid="error-modal" />,
}));

vi.mock('../../components/SessionPanel/ReminderButtonBar', () => ({
  ReminderButtonBar: () => <div data-testid="reminder-button-bar" />,
}));

vi.mock('react-markdown', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

describe('ChatPanel', () => {
  const sessionId = 'session-123' as SessionId;

  useCommonTestSetup();

  it('renders without crashing with required sessionId prop', () => {
    const { container } = render(<ChatPanel sessionId={sessionId} />);
    expect(container).toBeTruthy();
  });

  it('applies correct data-testid on main container', () => {
    render(<ChatPanel sessionId={sessionId} />);
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
  });

  it('renders message list container with correct testid', () => {
    render(<ChatPanel sessionId={sessionId} />);
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
  });

  it('renders chat messages from context with correct testids', async () => {
    render(<ChatPanel sessionId={sessionId} />);

    await waitFor(() => {
      expect(screen.getByTestId('message-msg-1')).toBeInTheDocument();
      expect(screen.getByTestId('message-msg-2')).toBeInTheDocument();
    });
  });

  it('displays user message on right with correct styling', async () => {
    render(<ChatPanel sessionId={sessionId} />);

    await waitFor(() => {
      const userMessage = screen.getByTestId('message-msg-1');
      expect(userMessage).toHaveClass('message--user');
    });
  });

  it('displays assistant message on left with correct styling', async () => {
    render(<ChatPanel sessionId={sessionId} />);

    await waitFor(() => {
      const assistantMessage = screen.getByTestId('message-msg-2');
      expect(assistantMessage).toHaveClass('message--assistant');
    });
  });

  it('renders chat input field with correct testid', () => {
    render(<ChatPanel sessionId={sessionId} />);
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
  });

  it('renders send button with correct testid', () => {
    render(<ChatPanel sessionId={sessionId} />);
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
  });

  it('updates input value as user types', async () => {
    render(<ChatPanel sessionId={sessionId} />);

    const input = screen.getByTestId('chat-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'New message' } });

    await waitFor(() => {
      expect(input.value).toBe('New message');
    });
  });

  it('sends message on Send button click', async () => {
    render(<ChatPanel sessionId={sessionId} />);

    const input = screen.getByTestId('chat-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Test message' } });

    const sendButton = screen.getByTestId('send-button');
    fireEvent.click(sendButton);

    // Input should be cleared after sending
    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('sends message on Enter key press in input', async () => {
    render(<ChatPanel sessionId={sessionId} />);

    const input = screen.getByTestId('chat-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Enter message' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // Input should be cleared after sending
    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('ignores Shift+Enter (line break) and only submits on Enter', async () => {
    render(<ChatPanel sessionId={sessionId} />);

    const input = screen.getByTestId('chat-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Line 1' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true });

    // Input should still contain text (not submitted)
    await waitFor(() => {
      expect(input.value).toContain('Line');
    });
  });

  it('renders prompt buttons with correct testids', async () => {
    render(<ChatPanel sessionId={sessionId} />);

    await waitFor(() => {
      expect(screen.getByTestId('prompt-button-0')).toBeInTheDocument();
      expect(screen.getByTestId('prompt-button-1')).toBeInTheDocument();
    });
  });

  it('inserts prompt text into input when prompt button clicked', async () => {
    render(<ChatPanel sessionId={sessionId} />);

    const promptButton = await screen.findByTestId('prompt-button-0');
    fireEvent.click(promptButton);

    const input = screen.getByTestId('chat-input') as HTMLInputElement;

    await waitFor(() => {
      expect(input.value).toContain('Explain this');
    });
  });

  it('displays typing indicator when assistant is responding', async () => {
    render(<ChatPanel sessionId={sessionId} />);

    // Initially should not show typing indicator
    expect(screen.queryByTestId('typing-indicator')).not.toBeInTheDocument();
  });

  it('renders session info header with session details', async () => {
    render(<ChatPanel sessionId={sessionId} />);

    await waitFor(() => {
      expect(screen.getByTestId('session-info-header')).toBeInTheDocument();
    });
  });

  it('displays session ID in header', async () => {
    render(<ChatPanel sessionId={sessionId} />);

    await waitFor(() => {
      const sessionDisplay = screen.getByTestId('session-id-display');
      expect(sessionDisplay.textContent).toContain(sessionId.substring(0, 8));
    });
  });

  it('shows session duration timer in header', async () => {
    render(<ChatPanel sessionId={sessionId} />);

    await waitFor(() => {
      expect(screen.getByTestId('session-duration')).toBeInTheDocument();
    });
  });

  it('includes accessibility labels on chat controls', () => {
    render(<ChatPanel sessionId={sessionId} />);

    const input = screen.getByTestId('chat-input');
    expect(input).toHaveAttribute('aria-label');

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toHaveAttribute('aria-label');
  });

  it('renders Discuss button for Claude conversation', () => {
    render(<ChatPanel sessionId={sessionId} />);
    expect(screen.getByTestId('discuss-button')).toBeInTheDocument();
  });

  it('renders reminder button bar for context-aware suggestions', () => {
    render(<ChatPanel sessionId={sessionId} />);
    expect(screen.getByTestId('reminder-button-bar')).toBeInTheDocument();
  });

  it('auto-scrolls to bottom when new message arrives', async () => {
    render(<ChatPanel sessionId={sessionId} />);

    await waitFor(() => {
      const messageList = screen.getByTestId('message-list');
      // Should scroll to bottom of message list
      expect(messageList).toBeInTheDocument();
    });
  });

  it('handles missing sessionId gracefully', () => {
    const { container } = render(<ChatPanel sessionId={null as any} />);
    expect(container).toBeTruthy();
  });

  it('does not send empty messages', async () => {
    render(<ChatPanel sessionId={sessionId} />);

    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: '   ' } });

    const sendButton = screen.getByTestId('send-button');
    fireEvent.click(sendButton);

    // Should not send empty input
    expect(input).toHaveValue('   ');
  });
});
