import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { SessionId } from '@afw/shared';

interface ChatWindowContextType {
  isOpen: boolean;
  sessionId: SessionId | null;
  source: string | null;        // what triggered the chat (e.g., "discuss-button", "orchestrator-btn")
  chatWidth: number;            // percentage (25-60, default 40)
  openChat: (source: string, context?: Record<string, unknown>) => void;
  closeChat: () => void;
  toggleChat: () => void;
  setChatWidth: (width: number) => void;
}

const ChatWindowContext = createContext<ChatWindowContextType | undefined>(undefined);

interface ChatWindowProviderProps {
  children: ReactNode;
}

const CHAT_WIDTH_STORAGE_KEY = 'afw-chat-width';
const DEFAULT_CHAT_WIDTH = 40;
const MIN_CHAT_WIDTH = 25;
const MAX_CHAT_WIDTH = 60;

/**
 * ChatWindowProvider
 * Manages the chat panel state including visibility, width, and source context.
 * Width is persisted to localStorage for consistent UX across sessions.
 */
export function ChatWindowProvider({ children }: ChatWindowProviderProps) {
  // Initialize width from localStorage, with fallback to default
  const [chatWidth, setChatWidthState] = useState<number>(() => {
    const stored = localStorage.getItem(CHAT_WIDTH_STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      return isNaN(parsed) ? DEFAULT_CHAT_WIDTH : Math.min(Math.max(parsed, MIN_CHAT_WIDTH), MAX_CHAT_WIDTH);
    }
    return DEFAULT_CHAT_WIDTH;
  });

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<SessionId | null>(null);
  const [source, setSource] = useState<string | null>(null);

  const openChat = useCallback(
    (newSource: string, context?: Record<string, unknown>) => {
      setSource(newSource);
      setIsOpen(true);
      // If context includes sessionId, use it; otherwise log warning
      if (context?.sessionId) {
        setSessionId(context.sessionId as SessionId);
      } else if (!sessionId) {
        console.warn('[ChatWindowContext] openChat called without sessionId in context or existing state');
      }
    },
    [sessionId]
  );

  const closeChat = useCallback(() => {
    setIsOpen(false);
    // Note: we do NOT clear sessionId — it's preserved for state continuity
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const setChatWidth = useCallback((width: number) => {
    const clamped = Math.min(Math.max(width, MIN_CHAT_WIDTH), MAX_CHAT_WIDTH);
    setChatWidthState(clamped);
    localStorage.setItem(CHAT_WIDTH_STORAGE_KEY, String(clamped));
  }, []);

  const value: ChatWindowContextType = {
    isOpen,
    sessionId,
    source,
    chatWidth,
    openChat,
    closeChat,
    toggleChat,
    setChatWidth,
  };

  return (
    <ChatWindowContext.Provider value={value}>
      {children}
    </ChatWindowContext.Provider>
  );
}

/**
 * useChatWindowContext
 * Hook to access the ChatWindowContext
 * Must be used within ChatWindowProvider
 */
export function useChatWindowContext(): ChatWindowContextType {
  const context = useContext(ChatWindowContext);
  if (!context) {
    throw new Error('useChatWindowContext must be used within ChatWindowProvider');
  }
  return context;
}
