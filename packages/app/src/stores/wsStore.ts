import { create } from 'zustand';
import type { ConnectionStatus } from '../lib/ws-client';

interface WSState {
  status: ConnectionStatus;
  subscribedChannels: string[];
  setStatus: (status: ConnectionStatus) => void;
  addChannel: (channel: string) => void;
  removeChannel: (channel: string) => void;
}

export const useWSStore = create<WSState>((set) => ({
  status: 'disconnected',
  subscribedChannels: [],
  setStatus: (status) => set({ status }),
  addChannel: (channel) =>
    set((s) => ({
      subscribedChannels: s.subscribedChannels.includes(channel)
        ? s.subscribedChannels
        : [...s.subscribedChannels, channel],
    })),
  removeChannel: (channel) =>
    set((s) => ({
      subscribedChannels: s.subscribedChannels.filter((c) => c !== channel),
    })),
}));
