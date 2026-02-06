import { useCallback } from 'react'

export type NotificationUrgency = 'normal' | 'critical' | 'low'

export interface NotificationOptions {
  title: string
  body: string
  urgency?: NotificationUrgency
}

export function useNotifications() {
  const showNotification = useCallback(async (options: NotificationOptions): Promise<boolean> => {
    if (typeof window === 'undefined' || !window.electron) {
      console.warn('Notifications not available (not running in Electron)')
      return false
    }

    try {
      const result = await window.electron.ipcRenderer.invoke('show-notification', options)
      return result
    } catch (error) {
      console.error('Failed to show notification:', error)
      return false
    }
  }, [])

  return { showNotification }
}
