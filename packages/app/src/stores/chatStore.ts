import { create } from 'zustand';
import type { WorkbenchId } from '../lib/types';
import type { ChatMessage, ToolCall, WorkbenchChat, ApprovalStatus } from '../lib/chat-types';

const DEFAULT_CHAT: WorkbenchChat = {
  messages: [],
  inputValue: '',
  isStreaming: false,
  activeSessionId: null,
};

function defaultChat(): WorkbenchChat {
  return {
    messages: [],
    inputValue: '',
    isStreaming: false,
    activeSessionId: null,
  };
}

interface ChatStoreState {
  chats: Map<WorkbenchId, WorkbenchChat>;

  /** Get chat state for a workbench (returns default if not set) */
  getChat: (id: WorkbenchId) => WorkbenchChat;

  /** Add a message to a workbench chat */
  addMessage: (id: WorkbenchId, msg: ChatMessage) => void;

  /** Update partial fields on a message */
  updateMessage: (id: WorkbenchId, msgId: string, update: Partial<ChatMessage>) => void;

  /** Append a streaming text chunk to a message */
  appendStreamChunk: (id: WorkbenchId, msgId: string, chunk: string) => void;

  /** Set the input field value */
  setInputValue: (id: WorkbenchId, value: string) => void;

  /** Set streaming state */
  setStreaming: (id: WorkbenchId, isStreaming: boolean) => void;

  /** Update a tool call within a message */
  updateToolCall: (id: WorkbenchId, msgId: string, toolCallId: string, update: Partial<ToolCall>) => void;

  /** Submit a response to an AskUserQuestion */
  submitAskUserResponse: (id: WorkbenchId, msgId: string, response: string) => void;

  /** Resolve an approval request (approved/denied/timed_out) */
  resolveApproval: (id: WorkbenchId, approvalId: string, status: ApprovalStatus) => void;

  /** Replace all messages (load session history) */
  loadSessionHistory: (id: WorkbenchId, messages: ChatMessage[]) => void;

  /** Reset workbench chat to defaults */
  clearChat: (id: WorkbenchId) => void;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  chats: new Map(),

  getChat: (id) => {
    return get().chats.get(id) ?? DEFAULT_CHAT;
  },

  addMessage: (id, msg) =>
    set((state) => {
      const next = new Map(state.chats);
      const chat = next.get(id) ?? defaultChat();
      next.set(id, {
        ...chat,
        messages: [...chat.messages, msg],
      });
      return { chats: next };
    }),

  updateMessage: (id, msgId, update) =>
    set((state) => {
      const chat = state.chats.get(id);
      if (!chat) return state;

      const next = new Map(state.chats);
      next.set(id, {
        ...chat,
        messages: chat.messages.map((m) =>
          m.id === msgId ? { ...m, ...update } : m
        ),
      });
      return { chats: next };
    }),

  appendStreamChunk: (id, msgId, chunk) =>
    set((state) => {
      const chat = state.chats.get(id);
      if (!chat) return state;

      const next = new Map(state.chats);
      next.set(id, {
        ...chat,
        messages: chat.messages.map((m) =>
          m.id === msgId ? { ...m, content: m.content + chunk } : m
        ),
      });
      return { chats: next };
    }),

  setInputValue: (id, value) =>
    set((state) => {
      const next = new Map(state.chats);
      const chat = next.get(id) ?? defaultChat();
      next.set(id, { ...chat, inputValue: value });
      return { chats: next };
    }),

  setStreaming: (id, isStreaming) =>
    set((state) => {
      const next = new Map(state.chats);
      const chat = next.get(id) ?? defaultChat();
      next.set(id, { ...chat, isStreaming });
      return { chats: next };
    }),

  updateToolCall: (id, msgId, toolCallId, update) =>
    set((state) => {
      const chat = state.chats.get(id);
      if (!chat) return state;

      const next = new Map(state.chats);
      next.set(id, {
        ...chat,
        messages: chat.messages.map((m) => {
          if (m.id !== msgId || !m.toolCalls) return m;
          return {
            ...m,
            toolCalls: m.toolCalls.map((tc) =>
              tc.id === toolCallId ? { ...tc, ...update } : tc
            ),
          };
        }),
      });
      return { chats: next };
    }),

  submitAskUserResponse: (id, msgId, response) =>
    set((state) => {
      const chat = state.chats.get(id);
      if (!chat) return state;

      const next = new Map(state.chats);
      next.set(id, {
        ...chat,
        messages: chat.messages.map((m) => {
          if (m.id !== msgId || !m.askUserQuestion) return m;
          return {
            ...m,
            askUserQuestion: {
              ...m.askUserQuestion,
              response,
              submitted: true,
            },
          };
        }),
      });
      return { chats: next };
    }),

  resolveApproval: (id, approvalId, status) =>
    set((state) => {
      const chat = state.chats.get(id);
      if (!chat) return state;

      const next = new Map(state.chats);
      next.set(id, {
        ...chat,
        messages: chat.messages.map((m) => {
          if (!m.approvalRequest || m.approvalRequest.approvalId !== approvalId) return m;
          return {
            ...m,
            approvalRequest: {
              ...m.approvalRequest,
              status,
              resolvedAt: new Date().toISOString(),
            },
          };
        }),
      });
      return { chats: next };
    }),

  loadSessionHistory: (id, messages) =>
    set((state) => {
      const next = new Map(state.chats);
      const chat = next.get(id) ?? defaultChat();
      next.set(id, { ...chat, messages });
      return { chats: next };
    }),

  clearChat: (id) =>
    set((state) => {
      const next = new Map(state.chats);
      next.set(id, defaultChat());
      return { chats: next };
    }),
}));
