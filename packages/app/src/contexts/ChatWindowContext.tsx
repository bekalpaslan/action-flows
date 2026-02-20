import { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import type { SessionId, WorkbenchId } from '@afw/shared';
import { useSessionContext } from './SessionContext';
import { useWorkbenchContext } from './WorkbenchContext';

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

const MODEL_STORAGE_KEY = 'afw-selected-model';
const FIXED_CHAT_WIDTH = 360; // Fixed width in pixels (matches --chat-w CSS variable)
const DEFAULT_MODEL = 'sonnet-4.5';

export const AVAILABLE_MODELS = [
  { id: 'opus-4.6', label: 'Opus 4.6' },
  { id: 'sonnet-4.5', label: 'Sonnet 4.5' },
  { id: 'haiku-4.5', label: 'Haiku 4.5' },
];

/**
 * ChatWindowProvider
 * Manages the chat panel state including visibility and source context.
 * Width is now fixed via CSS (--chat-w variable).
 *
 * NOTE: Must be nested inside SessionProvider to access useSessionContext()
 */
export function ChatWindowProvider({ children }: ChatWindowProviderProps) {
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

  // Get session context to access sessions and create new ones
  const { createSession, sessions } = useSessionContext();
  const { activeWorkbench } = useWorkbenchContext();

  // Ref to prevent duplicate session creation on rapid double-clicks
  const creatingSessionRef = useRef<boolean>(false);

  const openChat = useCallback(
    async (newSource: string, context?: Record<string, unknown>) => {
      setSource(newSource);
      setIsOpen(true);

      // Explicit context sessionId takes precedence
      if (context?.sessionId) {
        setSessionIdState(context.sessionId as SessionId);
        return;
      }

      // Check if there's already a session scoped to the current workbench
      const existingWorkbenchSession = sessions.find(
        (s) => s.workbenchId === activeWorkbench
      );

      if (existingWorkbenchSession) {
        // Reuse the existing session for this workbench
        setSessionIdState(existingWorkbenchSession.id);
      } else if (!sessionId && !creatingSessionRef.current) {
        // No workbench-scoped session exists — removed cross-workbench fallback to enforce isolation
        // Auto-create a session scoped to the current workbench
        // Guard prevents duplicate creation on rapid double-clicks
        creatingSessionRef.current = true;
        const workbenchLabel = activeWorkbench || 'unknown';
        const sessionName = context?.componentName
          ? `${workbenchLabel}: Discuss ${context.componentName as string}`
          : `${workbenchLabel}: ${newSource}`;
        try {
          const newSessionId = await createSession(undefined, sessionName, activeWorkbench as WorkbenchId);
          setSessionIdState(newSessionId);
        } catch (error) {
          console.error('[ChatWindowContext] Failed to auto-create session:', error);
          // Graceful degradation — chat opens without session
        } finally {
          creatingSessionRef.current = false;
        }
      }
    },
    [sessionId, sessions, activeWorkbench, createSession]
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

  // No-op function kept for backward compatibility
  const setChatWidth = useCallback((_width: number) => {
    // Width is now fixed via CSS (--chat-w), this function is a no-op
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
    chatWidth: FIXED_CHAT_WIDTH, // Return constant value for backward compatibility
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

  // Expose context for E2E testing (dev only, tree-shaken in production builds)
  if (import.meta.env.DEV) {
    (window as any).__chatWindowContext = value;
  }

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
