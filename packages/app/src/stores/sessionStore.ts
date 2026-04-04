import { create } from 'zustand';

interface SessionState {
  activeSessions: number;
  getActiveCount: () => number;
}

export const useSessionStore = create<SessionState>((_set, get) => ({
  activeSessions: 0,
  getActiveCount: () => get().activeSessions,
}));
