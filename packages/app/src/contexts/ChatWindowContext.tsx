import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { SessionId } from '@afw/shared';
import { useSessionContext } from './SessionContext';

interface ChatWindowContextType {
  isOpen: boolean;
  sessionId: SessionId | null;
  source: string | null;        // what triggered the chat (e.g., "discuss-button", "orchestrator-btn")
  chatWidth: number;            // percentage (25-60, default 40)
  selectedModel: string;        // selected AI model (e.g., "sonnet-4.5")
  openChat: (source: string, context?: Record<string, unknown>) => Promise<void>;
  closeChat: () => void;
  toggleChat: () => void;
  setChatWidth: (width: number) => void;
  setSessionId: (id: SessionId | null) => void;
  setSelectedModel: (model: string) => void;
}

const ChatWindowContext = createContext<ChatWindowContextType | undefined>(undefined);

interface ChatWindowProviderProps {
  children: ReactNode;
}

const CHAT_WIDTH_STORAGE_KEY = 'afw-chat-width';
const MODEL_STORAGE_KEY = 'afw-selected-model';
const DEFAULT_CHAT_WIDTH = 40;
const MIN_CHAT_WIDTH = 25;
const MAX_CHAT_WIDTH = 60;
const DEFAULT_MODEL = 'sonnet-4.5';

export const AVAILABLE_MODELS = [
  { id: 'opus-4.6', label: 'Opus 4.6' },
  { id: 'sonnet-4.5', label: 'Sonnet 4.5' },
  { id: 'haiku-4.5', label: 'Haiku 4.5' },
];

/**
 * ChatWindowProvider
 * Manages the chat panel state including visibility, width, and source context.
 * Width is persisted to localStorage for consistent UX across sessions.
 *
 * NOTE: Must be nested inside SessionProvider to access useSessionContext()
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

  // Initialize selected model from localStorage, with fallback to default
  const [selectedModel, setSelectedModelState] = useState<string>(() => {
    const stored = localStorage.getItem(MODEL_STORAGE_KEY);
    return stored || DEFAULT_MODEL;
  });

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [sessionId, setSessionIdState] = useState<SessionId | null>(null);
  const [source, setSource] = useState<string | null>(null);

  // Get session context for auto-creation
  const { createSession, activeSessionId } = useSessionContext();

  const openChat = useCallback(
    async (newSource: string, context?: Record<string, unknown>) => {
      setSource(newSource);
      setIsOpen(true);

      // Explicit context sessionId takes precedence
      if (context?.sessionId) {
        setSessionIdState(context.sessionId as SessionId);
      } else if (!sessionId && !activeSessionId) {
        // Auto-create session if none active and none in chat state
        try {
          const newId = await createSession(undefined, `Chat: ${newSource}`);
          setSessionIdState(newId);
        } catch (error) {
          console.error('[ChatWindowContext] Failed to auto-create session:', error);
          // Continue with no session set - user can select one manually
        }
      } else if (!sessionId && activeSessionId) {
        setSessionIdState(activeSessionId);
      }
    },
    [sessionId, activeSessionId, createSession]
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

  const setSelectedModel = useCallback((model: string) => {
    setSelectedModelState(model);
    localStorage.setItem(MODEL_STORAGE_KEY, model);
  }, []);

  const value: ChatWindowContextType = {
    isOpen,
    sessionId,
    source,
    chatWidth,
    selectedModel,
    openChat,
    closeChat,
    toggleChat,
    setChatWidth,
    setSessionId: setSessionIdState,
    setSelectedModel,
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
