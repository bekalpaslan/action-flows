import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => {
      // Whitelist allowed channels
      const validChannels = ['ping', 'show-notification']
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args)
      }
      throw new Error(`Channel '${channel}' not allowed`)
    },
    on: (channel: string, listener: (...args: any[]) => void) => {
      // Whitelist allowed channels
      const validChannels = ['update-available']
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => listener(...args))
      }
    },
    send: (channel: string, ...args: any[]) => {
      // Whitelist allowed channels
      const validChannels = ['close-app']
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, ...args)
      }
    },
  },
})

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke: (channel: string, ...args: any[]) => Promise<any>
        on: (channel: string, listener: (...args: any[]) => void) => void
        send: (channel: string, ...args: any[]) => void
      }
    }
  }
}
