/**
 * DiscussContext
 *
 * Provides a communication channel between DiscussButton/DiscussDialog (used throughout the app)
 * and ChatPanel (which owns the chat input field).
 *
 * Uses a ref-based registration pattern:
 * - ChatPanel registers its `setInput` function on mount
 * - useDiscussButton hook calls the registered function to prefill chat input
 * - Provider can be placed at any level in the component tree
 *
 * This allows all 41+ components with DiscussButton to "send to chat" without any rewiring.
 */

import { createContext, useContext, useRef, useCallback, type ReactNode } from 'react';

interface DiscussContextType {
  /** Register the chat input setter function (called by ChatPanel on mount) */
  registerChatInput: (setter: (message: string) => void) => void;
  /** Unregister the chat input setter (called by ChatPanel on unmount) */
  unregisterChatInput: () => void;
  /** Prefill the chat input with a message (called by useDiscussButton) */
  prefillChatInput: (message: string) => void;
}

const DiscussContext = createContext<DiscussContextType | undefined>(undefined);

interface DiscussProviderProps {
  children: ReactNode;
}

/**
 * DiscussProvider - Provides the discuss context
 *
 * Place this at a high level in the component tree (e.g., App root or WorkbenchLayout)
 */
export function DiscussProvider({ children }: DiscussProviderProps) {
  // Store the chat input setter as a ref (not state, to avoid re-renders)
  const chatInputSetterRef = useRef<((message: string) => void) | null>(null);

  const registerChatInput = useCallback((setter: (message: string) => void) => {
    chatInputSetterRef.current = setter;
  }, []);

  const unregisterChatInput = useCallback(() => {
    chatInputSetterRef.current = null;
  }, []);

  const prefillChatInput = useCallback((message: string) => {
    if (chatInputSetterRef.current) {
      chatInputSetterRef.current(message);
    } else {
      console.warn('[DiscussContext] No chat input registered. Message not sent:', message);
    }
  }, []);

  const value: DiscussContextType = {
    registerChatInput,
    unregisterChatInput,
    prefillChatInput,
  };

  return (
    <DiscussContext.Provider value={value}>
      {children}
    </DiscussContext.Provider>
  );
}

/**
 * Hook to access DiscussContext
 * Must be used within DiscussProvider
 */
export function useDiscussContext(): DiscussContextType {
  const context = useContext(DiscussContext);
  if (!context) {
    throw new Error('useDiscussContext must be used within DiscussProvider');
  }
  return context;
}
