import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import type { SessionId, WorkbenchId } from '@afw/shared';
import { useSessionContext } from './SessionContext';

interface PerWorkbenchChatState {
  isOpen: boolean;
  sessionId: SessionId | null;
  source: string | null;
  isMinimized: boolean;
  unreadCount: number;
}

interface ChatWindowContextType {
  isOpen: boolean;
  sessionId: SessionId | null;
  source: string | null;        // what triggered the chat (e.g., "discuss-button", "orchestrator-btn")
  chatWidth: number;            // percentage (25-60, default 40)
  selectedModel: string;        // selected AI model (e.g., "sonnet-4.5")
  isMinimized: boolean;         // whether chat is minimized to floating indicator
  unreadCount: number;          // unread message count when minimized
  openChat: (source: string, context?: Record<string, unknown>) => Promise<void>;
  closeChat: () => void;
  toggleChat: () => void;
  setChatWidth: (width: number) => void;
  setSessionId: (id: SessionId | null) => void;
  setSelectedModel: (model: string) => void;
  minimizeChat: () => void;
  restoreChat: () => void;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  saveAndSwitch: (fromWorkbench: WorkbenchId, toWorkbench: WorkbenchId) => void;
  workbenchesWithChat: WorkbenchId[];
}

const ChatWindowContext = createContext<ChatWindowContextType | undefined>(undefined);

interface ChatWindowProviderProps {
  children: ReactNode;
}

const CHAT_WIDTH_STORAGE_KEY = 'afw-chat-width';
const MODEL_STORAGE_KEY = 'afw-selected-model';
const DEFAULT_CHAT_WIDTH = 30;
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
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Per-workbench chat state persistence
  const workbenchChatMap = useRef<Map<WorkbenchId, PerWorkbenchChatState>>(new Map());
  const [workbenchesWithChat, setWorkbenchesWithChat] = useState<WorkbenchId[]>([]);

  // Get session context to inherit activeSessionId when chat opens
  const { activeSessionId } = useSessionContext();

  const openChat = useCallback(
    async (newSource: string, context?: Record<string, unknown>) => {
      setSource(newSource);
      setIsOpen(true);

      // Explicit context sessionId takes precedence
      if (context?.sessionId) {
        setSessionIdState(context.sessionId as SessionId);
      } else if (!sessionId && activeSessionId) {
        setSessionIdState(activeSessionId);
      }
      // No active session — chat opens with null sessionId; SlidingChatWindow session selector handles user selection
    },
    [sessionId, activeSessionId]
  );

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
    setUnreadCount(0);
    // Note: we do NOT clear sessionId — it's preserved for state continuity
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const minimizeChat = useCallback(() => {
    setIsMinimized(true);
    // Announce to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.textContent = 'Chat minimized';
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  }, []);

  const restoreChat = useCallback(() => {
    setIsMinimized(false);
    setUnreadCount(0);
    // Announce to screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.textContent = 'Chat restored';
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  }, []);

  const incrementUnreadCount = useCallback(() => {
    setUnreadCount((prev) => prev + 1);
  }, []);

  const resetUnreadCount = useCallback(() => {
    setUnreadCount(0);
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

  // Helper to recompute the reactive workbenchesWithChat list from the map
  const syncWorkbenchesWithChat = useCallback(() => {
    const ids: WorkbenchId[] = [];
    workbenchChatMap.current.forEach((state, id) => {
      if (state.isOpen) ids.push(id);
    });
    setWorkbenchesWithChat(ids);
  }, []);

  const saveAndSwitch = useCallback((fromWorkbench: WorkbenchId, toWorkbench: WorkbenchId) => {
    // Save current chat state for the workbench we're leaving
    workbenchChatMap.current.set(fromWorkbench, {
      isOpen,
      sessionId,
      source,
      isMinimized,
      unreadCount,
    });

    // Restore state for the target workbench (or default to closed)
    const saved = workbenchChatMap.current.get(toWorkbench);
    if (saved && saved.isOpen) {
      setIsOpen(saved.isOpen);
      setSessionIdState(saved.sessionId);
      setSource(saved.source);
      setIsMinimized(saved.isMinimized);
      setUnreadCount(saved.unreadCount);
    } else {
      setIsOpen(false);
      setIsMinimized(false);
      setUnreadCount(0);
    }

    syncWorkbenchesWithChat();
  }, [isOpen, sessionId, source, isMinimized, unreadCount, syncWorkbenchesWithChat]);

  const value: ChatWindowContextType = {
    isOpen,
    sessionId,
    source,
    chatWidth,
    selectedModel,
    isMinimized,
    unreadCount,
    openChat,
    closeChat,
    toggleChat,
    setChatWidth,
    setSessionId: setSessionIdState,
    setSelectedModel,
    minimizeChat,
    restoreChat,
    incrementUnreadCount,
    resetUnreadCount,
    saveAndSwitch,
    workbenchesWithChat,
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
