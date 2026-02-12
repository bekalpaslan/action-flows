import { contextBridge, ipcRenderer } from 'electron'

/**
 * IPC Channel Contracts - Define strict input/output types per channel
 */
interface IPCChannelContracts {
  'ping': {
    args: []
    response: { timestamp: number }
  }
  'show-notification': {
    args: [title: string, options?: { body?: string; icon?: string }]
    response: void
  }
  'update-available': {
    args: [version: string, releaseNotes: string]
    response: void
  }
  'close-app': {
    args: [exitCode?: number]
    response: void
  }
}

type IPCChannel = keyof IPCChannelContracts

/**
 * Type-safe IPC invoke handler
 */
function safeInvoke<C extends IPCChannel>(
  channel: C,
  ...args: IPCChannelContracts[C]['args']
): Promise<IPCChannelContracts[C]['response']> {
  const validChannels: IPCChannel[] = ['ping', 'show-notification']
  if (!validChannels.includes(channel)) {
    throw new Error(`Channel '${channel}' not allowed`)
  }
  return ipcRenderer.invoke(channel, ...args)
}

/**
 * Type-safe IPC listener handler
 */
function safeOn<C extends IPCChannel>(
  channel: C,
  listener: (...args: IPCChannelContracts[C]['args']) => void
): void {
  const validChannels: IPCChannel[] = ['update-available']
  if (!validChannels.includes(channel)) {
    return
  }
  ipcRenderer.on(channel, (event, ...args) => {
    listener(...(args as IPCChannelContracts[C]['args']))
  })
}

/**
 * Type-safe IPC send handler
 */
function safeSend<C extends IPCChannel>(
  channel: C,
  ...args: IPCChannelContracts[C]['args']
): void {
  const validChannels: IPCChannel[] = ['close-app']
  if (!validChannels.includes(channel)) {
    return
  }
  ipcRenderer.send(channel, ...args)
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: safeInvoke,
    on: safeOn,
    send: safeSend,
  },
})

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke: typeof safeInvoke
        on: typeof safeOn
        send: typeof safeSend
      }
    }
  }
}
